const {
  readState,
  addTask,
  updateTask,
  deleteTask,
  addGoal,
  updateGoal,
  addArtifact,
  addConversation,
  addWorkflow,
  updateWorkflow
} = require("./store");
const { suggestNextTask, buildDailyPlan } = require("./engine");
const { buildDecisionTimeline } = require("./strategy");
const {
  buildStructuredDocument,
  buildTodoList,
  buildKnowledgeQuery,
  buildProjectSnapshots,
  buildWorkflowBlueprint,
  runScenarioSimulation,
  buildComparisonEngine
} = require("./workbench");
const {
  buildAutonomousGoalPlan,
  simulateTwinResponse
} = require("./meta");
const { planVoiceCommand } = require("./ollama");
const { rebalanceSchedule } = require("./scheduler");
const { simulateTimeline } = require("./analytics");

const ACTION_TYPES = new Set([
  "create_task",
  "update_task",
  "delete_task",
  "mark_done",
  "schedule_task",
  "reschedule_task",
  "plan_day",
  "rebalance_schedule",
  "create_goal",
  "update_goal",
  "generate_doc",
  "generate_todo_list",
  "query_memory",
  "analyze_project",
  "run_workflow",
  "suggest_next_step",
  "simulate_outcome",
  "decision_analysis"
]);

function contextFromState(state, extras = {}) {
  const latestCheckin = (state.checkins || [])[0] || {};
  return {
    now: extras.now || new Date().toISOString(),
    energy: extras.energy || latestCheckin.energy || state.profile?.preferences?.defaultEnergy || "medium",
    focus: extras.focus || latestCheckin.focus || "steady",
    mood: extras.mood || latestCheckin.mood || "",
    calendar: extras.calendar || null
  };
}

function plusDays(days, context = {}) {
  const next = new Date(context.now || new Date().toISOString());
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function parseDurationMinutes(input = "") {
  const match = String(input).match(/(\d+)\s*(minutes|minute|mins|min|hours|hour|hrs|hr)/i);
  if (!match) return null;
  const value = Number(match[1] || 0);
  return /^h/i.test(match[2]) ? value * 60 : value;
}

function parseRelativeDate(input = "", context = {}) {
  const text = String(input || "").toLowerCase();
  if (!text) return null;
  if (text.includes("today")) return plusDays(0, context);
  if (text.includes("tomorrow")) return plusDays(1, context);
  const inDays = text.match(/in\s+(\d+)\s+days?/i);
  if (inDays) return plusDays(Number(inDays[1]), context);
  const iso = text.match(/\b\d{4}-\d{2}-\d{2}\b/);
  return iso ? iso[0] : null;
}

function parseTimeValue(input = "") {
  const text = String(input || "").trim().toLowerCase();
  if (!text) return null;
  if (/^\d{2}:\d{2}$/.test(text)) return text;
  const match = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridiem = match[3].toLowerCase();
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function cleanText(value) {
  return String(value || "").trim();
}

function valueList(input) {
  if (Array.isArray(input)) {
    return input.map((entry) => cleanText(entry)).filter(Boolean);
  }
  if (typeof input === "string") {
    return input.split(",").map((entry) => entry.trim()).filter(Boolean);
  }
  return [];
}

function buildVoiceContextSnapshot(state, context = {}) {
  const tasks = (state.tasks || [])
    .filter((task) => task.status === "open")
    .slice(0, 8)
    .map((task) => `- ${task.title} (${task.priority}, ${task.effort}, ${task.durationMins} mins${task.dueDate ? `, due ${task.dueDate}` : ""})`)
    .join("\n") || "- none";
  const goals = (state.goals || [])
    .slice(0, 5)
    .map((goal) => `- ${goal.title}${goal.targetDate ? ` (target ${goal.targetDate})` : ""}`)
    .join("\n") || "- none";
  const recentConversation = (state.conversations || [])
    .slice(-4)
    .map((entry) => `${entry.role}: ${entry.text}`)
    .join("\n") || "No recent conversation.";
  const calendar = context.calendar && !context.calendar.error
    ? `Busy today: ~${Math.round(context.calendar.busyMinutesToday || 0)} mins`
    : "No calendar availability available";

  return [
    `Current date/time: ${context.now}`,
    `Energy: ${context.energy}`,
    `Focus: ${context.focus}`,
    `Mood: ${context.mood || "unspecified"}`,
    `Calendar: ${calendar}`,
    "Today's tasks:",
    tasks,
    "Goals:",
    goals,
    "Recent conversation:",
    recentConversation
  ].join("\n");
}

function normalizePlan(plan) {
  if (!plan || typeof plan !== "object") {
    return {
      response: "I need a bit more detail before I act on that.",
      actions: [],
      requires_confirmation: false
    };
  }

  const actions = Array.isArray(plan.actions)
    ? plan.actions
        .map((action) => ({
          type: ACTION_TYPES.has(cleanText(action?.type)) ? cleanText(action.type) : "",
          parameters: action?.parameters && typeof action.parameters === "object" && !Array.isArray(action.parameters)
            ? action.parameters
            : {}
        }))
        .filter((action) => action.type)
    : [];

  return {
    response: cleanText(plan.response),
    actions,
    requires_confirmation: plan.requires_confirmation === true
  };
}

function simpleVoicePlan(message, state, context = {}) {
  const text = cleanText(message);
  const lower = text.toLowerCase();
  const isComplex = /,|\band\b/.test(lower) && /(plan|move|build|create|schedule|reschedule|delete|mark|focus)/.test(lower);

  if (!text || isComplex) {
    return null;
  }

  if (/^remind me later\b/i.test(text) || /\blater\b/i.test(text) && !parseRelativeDate(text, context)) {
    return {
      response: "When should I remind you?",
      actions: [],
      requires_confirmation: false
    };
  }

  if (/(what should i do next|what next|next step)/i.test(lower)) {
    return {
      response: "I will pick the best next step from your current state.",
      actions: [{ type: "suggest_next_step", parameters: {} }],
      requires_confirmation: false
    };
  }

  if (/plan my day/i.test(lower)) {
    const focusMatch = text.match(/focus on\s+(.+)$/i);
    return {
      response: "I will shape today's plan around your priorities.",
      actions: [{
        type: "plan_day",
        parameters: {
          focus: cleanText(focusMatch?.[1]),
          preferLightWork: context.energy === "low"
        }
      }],
      requires_confirmation: false
    };
  }

  if (/^(done|mark|finish|completed?)\s+/i.test(text)) {
    return {
      response: "I can mark that task as done.",
      actions: [{
        type: "mark_done",
        parameters: {
          taskQuery: text.replace(/^(done|mark|finish|completed?)\s+/i, "")
        }
      }],
      requires_confirmation: false
    };
  }

  if (/^(delete|remove)\s+/i.test(text)) {
    return {
      response: "I found a delete request. I need your confirmation before removing anything.",
      actions: [{
        type: "delete_task",
        parameters: {
          taskQuery: text.replace(/^(delete|remove)\s+/i, "")
        }
      }],
      requires_confirmation: true
    };
  }

  if (/^(add|create)\s+/i.test(text) && !/\bgoal\b/i.test(text)) {
    return {
      response: "I can add that task for you.",
      actions: [{
        type: "create_task",
        parameters: {
          title: text.replace(/^(add|create)\s+/i, ""),
          dueDate: parseRelativeDate(text, context),
          durationMins: parseDurationMinutes(text) || (context.energy === "low" ? 20 : 30)
        }
      }],
      requires_confirmation: false
    };
  }

  if (/^goal\s+/i.test(text)) {
    const targetDays = Number(text.match(/in\s+(\d+)\s+days?/i)?.[1] || 0) || 30;
    return {
      response: "I can decompose that goal into a practical roadmap.",
      actions: [{
        type: "create_goal",
        parameters: {
          title: cleanText(text.replace(/^goal\s+/i, "").replace(/\s+in\s+\d+\s+days?.*$/i, "")),
          objective: text,
          targetDays
        }
      }],
      requires_confirmation: false
    };
  }

  if (/build .*doc|create .*doc|generate .*doc/i.test(lower)) {
    return {
      response: "I will generate that document.",
      actions: [{ type: "generate_doc", parameters: { prompt: text } }],
      requires_confirmation: false
    };
  }

  if (/build .*to-?do|create .*to-?do|generate .*to-?do|checklist/i.test(lower)) {
    return {
      response: "I will turn that into a to-do list.",
      actions: [{ type: "generate_todo_list", parameters: { prompt: text, createTasks: true } }],
      requires_confirmation: false
    };
  }

  return null;
}

function enforceSafety(plan, state, context = {}) {
  const next = normalizePlan(plan);
  const forcedConfirmation = next.actions.some((action) =>
    action.type === "delete_task" ||
    action.type === "rebalance_schedule" ||
    (action.type === "reschedule_task" && !cleanText(action.parameters.taskId || action.parameters.taskQuery || action.parameters.title))
  );

  next.actions = next.actions.map((action) => {
    if (action.type === "plan_day") {
      return {
        ...action,
        parameters: {
          ...action.parameters,
          preferLightWork: action.parameters.preferLightWork === true || context.energy === "low"
        }
      };
    }
    return action;
  });

  next.requires_confirmation = next.requires_confirmation || forcedConfirmation;
  if (!next.response) {
    next.response = next.requires_confirmation
      ? "I can do that, but I need your confirmation first."
      : "I understood the command and I'm ready to act.";
  }
  return next;
}

async function buildVoiceActionPlan(message, state, context = {}) {
  const heuristic = simpleVoicePlan(message, state, context);
  if (heuristic) {
    return enforceSafety(heuristic, state, context);
  }

  const snapshot = buildVoiceContextSnapshot(state, context);
  const planned = await planVoiceCommand(message, snapshot, state.profile?.ai || {}).catch(() => null);
  if (planned) {
    return enforceSafety(planned, state, context);
  }

  return enforceSafety({
    response: "I did not get a reliable action plan from that. I can still suggest the next best step.",
    actions: [{ type: "suggest_next_step", parameters: {} }],
    requires_confirmation: false
  }, state, context);
}

function resolveProject(state, parameters = {}) {
  const projectId = cleanText(parameters.projectId || parameters.id);
  if (projectId) {
    return (state.projects || []).find((project) => project.id === projectId) || null;
  }

  const query = cleanText(parameters.projectName || parameters.project || parameters.focus || parameters.query);
  if (!query) return null;
  const lower = query.toLowerCase();
  return (state.projects || []).find((project) => project.name.toLowerCase().includes(lower)) || null;
}

function resolveTask(state, parameters = {}) {
  const taskId = cleanText(parameters.taskId || parameters.id);
  if (taskId) {
    return (state.tasks || []).find((task) => task.id === taskId) || null;
  }

  const query = cleanText(
    parameters.taskQuery ||
    parameters.taskTitle ||
    parameters.task ||
    parameters.title ||
    parameters.match ||
    parameters.query
  );
  if (!query) return null;
  const lower = query.toLowerCase();
  const tasks = state.tasks || [];
  return tasks.find((task) => task.status === "open" && task.title.toLowerCase() === lower) ||
    tasks.find((task) => task.status === "open" && task.title.toLowerCase().includes(lower)) ||
    tasks.find((task) => task.title.toLowerCase().includes(lower)) ||
    null;
}

function resolveGoal(state, parameters = {}) {
  const goalId = cleanText(parameters.goalId || parameters.id);
  if (goalId) {
    return (state.goals || []).find((goal) => goal.id === goalId) || null;
  }

  const query = cleanText(parameters.goalTitle || parameters.goal || parameters.title || parameters.query);
  if (!query) return null;
  const lower = query.toLowerCase();
  return (state.goals || []).find((goal) => goal.title.toLowerCase().includes(lower)) || null;
}

function resolveWorkflow(state, parameters = {}) {
  const workflowId = cleanText(parameters.workflowId || parameters.id);
  if (workflowId) {
    return (state.workflows || []).find((workflow) => workflow.id === workflowId) || null;
  }

  const query = cleanText(parameters.workflow || parameters.title || parameters.query);
  if (!query) return null;
  const lower = query.toLowerCase();
  return (state.workflows || []).find((workflow) => workflow.title.toLowerCase().includes(lower)) || null;
}

function taskPatchFromParameters(parameters = {}, context = {}, state = null) {
  const project = state ? resolveProject(state, parameters) : null;
  const goal = state ? resolveGoal(state, parameters) : null;
  return {
    title: cleanText(parameters.newTitle || parameters.title) || undefined,
    notes: cleanText(parameters.notes) || undefined,
    category: cleanText(parameters.category) || undefined,
    priority: ["high", "medium", "low"].includes(parameters.priority) ? parameters.priority : undefined,
    effort: ["high", "medium", "low"].includes(parameters.effort) ? parameters.effort : undefined,
    durationMins: Number(parameters.durationMins || parameters.minutes || 0) || undefined,
    dueDate: parameters.dueDate || parseRelativeDate(parameters.when || parameters.date || "", context) || undefined,
    scheduledTime: parameters.scheduledTime || parseTimeValue(parameters.time || "") || undefined,
    deferUntil: parameters.deferUntil || undefined,
    projectId: project?.id || parameters.projectId || undefined,
    goalId: goal?.id || parameters.goalId || undefined,
    people: parameters.people !== undefined ? valueList(parameters.people) : undefined,
    dependsOn: parameters.dependsOn !== undefined ? valueList(parameters.dependsOn) : undefined
  };
}

async function executeAction(action, latestState, context = {}, confirmed = false) {
  const parameters = action.parameters || {};
  const now = context.now || new Date().toISOString();

  switch (action.type) {
    case "create_task": {
      const project = resolveProject(latestState, parameters);
      const task = await addTask({
        title: cleanText(parameters.title || parameters.task || parameters.taskTitle),
        notes: cleanText(parameters.notes),
        category: cleanText(parameters.category) || "general",
        priority: ["high", "medium", "low"].includes(parameters.priority) ? parameters.priority : "medium",
        effort: ["high", "medium", "low"].includes(parameters.effort) ? parameters.effort : (context.energy === "low" ? "low" : "medium"),
        durationMins: Number(parameters.durationMins || parameters.minutes || 0) || (context.energy === "low" ? 20 : 30),
        dueDate: parameters.dueDate || parseRelativeDate(parameters.when || parameters.date || "", context),
        scheduledTime: parameters.scheduledTime || parseTimeValue(parameters.time || ""),
        projectId: project?.id || parameters.projectId || null,
        people: valueList(parameters.people),
        dependsOn: valueList(parameters.dependsOn)
      });
      return { ok: true, summary: `Created task "${task.title}".`, data: task };
    }

    case "update_task": {
      const task = resolveTask(latestState, parameters);
      if (!task) return { ok: false, summary: "I could not find the task to update." };
      const patch = taskPatchFromParameters(parameters, context, latestState);
      const updated = await updateTask(task.id, patch);
      return { ok: true, summary: `Updated "${updated.title}".`, data: updated };
    }

    case "delete_task": {
      const task = resolveTask(latestState, parameters);
      if (!task) return { ok: false, summary: "I could not find the task to delete." };
      if (!confirmed) return { ok: false, summary: `Deletion for "${task.title}" is waiting for confirmation.`, pending: true };
      await deleteTask(task.id);
      return { ok: true, summary: `Deleted "${task.title}".`, data: { id: task.id, title: task.title } };
    }

    case "mark_done": {
      const task = resolveTask(latestState, parameters);
      if (!task) return { ok: false, summary: "I could not find the task to mark done." };
      const updated = await updateTask(task.id, { status: "completed" });
      return { ok: true, summary: `Marked "${updated.title}" as done.`, data: updated };
    }

    case "schedule_task":
    case "reschedule_task": {
      let task = resolveTask(latestState, parameters);
      if (!task && cleanText(parameters.title || parameters.taskTitle)) {
        task = await addTask({
          title: cleanText(parameters.title || parameters.taskTitle),
          category: cleanText(parameters.category) || "general",
          durationMins: Number(parameters.durationMins || parameters.minutes || 0) || 30
        });
      }
      if (!task) return { ok: false, summary: "I could not find a task to schedule." };
      const patch = taskPatchFromParameters(parameters, context, latestState);
      const updated = await updateTask(task.id, patch);
      return {
        ok: true,
        summary: `${action.type === "schedule_task" ? "Scheduled" : "Rescheduled"} "${updated.title}".`,
        data: updated
      };
    }

    case "plan_day": {
      const project = resolveProject(latestState, parameters);
      const focus = cleanText(parameters.focus || parameters.category || "");
      let plan = buildDailyPlan(latestState, context, 5);
      if (project) {
        const focused = plan.filter((task) => task.projectId === project.id);
        if (focused.length) plan = focused;
      } else if (focus) {
        const lower = focus.toLowerCase();
        const focused = plan.filter((task) =>
          String(task.category || "").toLowerCase().includes(lower) ||
          String(task.title || "").toLowerCase().includes(lower)
        );
        if (focused.length) plan = focused;
      }
      if (parameters.preferLightWork) {
        const lighter = plan.filter((task) => task.effort === "low" || Number(task.durationMins || 0) <= 30);
        if (lighter.length) plan = lighter;
      }
      return {
        ok: true,
        summary: plan.length
          ? `Planned your day around ${plan[0].title}.`
          : "There is not enough open work to build a day plan yet.",
        data: { tasks: plan.slice(0, 5) }
      };
    }

    case "rebalance_schedule": {
      const preview = rebalanceSchedule(latestState, context);
      if (!confirmed) {
        return {
          ok: false,
          pending: true,
          summary: preview.movedTasks.length
            ? `I can rebalance ${preview.movedTasks.length} tasks, but I need confirmation first.`
            : "There is no meaningful rebalance needed right now.",
          data: preview
        };
      }

      const applied = [];
      for (const move of preview.movedTasks || []) {
        applied.push(await updateTask(move.taskId, { deferUntil: move.to }));
      }
      return {
        ok: true,
        summary: applied.length
          ? `Rebalanced ${applied.length} task${applied.length === 1 ? "" : "s"}.`
          : "There was nothing to rebalance.",
        data: { movedTasks: preview.movedTasks || [], applied }
      };
    }

    case "create_goal": {
      const plan = buildAutonomousGoalPlan(latestState, {
        title: cleanText(parameters.title || parameters.goalTitle || parameters.goal),
        objective: cleanText(parameters.objective || parameters.prompt),
        targetDays: Number(parameters.targetDays || 0) || 30,
        projectId: parameters.projectId || null,
        people: valueList(parameters.people)
      }, context);
      const created = await addGoal(plan.blueprint);
      await addArtifact({
        kind: "autonomous-goal-plan",
        title: plan.title,
        payload: {
          ...plan,
          goalId: created.goal.id,
          taskIds: created.tasks.map((task) => task.id)
        },
        category: "planning",
        projectId: created.goal.projectId || null
      });
      return {
        ok: true,
        summary: `Created goal "${created.goal.title}" with ${created.tasks.length} starter tasks.`,
        data: { goal: created.goal, tasks: created.tasks, plan }
      };
    }

    case "update_goal": {
      const goal = resolveGoal(latestState, parameters);
      if (!goal) return { ok: false, summary: "I could not find the goal to update." };
      const updated = await updateGoal(goal.id, {
        title: cleanText(parameters.newTitle || parameters.title) || undefined,
        objective: cleanText(parameters.objective) || undefined,
        theme: cleanText(parameters.theme) || undefined,
        targetDate: parameters.targetDate || parseRelativeDate(parameters.when || parameters.date || "", context) || undefined,
        targetDays: Number(parameters.targetDays || 0) || undefined,
        status: cleanText(parameters.status) || undefined,
        people: parameters.people,
        todayMoves: parameters.todayMoves,
        dependencies: parameters.dependencies
      });
      return { ok: true, summary: `Updated goal "${updated.title}".`, data: updated };
    }

    case "generate_doc": {
      const document = buildStructuredDocument({
        prompt: cleanText(parameters.prompt || parameters.title || parameters.topic)
      });
      const artifact = await addArtifact({
        kind: "document",
        title: document.title,
        payload: document,
        category: "docs",
        projectId: parameters.projectId || null
      });
      return { ok: true, summary: `Generated "${document.title}".`, data: { document, artifact } };
    }

    case "generate_todo_list": {
      const todoList = buildTodoList({
        prompt: cleanText(parameters.prompt || parameters.title || parameters.topic)
      });
      const createdTasks = [];
      if (parameters.createTasks !== false) {
        for (const item of todoList.tasks || []) {
          createdTasks.push(await addTask({
            title: item.title,
            category: item.category,
            priority: item.priority,
            effort: item.effort,
            durationMins: item.durationMins,
            notes: item.notes,
            projectId: parameters.projectId || null
          }));
        }
      }
      const artifact = await addArtifact({
        kind: "todo-plan",
        title: todoList.title,
        payload: todoList,
        category: "planning",
        projectId: parameters.projectId || null
      });
      return {
        ok: true,
        summary: createdTasks.length
          ? `Built "${todoList.title}" and added ${createdTasks.length} tasks.`
          : `Built "${todoList.title}".`,
        data: { todoList, createdTasks, artifact }
      };
    }

    case "query_memory": {
      const result = buildKnowledgeQuery(latestState, {
        search: cleanText(parameters.search || parameters.query || parameters.topic),
        category: cleanText(parameters.category),
        projectId: parameters.projectId || null
      });
      return { ok: true, summary: `Found ${result.count} memory match${result.count === 1 ? "" : "es"}.`, data: result };
    }

    case "analyze_project": {
      const project = resolveProject(latestState, parameters);
      const snapshots = buildProjectSnapshots(latestState);
      const result = project
        ? snapshots.find((snapshot) => snapshot.id === project.id) || null
        : snapshots.slice(0, 4);
      return {
        ok: true,
        summary: project
          ? `Analyzed project "${project.name}".`
          : `Analyzed ${Array.isArray(result) ? result.length : 0} project snapshots.`,
        data: result
      };
    }

    case "run_workflow": {
      let workflow = resolveWorkflow(latestState, parameters);
      if (!workflow && cleanText(parameters.title || parameters.prompt)) {
        const blueprint = buildWorkflowBlueprint({
          title: cleanText(parameters.title || parameters.prompt),
          prompt: cleanText(parameters.prompt),
          actions: cleanText(parameters.actions)
        });
        workflow = await addWorkflow({
          title: blueprint.title,
          description: blueprint.description,
          trigger: blueprint.trigger,
          steps: blueprint.steps,
          actions: blueprint.actions,
          safeguards: blueprint.safeguards,
          projectId: parameters.projectId || null,
          status: "draft"
        });
      }
      if (!workflow) return { ok: false, summary: "I could not find a workflow to run." };
      const updated = await updateWorkflow(workflow.id, {
        lastRunAt: now,
        runCount: Number(workflow.runCount || 0) + 1,
        status: workflow.status || "draft"
      });
      return { ok: true, summary: `Ran workflow "${updated.title}".`, data: updated };
    }

    case "suggest_next_step": {
      const suggestion = suggestNextTask(latestState, context);
      return {
        ok: true,
        summary: suggestion?.task
          ? `Next best step: ${suggestion.task.title}.`
          : "There is no clear next step yet because your task list is empty.",
        data: suggestion
      };
    }

    case "simulate_outcome": {
      let result;
      if (parameters.currentValue !== undefined || parameters.changePercent !== undefined) {
        result = runScenarioSimulation({
          scenario: cleanText(parameters.scenario || parameters.prompt || "Untitled scenario"),
          currentValue: Number(parameters.currentValue || 100),
          changePercent: Number(parameters.changePercent || 0)
        });
      } else if (parameters.dailyHours || parameters.targetDate || parameters.daysOff) {
        result = simulateTimeline(latestState, {
          label: cleanText(parameters.label || parameters.scenario || "Voice simulation"),
          dailyHours: Number(parameters.dailyHours || 2),
          targetDate: parameters.targetDate || null,
          includeWeekends: parameters.includeWeekends !== false,
          daysOff: valueList(parameters.daysOff)
        }, context);
      } else {
        result = simulateTwinResponse(latestState, {
          prompt: cleanText(parameters.prompt || parameters.scenario || "")
        }, context);
      }
      return { ok: true, summary: "Simulated the likely outcome.", data: result };
    }

    case "decision_analysis": {
      let result;
      if (parameters.optionA || parameters.optionB || Array.isArray(parameters.options)) {
        result = buildComparisonEngine({
          optionA: cleanText(parameters.optionA),
          optionB: cleanText(parameters.optionB),
          options: parameters.options,
          question: cleanText(parameters.question)
        });
      } else {
        result = buildDecisionTimeline({
          decision: cleanText(parameters.decision || parameters.question || "Voice decision"),
          optionA: cleanText(parameters.optionA || "Option A"),
          optionB: cleanText(parameters.optionB || "Option B"),
          horizonDays: Number(parameters.horizonDays || 90)
        });
      }
      return { ok: true, summary: "Finished the decision analysis.", data: result };
    }

    default:
      return { ok: false, summary: `Action ${action.type} is not supported.` };
  }
}

function summarizeVoiceExecution(plan, execution, confirmed) {
  if (plan.requires_confirmation && !confirmed) {
    return plan.response || "I can do that, but I need your confirmation first.";
  }

  const successful = (execution.results || []).filter((item) => item.ok);
  if (successful.length) {
    return successful.slice(0, 2).map((item) => item.summary).join(" ");
  }

  if ((execution.results || []).length) {
    return execution.results[0].summary || plan.response;
  }

  return plan.response || "I understood the request.";
}

async function executeVoicePlan(plan, context = {}, confirmed = false) {
  const results = [];

  for (const action of plan.actions || []) {
    const latestState = await readState();
    results.push(await executeAction(action, latestState, context, confirmed));
  }

  return {
    results,
    confirmed
  };
}

async function handleVoiceCommand(input = {}, extras = {}) {
  const text = cleanText(input.text || input.transcript || "");
  const state = await readState();
  const context = contextFromState(state, extras);
  const plan = input.plan
    ? enforceSafety(input.plan, state, context)
    : await buildVoiceActionPlan(text, state, context);

  if (text) {
    await addConversation("user", `[voice] ${text}`);
  }

  let execution = { results: [], confirmed: Boolean(input.confirmed) };
  if (input.execute !== false && (!plan.requires_confirmation || input.confirmed)) {
    execution = await executeVoicePlan(plan, context, Boolean(input.confirmed));
  }

  const response = summarizeVoiceExecution(plan, execution, Boolean(input.confirmed));
  await addConversation("assistant", response);

  return {
    response,
    actions: plan.actions,
    requires_confirmation: plan.requires_confirmation && !input.confirmed,
    execution
  };
}

module.exports = {
  ACTION_TYPES,
  contextFromState,
  buildVoiceContextSnapshot,
  buildVoiceActionPlan,
  executeVoicePlan,
  handleVoiceCommand,
  normalizePlan
};
