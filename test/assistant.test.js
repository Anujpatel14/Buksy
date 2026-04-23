const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { DATA_FILE, createDefaultState, readState, addTask, addCheckin } = require("../src/store");
const { handleChat } = require("../src/assistant");

const realFetch = global.fetch;

async function resetStore() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(createDefaultState(), null, 2));
}

async function withMockFetch(handler, work) {
  global.fetch = handler;

  try {
    await work();
  } finally {
    global.fetch = realFetch;
  }
}

test("chat builds and stores a document from a direct command", async () => {
  await resetStore();

  const result = await handleChat("build launch plan doc");
  const state = await readState();

  assert.ok(result.document);
  assert.equal(result.document.docType, "launch-plan");
  assert.ok(state.artifacts.some((artifact) => artifact.kind === "document"));
});

test("chat builds a todo list and adds tasks when asked directly", async () => {
  await resetStore();

  const result = await handleChat("build to do list for app launch");
  const state = await readState();

  assert.ok(result.todoList);
  assert.ok(result.createdTasks.length >= 4);
  assert.ok(state.tasks.length >= 4);
  assert.ok(state.artifacts.some((artifact) => artifact.kind === "todo-plan"));
});

test("chat can route a natural launch-plan request through Ollama intent planning", async () => {
  await resetStore();

  await withMockFetch(async () => ({
    ok: true,
    text: async () => JSON.stringify({
      message: {
        content: JSON.stringify({
          intent: "build_document",
          confidence: 0.93,
          title: "Launch Plan",
          prompt: "launch plan for my app",
          targetDays: 0,
          availableMinutes: 0,
          optionA: "",
          optionB: "",
          reply: "",
          reason: "The user wants a document."
        })
      }
    })
  }), async () => {
    const result = await handleChat("Can you map out a launch plan for my app?");
    const state = await readState();

    assert.ok(result.document);
    assert.equal(result.document.docType, "launch-plan");
    assert.ok(state.artifacts.some((artifact) => artifact.kind === "document"));
  });
});

test("chat can turn a natural deadline request into a goal through Ollama routing", async () => {
  await resetStore();

  await withMockFetch(async () => ({
    ok: true,
    text: async () => JSON.stringify({
      message: {
        content: JSON.stringify({
          intent: "create_goal",
          confidence: 0.91,
          title: "Launch my app",
          prompt: "Ship a first public version with the core onboarding flow.",
          targetDays: 20,
          availableMinutes: 0,
          optionA: "",
          optionB: "",
          reply: "",
          reason: "The user is asking for a time-bound outcome."
        })
      }
    })
  }), async () => {
    const result = await handleChat("I want to launch my app in 20 days.");
    const state = await readState();

    assert.ok(result.goal);
    assert.equal(result.goal.title, "Launch my app");
    assert.ok(state.goals.some((goal) => goal.title === "Launch my app"));
    assert.ok(state.tasks.length >= 1);
  });
});

test("goal chat uses autonomous planning and stores the roadmap artifact", async () => {
  await resetStore();

  const result = await handleChat("goal launch my app in 20 days");
  const state = await readState();

  assert.ok(result.goal);
  assert.ok(result.goalPlan);
  assert.ok(result.goalPlan.dailyHoursNeeded > 0);
  assert.ok(state.artifacts.some((artifact) => artifact.kind === "autonomous-goal-plan"));
});

test("chat can preview life autopilot in conversation", async () => {
  await resetStore();
  await addTask({ title: "Deep architecture review", effort: "high", priority: "high", durationMins: 120 });
  await addTask({ title: "Reply to client email", effort: "low", priority: "medium", durationMins: 20 });
  await addCheckin({ energy: "low", focus: "scattered", mood: "tired" });

  const result = await handleChat("rebalance my day with autopilot");
  const state = await readState();

  assert.ok(result.autopilot);
  assert.ok(result.autopilot.focusNow.length >= 1);
  assert.ok(state.artifacts.some((artifact) => artifact.kind === "autopilot-run"));
});
