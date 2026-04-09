const test = require("node:test");
const assert = require("node:assert/strict");
const { createDefaultLearning } = require("../src/store");
const { buildGoalBlueprint, solveConstraints } = require("../src/strategy");
const {
  buildPredictiveDay,
  buildCognitiveLoadReport,
  buildBehaviorModel
} = require("../src/intelligence");

function task(overrides = {}) {
  return {
    id: overrides.id || Math.random().toString(36).slice(2),
    title: overrides.title || "Untitled task",
    category: overrides.category || "work",
    priority: overrides.priority || "medium",
    effort: overrides.effort || "medium",
    durationMins: overrides.durationMins || 25,
    dueDate: overrides.dueDate || null,
    scheduledTime: overrides.scheduledTime || null,
    goalId: overrides.goalId || null,
    people: overrides.people || [],
    dependsOn: overrides.dependsOn || [],
    tags: overrides.tags || [],
    status: overrides.status || "open",
    createdAt: overrides.createdAt || "2026-04-01T08:00:00.000Z",
    updatedAt: overrides.updatedAt || "2026-04-01T08:00:00.000Z",
    completedAt: overrides.completedAt || null,
    lastSuggestedAt: overrides.lastSuggestedAt || null,
    lastFocusedAt: overrides.lastFocusedAt || null,
    suggestionCount: overrides.suggestionCount || 0,
    lastFeedbackKind: overrides.lastFeedbackKind || null
  };
}

function makeState(overrides = {}) {
  return {
    profile: {
      buddyName: "Buksy",
      preferences: {
        defaultEnergy: "medium"
      },
      learning: createDefaultLearning(),
      ...(overrides.profile || {})
    },
    tasks: overrides.tasks || [],
    goals: overrides.goals || [],
    checkins: overrides.checkins || [],
    feedback: overrides.feedback || [],
    activities: overrides.activities || [],
    artifacts: overrides.artifacts || [],
    conversations: overrides.conversations || []
  };
}

test("goal blueprint creates roadmap and starter tasks", () => {
  const blueprint = buildGoalBlueprint({
    title: "Launch my app",
    targetDays: 20,
    objective: "Ship a usable first version"
  }, new Date("2026-04-07T09:00:00.000Z"));

  assert.equal(blueprint.theme, "product");
  assert.ok(blueprint.roadmap.length >= 4);
  assert.ok(blueprint.starterTasks.length >= 3);
  assert.ok(blueprint.priorityPath.length >= 3);
});

test("constraint solver fits work inside the available window", () => {
  const state = makeState({
    tasks: [
      task({ id: "t1", title: "Quick admin", durationMins: 20, effort: "low", priority: "medium" }),
      task({ id: "t2", title: "High priority doc", durationMins: 60, effort: "medium", priority: "high" }),
      task({ id: "t3", title: "Deep refactor", durationMins: 120, effort: "high", priority: "medium" })
    ]
  });

  const result = solveConstraints(state, {
    availableMinutes: 90,
    energy: "medium"
  }, {
    now: "2026-04-07T10:00:00.000Z",
    energy: "medium"
  });

  assert.ok(result.totalMinutes <= 90);
  assert.ok(result.tasks.length > 0);
});

test("predictive day flags a likely shift around a scheduled task", () => {
  const state = makeState({
    tasks: [
      task({
        id: "meeting",
        title: "2 PM team meeting",
        durationMins: 60,
        effort: "medium",
        priority: "high",
        scheduledTime: "14:00"
      }),
      task({
        id: "build",
        title: "Finish onboarding flow",
        durationMins: 180,
        effort: "high",
        priority: "high"
      }),
      task({
        id: "qa",
        title: "QA pass",
        durationMins: 45,
        effort: "medium",
        priority: "medium"
      })
    ]
  });

  const prediction = buildPredictiveDay(state, {
    now: "2026-04-07T12:30:00.000Z",
    energy: "medium"
  });

  assert.ok(prediction.delayWarnings.length > 0);
});

test("behavior model switches to recovery mode on low energy and scattered focus", () => {
  const state = makeState({
    tasks: [task({ effort: "high", durationMins: 90 })],
    checkins: [
      {
        energy: "low",
        focus: "scattered",
        mood: "tired",
        createdAt: "2026-04-07T08:30:00.000Z"
      }
    ]
  });

  const model = buildBehaviorModel(state, {
    now: "2026-04-07T09:00:00.000Z",
    energy: "low"
  });

  assert.equal(model.operatingMode, "recovery");
});

test("cognitive load report warns when deep work stack is too large", () => {
  const state = makeState({
    tasks: [
      task({ effort: "high", durationMins: 120 }),
      task({ effort: "high", durationMins: 90 }),
      task({ effort: "high", durationMins: 80 }),
      task({ effort: "high", durationMins: 75 }),
      task({ effort: "high", durationMins: 60 }),
      task({ effort: "high", durationMins: 45 })
    ]
  });

  const report = buildCognitiveLoadReport(state, {
    now: "2026-04-07T09:00:00.000Z"
  });

  assert.equal(report.level, "high");
});
