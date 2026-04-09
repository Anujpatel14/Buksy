/**
 * Autonomous Learner Module
 * Learns the user's working style, patterns, and preferences over time.
 * Provides mood-adaptive auto-scheduling and work style profiling.
 */

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * Build a comprehensive work-style profile from historical data.
 */
function buildWorkStyleProfile(state) {
  const tasks = state.tasks || [];
  const checkins = state.checkins || [];
  const feedback = state.feedback || [];
  const activities = state.activities || [];
  const completed = tasks.filter(t => t.status === "completed" && t.completedAt);

  // ── Peak Productivity Hours ──────────────────────────────────
  const hourBuckets = {};
  completed.forEach(t => {
    const hour = new Date(t.completedAt).getHours();
    hourBuckets[hour] = (hourBuckets[hour] || 0) + 1;
  });
  const peakHour = Object.entries(hourBuckets)
    .sort((a, b) => b[1] - a[1])[0];
  const peakProductivityHour = peakHour ? Number(peakHour[0]) : 10;

  // ── Preferred Work Periods ───────────────────────────────────
  const periodCounts = { morning: 0, afternoon: 0, evening: 0 };
  completed.forEach(t => {
    const hour = new Date(t.completedAt).getHours();
    if (hour < 12) periodCounts.morning++;
    else if (hour < 18) periodCounts.afternoon++;
    else periodCounts.evening++;
  });
  const preferredPeriod = Object.entries(periodCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "morning";

  // ── Category Velocity (tasks completed per category per day) ──
  const categoryVelocity = {};
  const categoryDays = {};
  completed.forEach(t => {
    const cat = t.category || "general";
    const day = t.completedAt?.slice(0, 10);
    if (!day) return;
    if (!categoryDays[cat]) categoryDays[cat] = new Set();
    categoryDays[cat].add(day);
    categoryVelocity[cat] = (categoryVelocity[cat] || 0) + 1;
  });
  Object.keys(categoryVelocity).forEach(cat => {
    const days = categoryDays[cat]?.size || 1;
    categoryVelocity[cat] = Math.round((categoryVelocity[cat] / days) * 10) / 10;
  });

  // ── Average Task Duration (actual vs estimated) ──────────────
  const estimateAccuracy = [];
  completed.forEach(t => {
    if (t.durationMins && t.createdAt && t.completedAt) {
      const actualMs = new Date(t.completedAt) - new Date(t.createdAt);
      const actualMins = actualMs / 60000;
      // Only count if completed within reasonable bounds (5 mins to 1 day)
      if (actualMins >= 5 && actualMins <= 1440) {
        estimateAccuracy.push({
          estimated: t.durationMins,
          actual: Math.round(actualMins),
          ratio: actualMins / t.durationMins
        });
      }
    }
  });
  const avgAccuracyRatio = estimateAccuracy.length > 0
    ? estimateAccuracy.reduce((s, e) => s + e.ratio, 0) / estimateAccuracy.length
    : 1.0;

  // ── Carry Forward Patterns ───────────────────────────────────
  const carryForwardTasks = tasks.filter(t => t.deferUntil);
  const carryForwardRate = tasks.length > 0
    ? Math.round((carryForwardTasks.length / tasks.length) * 100) / 100
    : 0;
  const frequentlyDeferred = carryForwardTasks
    .filter(t => {
      const deferrals = (activities || []).filter(a =>
        a.taskId === t.id && (a.type === "task_auto_deferred" || a.type === "task_carry_forward")
      );
      return deferrals.length >= 2;
    })
    .slice(0, 5)
    .map(t => ({ id: t.id, title: t.title, category: t.category }));

  // ── Task Ordering Preference ─────────────────────────────────
  const completedWithScores = completed.slice(0, 50).map(t => ({
    effort: t.effort,
    priority: t.priority,
    durationMins: t.durationMins,
    hour: t.completedAt ? new Date(t.completedAt).getHours() : 10
  }));
  const morningTasks = completedWithScores.filter(t => t.hour < 12);
  const morningHighEffort = morningTasks.filter(t => t.effort === "high").length;
  const morningLowEffort = morningTasks.filter(t => t.effort === "low").length;
  const prefersDeepFirst = morningHighEffort > morningLowEffort;

  // ── Mood-Productivity Correlation ────────────────────────────
  const moodProductivity = [];
  checkins.forEach(checkin => {
    const checkinDate = checkin.createdAt?.slice(0, 10);
    if (!checkinDate) return;
    const tasksCompletedThatDay = completed.filter(t =>
      t.completedAt?.slice(0, 10) === checkinDate
    ).length;
    moodProductivity.push({
      energy: checkin.energy,
      focus: checkin.focus,
      mood: checkin.mood,
      tasksCompleted: tasksCompletedThatDay
    });
  });

  // Calculate average productivity by energy level
  const productivityByEnergy = { high: [], medium: [], low: [] };
  moodProductivity.forEach(entry => {
    if (productivityByEnergy[entry.energy]) {
      productivityByEnergy[entry.energy].push(entry.tasksCompleted);
    }
  });
  const avgProductivityByEnergy = {};
  Object.entries(productivityByEnergy).forEach(([energy, counts]) => {
    avgProductivityByEnergy[energy] = counts.length > 0
      ? Math.round((counts.reduce((s, c) => s + c, 0) / counts.length) * 10) / 10
      : 0;
  });

  // ── Weekly Pattern ──────────────────────────────────────────
  const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
  completed.forEach(t => {
    if (t.completedAt) {
      const day = new Date(t.completedAt).getDay();
      dayOfWeekCounts[day]++;
    }
  });
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const mostProductiveDay = dayNames[dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts))];
  const leastProductiveDay = dayNames[dayOfWeekCounts.indexOf(Math.min(...dayOfWeekCounts))];

  return {
    peakProductivityHour,
    preferredPeriod,
    prefersDeepFirst,
    categoryVelocity,
    estimateAccuracyRatio: Math.round(avgAccuracyRatio * 100) / 100,
    carryForwardRate,
    frequentlyDeferred,
    avgProductivityByEnergy,
    mostProductiveDay,
    leastProductiveDay,
    totalCompleted: completed.length,
    totalOpen: tasks.filter(t => t.status === "open").length,
    dataPoints: completed.length + checkins.length + feedback.length,
    confidence: completed.length >= 20 ? "high" : completed.length >= 10 ? "medium" : "learning"
  };
}

/**
 * Determine how much to adjust capacity based on mood/energy check-in.
 */
function computeMoodCapacityFactor(checkin, workStyle = {}) {
  const energy = checkin?.energy || "medium";
  const focus = checkin?.focus || "steady";
  const mood = String(checkin?.mood || "").toLowerCase();

  // Base factors
  const energyFactor = { high: 1.2, medium: 1.0, low: 0.55 };
  const focusFactor = { locked_in: 1.15, steady: 1.0, scattered: 0.60 };

  // Mood keyword adjustments
  let moodDelta = 0;
  const negativeMoods = ["tired", "exhausted", "sick", "stressed", "burned out", "burned", "awful", "terrible", "bad", "sad", "depressed", "anxious", "drained", "frustrated", "overwhelmed"];
  const positiveMoods = ["great", "amazing", "energized", "motivated", "excited", "fresh", "pumped", "inspired", "confident", "happy", "good", "awesome", "fantastic"];

  if (negativeMoods.some(m => mood.includes(m))) {
    moodDelta = -0.20;
  } else if (positiveMoods.some(m => mood.includes(m))) {
    moodDelta = 0.15;
  }

  const factor = (energyFactor[energy] || 1.0) * (focusFactor[focus] || 1.0) + moodDelta;
  return Math.max(0.3, Math.min(1.5, factor));
}

/**
 * Decide which tasks should be auto-carried-forward based on mood.
 * Returns list of task IDs that should be deferred.
 */
function computeMoodBasedDeferrals(state, context = {}) {
  const energy = context.energy || "medium";
  const focus = context.focus || "steady";
  const mood = String(context.mood || "").toLowerCase();

  // Only auto-defer if mood/energy is genuinely bad
  const shouldAutoDeferSome = energy === "low" || focus === "scattered";
  const shouldAggressiveDefer = energy === "low" && (focus === "scattered" || isBadMood(mood));

  if (!shouldAutoDeferSome) return { deferrals: [], reason: null };

  const now = context.now ? new Date(context.now) : new Date();
  const openTasks = (state.tasks || [])
    .filter(t => t.status === "open")
    .map(t => ({
      ...t,
      isUrgent: t.dueDate && (new Date(t.dueDate) - now) / MS_PER_DAY <= 1,
      isHigh: t.priority === "high",
      isHeavy: t.effort === "high" || t.durationMins > 60
    }));

  const deferCandidates = openTasks.filter(t => {
    // Never defer overdue or due-today tasks
    if (t.isUrgent) return false;
    // Never defer high-priority tasks
    if (t.isHigh) return false;
    // Defer heavy tasks when energy is low
    if (shouldAggressiveDefer) return t.isHeavy || t.effort === "medium";
    // Less aggressive: only defer heavy/long tasks
    return t.isHeavy;
  });

  const maxDefer = shouldAggressiveDefer ? 5 : 3;
  const selected = deferCandidates.slice(0, maxDefer);

  return {
    deferrals: selected.map(t => t.id),
    reason: shouldAggressiveDefer
      ? `Buksy noticed you're feeling ${mood || "low energy and scattered"}. Automatically carrying forward ${selected.length} heavy tasks to protect your day.`
      : `Low energy detected. ${selected.length} heavy task${selected.length === 1 ? "" : "s"} moved to tomorrow to keep your day manageable.`
  };
}

function isBadMood(mood) {
  const bad = ["tired", "exhausted", "sick", "stressed", "burned", "awful", "terrible", "bad", "sad", "depressed", "anxious", "drained", "frustrated", "overwhelmed"];
  return bad.some(m => mood.includes(m));
}

function isGoodMood(mood) {
  const good = ["great", "amazing", "energized", "motivated", "excited", "fresh", "pumped", "inspired", "confident", "happy", "good", "awesome", "fantastic"];
  return good.some(m => mood.includes(m));
}

/**
 * When mood is good, suggest pulling forward tasks from future days.
 */
function computeMoodBasedPullForward(state, context = {}) {
  const energy = context.energy || "medium";
  const focus = context.focus || "steady";
  const mood = String(context.mood || "").toLowerCase();

  const shouldPullForward = energy === "high" && (focus === "locked_in" || isGoodMood(mood));
  if (!shouldPullForward) return { pullForward: [], reason: null };

  const now = context.now ? new Date(context.now) : new Date();
  const deferred = (state.tasks || [])
    .filter(t => t.status === "open" && t.deferUntil && new Date(t.deferUntil) > now)
    .sort((a, b) => {
      // Prioritize high-priority deferred tasks
      const pa = { high: 3, medium: 2, low: 1 }[a.priority] || 2;
      const pb = { high: 3, medium: 2, low: 1 }[b.priority] || 2;
      return pb - pa;
    })
    .slice(0, 3);

  if (deferred.length === 0) return { pullForward: [], reason: null };

  return {
    pullForward: deferred.map(t => ({ id: t.id, title: t.title })),
    reason: `You're feeling great! Buksy found ${deferred.length} deferred task${deferred.length === 1 ? "" : "s"} you could tackle today while your energy is high.`
  };
}

/**
 * Build autonomous scheduling suggestions based on learned patterns.
 */
function buildSmartScheduleSuggestions(state, context = {}) {
  const workStyle = state.profile?.workStyle || buildWorkStyleProfile(state);
  const now = context.now ? new Date(context.now) : new Date();
  const hour = now.getHours();
  const suggestions = [];

  // Suggestion based on time of day + learned preferences
  if (hour < 12 && workStyle.prefersDeepFirst) {
    suggestions.push("Based on your pattern, you do your best deep work in the morning. Schedule high-effort tasks now.");
  } else if (hour >= 12 && hour < 15) {
    suggestions.push("Afternoon dip detected in your history. Switch to lighter tasks or take a short break.");
  }

  // Estimation accuracy warning
  if (workStyle.estimateAccuracyRatio > 1.5) {
    suggestions.push(`Your tasks typically take ${Math.round(workStyle.estimateAccuracyRatio * 100)}% of estimated time. Buksy is adding buffer automatically.`);
  }

  // Carry-forward pattern alert
  if (workStyle.carryForwardRate > 0.3) {
    suggestions.push("You carry forward 30%+ of tasks. Consider scoping tasks smaller or reducing daily commitments.");
  }

  // Frequently deferred tasks
  if (workStyle.frequentlyDeferred.length > 0) {
    const first = workStyle.frequentlyDeferred[0];
    suggestions.push(`"${first.title}" keeps getting deferred. Consider breaking it into smaller pieces or delegating it.`);
  }

  return suggestions;
}

/**
 * Generate an encouraging or supportive message based on mood.
 */
function buildMoodMessage(checkin) {
  const energy = checkin?.energy || "medium";
  const mood = String(checkin?.mood || "").toLowerCase();

  if (isBadMood(mood) || energy === "low") {
    const messages = [
      "It's okay to have a lighter day. Buksy adjusted your schedule to protect your energy.",
      "Take it easy today. Buksy moved heavy tasks to when you're feeling better.",
      "Your wellbeing matters. Buksy scaled back today's load and will catch up later.",
      "Low energy days are part of the rhythm. Buksy kept only the essentials for today.",
      "You don't need to push through. Buksy carried forward the heavy stuff automatically."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  if (isGoodMood(mood) || energy === "high") {
    const messages = [
      "You're in great shape today! Buksy added some stretch goals to keep the momentum.",
      "High energy detected. Time to tackle those deferred tasks!",
      "Feeling great? Buksy pulled forward some tasks from later this week.",
      "This is your power day. Buksy maxed your schedule with the high-impact work.",
      "Let's make the most of this energy. Your capacity is boosted today."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  return "Steady day ahead. Buksy has your balanced schedule ready.";
}

module.exports = {
  buildWorkStyleProfile,
  computeMoodCapacityFactor,
  computeMoodBasedDeferrals,
  computeMoodBasedPullForward,
  buildSmartScheduleSuggestions,
  buildMoodMessage,
  isBadMood,
  isGoodMood
};
