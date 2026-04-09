const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const PRIORITY_SCORES = { high: 36, medium: 22, low: 10 };
const DURATION_SCORES = { short: 12, medium: 8, long: 4 };

function clamp(value, min = -2.5, max = 2.5) {
  return Math.max(min, Math.min(max, value));
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function safeDuration(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 25;
  }
  return Math.round(numeric);
}

function getDurationBucket(durationMins) {
  const value = safeDuration(durationMins);

  if (value <= 25) {
    return "short";
  }

  if (value <= 60) {
    return "medium";
  }

  return "long";
}

function getTimeSlot(date = new Date()) {
  const hour = date.getHours();

  if (hour < 12) {
    return "morning";
  }

  if (hour < 18) {
    return "afternoon";
  }

  return "evening";
}

function getGoalBoost(task, state, now) {
  if (!task.goalId || !Array.isArray(state.goals)) {
    return 0;
  }

  const goal = state.goals.find((entry) => entry.id === task.goalId);

  if (!goal) {
    return 0;
  }

  const daysLeft = goal.targetDate
    ? Math.ceil((new Date(goal.targetDate) - now) / MS_PER_DAY)
    : null;

  if (daysLeft !== null && daysLeft <= 7) {
    return 12;
  }

  return 7;
}

function scheduledScore(task, now) {
  if (!task.scheduledTime || !/^\d{2}:\d{2}$/.test(task.scheduledTime)) {
    return 0;
  }

  const [hours, minutes] = task.scheduledTime.split(":").map(Number);
  const scheduled = new Date(now);
  scheduled.setHours(hours, minutes, 0, 0);
  const diffMinutes = Math.round((scheduled - now) / MS_PER_HOUR * 60);

  if (diffMinutes >= 0 && diffMinutes <= 120) {
    return 14;
  }

  if (diffMinutes > 120 && diffMinutes <= 300) {
    return 6;
  }

  return 0;
}

function dueScore(task, now) {
  if (!task.dueDate) {
    return 0;
  }

  const due = new Date(task.dueDate);
  const distance = Math.floor((startOfDay(due) - startOfDay(now)) / MS_PER_DAY);

  if (distance < 0) {
    return 42;
  }

  if (distance === 0) {
    return 30;
  }

  if (distance === 1) {
    return 20;
  }

  if (distance <= 3) {
    return 12;
  }

  return 4;
}

function dateDistanceInDays(fromDate, toDate) {
  return Math.floor((startOfDay(toDate) - startOfDay(fromDate)) / MS_PER_DAY);
}

function projectPressureScore(task, state, now) {
  if (!task.projectId) {
    return 0;
  }

  const relatedGoalDates = (state.goals || [])
    .filter((goal) => goal.projectId === task.projectId && goal.status !== "completed" && goal.targetDate)
    .map((goal) => new Date(goal.targetDate));
  const relatedTaskDates = (state.tasks || [])
    .filter((entry) => entry.projectId === task.projectId && entry.status === "open" && entry.dueDate)
    .map((entry) => new Date(entry.dueDate));
  const project = (state.projects || []).find((p) => p.id === task.projectId);
  const projectDue = project?.dueDate ? [new Date(project.dueDate)] : [];
  const allDates = relatedGoalDates.concat(relatedTaskDates).concat(projectDue);

  if (allDates.length === 0) {
    return 0;
  }

  let nearest = Infinity;
  allDates.forEach((date) => {
    nearest = Math.min(nearest, dateDistanceInDays(now, date));
  });

  if (nearest <= 0) {
    return 18;
  }
  if (nearest <= 2) {
    return 12;
  }
  if (nearest <= 7) {
    return 7;
  }
  return 2;
}

function energyMatchScore(task, context) {
  const energy = context.energy || "medium";
  const effort = task.effort || "medium";

  const matrix = {
    low: { low: 12, medium: 4, high: -10 },
    medium: { low: 6, medium: 9, high: 4 },
    high: { low: 2, medium: 7, high: 12 }
  };

  return matrix[energy]?.[effort] ?? 0;
}

function freshnessScore(task, now) {
  if (!task.lastSuggestedAt) {
    return 5;
  }

  const ageInHours = (now - new Date(task.lastSuggestedAt)) / MS_PER_HOUR;

  if (ageInHours < 2) {
    return -8;
  }

  if (ageInHours < 8) {
    return -4;
  }

  return 0;
}

function backlogScore(task, now) {
  const createdAt = task.createdAt ? new Date(task.createdAt) : now;
  const ageInDays = Math.floor((now - createdAt) / MS_PER_DAY);

  if (ageInDays >= 14) {
    return 8;
  }

  if (ageInDays >= 7) {
    return 4;
  }

  return 0;
}

function learningScore(task, profile, context, durationBucket) {
  const learning = profile.learning;
  const slot = getTimeSlot(context.now);
  const categoryAffinity = learning.categoryAffinity[task.category] || 0;
  const durationAffinity = learning.durationAffinity[durationBucket] || 0;
  const effortAffinity = learning.effortAffinity[task.effort || "medium"] || 0;
  const slotAffinity = learning.timeAffinity[slot]?.[durationBucket] || 0;

  return (
    categoryAffinity * 8 +
    durationAffinity * 7 +
    effortAffinity * 5 +
    slotAffinity * 4
  );
}

function scoreTask(task, state, context = {}) {
  const now = context.now ? new Date(context.now) : new Date();

  if (task.status !== "open") {
    return {
      task,
      score: Number.NEGATIVE_INFINITY,
      detail: {}
    };
  }

  if (task.deferUntil) {
    const deferDate = new Date(task.deferUntil);
    if (Number.isFinite(deferDate.getTime()) && startOfDay(deferDate) > startOfDay(now)) {
      return {
        task,
        score: Number.NEGATIVE_INFINITY,
        detail: {}
      };
    }
  }

  const durationBucket = getDurationBucket(task.durationMins);
  const detail = {
    priority: PRIORITY_SCORES[task.priority] || PRIORITY_SCORES.medium,
    due: dueScore(task, now),
    energy: energyMatchScore(task, context),
    duration: DURATION_SCORES[durationBucket],
    scheduled: scheduledScore(task, now),
    goal: getGoalBoost(task, state, now),
    projectPressure: projectPressureScore(task, state, now),
    freshness: freshnessScore(task, now),
    backlog: backlogScore(task, now),
    learning: learningScore(task, state.profile, { ...context, now }, durationBucket)
  };
  const mlScore = Number(context.mlScoreByTask?.[task.id] || 0);
  const guardrail = detail.due >= 20 ? 5 : detail.energy < -6 ? -4 : 0;

  const score = Object.values(detail).reduce((sum, value) => sum + value, 0) + mlScore + guardrail;

  return {
    task,
    score,
    durationBucket,
    detail: {
      ...detail,
      ml: mlScore,
      guardrail
    }
  };
}

function buildReasons(task, scoredTask, context) {
  const reasons = [];
  const now = context.now ? new Date(context.now) : new Date();
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const distance = due
    ? Math.floor((startOfDay(due) - startOfDay(now)) / MS_PER_DAY)
    : null;

  if (distance !== null && distance < 0) {
    reasons.push("It is overdue, so finishing it will lower background stress fast.");
  } else if (distance === 0) {
    reasons.push("It is due today, which makes it the safest move for staying ahead.");
  } else if (distance === 1) {
    reasons.push("It lands tomorrow, so doing it now prevents a last-minute pileup.");
  }

  if (scoredTask.detail.energy >= 9) {
    reasons.push(`It matches your current ${context.energy || "medium"} energy pretty well.`);
  }

  if (scoredTask.detail.scheduled >= 10 && task.scheduledTime) {
    reasons.push(`You already parked time for it at ${task.scheduledTime}, so acting now reduces schedule drift.`);
  }

  if (scoredTask.detail.duration >= 12) {
    reasons.push("It is short enough to create momentum without feeling heavy.");
  } else if (scoredTask.durationBucket === "long") {
    reasons.push("You seem ready for a deeper block, so this is worth protecting time for.");
  }

  if (scoredTask.detail.learning >= 7) {
    reasons.push(`Your recent feedback says ${task.category || "this kind of work"} tends to land well.`);
  }

  if (scoredTask.detail.goal >= 7) {
    reasons.push("It connects directly to one of your active goals, so it carries more strategic weight.");
  }

  if (scoredTask.detail.backlog >= 4) {
    reasons.push("It has been hanging around long enough that clearing it could feel relieving.");
  }

  return reasons.slice(0, 3);
}

function buildCoachMessage(task, scoredTask, context) {
  const slot = getTimeSlot(context.now ? new Date(context.now) : new Date());
  const reasons = buildReasons(task, scoredTask, context);
  const lead = {
    morning: "Fresh start pick",
    afternoon: "Midday move",
    evening: "Gentle closeout"
  }[slot];

  const summary =
    reasons[0] ||
    "This looks like the strongest next step based on urgency, effort, and your recent feedback.";
  const style = context.suggestionStyle || "coach";

  if (style === "compact") {
    return `Do ${task.title} next. ${summary}`;
  }

  if (style === "directive") {
    return `Priority move: ${task.title}. ${summary}`;
  }

  if (style === "strategist") {
    return `Strategic move: ${task.title}. ${summary}`;
  }

  return `${lead}: ${task.title}. ${summary}`;
}

function sortByScoreDescending(a, b) {
  if (b.score !== a.score) {
    return b.score - a.score;
  }

  return new Date(a.task.createdAt) - new Date(b.task.createdAt);
}

function computeAdaptiveCapacity(state, context = {}) {
  const energy = context.energy || "medium";
  const focus = context.focus || "steady";
  const baseByEnergy = {
    low: 100,
    medium: 180,
    high: 280
  };
  const focusDelta = {
    locked_in: 35,
    steady: 0,
    scattered: -45
  };
  const recentFeedback = (state.feedback || []).slice(0, 25);
  const completed = recentFeedback.filter((entry) => entry.kind === "completed").length;
  const skipped = recentFeedback.filter((entry) => entry.kind === "skipped" || entry.kind === "not_helpful").length;
  const consistencySignal = completed - skipped;
  const learningDelta = clamp(consistencySignal * 6, -40, 40) * 2.5;
  let raw = (baseByEnergy[energy] || baseByEnergy.medium) + (focusDelta[focus] || 0) + learningDelta;

  const cal = context.calendar;
  if (cal && Number.isFinite(cal.busyMinutesToday) && cal.busyMinutesToday > 0 && !cal.error) {
    const dayMins = 8 * 60;
    const frac = Math.min(1, cal.busyMinutesToday / dayMins);
    raw *= 1 - 0.42 * frac;
  }

  return Math.max(70, Math.min(360, Math.round(raw)));
}

function slotLabel(index) {
  const slots = ["Deep focus", "Momentum block", "Light block", "Admin closeout", "Optional"];
  return slots[index] || `Block ${index + 1}`;
}

function suggestNextTask(state, context = {}) {
  const openTasks = state.tasks.filter((task) => task.status === "open");

  if (openTasks.length === 0) {
    return null;
  }

  const scored = openTasks
    .map((task) => scoreTask(task, state, context))
    .sort(sortByScoreDescending);

  const top = scored[0];

  return {
    task: top.task,
    score: Number(top.score.toFixed(2)),
    reasons: buildReasons(top.task, top, context),
    coachMessage: buildCoachMessage(top.task, top, context),
    alternatives: scored.slice(1, 4).map((entry) => ({
      id: entry.task.id,
      title: entry.task.title,
      score: Number(entry.score.toFixed(2))
    }))
  };
}

function buildDailyPlan(state, context = {}, count = 3) {
  const openTasks = state.tasks.filter((task) => task.status === "open");
  const adaptiveCapacityMins = computeAdaptiveCapacity(state, context);
  const highEffortCap = (context.energy || "medium") === "low" ? 1 : 2;
  let used = 0;
  let highEffortUsed = 0;

  return openTasks
    .map((task) => scoreTask(task, state, context))
    .sort(sortByScoreDescending)
    .filter((entry) => Number.isFinite(entry.score))
    .filter((entry) => {
      const duration = safeDuration(entry.task.durationMins);
      const wouldOverflow = used + duration > adaptiveCapacityMins;
      const highEffort = entry.task.effort === "high";
      const tooHeavy = highEffort && highEffortUsed >= highEffortCap;
      if (wouldOverflow || tooHeavy) {
        return false;
      }
      used += duration;
      if (highEffort) {
        highEffortUsed += 1;
      }
      return true;
    })
    .slice(0, count)
    .map((entry, index) => ({
      rank: index + 1,
      id: entry.task.id,
      title: entry.task.title,
      category: entry.task.category,
      durationMins: safeDuration(entry.task.durationMins),
      score: Number(entry.score.toFixed(2)),
      slot: slotLabel(index)
    }));
}

function recommendDeferrals(state, context = {}, options = {}) {
  const scale = Number(options.capacityScale);
  const capacityScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const now = context.now ? new Date(context.now) : new Date();
  const adaptiveCapacityMins = Math.round(computeAdaptiveCapacity(state, context) * capacityScale);
  const scored = (state.tasks || [])
    .filter((task) => task.status === "open")
    .map((task) => scoreTask(task, state, context))
    .filter((entry) => Number.isFinite(entry.score))
    .sort(sortByScoreDescending);
  const urgent = (task) => {
    if (!task.dueDate) {
      return false;
    }
    const distance = dateDistanceInDays(now, new Date(task.dueDate));
    return distance <= 1;
  };
  let used = 0;
  const keepIds = new Set();
  scored.forEach((entry) => {
    const duration = safeDuration(entry.task.durationMins);
    if (urgent(entry.task) || used + duration <= adaptiveCapacityMins) {
      keepIds.add(entry.task.id);
      used += duration;
    }
  });

  return scored
    .map((entry) => entry.task)
    .filter((task) => !keepIds.has(task.id) && !urgent(task))
    .slice(0, 4)
    .map((task) => task.id);
}

/**
 * Clear future deferUntil dates so tasks can surface again (e.g. after a high-energy check-in).
 * Does not touch tasks due today or tomorrow.
 */
function clearSoftDeferrals(state, context = {}) {
  const now = context.now ? new Date(context.now) : new Date();
  const today = startOfDay(now);
  const urgent = (task) => {
    if (!task.dueDate) {
      return false;
    }
    return dateDistanceInDays(now, new Date(task.dueDate)) <= 1;
  };

  (state.tasks || []).forEach((task) => {
    if (task.status !== "open" || !task.deferUntil || urgent(task)) {
      return;
    }
    const defDay = startOfDay(new Date(task.deferUntil));
    if (defDay > today) {
      task.deferUntil = null;
      task.updatedAt = new Date().toISOString();
    }
  });
}

function learnFromFeedback(profile, task, kind, context = {}) {
  const deltaMap = {
    helpful: 0.18,
    completed: 0.28,
    skipped: -0.14,
    not_helpful: -0.24
  };

  const delta = deltaMap[kind] || 0;
  const durationBucket = getDurationBucket(task.durationMins);
  const slot = getTimeSlot(context.at ? new Date(context.at) : new Date());
  const nextProfile = {
    ...profile,
    learning: {
      ...profile.learning,
      categoryAffinity: { ...profile.learning.categoryAffinity },
      durationAffinity: { ...profile.learning.durationAffinity },
      effortAffinity: { ...profile.learning.effortAffinity },
      timeAffinity: {
        morning: { ...profile.learning.timeAffinity.morning },
        afternoon: { ...profile.learning.timeAffinity.afternoon },
        evening: { ...profile.learning.timeAffinity.evening }
      },
      responsePatterns: { ...profile.learning.responsePatterns }
    }
  };

  nextProfile.learning.durationAffinity[durationBucket] = clamp(
    (nextProfile.learning.durationAffinity[durationBucket] || 0) + delta
  );
  nextProfile.learning.effortAffinity[task.effort || "medium"] = clamp(
    (nextProfile.learning.effortAffinity[task.effort || "medium"] || 0) + delta
  );
  nextProfile.learning.timeAffinity[slot][durationBucket] = clamp(
    (nextProfile.learning.timeAffinity[slot][durationBucket] || 0) + delta
  );

  if (task.category) {
    nextProfile.learning.categoryAffinity[task.category] = clamp(
      (nextProfile.learning.categoryAffinity[task.category] || 0) + delta
    );
  }

  if (kind === "not_helpful") {
    nextProfile.learning.responsePatterns.notHelpful += 1;
  } else {
    nextProfile.learning.responsePatterns[kind] += 1;
  }

  return nextProfile;
}

function learnFromConversation(profile, message, outcomeKind = "general") {
  const text = String(message || "").trim().toLowerCase();
  const nextProfile = {
    ...profile,
    learning: {
      ...profile.learning,
      chatPatterns: {
        concise: 0,
        direct: 0,
        builder: 0,
        planner: 0,
        ...(profile.learning.chatPatterns || {})
      },
      outputAffinity: {
        task: 0,
        plan: 0,
        doc: 0,
        research: 0,
        ...(profile.learning.outputAffinity || {})
      }
    }
  };

  const chatPatterns = nextProfile.learning.chatPatterns;
  const outputAffinity = nextProfile.learning.outputAffinity;
  const shortMessage = text.length > 0 && text.length <= 42;
  const buildy = /\b(build|create|make|write|draft|generate)\b/.test(text);
  const planny = /\b(plan|roadmap|launch|schedule|next step|strategy)\b/.test(text);
  const documenty = /\b(doc|document|brief|outline|proposal)\b/.test(text);
  const listy = /\b(to-?do|todo|task list|checklist|list)\b/.test(text);
  const researchy = /\b(research|compare|investigate|analyze)\b/.test(text);

  if (shortMessage) {
    chatPatterns.concise = clamp(chatPatterns.concise + 0.08);
  }

  if (buildy) {
    chatPatterns.builder = clamp(chatPatterns.builder + 0.14);
    chatPatterns.direct = clamp(chatPatterns.direct + 0.1);
  }

  if (planny) {
    chatPatterns.planner = clamp(chatPatterns.planner + 0.12);
    outputAffinity.plan = clamp(outputAffinity.plan + 0.14);
  }

  if (documenty) {
    outputAffinity.doc = clamp(outputAffinity.doc + 0.16);
  }

  if (listy) {
    outputAffinity.task = clamp(outputAffinity.task + 0.12);
    outputAffinity.plan = clamp(outputAffinity.plan + 0.06);
  }

  if (researchy) {
    outputAffinity.research = clamp(outputAffinity.research + 0.14);
  }

  if (outcomeKind && outputAffinity[outcomeKind] !== undefined) {
    outputAffinity[outcomeKind] = clamp(outputAffinity[outcomeKind] + 0.12);
  }

  return nextProfile;
}

function summarizeLearning(profile) {
  const insights = [];
  const categoryEntries = Object.entries(profile.learning.categoryAffinity).sort(
    (a, b) => b[1] - a[1]
  );
  const durationEntries = Object.entries(profile.learning.durationAffinity).sort(
    (a, b) => b[1] - a[1]
  );
  const chatPatterns = profile.learning.chatPatterns || {};
  const outputAffinity = profile.learning.outputAffinity || {};

  if (durationEntries[0] && durationEntries[0][1] > 0.1) {
    insights.push(`Buksy is leaning toward ${durationEntries[0][0]} tasks for your next wins.`);
  }

  if (categoryEntries[0] && categoryEntries[0][1] > 0.1) {
    insights.push(`You usually respond well to ${categoryEntries[0][0]} tasks.`);
  }

  if (categoryEntries.at(-1) && categoryEntries.at(-1)[1] < -0.25) {
    insights.push(
      `Buksy is becoming more cautious about pushing ${categoryEntries.at(-1)[0]} tasks at the wrong time.`
    );
  }

  if ((chatPatterns.builder || 0) > 0.3) {
    insights.push("You usually ask Buksy to build things directly, so it is leaning more proactive.");
  }

  if ((outputAffinity.doc || 0) > 0.25) {
    insights.push("Docs and structured outputs seem especially useful for you right now.");
  }

  if ((chatPatterns.concise || 0) > 0.2) {
    insights.push("Short direct replies are becoming the better fit for your flow.");
  }

  if (insights.length === 0) {
    insights.push("Buksy is still learning your rhythm, so each helpful or skip signal sharpens the next suggestion.");
  }

  return insights;
}

module.exports = {
  getDurationBucket,
  getTimeSlot,
  scoreTask,
  suggestNextTask,
  buildDailyPlan,
  computeAdaptiveCapacity,
  recommendDeferrals,
  clearSoftDeferrals,
  learnFromFeedback,
  learnFromConversation,
  summarizeLearning
};
