const {
  readState,
  addTask,
  addGoal,
  addConversation,
  addFeedback,
  addArtifact,
  markSuggested,
  recordChatPattern
} = require("./store");
const { suggestNextTask, buildDailyPlan } = require("./engine");
const { buildBehaviorModel } = require("./intelligence");
const {
  buildGoalBlueprint,
  buildNegotiationAssist,
  buildDecisionTimeline,
  solveConstraints
} = require("./strategy");
const {
  buildResearchBrief,
  buildActionHubResult,
  buildStructuredDocument,
  buildTodoList
} = require("./workbench");
const {
  planChatAction,
  generateBuddyReply
} = require("./ollama");
const {
  appendMlEvent,
  readModelState,
  predictRoute,
  rankGenerationCandidates,
  buildScheduleFeatures
} = require("./ml");
const { predictScheduleScore } = require("./mlRuntime");

function plusDays(days) {
  const next = new Date();
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function inferCategory(text) {
  const lower = text.toLowerCase();

  if (/(mail|email|inbox|reply|admin|paperwork|invoice)/.test(lower)) {
    return "admin";
  }

  if (/(gym|walk|run|doctor|health|stretch|sleep)/.test(lower)) {
    return "health";
  }

  if (/(grocer|shopping|buy|pickup|bank|errand)/.test(lower)) {
    return "errands";
  }

  if (/(plan|journal|review|reflect|budget)/.test(lower)) {
    return "planning";
  }

  if (/(study|learn|course|read|practice|interview|exam)/.test(lower)) {
    return "learning";
  }

  if (/(launch|app|build|code|design|client|proposal|product)/.test(lower)) {
    return "work";
  }

  if (/(call|family|friend|message)/.test(lower)) {
    return "personal";
  }

  return "general";
}

function inferPriority(text) {
  const lower = text.toLowerCase();

  if (/(urgent|asap|important|critical|must)/.test(lower)) {
    return "high";
  }

  if (/(later|whenever|someday|optional)/.test(lower)) {
    return "low";
  }

  return "medium";
}

function inferEffort(text) {
  const lower = text.toLowerCase();

  if (/(deep|hard|focus|intense|complex|launch|build)/.test(lower)) {
    return "high";
  }

  if (/(quick|easy|small|light)/.test(lower)) {
    return "low";
  }

  return "medium";
}

function parseDuration(text) {
  const match = text.match(/(\d+)\s*(minutes|minute|mins|min|hours|hour|hrs|hr)/i);

  if (!match) {
    return 25;
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  return unit.startsWith("h") ? value * 60 : value;
}

function parseDueDate(text) {
  const lower = text.toLowerCase();

  if (lower.includes("tomorrow")) {
    return plusDays(1);
  }

  if (lower.includes("today")) {
    return plusDays(0);
  }

  const dayMatch = lower.match(/in\s+(\d+)\s+days?/i);

  if (dayMatch) {
    return plusDays(Number(dayMatch[1]));
  }

  return null;
}

function parseTargetDays(text) {
  const match = text.match(/in\s+(\d+)\s+days?/i);
  return match ? Number(match[1]) : null;
}

function stripCommandWords(text) {
  return text
    .replace(/^(please\s+)?(add|create|remember|track|make)\s+/i, "")
    .replace(/^remind me to\s+/i, "")
    .replace(/\b(today|tomorrow|in\s+\d+\s+days?)\b/gi, "")
    .replace(/\b(urgent|asap|important|critical|must|later|whenever|someday|optional)\b/gi, "")
    .replace(/\b(quick|easy|small|light|deep|hard|focus|intense|complex)\b/gi, "")
    .replace(/\b\d+\s*(minutes|minute|mins|min|hours|hour|hrs|hr)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBuilderPrompt(message) {
  return String(message || "")
    .replace(/^(please\s+)?(build|create|make|write|draft|generate)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeTaskCreation(message) {
  return /^(please\s+)?(add|create|remember|track)\s+/i.test(message) || /^remind me to\s+/i.test(message);
}

function looksLikeGoalCreation(message) {
  return /^goal\s+/i.test(message);
}

function looksLikeNextMove(message) {
  return /(what should i do next|what next|next step|suggest|plan my day|plan today)/i.test(message);
}

function looksLikeDone(message) {
  return /^(done|finished|completed)\s+/i.test(message);
}

function looksLikeNegotiation(message) {
  return /\b(reply|draft reply|negotiate|write to|client reply|email reply)\b/i.test(message);
}

function looksLikeDecision(message) {
  return /^compare\s+/i.test(message);
}

function looksLikeConstraintSolve(message) {
  return /i have\s+\d+\s*(minutes|minute|mins|min|hours|hour|hrs|hr)/i.test(message);
}

function looksLikeDocumentBuild(message) {
  const hasTodoListSignal = /\b(to-?do|to\s+do|todo|task list|checklist|list)\b/i.test(message);
  if (hasTodoListSignal) {
    return false;
  }

  return (
    /^(please\s+)?(build|create|make|write|draft|generate)\s+/i.test(message) &&
    /\b(doc|document|brief|outline|proposal)\b/i.test(message)
  ) || (
    /^(please\s+)?(build|create|make|write|draft|generate)\s+/i.test(message) &&
    /\b(launch plan|weekly plan|strategy brief)\b/i.test(message)
  );
}

function looksLikeTodoBuild(message) {
  return (
    /^(please\s+)?(build|create|make|generate)\s+/i.test(message) &&
    /\b(to-?do|to\s+do|todo|task list|checklist|list)\b/i.test(message)
  );
}

function looksLikeResearchRequest(message) {
  return /^(research|analyze|investigate)\s+/i.test(message);
}

function looksLikeActionPack(message) {
  return /\b(invoice|spreadsheet|email draft|draft email|document outline)\b/i.test(message) &&
    /^(please\s+)?(build|create|make|generate|draft)\s+/i.test(message);
}

function findTaskByTitle(state, fragment) {
  const needle = fragment.toLowerCase().trim();

  return state.tasks.find(
    (task) => task.status === "open" && task.title.toLowerCase().includes(needle)
  );
}

function buildRuntimeContext(state, extras = {}) {
  const latestCheckin = state.checkins[0];

  return {
    now: new Date().toISOString(),
    energy: latestCheckin?.energy || state.profile.preferences.defaultEnergy || "medium",
    focus: latestCheckin?.focus || "steady",
    calendar: extras.calendar ?? null
  };
}

function replyStyleForState(state) {
  const behavior = buildBehaviorModel(state, buildRuntimeContext(state));
  return behavior.suggestionStyle || "coach";
}

function formatReply(style, verbose, compact = verbose) {
  if (style === "compact" || style === "directive") {
    return compact;
  }

  return verbose;
}

function createTodayTodoFromState(state) {
  const plan = buildDailyPlan(state, buildRuntimeContext(state), 5);

  return {
    title: "Today's To-Do List",
    summary: "Buksy built this from your current priorities and due pressure.",
    tasks: plan.map((item, index) => ({
      title: item.title,
      category: item.category,
      priority: index === 0 ? "high" : "medium",
      effort: "medium",
      durationMins: item.durationMins,
      order: index + 1,
      notes: "Built from your live queue."
    }))
  };
}

async function buildMlScoreMap(state, context) {
  const openTasks = (state.tasks || []).filter((task) => task.status === "open").slice(0, 40);
  const entries = await Promise.all(
    openTasks.map(async (task) => {
      const features = buildScheduleFeatures(task, state, context);
      const mlScore = await predictScheduleScore(features);
      await appendMlEvent({
        type: "schedule_example",
        taskId: task.id,
        features,
        label: task.lastFeedbackKind === "completed" ? 1 : 0
      }).catch(() => {});
      return [task.id, mlScore];
    })
  );
  return Object.fromEntries(entries);
}

function buildChatSnapshot(state) {
  const context = buildRuntimeContext(state);
  const behavior = buildBehaviorModel(state, context);
  const openTasks = state.tasks
    .filter((task) => task.status === "open")
    .slice(0, 6)
    .map((task) => `- ${task.title} (${task.priority}, ${task.durationMins} mins${task.dueDate ? `, due ${task.dueDate}` : ""})`)
    .join("\n") || "- none";
  const goals = state.goals
    .slice(0, 4)
    .map((goal) => `- ${goal.title}${goal.targetDate ? ` (target ${goal.targetDate})` : ""}`)
    .join("\n") || "- none";
  const projects = state.projects
    .slice(0, 4)
    .map((project) => `- ${project.name}`)
    .join("\n") || "- none";
  const recentConversation = state.conversations
    .slice(-4)
    .map((entry) => `${entry.role}: ${entry.text}`)
    .join("\n") || "No recent conversation.";

  return [
    `Buddy: ${state.profile.buddyName || "Buksy"}`,
    `Energy: ${context.energy}`,
    `Focus: ${context.focus}`,
    `Operating mode: ${behavior.operatingMode}`,
    `Preferred reply style: ${behavior.suggestionStyle}`,
    "Open tasks:",
    openTasks,
    "Goals:",
    goals,
    "Projects:",
    projects,
    "Recent conversation:",
    recentConversation
  ].join("\n");
}

function extractComparisonParts(message) {
  const parts = message.replace(/^compare\s+/i, "").split(/\s+vs\s+/i);
  return {
    optionA: String(parts[0] || "").trim(),
    optionB: String(parts[1] || "").trim()
  };
}

function currentAiSettings(state) {
  return state.profile?.ai || {};
}

function canUseOllamaRouting(state) {
  const ai = currentAiSettings(state);
  return ai.enabled !== false && ai.useForRouting !== false;
}

function canUseOllamaReplies(state) {
  const ai = currentAiSettings(state);
  return ai.enabled !== false && ai.useForReplies !== false;
}

async function answerWithSuggestion(state) {
  const context = buildRuntimeContext(state);
  const mlScoreByTask = await buildMlScoreMap(state, context);
  const behaviorModel = buildBehaviorModel(state, context);
  const suggestion = suggestNextTask(state, {
    ...context,
    mlScoreByTask,
    suggestionStyle: behaviorModel.suggestionStyle
  });

  if (!suggestion) {
    return {
      reply: "You're clear right now. Add a task, ask Buksy to build a plan, or say what you're trying to finish.",
      suggestion: null
    };
  }

  await markSuggested(suggestion.task.id);

  return {
    reply: formatReply(
      behaviorModel.suggestionStyle,
      `${suggestion.coachMessage} Want me to build a to-do list or just keep steering one step at a time?`,
      `${suggestion.coachMessage} Want a to-do list too?`
    ),
    suggestion
  };
}

async function replyAndStore(state, reply, payload = {}) {
  await addConversation("assistant", reply);
  return {
    reply,
    ...payload
  };
}

async function maybeGenerateOllamaReply(state, message, style) {
  if (!canUseOllamaReplies(state)) {
    return "";
  }

  try {
    return await generateBuddyReply(
      message,
      buildChatSnapshot(state),
      style,
      currentAiSettings(state)
    );
  } catch (error) {
    return "";
  }
}

async function executeDocumentBuild(state, style, sourceMessage, prompt = sourceMessage) {
  await recordChatPattern(sourceMessage, "doc");
  const candidates = [
    buildStructuredDocument({ prompt }),
    buildStructuredDocument({ prompt: `${prompt} concise` }),
    buildStructuredDocument({ prompt: `${prompt} detailed` })
  ];
  const modelState = await readModelState();
  const document = rankGenerationCandidates(
    candidates,
    { outputKind: "doc", preferredStyle: style === "compact" ? "concise" : "detailed" },
    modelState
  )[0];
  const artifact = await addArtifact({
    kind: "document",
    title: document.title,
    payload: document,
    category: "docs"
  });
  await appendMlEvent({
    type: "generation_feedback",
    outputKind: "doc",
    kind: "accepted",
    source: "assistant_execute_document"
  }).catch(() => {});
  const nextState = await readState();
  const nextStyle = replyStyleForState(nextState);

  return replyAndStore(
    nextState,
    formatReply(
      nextStyle,
      `I built "${document.title}" and saved it in your workspace. It includes ${document.sections.length} focused sections and a next-actions block to move fast.`,
      `Built "${document.title}" and saved it.`
    ),
    { document, artifact }
  );
}

async function executeTodoBuild(state, style, sourceMessage, prompt = sourceMessage) {
  await recordChatPattern(sourceMessage, "plan");
  const builderPrompt = prompt || sourceMessage;
  const todoCandidates = /\bfor\b/i.test(builderPrompt) || /\blaunch|client|study|learn|proposal|app\b/i.test(builderPrompt)
    ? [
      buildTodoList({ prompt: builderPrompt }),
      buildTodoList({ prompt: `${builderPrompt} concise` }),
      buildTodoList({ prompt: `${builderPrompt} checklist` })
    ]
    : [createTodayTodoFromState(state)];
  const modelState = await readModelState();
  const todoList = rankGenerationCandidates(
    todoCandidates,
    { outputKind: "task", preferredStyle: style === "compact" ? "concise" : "checklist" },
    modelState
  )[0];
  const createdTasks = [];

  if (todoList.tasks.length && todoList.title !== "Today's To-Do List") {
    for (const item of todoList.tasks) {
      createdTasks.push(
        await addTask({
          title: item.title,
          category: item.category,
          priority: item.priority,
          effort: item.effort,
          durationMins: item.durationMins,
          notes: item.notes
        })
      );
    }
  }

  const artifact = await addArtifact({
    kind: "todo-plan",
    title: todoList.title,
    payload: todoList,
    category: "planning"
  });
  await appendMlEvent({
    type: "generation_feedback",
    outputKind: "task",
    kind: "accepted",
    source: "assistant_execute_todo"
  }).catch(() => {});
  const nextState = await readState();
  const nextStyle = replyStyleForState(nextState);

  return replyAndStore(
    nextState,
    formatReply(
      nextStyle,
      createdTasks.length
        ? `I built "${todoList.title}" and added ${createdTasks.length} tasks to your list. Start with "${createdTasks[0].title}".`
        : `I built "${todoList.title}" from your current priorities so you can work from a cleaner list.`,
      createdTasks.length
        ? `Built "${todoList.title}" and added ${createdTasks.length} tasks.`
        : `Built "${todoList.title}".`
    ),
    { todoList, createdTasks, artifact }
  );
}

async function executeActionPack(state, style, sourceMessage) {
  await recordChatPattern(sourceMessage, "doc");
  const actionType = /invoice/i.test(sourceMessage)
    ? "invoice_email"
    : /spreadsheet/i.test(sourceMessage)
      ? "spreadsheet_blueprint"
      : /outline/i.test(sourceMessage)
        ? "document_outline"
        : "draft_email";
  const actionPack = buildActionHubResult({
    actionType,
    prompt: sourceMessage
  });
  const artifact = await addArtifact({
    kind: "action-pack",
    title: actionPack.title,
    payload: actionPack,
    category: "operations"
  });

  return replyAndStore(
    state,
    formatReply(
      style,
      `I built "${actionPack.title}" and saved it for you. Open the latest result in Buksy to use or refine it.`,
      `Built "${actionPack.title}" and saved it.`
    ),
    { actionPack, artifact }
  );
}

async function executeResearch(state, style, sourceMessage, topic) {
  await recordChatPattern(sourceMessage, "research");
  const brief = buildResearchBrief({ topic });
  const artifact = await addArtifact({
    kind: "research",
    title: brief.topic,
    payload: brief,
    category: "research"
  });

  return replyAndStore(
    state,
    formatReply(
      style,
      `I started a research brief for "${brief.topic}". Add source notes later and Buksy will sharpen the insights and contradictions.`,
      `Started a research brief for "${brief.topic}".`
    ),
    { brief, artifact }
  );
}

async function executeTaskCreation(state, style, sourceMessage, titleOverride = "") {
  await recordChatPattern(sourceMessage, "task");
  const title = String(titleOverride || stripCommandWords(sourceMessage) || sourceMessage).trim();
  const task = await addTask({
    title,
    category: inferCategory(title),
    priority: inferPriority(sourceMessage),
    effort: inferEffort(sourceMessage),
    durationMins: parseDuration(sourceMessage),
    dueDate: parseDueDate(sourceMessage)
  });

  return replyAndStore(
    state,
    formatReply(
      style,
      `Added "${task.title}" to your list. Buksy will factor it into your next move.`,
      `Added "${task.title}".`
    ),
    { taskAdded: task }
  );
}

async function executeGoalCreation(state, style, sourceMessage, input = {}) {
  await recordChatPattern(sourceMessage, "plan");
  const title = String(
    input.title ||
    sourceMessage.replace(/^goal\s+/i, "").replace(/\s+in\s+\d+\s+days?.*$/i, "").trim() ||
    "Untitled goal"
  ).trim();
  const targetDays = Number(input.targetDays) || parseTargetDays(sourceMessage) || 20;
  const blueprint = buildGoalBlueprint({
    title,
    targetDays,
    objective: input.objective || `Autogenerated from chat: ${sourceMessage}`
  });
  const result = await addGoal(blueprint);

  return replyAndStore(
    state,
    formatReply(
      style,
      `Goal created: "${result.goal.title}". I mapped the first moves and linked ${result.tasks.length} starter tasks to it.`,
      `Created "${result.goal.title}" with ${result.tasks.length} starter tasks.`
    ),
    { goal: result.goal, starterTasks: result.tasks }
  );
}

async function executeSuggestion(state) {
  const result = await answerWithSuggestion(state);
  return replyAndStore(state, result.reply, result);
}

async function executeDone(state, style, sourceMessage) {
  const fragment = sourceMessage.replace(/^(done|finished|completed)\s+/i, "").trim();
  const task = findTaskByTitle(state, fragment);

  if (!task) {
    return replyAndStore(
      state,
      "I couldn't match that to an open task yet. Use the task buttons, or say the task name a bit more closely."
    );
  }

  await addFeedback({ taskId: task.id, kind: "completed" });

  return replyAndStore(
    state,
    formatReply(
      style,
      `Nice work. I marked "${task.title}" as completed and learned from that win.`,
      `Marked "${task.title}" done.`
    ),
    { completedTaskId: task.id }
  );
}

async function executeConstraintSolve(state, style, sourceMessage, availableMinutes = parseDuration(sourceMessage)) {
  await recordChatPattern(sourceMessage, "task");
  const context = buildRuntimeContext(state);
  const result = solveConstraints(
    state,
    {
      availableMinutes,
      energy: context.energy
    },
    context
  );

  return replyAndStore(
    state,
    result.tasks.length > 0
      ? formatReply(
          style,
          `Best fit for the next ${availableMinutes} minutes: ${result.tasks.map((task) => task.title).join(", ")}.`,
          `Best fit: ${result.tasks.map((task) => task.title).join(", ")}.`
        )
      : "Nothing fits the current window well yet. Shrink one task or let Buksy build a cleaner to-do list.",
    { constraintPlan: result }
  );
}

async function executeNegotiation(state, style, sourceMessage, scenario) {
  await recordChatPattern(sourceMessage, "doc");
  const draft = buildNegotiationAssist({
    scenario: scenario || sourceMessage.replace(/^(reply|draft reply|negotiate|write to)\s+/i, ""),
    tone: "calm",
    desiredOutcome: "a clear workable agreement"
  });
  await addArtifact({
    kind: "negotiation",
    title: "Chat negotiation draft",
    payload: draft,
    category: "communication"
  });

  return replyAndStore(
    state,
    formatReply(
      style,
      `I drafted the negotiation angle and saved it. Best opening: ${draft.opening}`,
      `Drafted it. Opening: ${draft.opening}`
    ),
    { negotiation: draft }
  );
}

async function executeDecision(state, style, sourceMessage, input = {}) {
  await recordChatPattern(sourceMessage, "plan");
  const extracted = extractComparisonParts(sourceMessage);
  const analysis = buildDecisionTimeline({
    decision: input.decision || input.title || "Quick comparison",
    optionA: input.optionA || extracted.optionA || "",
    optionB: input.optionB || extracted.optionB || "",
    horizonDays: 90
  });
  await addArtifact({
    kind: "decision",
    title: "Chat decision analysis",
    payload: analysis,
    category: "strategy"
  });

  return replyAndStore(
    state,
    analysis.recommendation,
    { decisionAnalysis: analysis }
  );
}

async function executeStatusOverview(state, style, sourceMessage) {
  await recordChatPattern(sourceMessage, "plan");
  const open = state.tasks.filter((task) => task.status === "open").length;
  const done = state.tasks.filter((task) => task.status === "completed").length;
  const context = buildRuntimeContext(state);
  const mlScoreByTask = await buildMlScoreMap(state, context);
  const plan = buildDailyPlan(state, { ...context, mlScoreByTask }, 3);
  const topLine = plan[0] ? `Top move: ${plan[0].title}.` : "No tasks queued yet.";

  return replyAndStore(
    state,
    formatReply(
      style,
      `You have ${open} open tasks and ${done} completed. ${topLine}`,
      `${open} open, ${done} done. ${topLine}`
    ),
    { dailyPlan: plan }
  );
}

async function executeOverwhelmSupport(state, style, sourceMessage) {
  await recordChatPattern(sourceMessage, "plan");
  const context = buildRuntimeContext(state);
  const mlScoreByTask = await buildMlScoreMap(state, context);
  const plan = buildDailyPlan(state, { ...context, mlScoreByTask }, 3);
  const reply = plan.length
    ? `Let's shrink the field. Focus on ${plan[0].title} first, then ${plan[1]?.title || "one smaller cleanup task"}. If you want, I can also build a clean to-do list from everything on your plate.`
    : "Your queue is still clear. Tell me what you're trying to finish, and I'll turn it into a plan or a to-do list.";

  return replyAndStore(state, formatReply(style, reply, reply));
}

async function maybeHandleOllamaRoute(state, style, message) {
  if (!canUseOllamaRouting(state)) {
    return null;
  }

  let route = null;

  try {
    route = await planChatAction(
      message,
      buildChatSnapshot(state),
      currentAiSettings(state)
    );
  } catch (error) {
    return null;
  }

  if (!route || !route.intent) {
    return null;
  }

  if (route.intent === "answer") {
    const reply = route.reply || await maybeGenerateOllamaReply(state, message, style);

    if (!reply) {
      return null;
    }

    await recordChatPattern(message, "general");
    await appendMlEvent({
      type: "chat_route_selected",
      provider: "ollama",
      intent: route.intent,
      confidence: route.confidence || 0,
      text: message
    }).catch(() => {});
    return replyAndStore(state, reply, { ai: { provider: "ollama", route } });
  }

  if (route.confidence > 0 && route.confidence < 0.42) {
    return null;
  }

  await appendMlEvent({
    type: "chat_route_selected",
    provider: "ollama",
    intent: route.intent,
    confidence: route.confidence || 0,
    text: message
  }).catch(() => {});

  switch (route.intent) {
    case "build_document":
      return executeDocumentBuild(state, style, message, route.prompt || route.title || message);
    case "build_todo":
      return executeTodoBuild(state, style, message, route.prompt || route.title || message);
    case "add_task":
      return executeTaskCreation(state, style, message, route.title);
    case "create_goal":
      return executeGoalCreation(state, style, message, {
        title: route.title,
        targetDays: route.targetDays,
        objective: route.prompt
      });
    case "research":
      return executeResearch(state, style, message, route.prompt || route.title || message);
    case "draft_reply":
      return executeNegotiation(state, style, message, route.prompt || route.title || message);
    case "suggest_next":
      return executeSuggestion(await readState());
    case "solve_constraints":
      return executeConstraintSolve(await readState(), style, message, route.availableMinutes || parseDuration(message));
    case "compare_options":
      return executeDecision(state, style, message, {
        title: route.title,
        optionA: route.optionA,
        optionB: route.optionB
      });
    case "status_overview":
      return executeStatusOverview(await readState(), style, message);
    default:
      return null;
  }
}

async function maybeHandleLocalMlRoute(state, style, message) {
  const modelState = await readModelState();
  const intents = [
    "build_document",
    "build_todo",
    "add_task",
    "create_goal",
    "research",
    "draft_reply",
    "suggest_next",
    "solve_constraints",
    "compare_options",
    "status_overview"
  ];
  const predicted = predictRoute(message, modelState, intents);
  if (!predicted.intent || predicted.confidence < 0.72) {
    return null;
  }

  await appendMlEvent({
    type: "chat_route_selected",
    provider: "local_ml",
    intent: predicted.intent,
    confidence: predicted.confidence,
    text: message
  }).catch(() => {});

  switch (predicted.intent) {
    case "build_document":
      return executeDocumentBuild(state, style, message, message);
    case "build_todo":
      return executeTodoBuild(state, style, message, message);
    case "add_task":
      return executeTaskCreation(state, style, message);
    case "create_goal":
      return executeGoalCreation(state, style, message);
    case "research":
      return executeResearch(state, style, message, message);
    case "draft_reply":
      return executeNegotiation(state, style, message);
    case "suggest_next":
      return executeSuggestion(await readState());
    case "solve_constraints":
      return executeConstraintSolve(await readState(), style, message);
    case "compare_options":
      return executeDecision(state, style, message);
    case "status_overview":
      return executeStatusOverview(await readState(), style, message);
    default:
      return null;
  }
}

async function handleChat(rawMessage) {
  const message = String(rawMessage || "").trim();

  if (!message) {
    return {
      reply: "Tell Buksy what to do. Try: build launch plan doc, build to-do list, reply to client, or what should I do next?"
    };
  }

  await addConversation("user", message);
  let state = await readState();
  let style = replyStyleForState(state);

  if (looksLikeDocumentBuild(message)) {
    return executeDocumentBuild(state, style, message, message);
  }

  if (looksLikeTodoBuild(message)) {
    return executeTodoBuild(state, style, message, message);
  }

  if (looksLikeActionPack(message)) {
    return executeActionPack(state, style, message);
  }

  if (looksLikeResearchRequest(message)) {
    const topic = message.replace(/^(research|analyze|investigate)\s+/i, "").trim();
    return executeResearch(state, style, message, topic);
  }

  if (looksLikeTaskCreation(message)) {
    return executeTaskCreation(state, style, message);
  }

  if (looksLikeGoalCreation(message)) {
    return executeGoalCreation(state, style, message);
  }

  if (looksLikeNextMove(message)) {
    state = await readState();
    return executeSuggestion(state);
  }

  if (looksLikeDone(message)) {
    state = await readState();
    style = replyStyleForState(state);
    return executeDone(state, style, message);
  }

  if (looksLikeConstraintSolve(message)) {
    state = await readState();
    style = replyStyleForState(state);
    return executeConstraintSolve(state, style, message);
  }

  if (looksLikeNegotiation(message)) {
    return executeNegotiation(state, style, message);
  }

  if (looksLikeDecision(message)) {
    return executeDecision(state, style, message);
  }

  if (/status|overview|how am i doing/i.test(message)) {
    state = await readState();
    style = replyStyleForState(state);
    return executeStatusOverview(state, style, message);
  }

  if (/stuck|overwhelmed|too much|cluttered/i.test(message)) {
    state = await readState();
    style = replyStyleForState(state);
    return executeOverwhelmSupport(state, style, message);
  }

  const localMlRouted = await maybeHandleLocalMlRoute(state, style, message);
  if (localMlRouted) {
    return localMlRouted;
  }

  const routed = await maybeHandleOllamaRoute(state, style, message);
  if (routed) {
    return routed;
  }

  const suggestionState = await readState();
  const ollamaReply = await maybeGenerateOllamaReply(
    suggestionState,
    message,
    replyStyleForState(suggestionState)
  );

  if (ollamaReply) {
    await recordChatPattern(message, "general");
    return replyAndStore(suggestionState, ollamaReply, { ai: { provider: "ollama" } });
  }

  const suggestion = suggestNextTask(suggestionState, buildRuntimeContext(suggestionState));
  const fallbackReply = suggestion?.task
    ? `I didn't ignore that. The strongest helpful move I can make right now is to point you at "${suggestion.task.title}". If you want a different output, try: build launch plan doc, build to-do list, or reply to client.`
    : "Tell Buksy what to build. Good examples: build launch plan doc, build to-do list, draft client reply, or goal launch my app in 20 days.";
  await recordChatPattern(message, "general");
  return replyAndStore(
    suggestionState,
    formatReply(replyStyleForState(suggestionState), fallbackReply, fallbackReply)
  );
}

module.exports = {
  buildRuntimeContext,
  handleChat
};
