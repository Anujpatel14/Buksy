const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { DATA_FILE, createDefaultState, readState } = require("../src/store");
const { buildLifeAnalytics, simulateTimeline } = require("../src/analytics");
const { buildExecutionPlan, executePlannedAction } = require("../src/autonomy");
const { handleChat } = require("../src/assistant");

async function resetStore() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(createDefaultState(), null, 2));
}

function makeCompletedTask(overrides = {}) {
  return {
    id: overrides.id || Math.random().toString(36).slice(2),
    title: overrides.title || "Completed task",
    category: overrides.category || "work",
    priority: overrides.priority || "medium",
    effort: overrides.effort || "medium",
    durationMins: overrides.durationMins || 45,
    dueDate: overrides.dueDate || null,
    scheduledTime: overrides.scheduledTime || null,
    goalId: overrides.goalId || null,
    projectId: overrides.projectId || null,
    people: overrides.people || [],
    dependsOn: overrides.dependsOn || [],
    tags: overrides.tags || [],
    status: overrides.status || "completed",
    createdAt: overrides.createdAt || "2026-04-01T08:00:00.000Z",
    updatedAt: overrides.updatedAt || "2026-04-01T10:30:00.000Z",
    completedAt: overrides.completedAt || "2026-04-01T10:30:00.000Z",
    lastSuggestedAt: overrides.lastSuggestedAt || null,
    lastFocusedAt: overrides.lastFocusedAt || null,
    suggestionCount: overrides.suggestionCount || 0,
    lastFeedbackKind: overrides.lastFeedbackKind || null
  };
}

function makeOpenTask(overrides = {}) {
  return {
    id: overrides.id || Math.random().toString(36).slice(2),
    title: overrides.title || "Open task",
    category: overrides.category || "work",
    priority: overrides.priority || "medium",
    effort: overrides.effort || "medium",
    durationMins: overrides.durationMins || 45,
    dueDate: overrides.dueDate || null,
    scheduledTime: overrides.scheduledTime || null,
    goalId: overrides.goalId || null,
    projectId: overrides.projectId || null,
    people: overrides.people || [],
    dependsOn: overrides.dependsOn || [],
    tags: overrides.tags || [],
    status: "open",
    createdAt: overrides.createdAt || "2026-04-22T08:00:00.000Z",
    updatedAt: overrides.updatedAt || "2026-04-22T08:00:00.000Z",
    completedAt: null,
    lastSuggestedAt: overrides.lastSuggestedAt || null,
    lastFocusedAt: overrides.lastFocusedAt || null,
    suggestionCount: overrides.suggestionCount || 0,
    lastFeedbackKind: overrides.lastFeedbackKind || null
  };
}

test("life analytics surfaces best work window and burnout signal", () => {
  const state = createDefaultState();
  state.tasks = [
    makeCompletedTask({ title: "Deep design", priority: "high", effort: "high", durationMins: 90, completedAt: "2026-04-18T10:15:00+05:30" }),
    makeCompletedTask({ title: "Launch copy", priority: "high", effort: "medium", durationMins: 60, completedAt: "2026-04-19T11:20:00+05:30" }),
    makeCompletedTask({ title: "Admin cleanup", category: "admin", priority: "low", effort: "low", durationMins: 30, completedAt: "2026-04-20T17:10:00+05:30" }),
    makeOpenTask({ title: "Heavy roadmap task", effort: "high", priority: "high", suggestionCount: 3 })
  ];
  state.checkins = [
    { energy: "low", focus: "scattered", mood: "tired", createdAt: "2026-04-22T09:00:00.000Z" },
    { energy: "low", focus: "steady", mood: "flat", createdAt: "2026-04-21T09:00:00.000Z" }
  ];
  state.feedback = [
    { taskId: state.tasks[3].id, kind: "skipped", createdAt: "2026-04-22T12:00:00.000Z" }
  ];

  const analytics = buildLifeAnalytics(state, { now: "2026-04-23T09:00:00.000Z" });

  assert.equal(analytics.performance.bestWindow, "9 AM - 12 PM");
  assert.ok(analytics.burnout.score > 0);
  assert.ok(analytics.avoidance.some((item) => item.title === "Heavy roadmap task"));
});

test("time simulator flags likely slip when target is too close", () => {
  const state = createDefaultState();
  state.tasks = [
    makeOpenTask({ title: "Core build", durationMins: 300 }),
    makeOpenTask({ title: "QA pass", durationMins: 180 }),
    makeOpenTask({ title: "Docs", durationMins: 120 })
  ];

  const result = simulateTimeline(state, {
    label: "Launch sprint",
    dailyHours: 2,
    targetDate: "2026-04-25"
  }, {
    now: "2026-04-23T09:00:00.000Z"
  });

  assert.equal(result.atRisk, true);
  assert.ok(result.deltaDays > 0);
});

test("execution plan infers action type and produces a usable result", () => {
  const state = createDefaultState();
  const plan = buildExecutionPlan({ prompt: "build to do list for client launch" }, state);
  const result = executePlannedAction(plan, state, { now: "2026-04-23T09:00:00.000Z" });

  assert.equal(plan.actionType, "build_todo");
  assert.equal(result.artifact.kind, "todo-plan");
  assert.ok(result.createdTasks.length >= 4);
});

test("chat queues an autonomous follow-up email request for approval", async () => {
  await resetStore();

  const response = await handleChat("Send a follow-up email to the client about the project timeline.");
  const state = await readState();

  assert.ok(response.execution);
  assert.equal(response.execution.actionType, "draft_follow_up_email");
  assert.equal(state.executions.length, 1);
  assert.equal(state.executions[0].status, "pending_confirmation");
});
