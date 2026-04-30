const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { DATA_FILE, createDefaultState, readState, addTask } = require("../src/store");
const { buildVoiceActionPlan, handleVoiceCommand } = require("../src/voice");

async function resetStore() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(createDefaultState(), null, 2));
}

test("voice planner asks for clarification when later is too vague", async () => {
  const state = createDefaultState();
  const plan = await buildVoiceActionPlan("remind me later", state, {
    now: "2026-04-23T09:00:00.000Z",
    energy: "medium",
    focus: "steady"
  });

  assert.equal(plan.actions.length, 0);
  assert.match(plan.response, /when should i remind you/i);
});

test("voice command can create a task directly", async () => {
  await resetStore();

  const result = await handleVoiceCommand({
    text: "add prepare invoice tomorrow",
    execute: true
  }, {
    now: "2026-04-23T09:00:00.000Z"
  });
  const state = await readState();

  assert.equal(result.requires_confirmation, false);
  assert.ok(state.tasks.some((task) => /prepare invoice/i.test(task.title)));
});

test("voice command previews delete and only executes after confirmation", async () => {
  await resetStore();
  await addTask({ title: "Prepare invoice", durationMins: 20 });

  const preview = await handleVoiceCommand({
    text: "delete prepare invoice",
    execute: true
  }, {
    now: "2026-04-23T09:00:00.000Z"
  });

  let state = await readState();
  assert.equal(preview.requires_confirmation, true);
  assert.ok(state.tasks.some((task) => /prepare invoice/i.test(task.title)));

  await handleVoiceCommand({
    plan: preview,
    confirmed: true,
    execute: true
  }, {
    now: "2026-04-23T09:00:00.000Z"
  });

  state = await readState();
  assert.equal(state.tasks.some((task) => /prepare invoice/i.test(task.title)), false);
});

test("voice plan-day command stays action-oriented", async () => {
  await resetStore();

  const result = await handleVoiceCommand({
    text: "plan my day but focus on client work",
    execute: false
  }, {
    now: "2026-04-23T09:00:00.000Z",
    energy: "medium",
    focus: "steady"
  });

  assert.equal(result.actions[0].type, "plan_day");
  assert.equal(result.requires_confirmation, false);
});
