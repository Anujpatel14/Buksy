const test = require("node:test");
const assert = require("node:assert/strict");
const { createDefaultState } = require("../src/store");
const {
  buildDigitalTwin,
  buildFutureTimelines,
  runLifeAutopilot,
  buildAutonomousGoalPlan
} = require("../src/meta");

function openTask(overrides = {}) {
  return {
    id: overrides.id || Math.random().toString(36).slice(2),
    title: overrides.title || "Open task",
    notes: overrides.notes || "",
    category: overrides.category || "work",
    priority: overrides.priority || "medium",
    effort: overrides.effort || "medium",
    durationMins: overrides.durationMins || 45,
    dueDate: overrides.dueDate || null,
    deferUntil: overrides.deferUntil || null,
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

function completedTask(overrides = {}) {
  return {
    ...openTask(overrides),
    status: "completed",
    completedAt: overrides.completedAt || "2026-04-20T10:00:00+05:30"
  };
}

test("digital twin finds hesitation triggers and follow-through profile", () => {
  const state = createDefaultState();
  state.profile.completionVelocity = { avgPerDay: 2.2, trend: "improving" };
  state.tasks = [
    completedTask({ title: "Deep build", effort: "high", priority: "high", completedAt: "2026-04-20T10:00:00+05:30" }),
    completedTask({ title: "Launch copy", effort: "medium", priority: "high", completedAt: "2026-04-21T11:00:00+05:30" }),
    openTask({ id: "r1", title: "Unclear partnership decision", notes: "Need to decide if we should proceed", effort: "high", suggestionCount: 3 }),
    openTask({ id: "r2", title: "Client follow-up", people: ["Kirtan"], effort: "medium", suggestionCount: 2 })
  ];
  state.feedback = [
    { taskId: "r1", kind: "skipped", createdAt: "2026-04-22T12:00:00.000Z" },
    { taskId: "r2", kind: "not_helpful", createdAt: "2026-04-22T13:00:00.000Z" }
  ];

  const twin = buildDigitalTwin(state, { now: "2026-04-23T09:00:00.000Z" });

  assert.ok(twin.followThroughScore > 40);
  assert.ok(twin.procrastinationTriggers.length >= 1);
  assert.match(twin.summary, /follow-through profile/i);
});

test("future timelines build three modes with progress points", () => {
  const state = createDefaultState();
  state.profile.completionVelocity = { avgPerDay: 1.8, trend: "stable" };
  state.tasks = [
    openTask({ durationMins: 180 }),
    openTask({ durationMins: 120 }),
    openTask({ durationMins: 90 })
  ];

  const future = buildFutureTimelines(state, { now: "2026-04-23T09:00:00.000Z" });

  assert.equal(future.modes.length, 3);
  assert.equal(future.recommendedMode, "Balanced");
  assert.ok(future.modes.every((mode) => mode.points.length >= 5));
});

test("autopilot trims heavy work on low-energy days", () => {
  const state = createDefaultState();
  state.profile.autopilot = {
    enabled: true,
    mode: "balanced",
    approvalMode: "smart",
    maxDailyDeepTasks: 2
  };
  state.tasks = [
    openTask({ id: "heavy1", title: "Deep architecture review", effort: "high", durationMins: 120, suggestionCount: 3 }),
    openTask({ id: "heavy2", title: "Long strategy deck", effort: "high", durationMins: 90 }),
    openTask({ id: "light1", title: "Reply to customer email", effort: "low", durationMins: 20 }),
    openTask({ id: "light2", title: "Fix settings copy", effort: "low", durationMins: 25 })
  ];
  state.checkins = [
    { energy: "low", focus: "scattered", mood: "tired", createdAt: "2026-04-23T08:30:00.000Z" }
  ];

  const result = runLifeAutopilot(state, { now: "2026-04-23T09:00:00.000Z", energy: "low", focus: "scattered" });

  assert.ok(result.deferments.length >= 1);
  assert.ok(result.focusNow.some((item) => /email|copy/i.test(item.title)));
});

test("autonomous goal plan decomposes the mission with starter tasks", () => {
  const state = createDefaultState();
  const result = buildAutonomousGoalPlan(state, {
    title: "Launch SaaS in 30 days",
    objective: "Ship the first sellable version",
    targetDays: 30
  }, {
    now: "2026-04-23T09:00:00.000Z"
  });

  assert.ok(result.blueprint.starterTasks.length >= 3);
  assert.ok(result.dailyHoursNeeded > 0);
  assert.ok(result.riskMitigation.length >= 1);
});
