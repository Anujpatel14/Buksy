const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildResearchBrief,
  analyzeFileContents,
  buildMeetingAssist,
  buildActionHubResult,
  buildStructuredDocument,
  buildTodoList
} = require("../src/workbench");

test("research brief summarizes sources and surfaces contradictions", () => {
  const brief = buildResearchBrief({
    topic: "SaaS pricing",
    sourceText: [
      "Source A",
      "Monthly subscription pricing improves retention and recurring growth for early SaaS products.",
      "---",
      "Source B",
      "An annual-first offer can improve cash flow while a one-time launch offer reduces buying friction."
    ].join("\n")
  });

  assert.equal(brief.sourceCount, 2);
  assert.match(brief.summary, /Across 2 sources/);
  assert.ok(brief.contradictions.length >= 1);
});

test("file analysis catches csv structure mismatches", () => {
  const analysis = analyzeFileContents({
    fileName: "finance.csv",
    content: "name,total\ninvoice,120\nbroken,row,extra"
  });

  assert.match(analysis.summary, /CSV with 2 columns/);
  assert.ok(analysis.mistakes.some((item) => /inconsistent column counts/i.test(item)));
});

test("meeting assistant extracts decisions and tasks", () => {
  const summary = buildMeetingAssist({
    transcript: [
      "We agreed to ship the onboarding update next Tuesday.",
      "Rahul will send the revised copy by Friday.",
      "Need to confirm analytics tracking before release."
    ].join("\n")
  });

  assert.ok(summary.decisions.some((item) => /agreed/i.test(item)));
  assert.ok(summary.tasks.some((item) => /will|need to/i.test(item)));
});

test("action hub builds invoice and email packs", () => {
  const result = buildActionHubResult({
    actionType: "invoice_email",
    prompt: "Create invoice and send draft email"
  });

  assert.equal(result.title, "Invoice + email pack");
  assert.ok(Array.isArray(result.output.invoiceTemplate.columns));
  assert.ok(result.output.emailDraft.sampleMessage);
});

test("document builder creates a structured launch plan", () => {
  const document = buildStructuredDocument({
    prompt: "build launch plan doc"
  });

  assert.equal(document.docType, "launch-plan");
  assert.ok(document.sections.length >= 4);
  assert.ok(document.nextActions.length >= 3);
});

test("todo builder creates practical launch tasks", () => {
  const todo = buildTodoList({
    prompt: "build to do list for app launch"
  });

  assert.match(todo.title, /To-Do List/);
  assert.ok(todo.tasks.length >= 4);
  assert.equal(todo.tasks[0].priority, "high");
});
