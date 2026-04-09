const { buildNegotiationAssist } = require("./strategy");

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "into",
  "your",
  "have",
  "will",
  "about",
  "there",
  "their",
  "they",
  "them",
  "would",
  "could",
  "should",
  "when",
  "what",
  "where",
  "which",
  "because",
  "while",
  "been",
  "being",
  "than",
  "then",
  "also",
  "just",
  "more",
  "less",
  "such",
  "very",
  "some",
  "much",
  "over",
  "like",
  "need",
  "want",
  "make",
  "made",
  "only",
  "each",
  "even",
  "most",
  "many",
  "uses",
  "using"
]);

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter((token) => !STOP_WORDS.has(token));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function splitSources(input = {}) {
  if (Array.isArray(input.sources) && input.sources.length) {
    return input.sources
      .map((source, index) => ({
        title: String(source.title || `Source ${index + 1}`).trim(),
        content: String(source.content || "").trim()
      }))
      .filter((source) => source.content);
  }

  const raw = String(input.sourceText || "").trim();

  if (!raw) {
    return [];
  }

  return raw
    .split(/\n-{3,}\n/)
    .map((chunk, index) => {
      const [firstLine, ...rest] = chunk.split(/\r?\n/);
      const hasTitle = firstLine.length <= 80;
      return {
        title: hasTitle ? firstLine.trim() || `Source ${index + 1}` : `Source ${index + 1}`,
        content: hasTitle ? rest.join("\n").trim() : chunk.trim()
      };
    })
    .filter((source) => source.content);
}

function frequencyMap(tokens) {
  const map = new Map();

  tokens.forEach((token) => {
    map.set(token, (map.get(token) || 0) + 1);
  });

  return map;
}

function topTerms(texts, count = 6) {
  const freq = frequencyMap(texts.flatMap((text) => tokenize(text)));
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([term]) => term);
}

function firstUsefulSentence(text) {
  return String(text || "")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .find((sentence) => sentence.length >= 24) || String(text || "").trim().slice(0, 140);
}

function detectContradictions(sources) {
  const checks = [
    {
      left: ["monthly", "subscription"],
      right: ["annual", "one-time"],
      label: "Some sources favor recurring pricing while others lean toward one-time or annual-first positioning."
    },
    {
      left: ["premium", "high", "upmarket"],
      right: ["low", "cheap", "budget", "freemium"],
      label: "Pricing position is split between premium and low-cost approaches."
    },
    {
      left: ["growth", "expand", "increase"],
      right: ["decline", "decrease", "shrink"],
      label: "The direction of the trend is not fully aligned across the material."
    }
  ];

  const joined = sources.map((source) => tokenize(source.content));
  const results = [];

  checks.forEach((check) => {
    const leftSeen = joined.some((tokens) => check.left.some((term) => tokens.includes(term)));
    const rightSeen = joined.some((tokens) => check.right.some((term) => tokens.includes(term)));

    if (leftSeen && rightSeen) {
      results.push(check.label);
    }
  });

  return results;
}

function buildResearchBrief(input = {}) {
  const topic = String(input.topic || "Untitled research topic").trim();
  const question = String(input.question || "").trim();
  const sources = splitSources(input);
  const texts = sources.map((source) => source.content);
  const themes = topTerms(texts.length ? texts : [topic], 5);
  const insights = sources.length
    ? sources.slice(0, 5).map((source) => `${source.title}: ${firstUsefulSentence(source.content)}`)
    : [`Start by collecting 3 to 5 strong sources for ${topic}.`];
  const contradictions = detectContradictions(sources);
  const trendLabel = themes.length
    ? `Recent emphasis clusters around ${themes.slice(0, 3).join(", ")}.`
    : `No strong trend detected yet for ${topic}.`;

  return {
    topic,
    question,
    sourceCount: sources.length,
    summary:
      sources.length > 0
        ? `Across ${sources.length} sources, the strongest pattern for ${topic} centers on ${themes.slice(0, 3).join(", ")}.`
        : `Buksy needs source material to produce a stronger research brief for ${topic}.`,
    importantInsights: insights,
    contradictions: contradictions.length ? contradictions : ["No sharp contradiction surfaced in the current material."],
    latestTrends: [
      trendLabel,
      themes[3] ? `A secondary pattern is emerging around ${themes[3]}.` : "Add newer material to sharpen trend detection."
    ],
    recommendedNextMoves: [
      `Validate one decision for ${topic} using the strongest source cluster.`,
      "Compare pricing, distribution, and risk separately instead of blending them together.",
      "Add at least one recent market or competitor source if the brief feels thin."
    ]
  };
}

function parseCsv(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .filter(Boolean);

  if (!lines.length) {
    return {
      headers: [],
      rows: []
    };
  }

  const headers = lines[0].split(",").map((cell) => cell.trim());
  const rows = lines.slice(1).map((line) => line.split(",").map((cell) => cell.trim()));

  return { headers, rows };
}

function analyzeTextPatterns(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const repeated = [...new Set(lines.filter((line, index) => lines.indexOf(line) !== index))];
  const headings = lines.filter((line) => /^#/.test(line)).slice(0, 6);
  const tasks = lines.filter((line) => /\b(todo|action|follow up|need to|next step)\b/i.test(line)).slice(0, 6);

  return {
    repeated,
    headings,
    tasks
  };
}

function compareVersions(baseText, compareText) {
  const baseLines = String(baseText || "").split(/\r?\n/);
  const compareLines = String(compareText || "").split(/\r?\n/);
  const max = Math.max(baseLines.length, compareLines.length);
  let changed = 0;

  for (let index = 0; index < max; index += 1) {
    if ((baseLines[index] || "") !== (compareLines[index] || "")) {
      changed += 1;
    }
  }

  return changed;
}

function analyzeFileContents(input = {}) {
  const fileName = String(input.fileName || "Untitled file").trim();
  const fileType = String(input.fileType || "").trim().toLowerCase();
  const content = String(input.content || "").trim();
  const compareContent = String(input.compareContent || "").trim();
  const extension = (fileName.split(".").pop() || "").toLowerCase();

  if (!content && !compareContent) {
    return {
      fileName,
      fileType,
      summary: "Buksy needs readable text content to analyze this file locally.",
      extracted: [],
      mistakes: ["No text content was provided for local analysis."],
      comparison: null
    };
  }

  if (extension === "csv") {
    const csv = parseCsv(content);
    const mismatched = csv.rows.filter((row) => row.length !== csv.headers.length).length;
    return {
      fileName,
      fileType,
      summary: `CSV with ${csv.headers.length} columns and ${csv.rows.length} data rows.`,
      extracted: [
        `Columns: ${csv.headers.join(", ")}`,
        csv.rows[0] ? `First row preview: ${csv.rows[0].join(", ")}` : "No data rows found."
      ],
      mistakes: mismatched ? [`${mismatched} row(s) have inconsistent column counts.`] : ["No obvious CSV structure issue found."],
      comparison: compareContent
        ? `Version comparison shows ${compareVersions(content, compareContent)} changed line(s).`
        : null
    };
  }

  if (extension === "json" || fileType.includes("json")) {
    try {
      const parsed = JSON.parse(content);
      const keys = Array.isArray(parsed)
        ? Object.keys(parsed[0] || {})
        : Object.keys(parsed || {});
      const count = Array.isArray(parsed) ? parsed.length : keys.length;
      return {
        fileName,
        fileType,
        summary: `JSON looks valid with ${count} top-level item(s).`,
        extracted: [`Top keys: ${keys.slice(0, 10).join(", ") || "none"}`],
        mistakes: ["No JSON parse issue found."],
        comparison: compareContent
          ? `Version comparison shows ${compareVersions(content, compareContent)} changed line(s).`
          : null
      };
    } catch (error) {
      return {
        fileName,
        fileType,
        summary: "Buksy could not parse this JSON content.",
        extracted: [],
        mistakes: ["Invalid JSON structure detected."],
        comparison: null
      };
    }
  }

  const patterns = analyzeTextPatterns(content);
  return {
    fileName,
    fileType,
    summary: `Text analysis complete for ${fileName}.`,
    extracted: [
      `Detected ${content.split(/\s+/).filter(Boolean).length} words.`,
      patterns.headings.length ? `Headings: ${patterns.headings.join(" | ")}` : "No headings detected."
    ],
    mistakes: patterns.repeated.length
      ? patterns.repeated.slice(0, 3).map((line) => `Repeated line detected: ${line}`)
      : ["No obvious repeated issue detected."],
    comparison: compareContent
      ? `Version comparison shows ${compareVersions(content, compareContent)} changed line(s).`
      : null,
    hiddenInsights: [
      patterns.tasks.length ? `Action-like lines found: ${patterns.tasks.slice(0, 3).join(" | ")}` : "No explicit action lines surfaced.",
      patterns.repeated.length ? "There are repeated lines that may indicate duplicated content." : "No strong duplication signal detected."
    ]
  };
}

function buildMeetingAssist(input = {}) {
  const transcript = String(input.transcript || "").trim();
  const lines = transcript.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const decisions = lines.filter((line) => /\b(agreed|decided|approved|aligned|confirmed)\b/i.test(line)).slice(0, 6);
  const tasks = lines.filter((line) => /\b(will|need to|action|follow up|next step)\b/i.test(line)).slice(0, 6);
  const themes = topTerms([transcript], 5);

  return {
    summary:
      transcript
        ? `Meeting focused on ${themes.slice(0, 3).join(", ")} with ${decisions.length} decision signal(s) and ${tasks.length} action signal(s).`
        : "Add meeting notes or a transcript to generate a summary.",
    decisions: decisions.length ? decisions : ["No explicit decision line detected yet."],
    tasks: tasks.length ? tasks : ["No explicit action item line detected yet."],
    followUpMessage: transcript
      ? `Thanks everyone. Quick recap: ${decisions[0] || "we aligned on the current direction"}. Next actions: ${tasks[0] || "please confirm owners and deadlines"}.`
      : "Thanks everyone. Sharing the follow-up once the meeting notes are available."
  };
}

function generateIdeas(input = {}) {
  const domain = String(input.domain || input.topic || "general").trim();
  const count = Math.max(3, Math.min(8, Math.round(Number(input.count) || 5)));
  const templates = [
    "workflow optimizer",
    "specialized marketplace",
    "subscription toolkit",
    "education product",
    "analytics assistant",
    "community platform",
    "automation service",
    "compliance helper"
  ];
  const models = ["subscription", "one-time sale", "service plus software", "usage-based pricing"];
  const ideas = [];

  for (let index = 0; index < count; index += 1) {
    ideas.push({
      title: `${domain} ${templates[index % templates.length]}`.replace(/\b\w/g, (char) => char.toUpperCase()),
      feasibility: ["High", "Medium", "Medium", "Low"][index % 4],
      difficulty: ["Low", "Medium", "Medium", "High"][index % 4],
      monetizationPotential: ["Strong", "Medium", "Strong", "Medium"][index % 4],
      whyItCouldWork: `Targets a clear pain point in ${domain} with a more focused angle than a generic tool.`,
      monetizationModel: models[index % models.length]
    });
  }

  return {
    domain,
    ideas
  };
}

function runMultiAgentAnalysis(input = {}) {
  const prompt = String(input.prompt || input.topic || "").trim();

  return {
    planner: `Planner mode: break ${prompt || "the problem"} into the fewest critical steps, sequence the dependencies, and protect the first leverage point.`,
    critic: `Critic mode: the main risks are scope creep, weak assumptions, and unclear success criteria around ${prompt || "the problem"}.`,
    optimizer: `Optimizer mode: shorten the path by removing optional work, batching similar actions, and testing the smallest useful version first.`,
    creative: `Creative mode: look for a more distinctive angle, a faster proof step, or an unexpected packaging decision for ${prompt || "this idea"}.`,
    synthesis: `Buksy's combined view: define success clearly, test the smallest version first, and keep one differentiating angle instead of spreading effort too wide.`
  };
}

function runScenarioSimulation(input = {}) {
  const scenario = String(input.scenario || "Untitled scenario").trim();
  const currentValue = Number(input.currentValue || 100);
  const changePercent = Number(input.changePercent || 0);
  const optimistic = Math.round(currentValue * (1 + (changePercent + 8) / 100));
  const likely = Math.round(currentValue * (1 + changePercent / 100));
  const downside = Math.round(currentValue * (1 + (changePercent - 10) / 100));

  return {
    scenario,
    currentValue,
    changePercent,
    optimistic,
    likely,
    downside,
    notes: [
      `If the change lands well, the modeled upside is around ${optimistic}.`,
      `A more conservative line lands around ${likely}.`,
      `Main risk is second-order friction rather than the headline change alone.`
    ]
  };
}

function buildPresentationOutline(input = {}) {
  const topic = String(input.topic || "Untitled topic").trim();
  const audience = String(input.audience || "general audience").trim();
  const duration = Math.max(5, Math.min(60, Math.round(Number(input.durationMins) || 15)));
  const slides = [
    {
      title: `${topic}: why this matters now`,
      points: ["Frame the core problem", "Show why timing matters", "State the outcome clearly"],
      speakerNote: `Open by aligning ${audience} around the problem, not the solution.`
    },
    {
      title: "Current reality",
      points: ["What is happening now", "Where the friction sits", "What costs are accumulating"],
      speakerNote: "Keep the diagnosis simple and concrete."
    },
    {
      title: "Proposed direction",
      points: ["The main idea", "What changes", "Why this is the right level of ambition"],
      speakerNote: "Make the proposal feel inevitable, not optional."
    },
    {
      title: "Execution plan",
      points: ["First milestone", "Owners and dependencies", "Timeline"],
      speakerNote: "Show that the path is credible."
    },
    {
      title: "Risks and next steps",
      points: ["Main risks", "How to reduce them", "Decision or support needed"],
      speakerNote: "End with a clear ask."
    }
  ];

  return {
    topic,
    audience,
    duration,
    slides
  };
}

function buildDebate(input = {}) {
  const topic = String(input.topic || "Untitled debate").trim();

  return {
    topic,
    forSide: [
      `Moving forward on ${topic} could unlock speed, differentiation, or leverage.`,
      "A focused decision now prevents slow drift later."
    ],
    againstSide: [
      `The downside of ${topic} is hidden complexity and second-order risk.`,
      "Premature commitment can lock the team into the wrong shape."
    ],
    synthesis: "The strongest path is usually to test the upside with a constrained first move before making a full commitment."
  };
}

function buildWorkflowBlueprint(input = {}) {
  const title = String(input.title || input.prompt || "Untitled workflow").trim();
  const trigger = String(input.trigger || "").trim() || "When a new input arrives";
  const actionText = String(input.actions || input.prompt || "").trim();
  const steps = actionText
    ? actionText
        .split(/[,.;]\s+/)
        .map((step) => step.trim())
        .filter(Boolean)
        .slice(0, 6)
    : ["Extract the key data", "Create a concise summary", "Route the result to the right place"];

  return {
    title,
    trigger,
    steps,
    safeguards: [
      "Confirm the input format before automation runs.",
      "Keep one manual review point for important outputs.",
      "Log failures so the workflow can improve."
    ],
    automationPotential: steps.length >= 3 ? "High" : "Medium"
  };
}

function safeEvaluateExpression(expression) {
  const raw = String(expression || "").trim();

  if (!/^[0-9+\-*/().%\s]+$/.test(raw)) {
    return null;
  }

  const normalized = raw.replace(/(\d+)\s*%/g, "($1/100)");

  try {
    const value = Function(`"use strict"; return (${normalized});`)();
    return Number.isFinite(value) ? value : null;
  } catch (error) {
    return null;
  }
}

function runSandbox(input = {}) {
  const expression = String(input.expression || "").trim();
  const scenario = String(input.scenario || "").trim();
  const value = safeEvaluateExpression(expression);

  if (value !== null) {
    return {
      mode: "math",
      expression,
      result: value
    };
  }

  return {
    mode: "scenario",
    expression,
    scenario,
    observations: [
      scenario || expression
        ? `Buksy would test the core assumption behind: ${scenario || expression}`
        : "Add a formula or scenario to test inside the sandbox.",
      "Check what must be true for the idea to work.",
      "Define the fastest experiment before treating the output as final."
    ]
  };
}

function buildLearningCompanion(input = {}) {
  const topic = String(input.topic || "Untitled topic").trim();
  const level = String(input.level || "beginner").trim().toLowerCase();
  const goal = String(input.goal || "").trim();

  return {
    topic,
    level,
    coachMessage: `Buksy will teach ${topic} at a ${level} pace${goal ? ` toward ${goal}` : ""}.`,
    lessonPlan: [
      "Build intuition with one simple explanation.",
      "Practice one concrete exercise.",
      "Check understanding with a short question.",
      "Increase difficulty only after a clean explanation."
    ],
    quiz: [
      `What is the core idea behind ${topic}?`,
      `Where would you apply ${topic} in a real situation?`,
      "What usually goes wrong first?"
    ]
  };
}

function buildRoleAnalysis(input = {}) {
  const role = String(input.role || "strategist").trim().toLowerCase();
  const prompt = String(input.prompt || "").trim();
  const lenses = {
    recruiter: "Look for clarity, credibility, and fit signals.",
    investor: "Look for leverage, defensibility, and market pull.",
    developer: "Look for feasibility, scope, and implementation risk.",
    marketer: "Look for positioning, audience pain, and differentiated message.",
    explainer: "Look for structure, clarity, and ease of understanding."
  };

  return {
    role,
    lens: lenses[role] || "Look for the highest-leverage interpretation of the problem.",
    analysis: `From a ${role} lens, the strongest move for "${prompt || "this topic"}" is to tighten the key assumption and express the outcome more clearly.`,
    questions: [
      "What is the most important signal this role would care about?",
      "What is still vague or unproven?",
      "What one improvement would most strengthen the case?"
    ]
  };
}

function buildComparisonEngine(input = {}) {
  const rawOptions = Array.isArray(input.options) ? input.options : [input.optionA, input.optionB].filter(Boolean);
  const options = rawOptions.map((option, index) => ({
    name: String(option.name || option || `Option ${index + 1}`).trim(),
    text: String(option.description || option || "").trim()
  }));

  const criteria = ["speed", "cost", "upside", "risk"];
  const results = options.map((option, index) => ({
    name: option.name,
    scores: {
      speed: 6 + ((index + option.text.length) % 4),
      cost: 5 + ((index + option.name.length) % 4),
      upside: 6 + ((option.text.split(" ").length + index) % 4),
      risk: 4 + ((index + option.name.length) % 4)
    }
  }));

  return {
    criteria,
    results,
    recommendation:
      results.length >= 2
        ? `${results[0].name} looks strongest if speed matters most, while ${results[1].name} may be safer if risk control matters more.`
        : "Add at least two options for a stronger comparison."
  };
}

function buildActionHubResult(input = {}) {
  const actionType = String(input.actionType || "draft_email").trim().toLowerCase();
  const prompt = String(input.prompt || "").trim();

  if (actionType === "invoice_email") {
    const draft = buildNegotiationAssist({
      scenario: prompt || "sending an invoice and confirming next steps",
      tone: "calm",
      relationship: "client",
      desiredOutcome: "share the invoice and keep the engagement moving"
    });

    return {
      actionType,
      title: "Invoice + email pack",
      output: {
        invoiceTemplate: {
          columns: ["Item", "Description", "Rate", "Quantity", "Total"],
          notes: ["Add payment terms", "Add due date", "Confirm tax handling if needed"]
        },
        emailDraft: draft
      }
    };
  }

  if (actionType === "document_outline") {
    return {
      actionType,
      title: "Document outline",
      output: {
        sections: ["Purpose", "Context", "Proposal", "Risks", "Next steps"],
        note: `Outline generated for: ${prompt || "untitled document"}.`
      }
    };
  }

  if (actionType === "spreadsheet_blueprint") {
    return {
      actionType,
      title: "Spreadsheet blueprint",
      output: {
        columns: ["Name", "Owner", "Status", "Cost", "Due date"],
        formulas: ["Total cost", "Days remaining", "Completion rate"],
        note: `Blueprint generated for: ${prompt || "untitled sheet"}.`
      }
    };
  }

  const email = buildNegotiationAssist({
    scenario: prompt || "follow-up",
    tone: "calm",
    desiredOutcome: "move the conversation forward"
  });

  return {
    actionType,
    title: "Action hub draft",
    output: {
      emailDraft: email,
      nextAction: "Review the draft, adjust names and details, then send from your preferred tool."
    }
  };
}

function cleanBuilderPrompt(prompt) {
  return String(prompt || "")
    .replace(/^(please\s+)?(build|create|make|write|draft|generate)\s+/i, "")
    .replace(/\b(doc|document|brief|outline|plan)\b/gi, "")
    .replace(/\b(to-?do|to\s+do|todo|task list|checklist|list)\b/gi, "")
    .replace(/^\s*for\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function promptTouchesSoftware(text) {
  const t = String(text || "").toLowerCase();
  return /\b(code|coding|software|developer|development|engineer|engineering|api|backend|frontend|full-?stack|deploy|ci\/cd|git|github|repo|typescript|javascript|python|react|node|database|microservice|refactor|bug|feature|sprint|scrum|agile|prd|technical spec|architecture)\b/.test(
    t
  );
}

function inferDocumentType(prompt) {
  const text = String(prompt || "").toLowerCase();

  if (/(launch|go to market|gtm)/.test(text)) {
    return "launch-plan";
  }

  if (/(proposal|client proposal|scope)/.test(text)) {
    return "proposal";
  }

  if (/(meeting agenda|agenda)/.test(text)) {
    return "agenda";
  }

  if (/(weekly plan|week plan|weekly roadmap)/.test(text)) {
    return "weekly-plan";
  }

  return "strategy-brief";
}

function buildStructuredDocument(input = {}) {
  const prompt = String(input.prompt || input.title || input.request || "Untitled document").trim();
  const topic = cleanBuilderPrompt(prompt) || prompt;
  let docType = inferDocumentType(prompt);
  if (docType === "strategy-brief" && promptTouchesSoftware(prompt)) {
    docType = "engineering-brief";
  }
  const titledTopic = topic.replace(/\b\w/g, (char) => char.toUpperCase());
  const withSuffix = (suffix) =>
    new RegExp(`${suffix}$`, "i").test(titledTopic) ? titledTopic : `${titledTopic} ${suffix}`;
  const templates = {
    "launch-plan": {
      title: /^(launch)$/i.test(topic) ? "Launch Plan" : `${titledTopic} Launch Plan`,
      summary: "A one-page launch plan that keeps the release, messaging, channels, and risks aligned.",
      sections: [
        { heading: "Outcome", bullets: ["Define what launch success looks like in one sentence.", "Choose the one metric Buksy should watch first."] },
        { heading: "Audience and promise", bullets: ["Name the first user group.", "State the clearest promise they should understand immediately."] },
        { heading: "Pre-launch checklist", bullets: ["Finish the critical product path.", "Prepare launch copy, screenshots, and signup flow.", "Test the release path and fallback support plan."] },
        { heading: "Launch day", bullets: ["Publish in the most relevant channel first.", "Watch feedback and onboarding friction closely.", "Log bugs, objections, and quick wins in one place."] },
        { heading: "First week follow-up", bullets: ["Review conversion and activation.", "Tighten the weakest onboarding step.", "Decide the next iteration based on real signals."] }
      ],
      nextActions: ["Finalize the smallest launch scope.", "Prepare the launch message.", "Book one focused QA pass before release."]
    },
    proposal: {
      title: withSuffix("Proposal"),
      summary: "A practical proposal structure Buksy can reuse for scope, timing, and decision-making.",
      sections: [
        { heading: "Context", bullets: ["Explain the situation clearly.", "Name the business problem being solved."] },
        { heading: "Scope", bullets: ["List the included deliverables.", "State what is intentionally out of scope."] },
        { heading: "Timeline", bullets: ["Break work into clear milestones.", "Attach dependencies or approvals to each milestone."] },
        { heading: "Pricing and assumptions", bullets: ["State the pricing model.", "List the assumptions that protect the timeline."] },
        { heading: "Decision and next step", bullets: ["Say what approval looks like.", "Offer the cleanest next action."] }
      ],
      nextActions: ["Tighten the scope statement.", "Add timeline assumptions.", "Draft the final approval message."]
    },
    agenda: {
      title: withSuffix("Agenda"),
      summary: "A meeting structure that keeps the discussion focused on decisions and owners.",
      sections: [
        { heading: "Purpose", bullets: ["State what this meeting must decide or unblock."] },
        { heading: "Key topics", bullets: ["List the 3 to 5 highest-value discussion points.", "Attach context or pre-read if needed."] },
        { heading: "Decision checkpoints", bullets: ["Name the decisions needed before the meeting ends."] },
        { heading: "Action owners", bullets: ["Capture follow-ups with owners and deadlines."] }
      ],
      nextActions: ["Trim optional agenda items.", "Send the pre-read early.", "End with owners and deadlines."]
    },
    "weekly-plan": {
      title: withSuffix("Weekly Plan"),
      summary: "A weekly plan that protects the main goal, the delivery rhythm, and recovery space.",
      sections: [
        { heading: "Main outcome", bullets: ["Choose the one outcome that would make the week successful."] },
        { heading: "Priority blocks", bullets: ["Reserve 2 to 3 deep-work blocks.", "Attach each block to a specific milestone."] },
        { heading: "Support work", bullets: ["Batch admin, messages, and smaller tasks together."] },
        { heading: "Risk watch", bullets: ["Name what could derail the week.", "Pick one pre-emptive move for each risk."] },
        { heading: "Review", bullets: ["Set a short Friday review to decide what carries forward."] }
      ],
      nextActions: ["Pick the main weekly outcome.", "Protect the first deep-work block.", "Batch your admin into one window."]
    },
    "strategy-brief": {
      title: withSuffix("Brief"),
      summary: "A clean brief Buksy can use to turn a vague request into a usable working document.",
      sections: [
        { heading: "Goal", bullets: ["State the desired outcome simply.", "Define what success means."] },
        { heading: "Current reality", bullets: ["Describe what is true now.", "List the biggest blockers or unknowns."] },
        { heading: "Recommended direction", bullets: ["Explain the strongest next path.", "Show why this path wins over alternatives."] },
        { heading: "Execution", bullets: ["Break the work into 3 to 5 moves.", "Assign owners, timing, or dependencies."] },
        { heading: "Risks", bullets: ["Name the hidden risks.", "Say how Buksy should reduce them early."] }
      ],
      nextActions: ["Clarify the outcome.", "Pick the first milestone.", "Convert the brief into concrete tasks."]
    },
    "engineering-brief": {
      title: /^(api|app|feature|bug)$/i.test(topic) ? "Engineering Brief" : `${titledTopic} — Engineering Brief`,
      summary:
        "Structured like common software practice: requirements, design, delivery, quality, and rollout — aligned with Buksy's seeded engineering knowledge.",
      sections: [
        {
          heading: "Problem and scope",
          bullets: [
            "User-visible problem or metric.",
            "In scope vs explicitly out of scope.",
            "Dependencies on other teams, services, or releases."
          ]
        },
        {
          heading: "Technical approach",
          bullets: [
            "High-level design and data flow.",
            "API or contract changes (if any).",
            "Migration or backward-compatibility notes."
          ]
        },
        {
          heading: "Implementation plan",
          bullets: [
            "Break into shippable increments (PR-sized).",
            "Order by risk: unknowns and integrations first.",
            "Feature flags or toggles if rollout is gradual."
          ]
        },
        {
          heading: "Quality and observability",
          bullets: [
            "Unit / integration / E2E coverage plan.",
            "Logging, metrics, and alerts to add or update.",
            "Rollback or kill-switch if something goes wrong."
          ]
        },
        {
          heading: "Launch and follow-up",
          bullets: [
            "Release checklist (CI green, docs, comms).",
            "Post-deploy verification window.",
            "Tech debt or follow-up tickets to file."
          ]
        }
      ],
      nextActions: [
        "Lock acceptance criteria and edge cases.",
        "Draft the API or data contract if applicable.",
        "Convert sections into tasks with estimates and owners."
      ]
    }
  };

  return {
    docType,
    prompt,
    ...(templates[docType] || templates["strategy-brief"])
  };
}

function buildTodoList(input = {}) {
  const prompt = String(input.prompt || input.goal || input.topic || "today").trim();
  const topic = cleanBuilderPrompt(prompt) || prompt;
  const lower = topic.toLowerCase();
  const titleBase = topic.replace(/^\s*for\s+/i, "").replace(/\b\w/g, (char) => char.toUpperCase());
  let tasks;

  if (promptTouchesSoftware(lower)) {
    tasks = [
      ["Clarify requirements and acceptance criteria", "planning", "high", "medium", 35],
      ["Spike or design the smallest viable approach", "work", "high", "high", 60],
      ["Implement core change with tests", "work", "high", "high", 90],
      ["Update docs, types, or API contract", "admin", "medium", "medium", 30],
      ["CI pass, self-review, and handoff for review", "work", "high", "medium", 40]
    ];
  } else if (/(launch|app|product|startup|ship)/.test(lower)) {
    tasks = [
      ["Lock the smallest launch scope", "planning", "high", "high", 50],
      ["Finish the critical user flow", "work", "high", "high", 90],
      ["Write launch copy and CTA", "work", "medium", "medium", 40],
      ["Prepare feedback and bug capture sheet", "admin", "medium", "low", 20],
      ["Run one focused QA pass", "work", "high", "medium", 45]
    ];
  } else if (/(client|proposal|freelance)/.test(lower)) {
    tasks = [
      ["Clarify the client outcome and scope", "planning", "high", "medium", 30],
      ["Draft the proposal or reply", "work", "high", "medium", 45],
      ["List assumptions and risks", "planning", "medium", "medium", 25],
      ["Prepare pricing or timeline summary", "admin", "medium", "medium", 30],
      ["Send and schedule follow-up", "admin", "high", "low", 15]
    ];
  } else if (/(study|learn|course|interview|exam)/.test(lower)) {
    tasks = [
      ["Define today's exact learning target", "learning", "high", "low", 10],
      ["Study the core concept block", "learning", "high", "medium", 45],
      ["Practice one exercise or example", "learning", "high", "medium", 35],
      ["Write down weak spots and questions", "planning", "medium", "low", 15],
      ["Review what to repeat tomorrow", "planning", "medium", "low", 10]
    ];
  } else {
    tasks = [
      ["Pick the main outcome", "planning", "high", "low", 10],
      ["Do the highest-value task first", "work", "high", "medium", 45],
      ["Batch the smaller admin tasks", "admin", "medium", "low", 25],
      ["Check risks or blockers", "planning", "medium", "low", 15],
      ["Close with the next action for tomorrow", "planning", "medium", "low", 10]
    ];
  }

  return {
    title: `${titleBase} To-Do List`,
    summary: `Buksy broke "${topic}" into a practical sequence of smaller actions.`,
    tasks: tasks.map(([taskTitle, category, priority, effort, durationMins], index) => ({
      title: taskTitle,
      category,
      priority,
      effort,
      durationMins,
      order: index + 1,
      notes: `Generated from: ${topic}`
    }))
  };
}

function buildKnowledgeQuery(state, input = {}) {
  const search = String(input.search || "").trim().toLowerCase();
  const category = String(input.category || "").trim().toLowerCase();
  const projectId = input.projectId || null;
  const knowledge = state.knowledge || [];
  const artifacts = state.artifacts || [];

  const items = knowledge
    .map((item) => ({
      type: "knowledge",
      title: item.title,
      category: item.category,
      projectId: item.projectId,
      content: item.content,
      createdAt: item.createdAt
    }))
    .concat(
      artifacts.map((artifact) => ({
        type: artifact.kind,
        title: artifact.title,
        category: artifact.category,
        projectId: artifact.projectId,
        content: JSON.stringify(artifact.payload),
        createdAt: artifact.createdAt
      }))
    )
    .filter((item) => !category || item.category === category)
    .filter((item) => !projectId || item.projectId === projectId)
    .filter((item) => {
      if (!search) {
        return true;
      }

      const haystack = `${item.title} ${item.content} ${item.category}`.toLowerCase();
      return haystack.includes(search);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 12);

  return {
    count: items.length,
    items
  };
}

function buildProjectSnapshots(state) {
  return (state.projects || []).map((project) => {
    const tasks = (state.tasks || []).filter((task) => task.projectId === project.id);
    const goals = (state.goals || []).filter((goal) => goal.projectId === project.id);
    const knowledge = (state.knowledge || []).filter((item) => item.projectId === project.id);
    const artifacts = (state.artifacts || []).filter((item) => item.projectId === project.id);

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      counts: {
        openTasks: tasks.filter((task) => task.status === "open").length,
        goals: goals.length,
        knowledge: knowledge.length,
        artifacts: artifacts.length
      }
    };
  });
}

function buildTrendWatch(state) {
  const recentResearch = (state.artifacts || [])
    .filter((artifact) => ["research", "comparison", "idea-set"].includes(artifact.kind))
    .slice(0, 8);
  const textPool = recentResearch.map((artifact) => `${artifact.title} ${JSON.stringify(artifact.payload)}`);
  const terms = topTerms(textPool, 6);

  return {
    signals: terms.slice(0, 4).map((term) => `Recurring interest signal around ${term}.`),
    note:
      terms.length > 0
        ? `Trend watch is clustering around ${terms.slice(0, 3).join(", ")}.`
        : "Add research briefs or idea sets to build a stronger trend watch."
  };
}

function buildOpportunityScanner(state) {
  const tasks = state.tasks || [];
  const knowledge = state.knowledge || [];
  const opportunities = [];

  const repeatedCategories = unique(
    tasks
      .map((task) => task.category)
      .filter((category) => tasks.filter((task) => task.category === category).length >= 3)
  );

  repeatedCategories.forEach((category) => {
    opportunities.push(`You revisit ${category} often. A reusable template or workflow could save time.`);
  });

  if (knowledge.filter((item) => item.category === "research").length >= 3) {
    opportunities.push("You have enough research material to turn it into a reusable knowledge pack.");
  }

  if (!opportunities.length) {
    opportunities.push("Buksy is scanning for repeated work patterns that can turn into shortcuts or offers.");
  }

  return opportunities.slice(0, 4);
}

function buildSurpriseInsights(state) {
  const ideas = (state.artifacts || []).filter((artifact) => artifact.kind === "idea-set").length;
  const workflows = (state.workflows || []).length;
  const insights = [];

  if (ideas >= 2 && workflows === 0) {
    insights.push("You have enough recurring idea generation to justify a reusable idea-evaluation workflow.");
  }

  if ((state.projects || []).length >= 2) {
    insights.push("There are multiple active projects now. Buksy can help you keep their memory separate and cleaner.");
  }

  if (!insights.length) {
    insights.push("As Buksy sees more repeated activity, it will start surfacing sharper surprise insights here.");
  }

  return insights;
}

function buildHiddenInsights(input = {}, state = {}) {
  const text = String(input.content || input.text || "").trim();
  const patterns = analyzeTextPatterns(text);
  const insights = [];

  if (patterns.repeated.length) {
    insights.push(`Repeated issue appears in ${patterns.repeated.length} place(s).`);
  }

  if (patterns.tasks.length >= 3) {
    insights.push("There are multiple action-like lines, but they are not clearly prioritized.");
  }

  if ((state.tasks || []).filter((task) => task.status === "open" && !task.dueDate).length >= 4) {
    insights.push("Several open tasks have no due date, which may be hiding decision debt.");
  }

  if (!insights.length) {
    insights.push("No major hidden pattern surfaced yet from the current material.");
  }

  return insights;
}

module.exports = {
  buildResearchBrief,
  analyzeFileContents,
  buildMeetingAssist,
  generateIdeas,
  runMultiAgentAnalysis,
  runScenarioSimulation,
  buildPresentationOutline,
  buildDebate,
  buildWorkflowBlueprint,
  runSandbox,
  buildLearningCompanion,
  buildRoleAnalysis,
  buildComparisonEngine,
  buildActionHubResult,
  buildStructuredDocument,
  buildTodoList,
  buildKnowledgeQuery,
  buildProjectSnapshots,
  buildTrendWatch,
  buildOpportunityScanner,
  buildSurpriseInsights,
  buildHiddenInsights
};
