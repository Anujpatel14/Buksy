const {
  buildBehaviorModel,
  buildCognitiveLoadReport,
  buildFocusGuard,
  buildFutureYou,
  buildDriftAlerts
} = require("./intelligence");
const { dateKey, addDays } = require("./scheduler");

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function nowDate(context = {}) {
  return context.now ? new Date(context.now) : new Date();
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysAgo(days, context = {}) {
  const date = nowDate(context);
  date.setDate(date.getDate() - days);
  return date;
}

function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function tasksCompletedSince(state, sinceDate) {
  return (state.tasks || []).filter((task) => {
    if (task.status !== "completed" || !task.completedAt) {
      return false;
    }

    return new Date(task.completedAt) >= sinceDate;
  });
}

function activitiesSince(state, sinceDate, typePrefix = "") {
  return (state.activities || []).filter((activity) => {
    if (new Date(activity.createdAt) < sinceDate) {
      return false;
    }

    return typePrefix ? String(activity.type || "").startsWith(typePrefix) : true;
  });
}

function checkinsSince(state, sinceDate) {
  return (state.checkins || []).filter((checkin) => new Date(checkin.createdAt) >= sinceDate);
}

function bucketForHour(hour) {
  if (hour < 9) return "6 AM - 9 AM";
  if (hour < 12) return "9 AM - 12 PM";
  if (hour < 15) return "12 PM - 3 PM";
  if (hour < 18) return "3 PM - 6 PM";
  if (hour < 21) return "6 PM - 9 PM";
  return "9 PM - 12 AM";
}

function average(values = []) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length;
}

function buildPerformanceWindows(state, context = {}) {
  const completed = tasksCompletedSince(state, daysAgo(30, context));
  const buckets = {};

  completed.forEach((task) => {
    const completedAt = new Date(task.completedAt);
    const key = bucketForHour(completedAt.getHours());
    buckets[key] = buckets[key] || {
      window: key,
      completions: 0,
      minutes: 0,
      highImpactMinutes: 0
    };
    buckets[key].completions += 1;
    buckets[key].minutes += Number(task.durationMins || 0);
    if (task.priority === "high" || task.effort === "high") {
      buckets[key].highImpactMinutes += Number(task.durationMins || 0);
    }
  });

  const rows = Object.values(buckets)
    .map((entry) => ({
      ...entry,
      impactScore: entry.completions * 2 + entry.highImpactMinutes / 30
    }))
    .sort((a, b) => b.impactScore - a.impactScore);

  return {
    bestWindow: rows[0]?.window || "Not enough data yet",
    strongestWindowScore: Math.round(rows[0]?.impactScore || 0),
    windows: rows
  };
}

function buildLowImpactEstimate(state, context = {}) {
  const completed = tasksCompletedSince(state, daysAgo(14, context));
  const lowImpact = completed.filter((task) =>
    task.priority === "low" ||
    ["admin", "general", "errands"].includes(task.category)
  );
  const lowImpactMinutes = lowImpact.reduce((sum, task) => sum + Number(task.durationMins || 0), 0);
  const perDayHours = lowImpactMinutes / 14 / 60;

  return {
    lowImpactMinutes,
    lowImpactHoursPerDay: Number(perDayHours.toFixed(1)),
    message: lowImpact.length
      ? `Estimated low-impact time is about ${perDayHours.toFixed(1)} hours per day over the last two weeks.`
      : "Not enough completed-task data yet to estimate low-impact time."
  };
}

function buildAvoidancePatterns(state, context = {}) {
  const sinceDate = daysAgo(30, context);
  const skippedByTask = {};

  (state.feedback || []).forEach((entry) => {
    if (!["skipped", "not_helpful"].includes(entry.kind) || new Date(entry.createdAt) < sinceDate) {
      return;
    }
    skippedByTask[entry.taskId] = (skippedByTask[entry.taskId] || 0) + 1;
  });

  return (state.tasks || [])
    .filter((task) => task.status === "open")
    .map((task) => ({
      id: task.id,
      title: task.title,
      suggestionCount: Number(task.suggestionCount || 0),
      skippedCount: skippedByTask[task.id] || 0,
      effort: task.effort,
      notes:
        task.suggestionCount >= 3 || (skippedByTask[task.id] || 0) >= 2
          ? "Buksy sees repeated hesitation here. The task may be unclear, too big, or poorly timed."
          : ""
    }))
    .filter((task) => task.suggestionCount >= 2 || task.skippedCount >= 1)
    .sort((a, b) => (b.skippedCount * 2 + b.suggestionCount) - (a.skippedCount * 2 + a.suggestionCount))
    .slice(0, 6);
}

function buildBurnoutRisk(state, context = {}) {
  const recentCheckins = checkinsSince(state, daysAgo(7, context));
  const lowEnergyCount = recentCheckins.filter((checkin) => checkin.energy === "low").length;
  const scatteredCount = recentCheckins.filter((checkin) => checkin.focus === "scattered").length;
  const autoDeferred = activitiesSince(state, daysAgo(7, context), "task_auto_deferred").length;
  const overload = buildCognitiveLoadReport(state, context);
  const focusGuard = buildFocusGuard(state, context);

  let score =
    lowEnergyCount * 12 +
    scatteredCount * 8 +
    autoDeferred * 6 +
    Math.max(0, overload.highFocusCount - 3) * 8 +
    Math.max(0, focusGuard.switchCount - 2) * 6;
  score = clamp(score, 0, 100);

  let level = "low";
  let message = "Burnout risk looks low right now. Keep protecting recovery and not just output.";
  if (score >= 70) {
    level = "high";
    message = "Buksy sees a real burnout signal. Reduce depth, cut commitments, and protect recovery blocks this week.";
  } else if (score >= 40) {
    level = "elevated";
    message = "Stress is building. Aim for shorter wins, fewer switches, and less optional work for a bit.";
  }

  return {
    score,
    level,
    lowEnergyCount,
    scatteredCount,
    autoDeferred,
    message
  };
}

function buildGoalSuccessProbabilities(state, context = {}) {
  const future = buildFutureYou(state, context);
  const drift = buildDriftAlerts(state, context);
  const completionVelocity = Number(state.profile?.completionVelocity?.avgPerDay || 0);

  return future.map((entry) => {
    const driftPenalty = drift.find((item) => item.goalId === entry.goalId) ? 12 : 0;
    const velocityBoost = completionVelocity >= 2 ? 8 : completionVelocity >= 1 ? 4 : 0;
    const probability = clamp(88 - entry.slipDays * 14 - driftPenalty + velocityBoost, 8, 96);

    return {
      goalId: entry.goalId,
      title: entry.title,
      probability,
      message:
        probability >= 75
          ? `${entry.title} has a strong chance if you keep the current cadence.`
          : probability >= 50
            ? `${entry.title} is still plausible, but Buksy sees pressure building.`
            : `${entry.title} is likely to slip unless you increase time or reduce scope.`
    };
  });
}

function buildPersonalizationProfile(state, context = {}) {
  const learning = state.profile?.learning || {};
  const performance = buildPerformanceWindows(state, context);
  const behavior = buildBehaviorModel(state, context);
  const preferredDurations = Object.entries(learning.durationAffinity || {})
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0));
  const preferredEffort = Object.entries(learning.effortAffinity || {})
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0));
  const lowEnergyDays = checkinsSince(state, daysAgo(14, context)).filter((checkin) => checkin.energy === "low").length;
  const easyWins = tasksCompletedSince(state, daysAgo(30, context))
    .filter((task) => task.effort === "low" || Number(task.durationMins) <= 25)
    .slice(0, 8);
  const categoryCounts = {};
  easyWins.forEach((task) => {
    categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
  });
  const bestEasyCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "admin";

  return {
    operatingMode: behavior.operatingMode,
    suggestionStyle: behavior.suggestionStyle,
    bestWorkWindow: performance.bestWindow,
    preferredDuration: preferredDurations[0]?.[0] || "short",
    preferredEffort: preferredEffort[0]?.[0] || "medium",
    lowEnergyDays,
    lowEnergyStrategy: `On low-energy days, Buksy should push shorter ${bestEasyCategory} wins before deep work.`,
    taskDifficultyByTime: [
      { window: performance.bestWindow, suggestion: "Best for higher-difficulty work." },
      { window: "Late afternoon / evening", suggestion: "Better for admin, cleanup, and lighter decisions." }
    ]
  };
}

function buildWeeklyReport(state, context = {}) {
  const completed7 = tasksCompletedSince(state, daysAgo(7, context));
  const completed14 = tasksCompletedSince(state, daysAgo(14, context));
  const avoidance = buildAvoidancePatterns(state, context);
  const performance = buildPerformanceWindows(state, context);
  const lowImpact = buildLowImpactEstimate(state, context);
  const burnout = buildBurnoutRisk(state, context);

  return {
    completedLast7Days: completed7.length,
    completedLast14Days: completed14.length,
    report: [
      completed7.length
        ? `You completed ${completed7.length} tasks in the last 7 days.`
        : "Not enough completed work yet to build a weekly output pattern.",
      performance.bestWindow !== "Not enough data yet"
        ? `Best performance window: ${performance.bestWindow}.`
        : "Buksy is still learning your strongest work window.",
      lowImpact.lowImpactHoursPerDay > 0
        ? `Estimated low-impact time: ${lowImpact.lowImpactHoursPerDay} hours/day.`
        : "Low-impact time estimate needs more completed-task data.",
      avoidance[0]
        ? `Most avoided task right now: ${avoidance[0].title}.`
        : "No strong avoidance pattern is surfacing yet.",
      burnout.level === "low"
        ? "Burnout risk is currently low."
        : `Burnout risk is ${burnout.level}.`
    ]
  };
}

function buildUsageLedger(state, context = {}) {
  const sinceDate = daysAgo(30, context);
  const aiRequests = (state.conversations || []).filter(
    (message) => message.role === "user" && new Date(message.createdAt) >= sinceDate
  ).length;
  const advancedRuns = (state.artifacts || []).filter(
    (artifact) =>
      ["multi-agent", "simulation", "comparison", "decision", "research", "learning"].includes(artifact.kind) &&
      new Date(artifact.createdAt) >= sinceDate
  ).length;
  const creditsUsed = aiRequests + advancedRuns * 2;
  const includedCredits = 300;

  return {
    plan: creditsUsed > 220 ? "Pro candidate" : "Free",
    aiRequests,
    advancedRuns,
    creditsUsed,
    includedCredits,
    remainingCredits: Math.max(0, includedCredits - creditsUsed)
  };
}

function buildLifeAnalytics(state, context = {}) {
  const weekly = buildWeeklyReport(state, context);
  const performance = buildPerformanceWindows(state, context);
  const lowImpact = buildLowImpactEstimate(state, context);
  const burnout = buildBurnoutRisk(state, context);
  const goals = buildGoalSuccessProbabilities(state, context);
  const avoidance = buildAvoidancePatterns(state, context);
  const personalization = buildPersonalizationProfile(state, context);
  const usage = buildUsageLedger(state, context);

  return {
    weekly,
    performance,
    lowImpact,
    burnout,
    goals,
    avoidance,
    personalization,
    usage
  };
}

function explainDelay(state, input = {}, context = {}) {
  const now = nowDate(context);
  const needle = String(input.project || input.goal || input.query || "").trim().toLowerCase();
  const project = (state.projects || []).find((entry) => entry.name.toLowerCase().includes(needle));
  const goal = (state.goals || []).find((entry) => entry.title.toLowerCase().includes(needle));
  const relevantTasks = (state.tasks || []).filter((task) => {
    if (project && task.projectId === project.id) return true;
    if (goal && task.goalId === goal.id) return true;
    return !project && !goal && task.title.toLowerCase().includes(needle);
  });

  const delayed = relevantTasks.filter((task) => task.deferUntil || (task.status === "open" && Number(task.suggestionCount || 0) >= 2));
  const skippedIds = new Set(
    (state.feedback || [])
      .filter((entry) => ["skipped", "not_helpful"].includes(entry.kind))
      .map((entry) => entry.taskId)
  );
  const reasons = [];

  if (delayed.some((task) => task.effort === "high")) {
    reasons.push("The work appears heavy or unclear, so it keeps getting pushed.");
  }
  if (delayed.some((task) => !task.dueDate)) {
    reasons.push("Several tasks have no due date, which makes them easy to postpone.");
  }
  if (delayed.some((task) => skippedIds.has(task.id))) {
    reasons.push("Buksy sees direct skip signals on this work, so timing or scope may be off.");
  }
  const recentLowEnergy = checkinsSince(state, daysAgo(30, context)).filter((checkin) => checkin.energy === "low").length;
  if (recentLowEnergy >= 4) {
    reasons.push("Recent low-energy days likely reduced how much deep work you could realistically absorb.");
  }
  if (!reasons.length) {
    reasons.push("The delay looks more like priority drift than one single blocker.");
  }

  return {
    target: project?.name || goal?.title || input.query || "this work",
    delayedTaskCount: delayed.length,
    reasons,
    recommendedFixes: [
      "Cut the first step smaller and give it a date.",
      "Protect one time block for the hardest task only.",
      "Remove optional tasks that are stealing attention."
    ],
    taskSnapshot: delayed.slice(0, 6).map((task) => ({
      title: task.title,
      effort: task.effort,
      dueDate: task.dueDate || null,
      deferUntil: task.deferUntil || null,
      suggestionCount: task.suggestionCount || 0
    })),
    generatedAt: now.toISOString()
  };
}

function resolveSimulationTasks(state, input = {}) {
  const goalId = input.goalId || null;
  const projectId = input.projectId || null;

  return (state.tasks || []).filter((task) => {
    if (task.status !== "open") {
      return false;
    }

    if (goalId) {
      return task.goalId === goalId;
    }

    if (projectId) {
      return task.projectId === projectId;
    }

    return true;
  });
}

function simulateTimeline(state, input = {}, context = {}) {
  const tasks = resolveSimulationTasks(state, input);
  const totalMinutes = tasks.reduce((sum, task) => sum + Number(task.durationMins || 0), 0);
  const dailyHours = Math.max(0.5, Number(input.dailyHours || 2));
  const hoursPerDay = dailyHours * 60;
  const daysOff = new Set(Array.isArray(input.daysOff) ? input.daysOff : []);
  const startDate = startOfDay(nowDate(context));
  const includeWeekends = input.includeWeekends === true;
  let remaining = totalMinutes;
  let cursor = new Date(startDate);
  const timeline = [];

  while (remaining > 0 && timeline.length < 365) {
    const isWeekendDay = cursor.getDay() === 0 || cursor.getDay() === 6;
    const key = dateKey(cursor);
    const usable = (!isWeekendDay || includeWeekends) && !daysOff.has(key);

    if (usable) {
      const worked = Math.min(hoursPerDay, remaining);
      remaining -= worked;
      timeline.push({
        date: key,
        plannedMinutes: worked,
        remainingMinutes: Math.max(0, remaining)
      });
    }

    if (remaining > 0) {
      cursor = addDays(cursor, 1);
    }
  }

  const projectedFinishDate = timeline[timeline.length - 1]?.date || dateKey(startDate);
  const targetGoal = input.goalId
    ? (state.goals || []).find((goal) => goal.id === input.goalId)
    : null;
  const targetDate = input.targetDate || targetGoal?.targetDate || null;
  const deltaDays = targetDate
    ? Math.floor((new Date(projectedFinishDate) - new Date(targetDate)) / MS_PER_DAY)
    : 0;
  const atRisk = deltaDays > 0;

  return {
    scope: targetGoal?.title || input.label || (input.projectId ? "Selected project" : "All open tasks"),
    totalMinutes,
    dailyHours,
    projectedFinishDate,
    targetDate,
    deltaDays,
    atRisk,
    message: targetDate
      ? atRisk
        ? `At ${dailyHours} hours/day, this work likely slips by about ${deltaDays} day${deltaDays === 1 ? "" : "s"}.`
        : `At ${dailyHours} hours/day, this plan still fits before the target date.`
      : `At ${dailyHours} hours/day, Buksy projects this work finishing around ${projectedFinishDate}.`,
    whatMustHappenThisWeek: tasks
      .slice()
      .sort((a, b) => (new Date(a.dueDate || "2999-12-31") - new Date(b.dueDate || "2999-12-31")))
      .slice(0, 5)
      .map((task) => task.title),
    timeline: timeline.slice(0, 14)
  };
}

module.exports = {
  buildLifeAnalytics,
  buildPerformanceWindows,
  buildBurnoutRisk,
  buildGoalSuccessProbabilities,
  buildPersonalizationProfile,
  explainDelay,
  simulateTimeline
};
