const {
  buildBehaviorModel,
  buildCognitiveLoadReport,
  buildFocusGuard
} = require("./intelligence");
const {
  buildGoalSuccessProbabilities
} = require("./analytics");
const {
  suggestNextTask,
  buildDailyPlan
} = require("./engine");
const {
  buildPluginCatalog,
  buildExecutionPlan
} = require("./autonomy");
const {
  buildGoalBlueprint
} = require("./strategy");

const DAY_MS = 24 * 60 * 60 * 1000;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function nowDate(context = {}) {
  return context.now ? new Date(context.now) : new Date();
}

function daysAgo(days, context = {}) {
  const date = nowDate(context);
  date.setDate(date.getDate() - days);
  return date;
}

function dateOnly(date) {
  const value = new Date(date);
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).toISOString().slice(0, 10);
}

function tasksCompletedSince(state, sinceDate) {
  return (state.tasks || []).filter((task) => task.status === "completed" && task.completedAt && new Date(task.completedAt) >= sinceDate);
}

function feedbackSince(state, sinceDate) {
  return (state.feedback || []).filter((entry) => new Date(entry.createdAt) >= sinceDate);
}

function checkinsSince(state, sinceDate) {
  return (state.checkins || []).filter((entry) => new Date(entry.createdAt) >= sinceDate);
}

function tokenize(value = "") {
  return String(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function inferDifficulty(text = "") {
  const tokens = tokenize(text);
  const hardHits = tokens.filter((token) => ["launch", "build", "strategy", "roadmap", "decide", "hire", "meeting", "client"].includes(token)).length;
  if (hardHits >= 4) return "high";
  if (hardHits >= 2) return "medium";
  return "low";
}

function inferUncertainty(text = "") {
  const tokens = tokenize(text);
  const hits = tokens.filter((token) => ["maybe", "unknown", "unclear", "decide", "should", "if", "risk", "research"].includes(token)).length;
  if (hits >= 3) return "high";
  if (hits >= 1) return "medium";
  return "low";
}

function inferSocialLoad(text = "") {
  const tokens = tokenize(text);
  const hits = tokens.filter((token) => ["client", "team", "meeting", "partner", "manager", "reply", "email"].includes(token)).length;
  if (hits >= 3) return "high";
  if (hits >= 1) return "medium";
  return "low";
}

function latestCheckin(state) {
  return (state.checkins || [])[0] || null;
}

function streakDays(history = []) {
  let streak = 0;
  const sorted = [...history]
    .filter((entry) => Number(entry.tasksCompleted || 0) > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  let cursor = null;
  for (const entry of sorted) {
    if (!cursor) {
      cursor = new Date(entry.date);
      streak += 1;
      continue;
    }
    const expected = new Date(cursor);
    expected.setDate(expected.getDate() - 1);
    if (dateOnly(expected) === entry.date) {
      streak += 1;
      cursor = new Date(entry.date);
    } else {
      break;
    }
  }

  return streak;
}

function buildSkipMap(state, context = {}) {
  const skipCounts = {};
  const skipped = feedbackSince(state, daysAgo(45, context)).filter((entry) =>
    ["skipped", "not_helpful"].includes(entry.kind)
  );

  skipped.forEach((entry) => {
    skipCounts[entry.taskId] = (skipCounts[entry.taskId] || 0) + 1;
  });

  return skipCounts;
}

function resistanceReasons(task, skipCount = 0) {
  const reasons = [];
  if (task.effort === "high") reasons.push("high-effort work");
  if (!task.dueDate) reasons.push("no hard deadline");
  if (skipCount >= 2 || Number(task.suggestionCount || 0) >= 3) reasons.push("repeated hesitation");
  if ((task.people || []).length) reasons.push(`social load with ${(task.people || []).join(", ")}`);
  if (inferUncertainty(`${task.title} ${task.notes}`) === "high") reasons.push("unclear or uncertain scope");
  return reasons;
}

function buildDigitalTwin(state, context = {}) {
  const completed = tasksCompletedSince(state, daysAgo(60, context));
  const skipMap = buildSkipMap(state, context);
  const behavior = buildBehaviorModel(state, context);
  const helpful = Number(state.profile?.learning?.responsePatterns?.helpful || 0);
  const completedSignals = Number(state.profile?.learning?.responsePatterns?.completed || 0);
  const skippedSignals = Number(state.profile?.learning?.responsePatterns?.skipped || 0);
  const notHelpfulSignals = Number(state.profile?.learning?.responsePatterns?.notHelpful || 0);
  const highChallengeWins = completed.filter((task) => task.effort === "high" || task.priority === "high").length;
  const riskRatio = completed.length ? highChallengeWins / completed.length : 0;
  const riskTolerance = riskRatio >= 0.55 ? "high" : riskRatio >= 0.3 ? "medium" : "low";
  const followThroughScore = clamp(
    44 +
      Number(state.profile?.completionVelocity?.avgPerDay || 0) * 8 +
      helpful * 1.8 +
      completedSignals * 2.2 -
      skippedSignals * 1.8 -
      notHelpfulSignals * 1.4,
    12,
    96
  );

  const openTasks = (state.tasks || [])
    .filter((task) => task.status === "open")
    .map((task) => ({
      title: task.title,
      reasons: resistanceReasons(task, skipMap[task.id] || 0),
      weight:
        (skipMap[task.id] || 0) * 3 +
        Number(task.suggestionCount || 0) * 2 +
        (task.effort === "high" ? 3 : 0) +
        (!task.dueDate ? 2 : 0)
    }))
    .filter((task) => task.reasons.length)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);

  const decisionPatterns = [];
  if ((state.profile?.learning?.chatPatterns?.builder || 0) >= (state.profile?.learning?.chatPatterns?.planner || 0)) {
    decisionPatterns.push("You lean toward concrete builds over long abstract guidance.");
  } else {
    decisionPatterns.push("You respond well when Buksy frames work as a plan before execution.");
  }
  if (behavior.suggestionStyle === "compact" || behavior.suggestionStyle === "directive") {
    decisionPatterns.push("Short, direct nudges are more effective than long explanations.");
  } else {
    decisionPatterns.push("Context-rich explanations help you commit more confidently.");
  }
  if (riskTolerance === "high") {
    decisionPatterns.push("You can handle aggressive bets when the outcome feels meaningful.");
  } else if (riskTolerance === "low") {
    decisionPatterns.push("You commit more reliably when the first step feels low-risk and contained.");
  } else {
    decisionPatterns.push("You balance ambition with caution when the next move is well scoped.");
  }

  return {
    summary: `Buksy's local twin sees ${riskTolerance} risk tolerance with a ${followThroughScore}% follow-through profile.`,
    riskTolerance,
    followThroughScore,
    decisionPatterns,
    procrastinationTriggers: openTasks.map((task) => ({
      title: task.title,
      reasons: task.reasons
    })),
    likelyToday: latestCheckin(state)?.energy === "low"
      ? "Likely to defer deep work unless the task is very clear and time-boxed."
      : followThroughScore >= 70
        ? "Likely to execute if the first task is concrete and high leverage."
        : "Likely to partially progress, then drift unless Buksy keeps the scope tight."
  };
}

function simulateTwinResponse(state, input = {}, context = {}) {
  const twin = buildDigitalTwin(state, context);
  const prompt = String(input.prompt || input.scenario || "").trim();
  const difficulty = String(input.difficulty || inferDifficulty(prompt)).toLowerCase();
  const uncertainty = String(input.uncertainty || inferUncertainty(prompt)).toLowerCase();
  const socialLoad = String(input.socialLoad || inferSocialLoad(prompt)).toLowerCase();
  const deadlineDays = Number.isFinite(Number(input.deadlineDays)) ? Number(input.deadlineDays) : null;
  const checkin = latestCheckin(state);

  let probability = Number(twin.followThroughScore || 50);
  probability += difficulty === "low" ? 12 : difficulty === "high" ? -10 : 0;
  probability += uncertainty === "low" ? 8 : uncertainty === "high" ? -12 : -3;
  probability += socialLoad === "low" ? 3 : socialLoad === "high" ? -7 : 0;
  probability += deadlineDays !== null ? (deadlineDays <= 2 ? 9 : deadlineDays <= 7 ? 3 : -2) : 0;
  probability += checkin?.energy === "high" ? 6 : checkin?.energy === "low" ? -8 : 0;
  probability = clamp(probability, 8, 97);

  const likelyAction =
    probability >= 74
      ? "Will probably complete the plan if the first step is available now."
      : probability >= 48
        ? "Will likely make partial progress, then need a nudge or smaller next step."
        : "Will probably delay this unless Buksy lowers the friction substantially.";

  return {
    prompt,
    probability,
    likelyAction,
    riskFlags: [
      uncertainty === "high" ? "High uncertainty" : null,
      socialLoad === "high" ? "High social load" : null,
      difficulty === "high" ? "Heavy cognitive effort" : null
    ].filter(Boolean),
    counterMoves: [
      "Shrink the first move to 15-30 minutes.",
      "Give the task one clear success definition.",
      deadlineDays === null ? "Attach a date so it stops drifting." : "Protect a fixed start time.",
      twin.riskTolerance === "low" ? "Frame the first move as a safe test, not a full commitment." : "Preserve momentum with one ambitious but bounded step."
    ].filter(Boolean)
  };
}

function buildFutureTimelines(state, context = {}) {
  const openTasks = (state.tasks || []).filter((task) => task.status === "open");
  const totalMinutes = openTasks.reduce((sum, task) => sum + Number(task.durationMins || 0), 0);
  const avgPerDay = Math.max(0.75, Number(state.profile?.completionVelocity?.avgPerDay || 1));
  const taskMinutes = totalMinutes || openTasks.length * 35 || 180;
  const goalOdds = buildGoalSuccessProbabilities(state, context);

  const modes = [
    { id: "aggressive", label: "Aggressive", hourFactor: 1.5, taskFactor: 1.45 },
    { id: "balanced", label: "Balanced", hourFactor: 1, taskFactor: 1 },
    { id: "lazy", label: "Lazy mode", hourFactor: 0.65, taskFactor: 0.6 }
  ].map((mode) => {
    const projectedTasksPer30Days = Math.max(1, Math.round(avgPerDay * 30 * mode.taskFactor));
    const projectedMinutesPer30Days = Math.max(120, Math.round(projectedTasksPer30Days * 40 * mode.hourFactor));
    const projectedDaysToClearOpenWork = Math.max(1, Math.ceil(taskMinutes / Math.max(90, projectedMinutesPer30Days / 30)));
    const completion90 = clamp(Math.round((projectedMinutesPer30Days * 3 / Math.max(1, taskMinutes)) * 100), 12, 100);
    const goalLift = mode.id === "aggressive" ? 12 : mode.id === "lazy" ? -12 : 0;

    return {
      id: mode.id,
      label: mode.label,
      projectedTasksPer30Days,
      projectedDaysToClearOpenWork,
      summary:
        mode.id === "aggressive"
          ? "Fastest path with more stretch and fatigue risk."
          : mode.id === "balanced"
            ? "Most sustainable path for steady progress."
            : "Safer on energy, but goals will likely drift.",
      goalOutlook: goalOdds.slice(0, 4).map((goal) => ({
        title: goal.title,
        probability: clamp(goal.probability + goalLift, 5, 97)
      })),
      points: [0, 30, 60, 90, 180].map((days) => ({
        day: days,
        completion: clamp(Math.round((days / Math.max(1, projectedDaysToClearOpenWork)) * 100), 0, 100)
      })),
      sixMonthMessage:
        mode.id === "aggressive"
          ? "At this pace, Buksy expects major goal compression with a real overload tradeoff."
          : mode.id === "balanced"
            ? "At this pace, Buksy expects meaningful progress with lower burnout risk."
            : "At this pace, Buksy expects some goals to slip unless scope drops."
    };
  });

  return {
    recommendedMode: modes[1].label,
    modes,
    summary: "Buksy is projecting multiple futures from your current velocity and open work."
  };
}

function buildHabitDNA(state, context = {}) {
  const recentCheckins = checkinsSince(state, daysAgo(30, context));
  const skips = feedbackSince(state, daysAgo(30, context)).filter((entry) => entry.kind === "skipped");
  const completed = tasksCompletedSince(state, daysAgo(30, context));
  const lowEnergyDays = recentCheckins.filter((entry) => entry.energy === "low").length;
  const lateWins = completed.filter((task) => {
    const hour = new Date(task.completedAt).getHours();
    return hour >= 14 && hour <= 18;
  }).length;
  const morningWins = completed.filter((task) => new Date(task.completedAt).getHours() < 12).length;
  const personSkips = {};

  (state.tasks || []).forEach((task) => {
    if (!task.people?.length) return;
    const skipCount = skips.filter((entry) => entry.taskId === task.id).length;
    task.people.forEach((person) => {
      personSkips[person] = (personSkips[person] || 0) + skipCount;
    });
  });

  const strongestPersonFriction = Object.entries(personSkips).sort((a, b) => b[1] - a[1])[0];
  const patterns = [];
  if (lowEnergyDays >= 4) {
    patterns.push({
      title: "Energy is a hidden driver",
      pattern: "You lose reliability on low-energy days, especially on deep or ambiguous work.",
      intervention: "Switch to short wins and remove optional deep work after low-energy check-ins."
    });
  }
  if (lateWins > morningWins) {
    patterns.push({
      title: "Afternoon completion bias",
      pattern: "You close more loops in the afternoon than in the morning.",
      intervention: "Use mornings for planning and afternoons for execution-heavy tasks."
    });
  } else if (morningWins > 0) {
    patterns.push({
      title: "Morning focus bias",
      pattern: "Your best completion pattern shows up earlier in the day.",
      intervention: "Protect the first part of the day for high-focus work."
    });
  }
  if (strongestPersonFriction && strongestPersonFriction[1] >= 2) {
    patterns.push({
      title: "People-linked friction",
      pattern: `Tasks involving ${strongestPersonFriction[0]} show elevated resistance.`,
      intervention: "Clarify expectations and define the exact next message or ask before starting."
    });
  }
  if (!patterns.length) {
    patterns.push({
      title: "Pattern still forming",
      pattern: "Buksy needs a bit more repeated behavior data to lock in stronger habit DNA signals.",
      intervention: "Keep logging check-ins and completing tasks with better metadata."
    });
  }

  return {
    summary: "Buksy is mapping the root conditions behind follow-through, not just counting habits.",
    patterns
  };
}

function buildContextEngine(state, context = {}) {
  const world = state.profile?.worldContext || {};
  const current = latestCheckin(state);
  const recommendations = [];

  if (Number(world.sleepHours || 0) > 0 && Number(world.sleepHours) < 6) {
    recommendations.push("Sleep is low. Prefer admin, cleanup, and shorter execution blocks.");
  }
  if (Number(world.commuteMinutes || 0) >= 45) {
    recommendations.push("Long commute detected. Group calls, messages, and lightweight tasks together.");
  }
  if (/rain|storm|heat|cold/i.test(String(world.weather || ""))) {
    recommendations.push("Weather suggests an indoor-first day. Favor desk-bound tasks and async planning.");
  }
  if (/crash|layoff|market|competition|pricing/i.test(String(world.newsSignal || ""))) {
    recommendations.push("External signal may change timing or risk. Re-check strategic bets before committing full effort.");
  }
  if (current?.energy === "low") {
    recommendations.push("Current energy is low, so Buksy should reduce cognitive load immediately.");
  }
  if (!recommendations.length) {
    recommendations.push("No strong outside-world pressure signal right now.");
  }

  return {
    locationLabel: world.locationLabel || "Not set",
    weather: world.weather || "No local snapshot",
    newsSignal: world.newsSignal || "No external note",
    commuteMinutes: Number(world.commuteMinutes || 0),
    sleepHours: Number(world.sleepHours || 0),
    workMode: world.workMode || "auto",
    recommendations
  };
}

function buildTeamBrain(state, context = {}) {
  const members = (state.team || []).length
    ? state.team
    : Array.from(new Set([
      ...(state.tasks || []).flatMap((task) => task.people || []),
      ...(state.goals || []).flatMap((goal) => goal.people || [])
    ])).map((name) => ({ id: name, name, role: "teammate", focusArea: "" }));

  const blockerTasks = (state.tasks || [])
    .filter((task) => task.status === "open")
    .filter((task) => (task.dependsOn || []).length > 0 || /blocked|waiting/i.test(`${task.title} ${task.notes}`))
    .slice(0, 6)
    .map((task) => ({
      title: task.title,
      dependsOn: task.dependsOn || [],
      people: task.people || [],
      reason: (task.dependsOn || []).length ? "Dependency risk" : "Explicit blocker language"
    }));

  const memberLoad = members.map((member) => {
    const involved = (state.tasks || []).filter((task) =>
      task.status === "open" &&
      (task.people || []).some((person) => person.toLowerCase() === member.name.toLowerCase())
    );
    return {
      name: member.name,
      role: member.role,
      openItems: involved.length,
      focusArea: member.focusArea
    };
  }).sort((a, b) => b.openItems - a.openItems);

  const suggestions = blockerTasks.length
    ? blockerTasks.map((task) => `${task.title}: resolve ${task.dependsOn[0] || task.people[0] || "the blocker"} before adding more work.`)
    : members.length > 1
      ? ["No hard blocker is visible yet. Buksy can still balance work by clarifying owners and dependencies."]
      : ["Add teammates and tag tasks with people to unlock stronger team-brain analysis."];

  return {
    summary: members.length > 1
      ? "Buksy is tracking cross-person load and dependency risk."
      : "Buksy is ready for team mode, but it needs more than one active person to reason across dependencies.",
    members: memberLoad,
    blockers: blockerTasks,
    suggestions
  };
}

function buildEmotionalIntelligence(state, context = {}) {
  const recentCheckins = checkinsSince(state, daysAgo(21, context));
  const lowEnergy = recentCheckins.filter((entry) => entry.energy === "low").length;
  const scattered = recentCheckins.filter((entry) => entry.focus === "scattered").length;
  const frustrationSignals = feedbackSince(state, daysAgo(14, context)).filter((entry) =>
    ["skipped", "not_helpful"].includes(entry.kind)
  ).length;
  const load = buildCognitiveLoadReport(state, context);

  const interventions = [];
  if (lowEnergy >= 4) interventions.push("Protect recovery mode and lower the number of high-focus tasks.");
  if (scattered >= 3) interventions.push("Reduce context switches and finish one bounded task before opening another.");
  if (frustrationSignals >= 4) interventions.push("Re-scope resisted work into clearer first moves or delegated asks.");
  if (load.level === "high") interventions.push("Cognitive load is already high, so Buksy should auto-trim today's plan.");
  if (!interventions.length) interventions.push("Emotional signal is stable right now.");

  return {
    summary: "Buksy is watching for frustration loops and burnout cycles, not just mood snapshots.",
    lowEnergyDays: lowEnergy,
    scatteredMoments: scattered,
    frustrationSignals,
    interventions
  };
}

function buildSelfLearningPlaybooks(state, context = {}) {
  const completed = tasksCompletedSince(state, daysAgo(60, context));
  const artifacts = (state.artifacts || []).slice(0, 20);
  const playbooks = [];

  if (completed.some((task) => task.priority === "high") && artifacts.some((artifact) => artifact.kind === "document")) {
    playbooks.push({
      title: "Plan -> document -> execute",
      pattern: "You often move best when Buksy creates a structured plan or doc before execution starts.",
      whenToUse: "Complex launches, proposals, or messy goals.",
      steps: ["Clarify the target", "Build the doc or roadmap", "Convert first moves into tasks", "Run a short execution block"]
    });
  }
  if (checkinsSince(state, daysAgo(30, context)).some((entry) => entry.energy === "low")) {
    playbooks.push({
      title: "Recovery-day operating mode",
      pattern: "You protect momentum better when low-energy days pivot to easy wins instead of forced deep work.",
      whenToUse: "Tired or scattered days.",
      steps: ["Remove optional depth", "Pick 2-3 short wins", "Keep one urgent obligation only", "Review tomorrow"]
    });
  }
  if (completed.filter((task) => task.effort === "high").length >= 3) {
    playbooks.push({
      title: "Deep-work strike",
      pattern: "You can handle high-effort pushes when the task is tightly scoped and time-boxed.",
      whenToUse: "Critical build or decision windows.",
      steps: ["Define one high-leverage move", "Block 60-90 minutes", "Silence low-value tasks", "Capture follow-up immediately"]
    });
  }

  if (!playbooks.length) {
    playbooks.push({
      title: "Pattern still learning",
      pattern: "Buksy is still observing enough completed work to build stronger personal playbooks.",
      whenToUse: "Now",
      steps: ["Keep using goals", "Complete tasks through Buksy", "Save decisions and docs so patterns have more signal"]
    });
  }

  return {
    summary: "Buksy is turning repeated wins into reusable personal operating playbooks.",
    playbooks
  };
}

function buildStrategyEngine(state, context = {}) {
  const goalOdds = buildGoalSuccessProbabilities(state, context);
  const projects = (state.projects || []).map((project) => {
    const openTasks = (state.tasks || []).filter((task) => task.projectId === project.id && task.status === "open");
    const urgency = project.dueDate ? clamp(30 - Math.max(0, Math.floor((new Date(project.dueDate) - nowDate(context)) / DAY_MS)), 0, 30) : 10;
    const leverage = openTasks.filter((task) => task.priority === "high").length * 8 + openTasks.length * 2;
    const score = clamp(urgency + leverage, 5, 100);
    return {
      title: project.name,
      score,
      reason: score >= 55 ? "High ROI focus area right now." : "Important, but not the highest leverage item.",
      dueDate: project.dueDate || null
    };
  }).sort((a, b) => b.score - a.score);

  const focusAreas = projects.slice(0, 3);
  const goalOpportunities = goalOdds
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3)
    .map((goal) => `${goal.title}: ${goal.probability}% success probability if momentum holds.`);

  return {
    summary: "CEO mode ranks where your next unit of effort can buy the most leverage.",
    focusAreas,
    goalOpportunities,
    recommendation: focusAreas[0]
      ? `Primary strategic focus: ${focusAreas[0].title}.`
      : "Create a project or goal and Buksy will start ranking strategic focus areas."
  };
}

function buildGamification(state, context = {}) {
  const completed = (state.feedback || []).filter((entry) => entry.kind === "completed").length;
  const highValueWins = tasksCompletedSince(state, daysAgo(90, context)).filter((task) =>
    task.priority === "high" || task.effort === "high"
  ).length;
  const streak = streakDays(state.profile?.productivityHistory || []);
  const xp = completed * 15 + highValueWins * 10 + streak * 6;
  const level = Math.max(1, Math.floor(Math.sqrt(xp / 60)) + 1);
  const unlocks = [
    level >= 2 ? "Daily AI planning" : null,
    level >= 3 ? "Future timeline modes" : null,
    level >= 4 ? "Autopilot optimizations" : null,
    level >= 5 ? "Advanced strategy and team brain insights" : null
  ].filter(Boolean);

  return {
    xp,
    level,
    streak,
    unlocks,
    nextUnlockAt: (level + 1) * (level + 1) * 60,
    summary: "Buksy is turning consistency and difficulty into progression, not just badges."
  };
}

function buildSubconsciousPatterns(state, context = {}) {
  const skipMap = buildSkipMap(state, context);
  const patterns = [];
  const personCounts = {};

  (state.tasks || []).forEach((task) => {
    if (!(skipMap[task.id] || 0)) return;
    (task.people || []).forEach((person) => {
      personCounts[person] = (personCounts[person] || 0) + skipMap[task.id];
    });
  });

  const topPerson = Object.entries(personCounts).sort((a, b) => b[1] - a[1])[0];
  if (topPerson && topPerson[1] >= 2) {
    patterns.push(`You show elevated resistance on tasks involving ${topPerson[0]}.`);
  }

  const uncertainTasks = (state.tasks || []).filter((task) =>
    task.status === "open" &&
    inferUncertainty(`${task.title} ${task.notes}`) === "high" &&
    ((skipMap[task.id] || 0) > 0 || Number(task.suggestionCount || 0) >= 2)
  );
  if (uncertainTasks.length) {
    patterns.push("You delay decisions when the path feels ambiguous or under-defined.");
  }

  const noDeadlineDrift = (state.tasks || []).filter((task) =>
    task.status === "open" && !task.dueDate && Number(task.suggestionCount || 0) >= 2
  ).length;
  if (noDeadlineDrift >= 2) {
    patterns.push("You drift away from important work when it lacks a date or visible consequence.");
  }

  return {
    summary: "Buksy is looking for patterns you usually only notice in hindsight.",
    patterns: patterns.length ? patterns : ["No strong subconscious pattern has crossed the confidence line yet."]
  };
}

function buildPrivacyMode(state) {
  const integrations = state.profile?.integrations || {};
  const plugins = buildPluginCatalog(state);
  const connectedIntegrations = Object.values(integrations).filter((entry) => entry && (entry.token || entry.accessToken || entry.apiToken)).length;
  const connectedPlugins = plugins.filter((plugin) => plugin.connected).length;
  const privacy = state.profile?.privacy || {};

  return {
    localFirst: privacy.localFirst !== false,
    offlinePreferred: privacy.offlinePreferred !== false,
    connectedIntegrations,
    connectedPlugins,
    dataSharing: privacy.dataSharing || "local_only",
    summary:
      connectedIntegrations + connectedPlugins === 0
        ? "Buksy is running in an almost fully local-first mode right now."
        : "Buksy is still local-first, but some capabilities depend on connected integrations."
  };
}

function buildMetaImprovementLoop(state, context = {}) {
  const learning = state.profile?.learning || {};
  const velocity = state.profile?.completionVelocity || { avgPerDay: 0, trend: "stable" };
  const outputs = Object.entries(learning.outputAffinity || {}).sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0));
  const categories = Object.entries(learning.categoryAffinity || {}).sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0));

  return {
    summary: "Buksy is continuously tuning its internal guidance from your acceptance, skips, completions, and routing outcomes.",
    currentBiases: [
      outputs[0] ? `Preferred output: ${outputs[0][0]}.` : "No output bias yet.",
      categories[0] ? `Most rewarded category: ${categories[0][0]}.` : "No category bias yet.",
      `Velocity trend: ${velocity.trend}.`
    ],
    nextOptimizations: [
      learning.responsePatterns?.skipped > learning.responsePatterns?.helpful
        ? "Reduce plan length and increase action-first suggestions."
        : "Keep reinforcing the styles that lead to completions.",
      velocity.trend === "declining"
        ? "Lean harder on recovery planning and cognitive-load balancing."
        : "Maintain current pacing and keep collecting preference signals."
    ]
  };
}

function buildAutopilotReport(state, context = {}) {
  const settings = state.profile?.autopilot || {};
  const suggestion = suggestNextTask(state, context);
  const plan = buildDailyPlan(state, context, Math.max(3, Number(settings.maxDailyDeepTasks || 3)));
  const load = buildCognitiveLoadReport(state, context);
  const twin = buildDigitalTwin(state, context);

  return {
    settings,
    ready: settings.enabled === true,
    summary: settings.enabled
      ? "Life Autopilot is active and ready to rebalance today."
      : "Life Autopilot is in preview mode until you enable it.",
    nextAnchor: suggestion?.task?.title || plan[0]?.title || "No clear anchor yet",
    guardrails: [
      `Approval mode: ${settings.approvalMode || "smart"}.`,
      `Max deep tasks per day: ${settings.maxDailyDeepTasks || 3}.`,
      load.level === "high" ? "Autopilot should trim depth today." : "Current load supports normal execution."
    ],
    confidence: twin.followThroughScore
  };
}

function runLifeAutopilot(state, context = {}) {
  const settings = state.profile?.autopilot || {};
  const current = latestCheckin(state);
  const load = buildCognitiveLoadReport(state, context);
  const emotional = buildEmotionalIntelligence(state, context);
  const twin = buildDigitalTwin(state, context);
  const contextEngine = buildContextEngine(state, context);
  const openTasks = (state.tasks || []).filter((task) => task.status === "open");
  const dueSoon = openTasks.filter((task) => task.dueDate).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const easyWins = openTasks.filter((task) => task.effort === "low" || Number(task.durationMins || 0) <= 30);
  const heavyTasks = openTasks.filter((task) => task.effort === "high").sort((a, b) => Number(b.suggestionCount || 0) - Number(a.suggestionCount || 0));
  const deferCount = settings.mode === "aggressive" ? 1 : settings.mode === "lazy" ? 3 : 2;
  const shouldTrim = current?.energy === "low" || load.level === "high" || emotional.frustrationSignals >= 4;
  const tomorrow = new Date(nowDate(context));
  tomorrow.setDate(tomorrow.getDate() + 1);
  const deferDate = dateOnly(tomorrow);
  const deferments = shouldTrim
    ? heavyTasks
      .filter((task) => !task.dueDate || new Date(task.dueDate) > nowDate(context))
      .slice(0, deferCount)
      .map((task) => ({
        taskId: task.id,
        title: task.title,
        deferUntil: deferDate,
        reason: "Autopilot is reducing deep-load pressure."
      }))
    : [];

  const focusNow = (shouldTrim ? easyWins : dueSoon.length ? dueSoon : openTasks)
    .slice(0, Math.max(1, Number(settings.maxDailyDeepTasks || 3)))
    .map((task) => ({
      taskId: task.id,
      title: task.title,
      reason: shouldTrim ? "Lightest viable next move." : "Highest leverage or time-sensitive work."
    }));

  const executionPrompts = openTasks
    .filter((task) => /email|follow[- ]?up|reply|meeting|schedule|invoice|client/i.test(`${task.title} ${task.notes}`))
    .slice(0, 2)
    .map((task) => buildExecutionPlan({ prompt: task.title }, state));

  return {
    mode: settings.mode || "balanced",
    message: shouldTrim
      ? "Autopilot trimmed cognitive load and switched the day toward lighter, clearer wins."
      : "Autopilot kept the day on track and highlighted the strongest next moves.",
    deferments,
    focusNow,
    plannedExecutions: executionPrompts,
    contextSignals: contextEngine.recommendations.slice(0, 3),
    twinConfidence: twin.followThroughScore
  };
}

function buildAutonomousGoalPlan(state, input = {}, context = {}) {
  const now = nowDate(context);
  const blueprint = buildGoalBlueprint(input, now);
  const estimatedMinutes =
    blueprint.starterTasks.reduce((sum, task) => sum + Number(task.durationMins || 0), 0) +
    blueprint.roadmap.length * 90;
  const dailyHoursNeeded = Math.max(0.5, Math.round((estimatedMinutes / Math.max(1, blueprint.targetDays) / 60) * 10) / 10);

  return {
    title: blueprint.title,
    objective: blueprint.objective,
    summary: `Buksy decomposed "${blueprint.title}" into a goal, roadmap, starter tasks, and a realistic execution pressure model.`,
    blueprint,
    dailyHoursNeeded,
    riskMitigation: blueprint.hiddenRisks.map((risk) => `Mitigate ${risk.toLowerCase()} by making it visible early and assigning a response.`),
    firstWeekFocus: blueprint.weeklyRoadmap.slice(0, 2),
    executionAdvice: [
      `You likely need about ${dailyHoursNeeded} focused hours per day to stay on track.`,
      "Protect the first starter task immediately so the roadmap becomes real work, not just a plan.",
      "Review risks weekly and re-scope early instead of letting drift compound."
    ]
  };
}

function buildExtendedIntelligence(state, context = {}) {
  return {
    digitalTwin: buildDigitalTwin(state, context),
    futureTimelines: buildFutureTimelines(state, context),
    habitDna: buildHabitDNA(state, context),
    contextEngine: buildContextEngine(state, context),
    teamBrain: buildTeamBrain(state, context),
    emotionalIntelligence: buildEmotionalIntelligence(state, context),
    playbooks: buildSelfLearningPlaybooks(state, context),
    strategyEngine: buildStrategyEngine(state, context),
    gamification: buildGamification(state, context),
    subconsciousPatterns: buildSubconsciousPatterns(state, context),
    privacyMode: buildPrivacyMode(state),
    metaLearning: buildMetaImprovementLoop(state, context),
    autopilot: buildAutopilotReport(state, context)
  };
}

module.exports = {
  buildDigitalTwin,
  simulateTwinResponse,
  buildFutureTimelines,
  buildHabitDNA,
  buildContextEngine,
  buildTeamBrain,
  buildEmotionalIntelligence,
  buildSelfLearningPlaybooks,
  buildStrategyEngine,
  buildGamification,
  buildSubconsciousPatterns,
  buildPrivacyMode,
  buildMetaImprovementLoop,
  buildAutopilotReport,
  runLifeAutopilot,
  buildAutonomousGoalPlan,
  buildExtendedIntelligence
};
