const { scoreTask, getDurationBucket } = require("./engine");

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function nowDate(context = {}) {
  return context.now ? new Date(context.now) : new Date();
}

function minutesBetween(start, end) {
  return Math.max(0, Math.round((end - start) / MS_PER_MINUTE));
}

function parseClock(time) {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }

  const [hours, minutes] = time.split(":").map(Number);
  return { hours, minutes };
}

function atClock(baseDate, time) {
  const parsed = parseClock(time);
  if (!parsed) {
    return null;
  }

  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    parsed.hours,
    parsed.minutes,
    0,
    0
  );
}

function formatClock(date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function daysUntil(dateString, now) {
  if (!dateString) {
    return null;
  }

  const target = new Date(dateString);
  return Math.ceil((target - now) / MS_PER_DAY);
}

function getGoalById(state, goalId) {
  return (state.goals || []).find((goal) => goal.id === goalId) || null;
}

function getLinkedTasks(state, goalId) {
  return (state.tasks || []).filter((task) => task.goalId === goalId);
}

function average(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildBehaviorModel(state, context = {}) {
  const now = nowDate(context);
  const learning = state.profile?.learning || {};
  const shortAffinity = learning.durationAffinity?.short || 0;
  const longAffinity = learning.durationAffinity?.long || 0;
  const lowEffort = learning.effortAffinity?.low || 0;
  const highEffort = learning.effortAffinity?.high || 0;
  const openTasks = (state.tasks || []).filter((task) => task.status === "open");
  const highFocusCount = openTasks.filter((task) => task.effort === "high" || Number(task.durationMins) > 60).length;
  const overdueCount = openTasks.filter((task) => {
    const days = daysUntil(task.dueDate, now);
    return days !== null && days < 0;
  }).length;
  const recentCheckin = state.checkins?.[0];
  const lowEnergy = (recentCheckin?.energy || context.energy) === "low";
  const scattered = recentCheckin?.focus === "scattered";
  const helpful = learning.responsePatterns?.helpful || 0;
  const completed = learning.responsePatterns?.completed || 0;
  const skipped = learning.responsePatterns?.skipped || 0;
  const notHelpful = learning.responsePatterns?.notHelpful || 0;
  const chatPatterns = learning.chatPatterns || {};
  const outputAffinity = learning.outputAffinity || {};

  let operatingMode = "work";
  if (lowEnergy || scattered) {
    operatingMode = "recovery";
  } else if (overdueCount >= 2 || highFocusCount >= 5) {
    operatingMode = "stress";
  } else if (
    openTasks.filter((task) => ["planning", "learning"].includes(task.category)).length >= 3 &&
    (context.energy || "medium") !== "low"
  ) {
    operatingMode = "creative";
  }

  let suggestionStyle = "coach";
  if (
    shortAffinity > longAffinity + 0.2 ||
    skipped + notHelpful > helpful + completed ||
    (chatPatterns.concise || 0) > 0.25
  ) {
    suggestionStyle = "compact";
  } else if (operatingMode === "stress") {
    suggestionStyle = "directive";
  } else if (
    operatingMode === "creative" ||
    (chatPatterns.planner || 0) > 0.2 ||
    (outputAffinity.plan || 0) > (outputAffinity.task || 0) + 0.1
  ) {
    suggestionStyle = "strategist";
  }

  const rules = [];

  if (shortAffinity > longAffinity + 0.2) {
    rules.push("You respond better to shorter actions than long open-ended pushes.");
  }

  if ((chatPatterns.builder || 0) > 0.2) {
    rules.push("You usually want Buksy to take action and build outputs instead of only advising.");
  }

  if (lowEffort > highEffort + 0.2) {
    rules.push("Momentum usually improves when Buksy starts you with lighter work.");
  }

  if (helpful + completed > skipped + notHelpful) {
    rules.push("Positive responses are strong enough for Buksy to keep leading with confident recommendations.");
  }

  if (operatingMode === "recovery") {
    rules.push("Current signals suggest recovery mode, so Buksy should reduce pressure and shorten the ask.");
  }

  if (operatingMode === "stress") {
    rules.push("Your system is crowded enough that Buksy should prioritize ruthless clarity over variety.");
  }

  if ((outputAffinity.doc || 0) > 0.2) {
    rules.push("Structured docs and plans seem to land better than vague open-ended replies.");
  }

  if (!rules.length) {
    rules.push("Buksy is still shaping your behavior model from the signals you leave behind.");
  }

  return {
    operatingMode,
    suggestionStyle,
    prefersShortActions: shortAffinity >= longAffinity,
    rules
  };
}

function buildCognitiveLoadReport(state, context = {}) {
  const now = nowDate(context);
  const openTasks = (state.tasks || []).filter((task) => task.status === "open");
  const highFocus = openTasks.filter((task) => task.effort === "high" || Number(task.durationMins) > 60);
  const totalMinutes = openTasks.reduce((sum, task) => sum + Number(task.durationMins || 0), 0);
  const dueSoon = openTasks.filter((task) => {
    const days = daysUntil(task.dueDate, now);
    return days !== null && days <= 2;
  }).length;

  let level = "stable";
  let message = "Your current list looks manageable.";

  if (highFocus.length >= 6 || totalMinutes >= 900) {
    level = "high";
    message = `Your current list has ${highFocus.length} high-focus items. Reduce to 3 before adding more depth.`;
  } else if (highFocus.length >= 4 || dueSoon >= 4) {
    level = "elevated";
    message = "Buksy sees a rising overload risk. Protect one deep block and trim optional work.";
  }

  return {
    level,
    totalMinutes,
    highFocusCount: highFocus.length,
    dueSoonCount: dueSoon,
    message
  };
}

function buildFocusGuard(state, context = {}) {
  const now = nowDate(context);
  const recent = (state.activities || []).filter((activity) => now - new Date(activity.createdAt) <= 20 * MS_PER_MINUTE);
  const taskIds = recent
    .map((activity) => activity.taskId)
    .filter(Boolean);
  const uniqueTaskIds = [...new Set(taskIds)];
  let switchCount = 0;

  for (let index = 1; index < taskIds.length; index += 1) {
    if (taskIds[index] !== taskIds[index - 1]) {
      switchCount += 1;
    }
  }

  return {
    switchCount,
    uniqueTaskCount: uniqueTaskIds.length,
    alert:
      uniqueTaskIds.length >= 4 || switchCount >= 3
        ? `You moved between ${uniqueTaskIds.length} tasks in the last 20 minutes. Finish one before switching again.`
        : "Your recent flow looks reasonably focused."
  };
}

function estimateTaskDelayDays(task, state, context = {}) {
  const now = nowDate(context);
  let delay = 0;
  const dueIn = daysUntil(task.dueDate, now);

  if (task.goalId) {
    delay += 1;
  }

  if (Array.isArray(task.dependsOn) && task.dependsOn.length) {
    delay += Math.min(2, task.dependsOn.length);
  }

  if (Number(task.durationMins) >= 60) {
    delay += 1;
  }

  if (dueIn !== null && dueIn <= 1) {
    delay += 1;
  }

  return Math.max(1, delay);
}

function buildDelayedConsequences(state, context = {}) {
  const scored = (state.tasks || [])
    .filter((task) => task.status === "open")
    .map((task) => ({
      task,
      delayDays: estimateTaskDelayDays(task, state, context),
      score: scoreTask(task, state, context).score
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return scored.map((entry) => ({
    id: entry.task.id,
    title: entry.task.title,
    delayDays: entry.delayDays,
    message: `Skipping this today may delay progress by about ${entry.delayDays} day${entry.delayDays === 1 ? "" : "s"}.`
  }));
}

function buildPriorityRebalance(state, context = {}) {
  const now = nowDate(context);
  const urgent = (state.tasks || [])
    .filter((task) => task.status === "open")
    .filter((task) => task.priority === "high" || (daysUntil(task.dueDate, now) ?? 99) <= 1)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!urgent.length) {
    return {
      message: "No emergency reshuffle needed right now."
    };
  }

  return {
    message: `Buksy is auto-rebalancing around "${urgent[0].title}" because it is the most urgent pressure point right now.`
  };
}

function buildPredictiveDay(state, context = {}) {
  const now = nowDate(context);
  const modeFactor = {
    recovery: 0.55,
    work: 0.82,
    creative: 0.75,
    stress: 0.65
  };
  const endOfDay = new Date(now);
  endOfDay.setHours(21, 0, 0, 0);
  if (endOfDay <= now) {
    endOfDay.setDate(endOfDay.getDate() + 1);
  }

  const behavior = buildBehaviorModel(state, context);
  const baseAvailable = minutesBetween(now, endOfDay);
  const effectiveMinutes = Math.max(60, Math.round(baseAvailable * (modeFactor[behavior.operatingMode] || 0.75)));
  const scored = (state.tasks || [])
    .filter((task) => task.status === "open")
    .map((task) => scoreTask(task, state, context))
    .sort((a, b) => b.score - a.score);
  const anchors = scored
    .filter((entry) => entry.task.scheduledTime)
    .map((entry) => ({
      ...entry,
      time: atClock(now, entry.task.scheduledTime)
    }))
    .filter((entry) => entry.time && entry.time > now)
    .sort((a, b) => a.time - b.time);
  const queue = scored.filter((entry) => !entry.task.scheduledTime);
  const timeline = [];
  const delayWarnings = [];
  const overloadPoints = [];
  const scheduledIds = new Set();
  let cursor = new Date(now);
  let remaining = effectiveMinutes;
  let consecutiveDeep = 0;

  function placeTask(entry, startTime, fixed = false) {
    const endTime = new Date(startTime.getTime() + Number(entry.task.durationMins || 0) * MS_PER_MINUTE);
    timeline.push({
      id: entry.task.id,
      title: entry.task.title,
      start: formatClock(startTime),
      end: formatClock(endTime),
      fixed,
      category: entry.task.category
    });
    scheduledIds.add(entry.task.id);
    remaining -= Number(entry.task.durationMins || 0);
    cursor = endTime;
    if (entry.task.effort === "high" || Number(entry.task.durationMins) > 60) {
      consecutiveDeep += Number(entry.task.durationMins || 0);
      if (consecutiveDeep >= 150) {
        overloadPoints.push(`Around ${formatClock(endTime)}, your schedule tips into deep-work overload.`);
      }
    } else {
      consecutiveDeep = Math.max(0, consecutiveDeep - 30);
    }
  }

  anchors.forEach((anchor) => {
    const gap = minutesBetween(cursor, anchor.time);
    const fill = queue.find((entry) => !scheduledIds.has(entry.task.id) && Number(entry.task.durationMins || 0) <= gap);

    if (fill && remaining >= Number(fill.task.durationMins || 0)) {
      placeTask(fill, new Date(cursor), false);
    } else if (queue[0] && gap > 0 && !scheduledIds.has(queue[0].task.id)) {
      delayWarnings.push(
        `If you attend ${anchor.task.title} at ${formatClock(anchor.time)}, ${queue[0].task.title} may shift to evening.`
      );
    }

    if (remaining >= Number(anchor.task.durationMins || 0)) {
      placeTask(anchor, anchor.time, true);
    }
  });

  queue.forEach((entry) => {
    if (scheduledIds.has(entry.task.id) || remaining < Number(entry.task.durationMins || 0)) {
      return;
    }

    placeTask(entry, new Date(cursor), false);
  });

  const likelyCompleted = timeline.filter((item) => !item.fixed).slice(0, 4);
  const likelyDelayed = scored
    .filter((entry) => !scheduledIds.has(entry.task.id))
    .slice(0, 3)
    .map((entry) => ({
      id: entry.task.id,
      title: entry.task.title
    }));

  if (!delayWarnings.length && likelyDelayed[0]) {
    delayWarnings.push(`${likelyDelayed[0].title} is the first task likely to slip if interruptions show up.`);
  }

  if (!overloadPoints.length) {
    overloadPoints.push("No obvious overload spike is predicted if you stay with the current top sequence.");
  }

  return {
    capacityMinutes: effectiveMinutes,
    likelyCompleted,
    likelyDelayed,
    delayWarnings,
    overloadPoints,
    timeline
  };
}

function buildWeaknessReport(state) {
  const openTasks = (state.tasks || []).filter((task) => task.status === "open");
  const skippedTasks = openTasks.filter((task) => ["skipped", "not_helpful"].includes(task.lastFeedbackKind));
  const longTasks = openTasks.filter((task) => getDurationBucket(task.durationMins) === "long");
  const vagueTasks = openTasks.filter((task) => /\b(work on|fix|manage|handle|project)\b/i.test(task.title));
  const patterns = [];

  if (skippedTasks.length >= 2) {
    patterns.push("Tasks are getting ignored after appearing at the wrong time.");
  }

  if (longTasks.length >= 3) {
    patterns.push("Long tasks are stacking faster than they are getting finished.");
  }

  if (vagueTasks.length >= 2) {
    patterns.push("A few tasks are too vague, which makes starting them harder.");
  }

  if (!patterns.length) {
    patterns.push("No strong failure pattern is dominant yet. Buksy can still tune the system gradually.");
  }

  const improvement = longTasks.length >= 3
    ? "Split one long task into a 25-minute first move."
    : vagueTasks.length >= 2
      ? "Rewrite vague tasks as concrete visible actions."
      : "Keep leaving feedback so Buksy can sharpen the weak spots.";

  return {
    patterns,
    improvement
  };
}

function buildReflectionMemory(state, context = {}) {
  const recentFeedback = (state.feedback || []).slice(0, 8);
  const reflections = [];

  if (
    recentFeedback.some((entry) => entry.kind === "skipped") &&
    (state.checkins?.[0]?.energy || context.energy) === "low"
  ) {
    reflections.push("Last time low energy met a crowded list, skipped suggestions increased. A smaller plan should help.");
  }

  if (recentFeedback.some((entry) => entry.kind === "completed")) {
    reflections.push("Completion signals are strongest when Buksy suggests one clear move instead of a broad list.");
  }

  if (!reflections.length) {
    reflections.push("Buksy is still collecting enough emotional pattern data to reflect more personally.");
  }

  return reflections;
}

function buildDriftAlerts(state, context = {}) {
  const now = nowDate(context);

  return (state.goals || [])
    .map((goal) => {
      const linkedTasks = getLinkedTasks(state, goal.id);
      const lastProgress = linkedTasks
        .map((task) => task.completedAt || task.updatedAt || task.createdAt)
        .filter(Boolean)
        .map((value) => new Date(value))
        .sort((a, b) => b - a)[0];

      const daysSinceProgress = lastProgress ? Math.floor((now - lastProgress) / MS_PER_DAY) : 999;

      if (daysSinceProgress < 8) {
        return null;
      }

      return {
        goalId: goal.id,
        title: goal.title,
        message: `You said "${goal.title}" mattered, but progress has drifted for ${daysSinceProgress} days.`
      };
    })
    .filter(Boolean)
    .slice(0, 3);
}

function buildFutureYou(state, context = {}) {
  const now = nowDate(context);

  const items = (state.goals || []).map((goal) => {
    const linkedTasks = getLinkedTasks(state, goal.id).filter((task) => task.status === "open");
    const remainingMinutes = linkedTasks.reduce((sum, task) => sum + Number(task.durationMins || 0), 0);
    const daysLeft = Math.max(1, daysUntil(goal.targetDate, now) || 1);
    const requiredMinutesPerDay = Math.ceil(remainingMinutes / daysLeft);
    const slipDays = requiredMinutesPerDay > 90 ? Math.ceil((requiredMinutesPerDay - 90) / 45) : 0;

    return {
      goalId: goal.id,
      title: goal.title,
      requiredMinutesPerDay,
      slipDays,
      message:
        slipDays > 0
          ? `At the current load, ${goal.title} may take about ${slipDays} extra day${slipDays === 1 ? "" : "s"}.`
          : `${goal.title} is still on a realistic path if you protect the next few sessions.`
    };
  });

  return items.slice(0, 3);
}

function buildOpportunitySignals(state) {
  const counts = {};
  (state.tasks || []).forEach((task) => {
    if (task.status !== "open" && task.status !== "completed") {
      return;
    }

    counts[task.category] = (counts[task.category] || 0) + 1;
  });

  return Object.entries(counts)
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, count]) => ({
      category,
      message: `You keep returning to ${category} work (${count} tasks). This may deserve its own intentional goal.`
    }));
}

function buildMemoryGraph(state) {
  const nodes = [];
  const edges = [];
  const nodeKeys = new Set();

  function addNode(id, label, type) {
    const key = `${type}:${id}`;
    if (nodeKeys.has(key)) {
      return;
    }

    nodeKeys.add(key);
    nodes.push({ id, label, type });
  }

  (state.projects || []).slice(0, 5).forEach((project) => {
    addNode(project.id, project.name, "project");
  });

  (state.goals || []).slice(0, 5).forEach((goal) => {
    addNode(goal.id, goal.title, "goal");
    if (goal.projectId) {
      edges.push({
        from: goal.id,
        to: goal.projectId,
        label: "belongs to"
      });
    }
  });

  (state.tasks || [])
    .filter((task) => task.status === "open")
    .slice(0, 8)
    .forEach((task) => {
      addNode(task.id, task.title, "task");
      if (task.goalId) {
        edges.push({
          from: task.id,
          to: task.goalId,
          label: "supports"
        });
      }

      if (task.projectId) {
        edges.push({
          from: task.id,
          to: task.projectId,
          label: "belongs to"
        });
      }

      (task.people || []).forEach((person) => {
        addNode(person, person, "person");
        edges.push({
          from: task.id,
          to: person,
          label: "involves"
        });
      });

      if (task.category) {
        const habitId = `habit:${task.category}`;
        addNode(habitId, task.category, "habit");
        edges.push({
          from: task.id,
          to: habitId,
          label: "pattern"
        });
      }
    });

  (state.goals || []).forEach((goal) => {
    (goal.people || []).forEach((person) => {
      addNode(person, person, "person");
      edges.push({
        from: goal.id,
        to: person,
        label: "depends on"
      });
      });
    });

  (state.artifacts || [])
    .slice(0, 6)
    .forEach((artifact) => {
      const type =
        artifact.kind === "document" ? "document"
          : artifact.kind === "decision" || artifact.kind === "comparison" ? "decision"
            : artifact.kind === "research" ? "research"
              : "artifact";
      addNode(artifact.id, artifact.title, type);

      if (artifact.projectId) {
        edges.push({
          from: artifact.id,
          to: artifact.projectId,
          label: "created for"
        });
      }
    });

  (state.knowledge || [])
    .slice(0, 6)
    .forEach((item) => {
      addNode(item.id, item.title || item.category || "memory", "memory");
      if (item.projectId) {
        edges.push({
          from: item.id,
          to: item.projectId,
          label: "stored in"
        });
      }
    });

  return {
    nodes,
    edges: edges.slice(0, 24)
  };
}

function buildGoalCards(state) {
  return (state.goals || []).map((goal) => {
    const linkedTasks = getLinkedTasks(state, goal.id);
    const completed = linkedTasks.filter((task) => task.status === "completed").length;
    const open = linkedTasks.filter((task) => task.status === "open").length;

    return {
      ...goal,
      progressLabel: `${completed} done / ${open} open linked tasks`
    };
  });
}

function buildAdvancedInsights(state, context = {}) {
  return {
    behaviorModel: buildBehaviorModel(state, context),
    cognitiveLoad: buildCognitiveLoadReport(state, context),
    focusGuard: buildFocusGuard(state, context),
    delayedConsequences: buildDelayedConsequences(state, context),
    predictiveDay: buildPredictiveDay(state, context),
    weaknessReport: buildWeaknessReport(state),
    reflectionMemory: buildReflectionMemory(state, context),
    driftAlerts: buildDriftAlerts(state, context),
    futureYou: buildFutureYou(state, context),
    opportunities: buildOpportunitySignals(state),
    memoryGraph: buildMemoryGraph(state),
    priorityRebalance: buildPriorityRebalance(state, context),
    goals: buildGoalCards(state)
  };
}

module.exports = {
  buildBehaviorModel,
  buildCognitiveLoadReport,
  buildFocusGuard,
  buildDelayedConsequences,
  buildPredictiveDay,
  buildWeaknessReport,
  buildReflectionMemory,
  buildDriftAlerts,
  buildFutureYou,
  buildOpportunitySignals,
  buildMemoryGraph,
  buildAdvancedInsights
};
