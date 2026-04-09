const test = require("node:test");
const assert = require("node:assert/strict");
const {
  suggestNextTask,
  learnFromFeedback,
  scoreTask
} = require("../src/engine");
const { createDefaultLearning } = require("../src/store");

function makeState(tasks, overrides = {}) {
  return {
    profile: {
      buddyName: "Buksy",
      preferences: {
        defaultEnergy: "medium"
      },
      learning: createDefaultLearning(),
      ...overrides.profile
    },
    tasks
  };
}

function task(overrides = {}) {
  return {
    id: overrides.id || Math.random().toString(36).slice(2),
    title: overrides.title || "Untitled task",
    category: overrides.category || "work",
    priority: overrides.priority || "medium",
    effort: overrides.effort || "medium",
    durationMins: overrides.durationMins || 25,
    dueDate: overrides.dueDate || null,
    status: overrides.status || "open",
    createdAt: overrides.createdAt || "2026-04-01T08:00:00.000Z",
    updatedAt: overrides.updatedAt || "2026-04-01T08:00:00.000Z",
    lastSuggestedAt: overrides.lastSuggestedAt || null,
    suggestionCount: overrides.suggestionCount || 0
  };
}

test("suggestNextTask prefers urgent and high priority work", () => {
  const state = makeState([
    task({
      id: "low",
      title: "Optional reading",
      priority: "low",
      dueDate: null
    }),
    task({
      id: "high",
      title: "Send proposal",
      priority: "high",
      dueDate: "2026-04-07"
    })
  ]);

  const suggestion = suggestNextTask(state, {
    now: "2026-04-07T10:00:00.000Z",
    energy: "medium"
  });

  assert.equal(suggestion.task.id, "high");
});

test("positive feedback increases the score of similar tasks", () => {
  const baseTask = task({
    id: "focus-task",
    category: "planning",
    effort: "low",
    durationMins: 20
  });
  const followupTask = task({
    id: "followup",
    category: "planning",
    effort: "low",
    durationMins: 20
  });
  const context = {
    now: "2026-04-07T09:00:00.000Z",
    energy: "low"
  };

  const beforeState = makeState([followupTask]);
  const beforeScore = scoreTask(followupTask, beforeState, context).score;
  const learnedProfile = learnFromFeedback(
    {
      buddyName: "Buksy",
      preferences: { defaultEnergy: "medium" },
      learning: createDefaultLearning()
    },
    baseTask,
    "completed",
    { at: context.now }
  );
  const afterState = makeState([followupTask], {
    profile: { learning: learnedProfile.learning }
  });
  const afterScore = scoreTask(followupTask, afterState, context).score;

  assert.ok(afterScore > beforeScore);
});

test("not helpful feedback cools down similar suggestions", () => {
  const repetitiveTask = task({
    id: "email-task",
    category: "admin",
    effort: "low",
    durationMins: 15
  });
  const candidate = task({
    id: "candidate",
    category: "admin",
    effort: "low",
    durationMins: 15
  });
  const context = {
    now: "2026-04-07T17:00:00.000Z",
    energy: "medium"
  };

  const beforeState = makeState([candidate]);
  const beforeScore = scoreTask(candidate, beforeState, context).score;
  const learnedProfile = learnFromFeedback(
    {
      buddyName: "Buksy",
      preferences: { defaultEnergy: "medium" },
      learning: createDefaultLearning()
    },
    repetitiveTask,
    "not_helpful",
    { at: context.now }
  );
  const afterState = makeState([candidate], {
    profile: { learning: learnedProfile.learning }
  });
  const afterScore = scoreTask(candidate, afterState, context).score;

  assert.ok(afterScore < beforeScore);
});
