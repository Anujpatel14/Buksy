const { scoreTask } = require("./engine");

function clampDays(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 14;
  }

  return Math.max(3, Math.min(180, Math.round(numeric)));
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dateOnly(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function inferGoalTheme(title, objective) {
  const text = `${title} ${objective}`.toLowerCase();

  if (/(app|startup|product|launch|saas|website)/.test(text)) {
    return "product";
  }

  if (/(learn|study|course|exam|practice|skill)/.test(text)) {
    return "learning";
  }

  if (/(fitness|health|run|gym|sleep|diet)/.test(text)) {
    return "health";
  }

  if (/(freelance|client|income|career|job|portfolio)/.test(text)) {
    return "career";
  }

  return "general";
}

function inferGoalTemplate(theme) {
  const templates = {
    product: {
      phases: [
        {
          label: "Scope",
          deliverables: [
            "Define the smallest version worth shipping",
            "List must-have features and cut the rest",
            "Map the first user flow end to end"
          ]
        },
        {
          label: "Build",
          deliverables: [
            "Implement the core flow that proves the idea",
            "Set up data, auth, or state for the main path",
            "Create a test pass for key product behavior"
          ]
        },
        {
          label: "Polish",
          deliverables: [
            "Fix rough edges and remove blockers",
            "Tighten onboarding, copy, and empty states",
            "Prepare a simple launch checklist"
          ]
        },
        {
          label: "Launch",
          deliverables: [
            "Publish and verify the release",
            "Collect first feedback from real users",
            "Decide the first follow-up iteration"
          ]
        }
      ],
      dependencies: [
        "Clear product scope",
        "Protected build time",
        "A feedback loop with at least one real user"
      ],
      risks: [
        "Trying to ship too many features at once",
        "Leaving testing until the end",
        "Not deciding what success looks like before launch"
      ]
    },
    learning: {
      phases: [
        {
          label: "Foundation",
          deliverables: [
            "Define the exact outcome you want to reach",
            "Choose one learning source and stick to it",
            "Break the subject into weekly themes"
          ]
        },
        {
          label: "Practice",
          deliverables: [
            "Create short daily practice blocks",
            "Turn passive reading into active exercises",
            "Track mistakes and questions in one place"
          ]
        },
        {
          label: "Application",
          deliverables: [
            "Build or solve one real-world example",
            "Review weak spots and close the gaps",
            "Explain the topic back in simple language"
          ]
        },
        {
          label: "Review",
          deliverables: [
            "Test yourself without notes",
            "Refine what still feels shaky",
            "Decide the next level after this sprint"
          ]
        }
      ],
      dependencies: [
        "A small repeatable study block",
        "Clear practice exercises",
        "Weekly review"
      ],
      risks: [
        "Collecting resources instead of practicing",
        "Taking on too much content at once",
        "Skipping review because progress feels invisible"
      ]
    },
    career: {
      phases: [
        {
          label: "Position",
          deliverables: [
            "Clarify the offer or role you want",
            "Identify the strongest proof points",
            "Draft a focused outreach or update plan"
          ]
        },
        {
          label: "Assets",
          deliverables: [
            "Refresh portfolio, resume, or proposal",
            "Prepare one strong case study",
            "List the conversations that matter most"
          ]
        },
        {
          label: "Outreach",
          deliverables: [
            "Send the highest-value messages first",
            "Follow up on warm leads",
            "Track responses and negotiation points"
          ]
        },
        {
          label: "Close",
          deliverables: [
            "Evaluate offers or responses clearly",
            "Negotiate timing, scope, or rate",
            "Lock the next milestone"
          ]
        }
      ],
      dependencies: [
        "Clear positioning",
        "Proof of work",
        "Consistent follow-up"
      ],
      risks: [
        "Sending vague outreach",
        "Waiting too long to follow up",
        "Not defining your minimum acceptable outcome"
      ]
    },
    health: {
      phases: [
        {
          label: "Baseline",
          deliverables: [
            "Define the habit or outcome clearly",
            "Choose a realistic weekly cadence",
            "Remove one obvious blocker"
          ]
        },
        {
          label: "Rhythm",
          deliverables: [
            "Build a repeatable daily or weekly routine",
            "Track the smallest useful signal",
            "Protect recovery time"
          ]
        },
        {
          label: "Consistency",
          deliverables: [
            "Make the habit easier to start",
            "Reduce friction around timing and setup",
            "Adjust effort before burnout appears"
          ]
        },
        {
          label: "Review",
          deliverables: [
            "Check what is working",
            "Keep the effective parts",
            "Increase difficulty only if the base is stable"
          ]
        }
      ],
      dependencies: [
        "A sustainable routine",
        "Recovery space",
        "Simple tracking"
      ],
      risks: [
        "Starting too hard",
        "Ignoring recovery",
        "Treating one missed day like a collapse"
      ]
    },
    general: {
      phases: [
        {
          label: "Define",
          deliverables: [
            "Describe the exact outcome",
            "Break the goal into major parts",
            "Choose the first concrete milestone"
          ]
        },
        {
          label: "Execute",
          deliverables: [
            "Work the highest-leverage part first",
            "Remove blockers early",
            "Keep progress visible"
          ]
        },
        {
          label: "Stabilize",
          deliverables: [
            "Check dependencies and risks",
            "Fix rough edges",
            "Confirm the result works in the real world"
          ]
        },
        {
          label: "Finish",
          deliverables: [
            "Ship or complete the final version",
            "Review what changed",
            "Decide the next best follow-up"
          ]
        }
      ],
      dependencies: [
        "Clear scope",
        "Visible milestones",
        "A realistic weekly rhythm"
      ],
      risks: [
        "Unclear scope",
        "Too many parallel priorities",
        "No review checkpoint until the end"
      ]
    }
  };

  return templates[theme] || templates.general;
}

function distributeWindows(totalDays, phaseCount) {
  const ratios = phaseCount === 4 ? [0.2, 0.45, 0.22, 0.13] : [0.25, 0.5, 0.25];
  const raw = ratios.map((ratio) => Math.max(1, Math.round(totalDays * ratio)));
  const diff = totalDays - raw.reduce((sum, value) => sum + value, 0);

  raw[raw.length - 1] += diff;
  return raw;
}

function buildGoalBlueprint(input = {}, now = new Date()) {
  const title = String(input.title || "").trim();
  const objective = String(input.objective || "").trim();
  const targetDays = input.targetDate
    ? clampDays(Math.ceil((new Date(input.targetDate) - now) / (24 * 60 * 60 * 1000)))
    : clampDays(input.targetDays);
  const targetDate = input.targetDate || dateOnly(addDays(now, targetDays));
  const theme = inferGoalTheme(title, objective);
  const template = inferGoalTemplate(theme);
  const windows = distributeWindows(targetDays, template.phases.length);
  const roadmap = [];
  const weeklyRoadmap = [];
  const todayMoves = [];
  const starterTasks = [];
  const priorityPath = [];
  let cursor = new Date(now);

  template.phases.forEach((phase, index) => {
    const start = new Date(cursor);
    const end = addDays(start, Math.max(0, windows[index] - 1));
    const phaseRecord = {
      label: phase.label,
      windowLabel: `${dateOnly(start)} to ${dateOnly(end)}`,
      deliverables: phase.deliverables.slice(0, 3)
    };

    roadmap.push(phaseRecord);
    weeklyRoadmap.push({
      label: `Week ${index + 1}`,
      focus: phase.label,
      moves: phase.deliverables.slice(0, 2)
    });

    if (index === 0) {
      phase.deliverables.slice(0, 3).forEach((deliverable, deliverableIndex) => {
        todayMoves.push(deliverable);
        starterTasks.push({
          title: deliverable,
          category: theme === "learning" ? "learning" : theme === "health" ? "health" : "work",
          priority: deliverableIndex === 0 ? "high" : "medium",
          effort: deliverableIndex === 0 ? "high" : "medium",
          durationMins: deliverableIndex === 0 ? 60 : 30,
          dueDate: dateOnly(addDays(now, deliverableIndex)),
          notes: `Autogenerated from goal: ${title}`
        });
      });
    }

    priorityPath.push(phase.deliverables[0]);
    cursor = addDays(end, 1);
  });

  const hiddenRisks = template.risks.slice(0, 3);
  const people = String(input.people || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return {
    title,
    objective,
    theme,
    targetDate,
    targetDays,
    roadmap,
    weeklyRoadmap,
    dependencies: template.dependencies.slice(0, 3),
    hiddenRisks,
    priorityPath,
    todayMoves,
    starterTasks,
    people
  };
}

function buildNegotiationAssist(input = {}) {
  const scenario = String(input.scenario || "").trim();
  const tone = String(input.tone || "calm").trim().toLowerCase();
  const desiredOutcome = String(input.desiredOutcome || "").trim();
  const relationship = String(input.relationship || "client").trim().toLowerCase();

  const openings = {
    calm: "Thanks for the update. I want to align on the best next step.",
    warm: "Really appreciate the context here. I think we can land this well if we tighten expectations.",
    assertive: "I want to be direct so we can move this forward cleanly."
  };
  const angle = {
    client: "Protect scope while staying collaborative.",
    manager: "Show ownership and propose a concrete path forward.",
    partner: "Keep trust high and clarify tradeoffs early."
  };

  return {
    opening: openings[tone] || openings.calm,
    negotiationAngle: angle[relationship] || "Lead with clarity, then propose a practical next step.",
    talkingPoints: [
      `State the shared goal around: ${desiredOutcome || "a clear workable outcome"}.`,
      "Name the constraint without sounding defensive.",
      "Offer one preferred option and one fallback option."
    ],
    sampleMessage: `${openings[tone] || openings.calm}\n\nFrom my side, the key issue is ${scenario || "the current scope and timing"}. My goal is ${desiredOutcome || "to reach a fair next step"}.\n\nMy recommendation is that we agree on the main priority first, then adjust timing or scope around that. If that works for you, I can send a concrete plan today.`,
    riskNote: "Avoid over-explaining. Short, clear proposals usually negotiate better than long defenses."
  };
}

function scoreDecisionOption(text = "") {
  const tokens = tokenize(text);
  let growth = 0;
  let stability = 0;
  let flexibility = 0;
  let risk = 0;

  tokens.forEach((token) => {
    if (["learn", "build", "startup", "lead", "skill", "portfolio", "growth"].includes(token)) {
      growth += 2;
    }

    if (["salary", "stable", "security", "benefits", "steady"].includes(token)) {
      stability += 2;
    }

    if (["remote", "flexible", "freedom", "independent", "travel"].includes(token)) {
      flexibility += 2;
    }

    if (["uncertain", "risk", "quit", "debt", "pressure", "volatile"].includes(token)) {
      risk += 2;
    }
  });

  return {
    growth,
    stability,
    flexibility,
    risk
  };
}

function buildDecisionTimeline(input = {}) {
  const decision = String(input.decision || "").trim();
  const optionA = String(input.optionA || "").trim();
  const optionB = String(input.optionB || "").trim();
  const horizonDays = clampDays(input.horizonDays || 90);
  const scoreA = scoreDecisionOption(optionA);
  const scoreB = scoreDecisionOption(optionB);

  function buildSummary(label, score) {
    const upside = Math.max(score.growth, score.flexibility, score.stability);
    const risk = score.risk;

    return {
      label,
      score: score.growth + score.flexibility + score.stability - score.risk,
      outlook30:
        upside >= 4
          ? "Strong momentum if you act quickly on the first milestone."
          : "More gradual early payoff, but steadier to manage.",
      outlook90:
        risk >= 4
          ? "High upside is possible, but only if you manage uncertainty deliberately."
          : "Likely to compound well if you stay consistent for three months.",
      caution:
        risk >= 4
          ? "This path needs a tighter safety net and clearer constraints."
          : "Main risk is moving too slowly because it feels comfortable."
    };
  }

  const summaryA = buildSummary("Option A", scoreA);
  const summaryB = buildSummary("Option B", scoreB);

  return {
    decision,
    horizonDays,
    options: [summaryA, summaryB],
    recommendation:
      summaryA.score === summaryB.score
        ? "Both paths are close. Choose based on which pain you are more willing to manage."
        : summaryA.score > summaryB.score
          ? "Option A has the stronger upside-to-risk balance right now."
          : "Option B has the stronger upside-to-risk balance right now."
  };
}

function solveConstraints(state, input = {}, context = {}) {
  const availableMinutes = Math.max(15, Math.min(480, Math.round(Number(input.availableMinutes) || 120)));
  const energy = ["high", "medium", "low"].includes(input.energy) ? input.energy : context.energy || "medium";
  const scoredTasks = (state.tasks || [])
    .filter((task) => task.status === "open")
    .map((task) => scoreTask(task, state, { ...context, energy }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  const capacity = Math.floor(availableMinutes / 5);
  const dp = Array.from({ length: scoredTasks.length + 1 }, () =>
    Array.from({ length: capacity + 1 }, () => ({ score: 0, picks: [] }))
  );

  for (let index = 1; index <= scoredTasks.length; index += 1) {
    const entry = scoredTasks[index - 1];
    const weight = Math.max(1, Math.round(entry.task.durationMins / 5));

    for (let slot = 0; slot <= capacity; slot += 1) {
      const skip = dp[index - 1][slot];
      let take = null;

      if (weight <= slot) {
        const previous = dp[index - 1][slot - weight];
        take = {
          score: previous.score + entry.score,
          picks: previous.picks.concat(entry)
        };
      }

      dp[index][slot] = !take || skip.score >= take.score ? skip : take;
    }
  }

  const result = dp[scoredTasks.length][capacity];
  const chosen = result.picks;
  const totalMinutes = chosen.reduce((sum, entry) => sum + Number(entry.task.durationMins || 0), 0);

  return {
    availableMinutes,
    energy,
    totalMinutes,
    unusedMinutes: Math.max(0, availableMinutes - totalMinutes),
    tasks: chosen.map((entry) => ({
      id: entry.task.id,
      title: entry.task.title,
      durationMins: entry.task.durationMins,
      score: Number(entry.score.toFixed(2))
    })),
    note:
      chosen.length === 0
        ? "No open task fits the current time and energy constraints well yet."
        : `Buksy found ${chosen.length} task${chosen.length === 1 ? "" : "s"} that best fit your current window.`
  };
}

module.exports = {
  buildGoalBlueprint,
  buildNegotiationAssist,
  buildDecisionTimeline,
  solveConstraints
};
