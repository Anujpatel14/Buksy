/**
 * Multi-Project Deadline Scheduler
 * 
 * Builds a day-by-day schedule across all projects and deadlines.
 * Handles carry-forward, auto-rebalancing, mood-adaptive capacity,
 * and cross-project priority interleaving.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function daysBetween(a, b) {
  return Math.ceil((startOfDay(b) - startOfDay(a)) / MS_PER_DAY);
}

function isWeekend(date) {
  const d = date.getDay();
  return d === 0 || d === 6;
}

const PRIORITY_WEIGHT = { high: 100, medium: 50, low: 20 };
const EFFORT_WEIGHT = { high: 1.3, medium: 1.0, low: 0.7 };

/**
 * Calculate daily capacity in minutes based on mood/energy/focus.
 */
function computeDailyCapacity(context, project) {
  const maxMins = (project?.maxHoursPerDay || 6) * 60;
  const energy = context.energy || "medium";
  const focus = context.focus || "steady";

  const energyFactor = { high: 1.0, medium: 0.75, low: 0.45 };
  const focusFactor = { locked_in: 1.1, steady: 1.0, scattered: 0.65 };

  const factor = (energyFactor[energy] || 0.75) * (focusFactor[focus] || 1.0);
  let cap = Math.round(maxMins * factor);
  const cal = context.calendar;
  if (cal && Number.isFinite(cal.busyMinutesToday) && cal.busyMinutesToday > 0 && !cal.error) {
    const dayMins = 8 * 60;
    const frac = Math.min(1, cal.busyMinutesToday / dayMins);
    cap = Math.max(30, Math.round(cap * (1 - 0.42 * frac)));
  }
  return cap;
}

/**
 * Score a task for scheduling priority.
 * Higher = should be scheduled earlier.
 */
function scheduleScore(task, now) {
  let score = PRIORITY_WEIGHT[task.priority] || 50;

  // Due date urgency
  if (task.dueDate) {
    const daysLeft = daysBetween(now, new Date(task.dueDate));
    if (daysLeft < 0) score += 200; // overdue
    else if (daysLeft === 0) score += 150; // due today
    else if (daysLeft === 1) score += 100; // due tomorrow
    else if (daysLeft <= 3) score += 60;
    else if (daysLeft <= 7) score += 30;
    else score += 10;
  }

  // Effort match: when energy is high, prefer high-effort tasks
  score += (EFFORT_WEIGHT[task.effort] || 1.0) * 10;

  // Shorter tasks get slight boost for momentum
  if (task.durationMins <= 25) score += 5;

  return score;
}

/**
 * Get the effective due date for a task, considering project deadline.
 */
function effectiveDueDate(task, projectMap) {
  if (task.dueDate) return task.dueDate;
  if (task.projectId && projectMap[task.projectId]?.dueDate) {
    return projectMap[task.projectId].dueDate;
  }
  return null;
}

/**
 * Build a full day-by-day schedule from today until all deadlines are met.
 * 
 * @param {Object} state - Full Buksy state
 * @param {Object} context - { energy, focus, now }
 * @returns {Object} - { days: [...], warnings: [...], atRisk: [...], summary: {} }
 */
function buildFullSchedule(state, context = {}) {
  const now = context.now ? new Date(context.now) : new Date();
  const today = startOfDay(now);

  // Build project lookup
  const projectMap = {};
  (state.projects || []).forEach(p => {
    projectMap[p.id] = p;
  });

  // Get all open tasks
  const openTasks = (state.tasks || [])
    .filter(t => t.status === "open")
    .map(t => ({
      ...t,
      _effectiveDue: effectiveDueDate(t, projectMap),
      _score: scheduleScore(t, today),
      _scheduledDate: null,
      _status: t.deferUntil && new Date(t.deferUntil) > today ? "deferred" : "pending"
    }));

  // Find the furthest deadline
  const allDueDates = [
    ...openTasks.filter(t => t._effectiveDue).map(t => new Date(t._effectiveDue)),
    ...(state.goals || []).filter(g => g.targetDate && g.status === "active").map(g => new Date(g.targetDate))
  ];
  const furthestDeadline = allDueDates.length > 0
    ? new Date(Math.max(...allDueDates.map(d => d.getTime())))
    : addDays(today, 14); // Default: 2 weeks ahead

  // Extend 2 days past the furthest deadline for buffer
  const endDate = addDays(furthestDeadline, 2);
  const totalDays = Math.max(7, daysBetween(today, endDate) + 1);

  // Build daily buckets
  const days = [];
  const taskAssignments = new Map(); // taskId -> date

  // Sort tasks: highest urgency first
  const sortedTasks = [...openTasks].sort((a, b) => {
    // First: tasks with due dates come before tasks without
    const aHasDue = a._effectiveDue ? 1 : 0;
    const bHasDue = b._effectiveDue ? 1 : 0;
    if (aHasDue !== bHasDue) return bHasDue - aHasDue;

    // Then by due date (earliest first)
    if (a._effectiveDue && b._effectiveDue) {
      const diff = new Date(a._effectiveDue) - new Date(b._effectiveDue);
      if (diff !== 0) return diff;
    }

    // Then by priority score
    return b._score - a._score;
  });

  // First pass: assign tasks to days
  for (let d = 0; d < totalDays; d++) {
    const dayDate = addDays(today, d);
    const dayStr = dateKey(dayDate);
    const isToday = d === 0;
    const weekend = isWeekend(dayDate);

    days.push({
      date: dayStr,
      dayOfWeek: dayDate.toLocaleDateString("en-US", { weekday: "short" }),
      isToday,
      isWeekend: weekend,
      capacityMins: isToday
        ? computeDailyCapacity(context, null)
        : computeDailyCapacity({ energy: "medium", focus: "steady" }, null),
      usedMins: 0,
      tasks: [],
      overloaded: false
    });
  }

  // Assign each task to the earliest possible day
  for (const task of sortedTasks) {
    if (task._status === "deferred") {
      const deferDate = dateKey(new Date(task.deferUntil));
      const dayIndex = days.findIndex(d => d.date >= deferDate);
      if (dayIndex >= 0) {
        assignTaskToDay(task, days, dayIndex);
        taskAssignments.set(task.id, days[dayIndex].date);
      }
      continue;
    }

    // Find the best day for this task
    let assigned = false;
    const dueStr = task._effectiveDue;
    const dueIndex = dueStr
      ? days.findIndex(d => d.date >= dueStr) - 1
      : days.length - 1;
    const latestDay = Math.max(0, Math.min(dueIndex, days.length - 1));

    // Try to assign as early as possible, but don't exceed daily capacity
    for (let d = 0; d <= latestDay && d < days.length; d++) {
      const day = days[d];
      if (day.usedMins + task.durationMins <= day.capacityMins) {
        assignTaskToDay(task, days, d);
        taskAssignments.set(task.id, day.date);
        assigned = true;
        break;
      }
    }

    // If couldn't fit before deadline, force-assign to the due date (or last possible day)
    if (!assigned) {
      const fallbackDay = Math.min(latestDay, days.length - 1);
      assignTaskToDay(task, days, Math.max(0, fallbackDay));
      taskAssignments.set(task.id, days[Math.max(0, fallbackDay)].date);
    }
  }

  // Mark overloaded days
  days.forEach(day => {
    day.overloaded = day.usedMins > day.capacityMins;
  });

  // Generate warnings
  const warnings = [];
  const atRisk = [];

  // Check for overloaded days
  const overloadedDays = days.filter(d => d.overloaded);
  if (overloadedDays.length > 0) {
    warnings.push(`${overloadedDays.length} day(s) exceed your daily capacity. Consider deferring lower-priority tasks.`);
  }

  // Check project deadline risks
  Object.values(projectMap).forEach(project => {
    if (!project.dueDate || project.status !== "active") return;
    const projectTasks = openTasks.filter(t => t.projectId === project.id);
    const totalMins = projectTasks.reduce((sum, t) => sum + t.durationMins, 0);
    const daysLeft = daysBetween(today, new Date(project.dueDate));
    const dailyNeeded = daysLeft > 0 ? totalMins / daysLeft : totalMins;

    if (dailyNeeded > 360) { // More than 6 hours/day needed
      atRisk.push({
        projectId: project.id,
        projectName: project.name,
        dueDate: project.dueDate,
        daysLeft,
        totalMinsRemaining: totalMins,
        reason: `Needs ${Math.round(dailyNeeded)} mins/day but capacity is limited. Consider extending deadline or reducing scope.`
      });
      warnings.push(`Project "${project.name}" is at risk: ${Math.round(totalMins / 60)} hours of work remaining with only ${daysLeft} days left.`);
    }
  });

  // Summary
  const summary = {
    totalOpenTasks: openTasks.length,
    scheduledDays: days.filter(d => d.tasks.length > 0).length,
    totalScheduledMins: days.reduce((sum, d) => sum + d.usedMins, 0),
    overloadedDays: overloadedDays.length,
    atRiskProjects: atRisk.length,
    furthestDeadline: dateKey(furthestDeadline)
  };

  return { days, warnings, atRisk, summary };
}

function assignTaskToDay(task, days, dayIndex) {
  const day = days[dayIndex];
  day.tasks.push({
    id: task.id,
    title: task.title,
    projectId: task.projectId,
    projectName: task._projectName || "",
    priority: task.priority,
    effort: task.effort,
    category: task.category,
    durationMins: task.durationMins,
    dueDate: task._effectiveDue,
    status: "pending",
    notes: task.notes || "",
    goalId: task.goalId || null
  });
  day.usedMins += task.durationMins;
}

/**
 * Carry a task forward to a target date and rebalance the remaining schedule.
 * 
 * @param {Object} state - Full Buksy state
 * @param {string} taskId - Task to carry forward
 * @param {string} targetDate - Date to move to (YYYY-MM-DD)
 * @param {Object} context - Current mood/energy context
 * @returns {Object} - { movedTask, rebalancedCount, newSchedule }
 */
function carryForwardTask(state, taskId, targetDate, context = {}) {
  const task = (state.tasks || []).find(t => t.id === taskId);
  if (!task) return { error: "Task not found" };

  // Set defer date
  task.deferUntil = targetDate;
  task.updatedAt = new Date().toISOString();

  // Rebuild the full schedule with the deferral
  const newSchedule = buildFullSchedule(state, context);

  // Count how many tasks shifted as a result
  const rebalancedCount = newSchedule.days
    .filter(d => d.overloaded)
    .reduce((sum, d) => sum + d.tasks.length, 0);

  return {
    movedTask: { id: task.id, title: task.title, newDate: targetDate },
    rebalancedCount,
    newSchedule
  };
}

/**
 * Auto-rebalance the schedule after changes (carry-forward, mood change, etc).
 * Tries to move tasks from overloaded days to earlier available slots.
 */
function rebalanceSchedule(state, context = {}) {
  const schedule = buildFullSchedule(state, context);

  const movedTasks = [];

  // For each overloaded day, try to move lowest-priority tasks to earlier/later days
  for (let d = 0; d < schedule.days.length; d++) {
    const day = schedule.days[d];
    if (!day.overloaded) continue;

    // Sort tasks by priority (lowest first - those get moved)
    const sortedTasks = [...day.tasks].sort((a, b) =>
      (PRIORITY_WEIGHT[a.priority] || 50) - (PRIORITY_WEIGHT[b.priority] || 50)
    );

    while (day.usedMins > day.capacityMins && sortedTasks.length > 1) {
      const movable = sortedTasks.shift();
      // Don't move overdue or due-today tasks
      if (movable.dueDate) {
        const daysLeft = daysBetween(new Date(day.date), new Date(movable.dueDate));
        if (daysLeft <= 0) continue;
      }

      // Find next available day
      for (let target = d + 1; target < schedule.days.length; target++) {
        const targetDay = schedule.days[target];
        if (targetDay.usedMins + movable.durationMins <= targetDay.capacityMins) {
          // Move the task
          const idx = day.tasks.findIndex(t => t.id === movable.id);
          if (idx >= 0) {
            day.tasks.splice(idx, 1);
            day.usedMins -= movable.durationMins;
            targetDay.tasks.push(movable);
            targetDay.usedMins += movable.durationMins;
            movedTasks.push({
              taskId: movable.id,
              title: movable.title,
              from: day.date,
              to: targetDay.date
            });
          }
          break;
        }
      }
    }

    day.overloaded = day.usedMins > day.capacityMins;
  }

  return { schedule, movedTasks };
}

/**
 * Get today's task list, mood-adjusted.
 */
function getTodaySchedule(state, context = {}) {
  const schedule = buildFullSchedule(state, context);
  const todayDay = schedule.days.find(d => d.isToday);
  return {
    date: todayDay?.date || dateKey(new Date()),
    capacityMins: todayDay?.capacityMins || 360,
    usedMins: todayDay?.usedMins || 0,
    tasks: todayDay?.tasks || [],
    overloaded: todayDay?.overloaded || false,
    moodAdjusted: context.energy !== "medium" || context.focus !== "steady"
  };
}

module.exports = {
  buildFullSchedule,
  carryForwardTask,
  rebalanceSchedule,
  getTodaySchedule,
  computeDailyCapacity,
  dateKey,
  addDays,
  daysBetween
};
