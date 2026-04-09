const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const {
  learnFromFeedback,
  learnFromConversation,
  recommendDeferrals,
  clearSoftDeferrals,
  computeAdaptiveCapacity
} = require("./engine");
const {
  appendMlEvent,
  retrainLocalModels
} = require("./ml");
const {
  createDefaultOllamaSettings,
  normalizeOllamaSettings
} = require("./ollama");
const { getCurrentUserId } = require("./context");
const {
  isMysqlConfigured,
  loadUserStateJson,
  saveUserStateJson
} = require("./db");
const { buildSeedKnowledge, SEED_VERSION } = require("./knowledge-seed");
const { defaultJiraConfig } = require("./jira");
const { defaultGithubConfig } = require("./github");
const { defaultNotionConfig } = require("./notion");
const { defaultGoogleCalendarConfig } = require("./googleCalendar");

const DATA_FILE = path.join(__dirname, "..", "data", "buksy-data.json");

function createDefaultLearning() {
  return {
    categoryAffinity: {},
    durationAffinity: {
      short: 0,
      medium: 0,
      long: 0
    },
    effortAffinity: {
      low: 0,
      medium: 0,
      high: 0
    },
    timeAffinity: {
      morning: { short: 0, medium: 0, long: 0 },
      afternoon: { short: 0, medium: 0, long: 0 },
      evening: { short: 0, medium: 0, long: 0 }
    },
    responsePatterns: {
      helpful: 0,
      completed: 0,
      skipped: 0,
      notHelpful: 0
    },
    chatPatterns: {
      concise: 0,
      direct: 0,
      builder: 0,
      planner: 0
    },
    outputAffinity: {
      task: 0,
      plan: 0,
      doc: 0,
      research: 0
    }
  };
}

function createDefaultIntegrations() {
  return {
    jira: defaultJiraConfig(),
    github: defaultGithubConfig(),
    notion: defaultNotionConfig(),
    googleCalendar: defaultGoogleCalendarConfig()
  };
}

function createDefaultState() {
  const now = new Date().toISOString();

  return {
    version: 5,
    knowledgeSeedVersion: 0,
    createdAt: now,
    updatedAt: now,
    profile: {
      buddyName: "Buksy",
      ownerName: "",
      preferences: {
        defaultEnergy: "medium"
      },
      ai: createDefaultOllamaSettings(),
      learning: createDefaultLearning(),
      integrations: createDefaultIntegrations(),
      productivityHistory: [],
      completionVelocity: { avgPerDay: 0, trend: "stable" },
      preferredWorkHours: { start: "09:00", end: "18:00", peakFocus: "morning" },
      categoryCompletionRate: {}
    },
    tasks: [],
    goals: [],
    projects: [],
    knowledge: [],
    workflows: [],
    checkins: [],
    feedback: [],
    activities: [],
    artifacts: [],
    conversations: [
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "I'm Buksy. Add a task, tell me your energy, and I'll help you decide what to do next.",
        createdAt: now
      }
    ]
  };
}

function asArray(input) {
  if (Array.isArray(input)) {
    return input.map((entry) => String(entry).trim()).filter(Boolean);
  }

  if (typeof input === "string") {
    return input
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeTask(task = {}) {
  return {
    id: task.id || crypto.randomUUID(),
    title: String(task.title || "").trim(),
    notes: String(task.notes || "").trim(),
    category: String(task.category || "general").trim().toLowerCase(),
    priority: ["high", "medium", "low"].includes(task.priority) ? task.priority : "medium",
    effort: ["high", "medium", "low"].includes(task.effort) ? task.effort : "medium",
    durationMins: Number.isFinite(Number(task.durationMins))
      ? Math.max(5, Math.round(Number(task.durationMins)))
      : 25,
    dueDate: task.dueDate || null,
    deferUntil: task.deferUntil || null,
    scheduledTime: task.scheduledTime || null,
    goalId: task.goalId || null,
    projectId: task.projectId || null,
    people: asArray(task.people),
    dependsOn: asArray(task.dependsOn),
    tags: asArray(task.tags),
    status: ["open", "completed"].includes(task.status) ? task.status : "open",
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || new Date().toISOString(),
    completedAt: task.completedAt || null,
    lastSuggestedAt: task.lastSuggestedAt || null,
    lastFocusedAt: task.lastFocusedAt || null,
    suggestionCount: Number(task.suggestionCount || 0),
    lastFeedbackKind: task.lastFeedbackKind || null,
    externalId: task.externalId ? String(task.externalId).trim() : "",
    source: task.source ? String(task.source).trim() : ""
  };
}

function normalizeGoal(goal = {}) {
  return {
    id: goal.id || crypto.randomUUID(),
    title: String(goal.title || "").trim(),
    objective: String(goal.objective || "").trim(),
    theme: String(goal.theme || "general").trim(),
    targetDate: goal.targetDate || null,
    targetDays: Number.isFinite(Number(goal.targetDays)) ? Math.round(Number(goal.targetDays)) : null,
    roadmap: Array.isArray(goal.roadmap) ? goal.roadmap : [],
    weeklyRoadmap: Array.isArray(goal.weeklyRoadmap) ? goal.weeklyRoadmap : [],
    dependencies: asArray(goal.dependencies),
    hiddenRisks: asArray(goal.hiddenRisks),
    priorityPath: asArray(goal.priorityPath),
    todayMoves: asArray(goal.todayMoves),
    linkedTaskIds: asArray(goal.linkedTaskIds),
    people: asArray(goal.people),
    projectId: goal.projectId || null,
    status: String(goal.status || "active"),
    createdAt: goal.createdAt || new Date().toISOString(),
    updatedAt: goal.updatedAt || new Date().toISOString()
  };
}

function normalizeProject(project = {}) {
  return {
    id: project.id || crypto.randomUUID(),
    name: String(project.name || "").trim(),
    description: String(project.description || "").trim(),
    status: String(project.status || "active"),
    tags: asArray(project.tags),
    dueDate: project.dueDate || null,
    estimatedHours: Number.isFinite(Number(project.estimatedHours)) ? Number(project.estimatedHours) : 0,
    workingDaysPerWeek: Number.isFinite(Number(project.workingDaysPerWeek)) ? Math.min(7, Math.max(1, Number(project.workingDaysPerWeek))) : 5,
    maxHoursPerDay: Number.isFinite(Number(project.maxHoursPerDay)) ? Math.min(12, Math.max(1, Number(project.maxHoursPerDay))) : 6,
    createdAt: project.createdAt || new Date().toISOString(),
    updatedAt: project.updatedAt || new Date().toISOString()
  };
}

function normalizeKnowledgeItem(item = {}) {
  return {
    id: item.id || crypto.randomUUID(),
    title: String(item.title || "").trim(),
    category: String(item.category || "general").trim().toLowerCase(),
    content: String(item.content || "").trim(),
    tags: asArray(item.tags),
    sourceType: String(item.sourceType || "note").trim().toLowerCase(),
    fileName: item.fileName || null,
    fileType: item.fileType || null,
    projectId: item.projectId || null,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString()
  };
}

function normalizeWorkflow(workflow = {}) {
  return {
    id: workflow.id || crypto.randomUUID(),
    title: String(workflow.title || "").trim(),
    trigger: String(workflow.trigger || "").trim(),
    steps: Array.isArray(workflow.steps) ? workflow.steps : [],
    status: String(workflow.status || "draft"),
    projectId: workflow.projectId || null,
    createdAt: workflow.createdAt || new Date().toISOString(),
    updatedAt: workflow.updatedAt || new Date().toISOString()
  };
}

function normalizeActivity(activity = {}) {
  return {
    id: activity.id || crypto.randomUUID(),
    type: String(activity.type || "event").trim(),
    taskId: activity.taskId || null,
    goalId: activity.goalId || null,
    projectId: activity.projectId || null,
    meta: activity.meta && typeof activity.meta === "object" ? activity.meta : {},
    createdAt: activity.createdAt || new Date().toISOString()
  };
}

function normalizeArtifact(artifact = {}) {
  return {
    id: artifact.id || crypto.randomUUID(),
    kind: String(artifact.kind || "note").trim(),
    title: String(artifact.title || "").trim(),
    payload: artifact.payload && typeof artifact.payload === "object" ? artifact.payload : {},
    tags: asArray(artifact.tags),
    category: String(artifact.category || "general").trim().toLowerCase(),
    projectId: artifact.projectId || null,
    createdAt: artifact.createdAt || new Date().toISOString()
  };
}

function normalizeState(state) {
  const next = state || createDefaultState();
  const defaultLearning = createDefaultLearning();

  next.profile = next.profile || {};
  next.profile.buddyName = next.profile.buddyName || "Buksy";
  next.profile.preferences = next.profile.preferences || { defaultEnergy: "medium" };
  next.profile.ai = normalizeOllamaSettings(next.profile.ai || {});
  next.profile.integrations = {
    ...createDefaultIntegrations(),
    ...(next.profile.integrations || {})
  };
  next.profile.productivityHistory = Array.isArray(next.profile.productivityHistory) ? next.profile.productivityHistory : [];
  next.profile.completionVelocity = next.profile.completionVelocity || { avgPerDay: 0, trend: "stable" };
  next.profile.preferredWorkHours = next.profile.preferredWorkHours || { start: "09:00", end: "18:00", peakFocus: "morning" };
  next.profile.categoryCompletionRate = next.profile.categoryCompletionRate || {};
  next.profile.learning = {
    ...defaultLearning,
    ...(next.profile.learning || {}),
    durationAffinity: {
      ...defaultLearning.durationAffinity,
      ...(next.profile.learning?.durationAffinity || {})
    },
    effortAffinity: {
      ...defaultLearning.effortAffinity,
      ...(next.profile.learning?.effortAffinity || {})
    },
    timeAffinity: {
      morning: {
        ...defaultLearning.timeAffinity.morning,
        ...(next.profile.learning?.timeAffinity?.morning || {})
      },
      afternoon: {
        ...defaultLearning.timeAffinity.afternoon,
        ...(next.profile.learning?.timeAffinity?.afternoon || {})
      },
      evening: {
        ...defaultLearning.timeAffinity.evening,
        ...(next.profile.learning?.timeAffinity?.evening || {})
      }
    },
    responsePatterns: {
      ...defaultLearning.responsePatterns,
      ...(next.profile.learning?.responsePatterns || {})
    },
    chatPatterns: {
      ...defaultLearning.chatPatterns,
      ...(next.profile.learning?.chatPatterns || {})
    },
    outputAffinity: {
      ...defaultLearning.outputAffinity,
      ...(next.profile.learning?.outputAffinity || {})
    }
  };

  next.tasks = Array.isArray(next.tasks) ? next.tasks.map(normalizeTask) : [];
  next.goals = Array.isArray(next.goals) ? next.goals.map(normalizeGoal) : [];
  next.projects = Array.isArray(next.projects) ? next.projects.map(normalizeProject) : [];
  next.knowledge = Array.isArray(next.knowledge) ? next.knowledge.map(normalizeKnowledgeItem) : [];
  next.workflows = Array.isArray(next.workflows) ? next.workflows.map(normalizeWorkflow) : [];
  next.checkins = Array.isArray(next.checkins) ? next.checkins : [];
  next.feedback = Array.isArray(next.feedback) ? next.feedback : [];
  next.activities = Array.isArray(next.activities) ? next.activities.map(normalizeActivity) : [];
  next.artifacts = Array.isArray(next.artifacts) ? next.artifacts.map(normalizeArtifact) : [];
  next.conversations = Array.isArray(next.conversations) ? next.conversations : [];
  next.knowledgeSeedVersion = next.knowledgeSeedVersion || 0;

  return next;
}

async function ensureStore() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    await fs.writeFile(DATA_FILE, JSON.stringify(createDefaultState(), null, 2));
  }
}

async function seedKnowledgeIfNeeded(state) {
  if ((state.knowledgeSeedVersion || 0) >= SEED_VERSION) return state;

  const seedItems = buildSeedKnowledge();
  const existingTitles = new Set((state.knowledge || []).map(k => k.title));

  const newItems = seedItems
    .filter(item => !existingTitles.has(item.title))
    .map(item => normalizeKnowledgeItem({
      id: crypto.randomUUID(),
      title: item.title,
      category: item.category,
      content: item.content,
      tags: item.tags || [],
      sourceType: "seed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

  state.knowledge = [...newItems, ...(state.knowledge || [])].slice(0, 500);
  state.knowledgeSeedVersion = SEED_VERSION;
  return state;
}

async function readState() {
  const userId = getCurrentUserId();
  if (isMysqlConfigured() && userId) {
    const raw = await loadUserStateJson(userId);
    if (!raw) {
      const initial = createDefaultState();
      const seeded = await seedKnowledgeIfNeeded(initial);
      await saveUserStateJson(userId, JSON.stringify(seeded));
      return normalizeState(seeded);
    }
    const state = normalizeState(JSON.parse(raw));
    const seeded = await seedKnowledgeIfNeeded(state);
    if (seeded.knowledgeSeedVersion !== state.knowledgeSeedVersion) {
      await saveUserStateJson(userId, JSON.stringify(seeded));
    }
    return seeded;
  }

  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const state = normalizeState(JSON.parse(raw));
  const seeded = await seedKnowledgeIfNeeded(state);
  if (seeded.knowledgeSeedVersion !== (JSON.parse(raw).knowledgeSeedVersion || 0)) {
    await fs.writeFile(DATA_FILE, JSON.stringify(seeded, null, 2));
  }
  return seeded;
}

async function writeState(state) {
  const next = normalizeState(state);
  next.updatedAt = new Date().toISOString();
  const userId = getCurrentUserId();
  if (isMysqlConfigured() && userId) {
    await saveUserStateJson(userId, JSON.stringify(next));
    return next;
  }
  await fs.writeFile(DATA_FILE, JSON.stringify(next, null, 2));
  return next;
}

async function mutateState(mutator) {
  const state = await readState();
  const result = await mutator(state);
  await writeState(state);
  return result;
}

function cleanTaskInput(input = {}) {
  const now = new Date().toISOString();

  return normalizeTask({
    id: crypto.randomUUID(),
    title: String(input.title || "").trim(),
    notes: String(input.notes || "").trim(),
    category: String(input.category || "general").trim().toLowerCase(),
    priority: input.priority,
    effort: input.effort,
    durationMins: input.durationMins,
    dueDate: input.dueDate || null,
    deferUntil: input.deferUntil || null,
    scheduledTime: input.scheduledTime || null,
    goalId: input.goalId || null,
    projectId: input.projectId || null,
    people: input.people,
    dependsOn: input.dependsOn,
    tags: input.tags,
    externalId: input.externalId,
    source: input.source,
    status: "open",
    createdAt: now,
    updatedAt: now
  });
}

function cleanGoalInput(input = {}) {
  const now = new Date().toISOString();

  return normalizeGoal({
    id: crypto.randomUUID(),
    title: String(input.title || "").trim(),
    objective: String(input.objective || "").trim(),
    theme: input.theme || "general",
    targetDate: input.targetDate || null,
    targetDays: input.targetDays || null,
    roadmap: input.roadmap,
    weeklyRoadmap: input.weeklyRoadmap,
    dependencies: input.dependencies,
    hiddenRisks: input.hiddenRisks,
    priorityPath: input.priorityPath,
    todayMoves: input.todayMoves,
    linkedTaskIds: input.linkedTaskIds,
    people: input.people,
    projectId: input.projectId || null,
    status: input.status || "active",
    createdAt: now,
    updatedAt: now
  });
}

function cleanProjectInput(input = {}) {
  const now = new Date().toISOString();

  return normalizeProject({
    id: crypto.randomUUID(),
    name: String(input.name || "").trim(),
    description: String(input.description || "").trim(),
    status: input.status || "active",
    tags: input.tags,
    dueDate: input.dueDate || null,
    estimatedHours: input.estimatedHours || 0,
    workingDaysPerWeek: input.workingDaysPerWeek || 5,
    maxHoursPerDay: input.maxHoursPerDay || 6,
    createdAt: now,
    updatedAt: now
  });
}

function cleanKnowledgeInput(input = {}) {
  const now = new Date().toISOString();

  return normalizeKnowledgeItem({
    id: crypto.randomUUID(),
    title: String(input.title || "").trim(),
    category: input.category || "general",
    content: String(input.content || "").trim(),
    tags: input.tags,
    sourceType: input.sourceType || "note",
    fileName: input.fileName || null,
    fileType: input.fileType || null,
    projectId: input.projectId || null,
    createdAt: now,
    updatedAt: now
  });
}

function cleanWorkflowInput(input = {}) {
  const now = new Date().toISOString();

  return normalizeWorkflow({
    id: crypto.randomUUID(),
    title: String(input.title || "").trim(),
    trigger: String(input.trigger || "").trim(),
    steps: input.steps,
    status: input.status || "draft",
    projectId: input.projectId || null,
    createdAt: now,
    updatedAt: now
  });
}

function findTaskById(state, id) {
  const task = state.tasks.find((entry) => entry.id === id);

  if (!task) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }

  return task;
}

function findGoalById(state, id) {
  const goal = state.goals.find((entry) => entry.id === id);

  if (!goal) {
    const error = new Error("Goal not found");
    error.statusCode = 404;
    throw error;
  }

  return goal;
}

function findProjectById(state, id) {
  const project = state.projects.find((entry) => entry.id === id);

  if (!project) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  return project;
}

function touchProject(state, projectId) {
  if (!projectId) {
    return;
  }

  const project = state.projects.find((entry) => entry.id === projectId);
  if (project) {
    project.updatedAt = new Date().toISOString();
  }
}

function logActivityEntry(state, activity) {
  state.activities.unshift(normalizeActivity(activity));
  state.activities = state.activities.slice(0, 500);
}

function refreshGoalProgress(state, goalId) {
  if (!goalId) {
    return;
  }

  const goal = state.goals.find((entry) => entry.id === goalId);
  if (!goal) {
    return;
  }

  const linkedTasks = state.tasks.filter((task) => task.goalId === goal.id);
  goal.linkedTaskIds = linkedTasks.map((task) => task.id);
  goal.updatedAt = new Date().toISOString();

  if (linkedTasks.length > 0 && linkedTasks.every((task) => task.status === "completed")) {
    goal.status = "completed";
  } else if (goal.status === "completed") {
    goal.status = "active";
  }
}

async function addTask(input) {
  return mutateState((state) => {
    const task = cleanTaskInput(input);

    if (!task.title) {
      const error = new Error("Task title is required");
      error.statusCode = 400;
      throw error;
    }

    if (task.projectId) {
      findProjectById(state, task.projectId);
    }

    state.tasks.unshift(task);
    appendMlEvent({
      type: "task_created",
      taskId: task.id,
      projectId: task.projectId,
      goalId: task.goalId,
      payload: {
        priority: task.priority,
        effort: task.effort,
        durationMins: task.durationMins,
        dueDate: task.dueDate
      }
    }).catch(() => {});
    logActivityEntry(state, {
      type: "task_added",
      taskId: task.id,
      goalId: task.goalId,
      projectId: task.projectId,
      meta: {
        priority: task.priority
      }
    });
    refreshGoalProgress(state, task.goalId);
    touchProject(state, task.projectId);
    return task;
  });
}

async function updateTask(id, patch = {}) {
  return mutateState((state) => {
    const task = findTaskById(state, id);
    const previousGoalId = task.goalId;
    const previousProjectId = task.projectId;

    if (typeof patch.title === "string") {
      task.title = patch.title.trim();
    }

    if (typeof patch.notes === "string") {
      task.notes = patch.notes.trim();
    }

    if (typeof patch.category === "string" && patch.category.trim()) {
      task.category = patch.category.trim().toLowerCase();
    }

    if (["high", "medium", "low"].includes(patch.priority)) {
      task.priority = patch.priority;
    }

    if (["high", "medium", "low"].includes(patch.effort)) {
      task.effort = patch.effort;
    }

    if (patch.durationMins !== undefined) {
      task.durationMins = Math.max(5, Math.round(Number(patch.durationMins) || 25));
    }

    if (patch.dueDate !== undefined) {
      task.dueDate = patch.dueDate || null;
    }

    if (patch.deferUntil !== undefined) {
      task.deferUntil = patch.deferUntil || null;
    }

    if (patch.scheduledTime !== undefined) {
      task.scheduledTime = patch.scheduledTime || null;
    }

    if (patch.goalId !== undefined) {
      task.goalId = patch.goalId || null;
    }

    if (patch.projectId !== undefined) {
      task.projectId = patch.projectId || null;
      if (task.projectId) {
        findProjectById(state, task.projectId);
      }
    }

    if (patch.people !== undefined) {
      task.people = asArray(patch.people);
    }

    if (patch.dependsOn !== undefined) {
      task.dependsOn = asArray(patch.dependsOn);
    }

    if (patch.tags !== undefined) {
      task.tags = asArray(patch.tags);
    }

    if (["open", "completed"].includes(patch.status)) {
      task.status = patch.status;
      task.completedAt = patch.status === "completed" ? new Date().toISOString() : null;
      if (patch.status === "completed") {
        appendMlEvent({
          type: "task_completed",
          taskId: task.id,
          projectId: task.projectId,
          goalId: task.goalId
        }).catch(() => {});
      }
    }

    task.updatedAt = new Date().toISOString();

    logActivityEntry(state, {
      type: task.status === "completed" ? "task_completed" : "task_updated",
      taskId: task.id,
      goalId: task.goalId,
      projectId: task.projectId
    });
    refreshGoalProgress(state, previousGoalId);
    refreshGoalProgress(state, task.goalId);
    touchProject(state, previousProjectId);
    touchProject(state, task.projectId);
    return task;
  });
}

async function deleteTask(id) {
  return mutateState((state) => {
    const index = state.tasks.findIndex((task) => task.id === id);

    if (index === -1) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }

    const [task] = state.tasks.splice(index, 1);
    logActivityEntry(state, {
      type: "task_deleted",
      taskId: task.id,
      goalId: task.goalId,
      projectId: task.projectId
    });
    refreshGoalProgress(state, task.goalId);
    touchProject(state, task.projectId);
    return { ok: true };
  });
}

async function addGoal(input = {}) {
  return mutateState((state) => {
    const goal = cleanGoalInput(input);

    if (!goal.title) {
      const error = new Error("Goal title is required");
      error.statusCode = 400;
      throw error;
    }

    if (goal.projectId) {
      findProjectById(state, goal.projectId);
    }

    state.goals.unshift(goal);
    logActivityEntry(state, {
      type: "goal_created",
      goalId: goal.id,
      projectId: goal.projectId
    });

    const starterTasks = Array.isArray(input.starterTasks) ? input.starterTasks : [];
    const createdTasks = starterTasks.map((starterTask) =>
      cleanTaskInput({
        ...starterTask,
        goalId: goal.id,
        projectId: goal.projectId
      })
    );

    createdTasks.reverse().forEach((task) => {
      state.tasks.unshift(task);
      logActivityEntry(state, {
        type: "task_added",
        taskId: task.id,
        goalId: goal.id,
        projectId: goal.projectId,
        meta: {
          source: "goal_starter"
        }
      });
    });

    goal.linkedTaskIds = createdTasks.map((task) => task.id);
    refreshGoalProgress(state, goal.id);
    touchProject(state, goal.projectId);

    return {
      goal,
      tasks: createdTasks
    };
  });
}

async function addProject(input = {}) {
  return mutateState((state) => {
    const project = cleanProjectInput(input);

    if (!project.name) {
      const error = new Error("Project name is required");
      error.statusCode = 400;
      throw error;
    }

    state.projects.unshift(project);
    logActivityEntry(state, {
      type: "project_created",
      projectId: project.id
    });
    return project;
  });
}

async function addKnowledgeItem(input = {}) {
  return mutateState((state) => {
    const item = cleanKnowledgeInput(input);

    if (!item.title && !item.content) {
      const error = new Error("Knowledge item needs a title or content");
      error.statusCode = 400;
      throw error;
    }

    if (item.projectId) {
      findProjectById(state, item.projectId);
    }

    state.knowledge.unshift(item);
    state.knowledge = state.knowledge.slice(0, 400);
    logActivityEntry(state, {
      type: "knowledge_added",
      projectId: item.projectId,
      meta: {
        category: item.category,
        sourceType: item.sourceType
      }
    });
    touchProject(state, item.projectId);
    return item;
  });
}

async function addWorkflow(input = {}) {
  return mutateState((state) => {
    const workflow = cleanWorkflowInput(input);

    if (!workflow.title) {
      const error = new Error("Workflow title is required");
      error.statusCode = 400;
      throw error;
    }

    if (workflow.projectId) {
      findProjectById(state, workflow.projectId);
    }

    state.workflows.unshift(workflow);
    state.workflows = state.workflows.slice(0, 120);
    logActivityEntry(state, {
      type: "workflow_created",
      projectId: workflow.projectId
    });
    touchProject(state, workflow.projectId);
    return workflow;
  });
}

async function addCheckin(input = {}) {
  return mutateState((state) => {
    const checkin = {
      id: crypto.randomUUID(),
      energy: ["high", "medium", "low"].includes(input.energy) ? input.energy : "medium",
      focus: ["locked_in", "steady", "scattered"].includes(input.focus)
        ? input.focus
        : "steady",
      mood: String(input.mood || "").trim(),
      createdAt: new Date().toISOString()
    };

    state.checkins.unshift(checkin);
    appendMlEvent({
      type: "user_checkin",
      payload: {
        energy: checkin.energy,
        focus: checkin.focus,
        mood: checkin.mood
      }
    }).catch(() => {});
    state.checkins = state.checkins.slice(0, 30);
    logActivityEntry(state, {
      type: "checkin",
      meta: {
        energy: checkin.energy,
        focus: checkin.focus
      }
    });

    const ctx = {
      now: checkin.createdAt,
      energy: checkin.energy,
      focus: checkin.focus
    };
    const mood = String(checkin.mood || "");
    const moodHeavy =
      /\b(bad|rough|tired|exhausted|stressed|anxious|sick|drained|burnout|burned out|overwhelmed|terrible|awful|low|meh|bleh)\b/i.test(
        mood
      );
    const moodLight =
      /\b(great|good|amazing|fantastic|energized|energetic|fresh|excellent|pumped|motivated|sharp|focused)\b/i.test(mood);

    if (checkin.energy === "low" || (moodHeavy && !moodLight)) {
      let capacityScale = 0.62;
      if (checkin.energy === "low") {
        capacityScale *= 0.82;
      }
      if (moodHeavy) {
        capacityScale *= 0.78;
      }
      const deferIds = new Set(recommendDeferrals(state, ctx, { capacityScale }));
      const deferUntil = new Date(checkin.createdAt);
      deferUntil.setDate(deferUntil.getDate() + 1);
      const deferDate = deferUntil.toISOString().slice(0, 10);
      deferIds.forEach((taskId) => {
        const entry = state.tasks.find((t) => t.id === taskId);
        if (!entry || entry.status !== "open") {
          return;
        }
        entry.deferUntil = deferDate;
        entry.updatedAt = checkin.createdAt;
        logActivityEntry(state, {
          type: "task_auto_deferred",
          taskId: entry.id,
          goalId: entry.goalId,
          projectId: entry.projectId,
          meta: { deferUntil: deferDate, source: "checkin_mood" }
        });
      });
    }

    if (checkin.energy !== "low" && (checkin.energy === "high" || moodLight)) {
      clearSoftDeferrals(state, ctx);
    }

    return checkin;
  });
}

async function addConversation(role, text) {
  return mutateState((state) => {
    state.conversations.push({
      id: crypto.randomUUID(),
      role,
      text,
      createdAt: new Date().toISOString()
    });
    if (role === "user") {
      appendMlEvent({
        type: "chat_message",
        text: String(text || "")
      }).catch(() => {});
    }
    state.conversations = state.conversations.slice(-100);
    return { ok: true };
  });
}

async function recordChatPattern(message, outcomeKind = "general") {
  return mutateState((state) => {
    state.profile = learnFromConversation(state.profile, message, outcomeKind);
    appendMlEvent({
      type: "chat_style_signal",
      style: (state.profile.learning.chatPatterns.concise || 0) > 0.2 ? "concise" : "detailed",
      outputKind: outcomeKind
    }).catch(() => {});
    return state.profile.learning;
  });
}

async function updateAiSettings(input = {}) {
  return mutateState((state) => {
    state.profile = state.profile || {};
    state.profile.ai = normalizeOllamaSettings({
      ...(state.profile.ai || createDefaultOllamaSettings()),
      ...input
    });
    return state.profile.ai;
  });
}

async function addFeedback(input = {}) {
  return mutateState((state) => {
    const task = findTaskById(state, input.taskId);
    const kind = ["helpful", "completed", "skipped", "not_helpful"].includes(input.kind)
      ? input.kind
      : null;

    if (!kind) {
      const error = new Error("Feedback kind is invalid");
      error.statusCode = 400;
      throw error;
    }

    const createdAt = new Date().toISOString();
    const feedback = {
      id: crypto.randomUUID(),
      taskId: task.id,
      kind,
      createdAt
    };

    state.feedback.unshift(feedback);
    state.feedback = state.feedback.slice(0, 500);
    state.profile = learnFromFeedback(state.profile, task, kind, { at: createdAt });
    appendMlEvent({
      type: kind === "completed" ? "task_completed" : kind === "skipped" ? "task_skipped" : "task_feedback",
      taskId: task.id,
      projectId: task.projectId,
      goalId: task.goalId,
      kind
    }).catch(() => {});

    task.lastFeedbackKind = kind;
    task.updatedAt = createdAt;

    if (kind === "completed") {
      task.status = "completed";
      task.completedAt = createdAt;
    }

    logActivityEntry(state, {
      type: `feedback_${kind}`,
      taskId: task.id,
      goalId: task.goalId,
      projectId: task.projectId
    });
    refreshGoalProgress(state, task.goalId);
    touchProject(state, task.projectId);

    const latestCheckin = state.checkins[0];
    const context = {
      now: createdAt,
      energy: latestCheckin?.energy || state.profile?.preferences?.defaultEnergy || "medium",
      focus: latestCheckin?.focus || "steady"
    };
    const rebalanceCandidates = kind === "completed" || kind === "not_helpful"
      ? recommendDeferrals(state, context)
      : [];
    const deferUntil = new Date();
    deferUntil.setDate(deferUntil.getDate() + 1);
    const deferDate = deferUntil.toISOString().slice(0, 10);
    let movedCount = 0;

    if (rebalanceCandidates.length > 0) {
      const moveSet = new Set(rebalanceCandidates);
      state.tasks.forEach((entry) => {
        if (entry.status !== "open") {
          return;
        }
        if (moveSet.has(entry.id)) {
          entry.deferUntil = deferDate;
          entry.updatedAt = createdAt;
          movedCount += 1;
          logActivityEntry(state, {
            type: "task_auto_deferred",
            taskId: entry.id,
            goalId: entry.goalId,
            projectId: entry.projectId,
            meta: { deferUntil: deferDate, source: "auto_rebalance" }
          });
          appendMlEvent({
            type: "task_auto_deferred",
            taskId: entry.id,
            projectId: entry.projectId,
            payload: {
              deferUntil: deferDate,
              source: "auto_rebalance"
            }
          }).catch(() => {});
        }
      });
    }

    const completedSinceLastCheckin = state.feedback.filter((entry) => {
      if (entry.kind !== "completed") {
        return false;
      }
      if (!latestCheckin?.createdAt) {
        return true;
      }
      return new Date(entry.createdAt) > new Date(latestCheckin.createdAt);
    }).length;
    const shouldPromptCheckin = completedSinceLastCheckin >= 2;

    const recentlyCompleted = state.feedback.filter((entry) => entry.kind === "completed").length;
    if (recentlyCompleted % 6 === 0) {
      retrainLocalModels().catch(() => {});
    }

    return {
      ...feedback,
      autoAdjustment: {
        movedTaskCount: movedCount,
        movedTaskIds: rebalanceCandidates.slice(0, movedCount),
        adaptiveCapacityMins: computeAdaptiveCapacity(state, context),
        shouldPromptCheckin
      }
    };
  });
}

async function markSuggested(taskId) {
  return mutateState((state) => {
    const task = findTaskById(state, taskId);
    task.lastSuggestedAt = new Date().toISOString();
    task.suggestionCount += 1;
    task.updatedAt = new Date().toISOString();
    logActivityEntry(state, {
      type: "task_suggested",
      taskId: task.id,
      goalId: task.goalId,
      projectId: task.projectId
    });
    return task;
  });
}

async function addActivity(input = {}) {
  return mutateState((state) => {
    const activity = normalizeActivity(input);

    if (activity.taskId) {
      const task = state.tasks.find((entry) => entry.id === activity.taskId);
      if (task && activity.type === "focus_task") {
        task.lastFocusedAt = activity.createdAt;
        task.updatedAt = activity.createdAt;
      }
    }

    if (activity.goalId) {
      findGoalById(state, activity.goalId);
    }

    if (activity.projectId) {
      findProjectById(state, activity.projectId);
    }

    logActivityEntry(state, activity);
    touchProject(state, activity.projectId);
    return activity;
  });
}

async function addArtifact(input = {}) {
  return mutateState((state) => {
    const artifact = normalizeArtifact(input);

    if (artifact.projectId) {
      findProjectById(state, artifact.projectId);
    }

    state.artifacts.unshift(artifact);
    state.artifacts = state.artifacts.slice(0, 150);
    logActivityEntry(state, {
      type: `artifact_${artifact.kind}`,
      projectId: artifact.projectId,
      meta: {
        title: artifact.title,
        category: artifact.category
      }
    });
    touchProject(state, artifact.projectId);
    return artifact;
  });
}

async function updateIntegrations(input = {}) {
  return mutateState((state) => {
    state.profile = state.profile || {};
    state.profile.integrations = {
      ...createDefaultIntegrations(),
      ...(state.profile.integrations || {}),
      ...input
    };
    return state.profile.integrations;
  });
}

async function updateProductivityHistory(entry) {
  return mutateState((state) => {
    state.profile.productivityHistory = state.profile.productivityHistory || [];
    // Update or add today's entry
    const existing = state.profile.productivityHistory.find(e => e.date === entry.date);
    if (existing) {
      Object.assign(existing, entry);
    } else {
      state.profile.productivityHistory.unshift(entry);
    }
    state.profile.productivityHistory = state.profile.productivityHistory.slice(0, 90); // 90 days

    // Recalculate completion velocity
    const last7 = state.profile.productivityHistory.slice(0, 7);
    const avgPerDay = last7.length > 0
      ? last7.reduce((sum, e) => sum + (e.tasksCompleted || 0), 0) / last7.length
      : 0;
    const prev7 = state.profile.productivityHistory.slice(7, 14);
    const prevAvg = prev7.length > 0
      ? prev7.reduce((sum, e) => sum + (e.tasksCompleted || 0), 0) / prev7.length
      : avgPerDay;
    state.profile.completionVelocity = {
      avgPerDay: Math.round(avgPerDay * 10) / 10,
      trend: avgPerDay > prevAvg * 1.1 ? "improving" : avgPerDay < prevAvg * 0.9 ? "declining" : "stable"
    };

    return state.profile.productivityHistory;
  });
}

module.exports = {
  DATA_FILE,
  createDefaultLearning,
  createDefaultState,
  readState,
  addTask,
  updateTask,
  deleteTask,
  addGoal,
  addProject,
  addKnowledgeItem,
  addWorkflow,
  addCheckin,
  addConversation,
  recordChatPattern,
  updateAiSettings,
  addFeedback,
  markSuggested,
  addActivity,
  addArtifact,
  updateIntegrations,
  updateProductivityHistory
};
