const fs = require("node:fs/promises");
const path = require("node:path");
const { getCurrentUserId } = require("./context");

const DATA_DIR = path.join(__dirname, "..", "data");
const EVENTS_FILE = path.join(DATA_DIR, "ml-events.jsonl");
const MODELS_FILE = path.join(DATA_DIR, "ml-models.json");

function getEventsFile() {
  const uid = getCurrentUserId();
  return uid ? path.join(DATA_DIR, `ml-events-${uid}.jsonl`) : EVENTS_FILE;
}

function getModelsFile() {
  const uid = getCurrentUserId();
  return uid ? path.join(DATA_DIR, `ml-models-${uid}.json`) : MODELS_FILE;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

async function ensureMlStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const ef = getEventsFile();
  const mf = getModelsFile();

  try {
    await fs.access(ef);
  } catch {
    await fs.writeFile(ef, "");
  }

  try {
    await fs.access(mf);
  } catch {
    await fs.writeFile(mf, JSON.stringify(createDefaultModelState(), null, 2));
  }
}

function createDefaultModelState() {
  return {
    updatedAt: new Date().toISOString(),
    stats: {
      totalEvents: 0,
      trainedAt: null
    },
    schedule: {
      weights: {
        duePressure: 0,
        projectPressure: 0,
        energyMatch: 0,
        focusMatch: 0,
        durationFit: 0,
        completionRate: 0
      },
      bias: 0
    },
    routing: {
      priors: {},
      tokenWeights: {}
    },
    generation: {
      outputAffinity: {
        task: 0,
        plan: 0,
        doc: 0,
        research: 0
      },
      styleAffinity: {
        concise: 0,
        detailed: 0,
        checklist: 0
      }
    },
    mysqlAuthPlan: {
      draftedAt: null,
      summary: ""
    }
  };
}

async function readModelState() {
  await ensureMlStore();
  try {
    const raw = await fs.readFile(getModelsFile(), "utf8");
    const parsed = JSON.parse(raw || "{}");
    return {
      ...createDefaultModelState(),
      ...parsed,
      schedule: {
        ...createDefaultModelState().schedule,
        ...(parsed.schedule || {}),
        weights: {
          ...createDefaultModelState().schedule.weights,
          ...(parsed.schedule?.weights || {})
        }
      },
      routing: {
        ...createDefaultModelState().routing,
        ...(parsed.routing || {})
      },
      generation: {
        ...createDefaultModelState().generation,
        ...(parsed.generation || {}),
        outputAffinity: {
          ...createDefaultModelState().generation.outputAffinity,
          ...(parsed.generation?.outputAffinity || {})
        },
        styleAffinity: {
          ...createDefaultModelState().generation.styleAffinity,
          ...(parsed.generation?.styleAffinity || {})
        }
      }
    };
  } catch {
    return createDefaultModelState();
  }
}

async function writeModelState(state) {
  const next = {
    ...createDefaultModelState(),
    ...state,
    updatedAt: new Date().toISOString()
  };
  await fs.writeFile(getModelsFile(), JSON.stringify(next, null, 2));
  return next;
}

async function appendMlEvent(event = {}) {
  await ensureMlStore();
  const row = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...event
  };
  await fs.appendFile(getEventsFile(), `${JSON.stringify(row)}\n`);
  return row;
}

async function readMlEvents(limit = 4000) {
  await ensureMlStore();
  const raw = await fs.readFile(getEventsFile(), "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const sliced = lines.slice(Math.max(0, lines.length - limit));
  return sliced
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .slice(0, 40);
}

function fitScheduleModel(events = []) {
  const examples = events.filter((entry) => entry.type === "schedule_example" && entry.features && typeof entry.label === "number");
  if (examples.length < 12) {
    return createDefaultModelState().schedule;
  }

  const featureKeys = ["duePressure", "projectPressure", "energyMatch", "focusMatch", "durationFit", "completionRate"];
  const pos = examples.filter((entry) => entry.label >= 0.5);
  const neg = examples.filter((entry) => entry.label < 0.5);
  const means = (rows, key) =>
    rows.length ? rows.reduce((sum, item) => sum + Number(item.features?.[key] || 0), 0) / rows.length : 0;
  const weights = {};
  featureKeys.forEach((key) => {
    const w = means(pos, key) - means(neg, key);
    weights[key] = Number(w.toFixed(4));
  });

  const posRate = pos.length / examples.length;
  const bias = Number((posRate - 0.5).toFixed(4));
  return { weights, bias };
}

function buildScheduleFeatures(task, state, context = {}) {
  const now = new Date(context.now || new Date().toISOString());
  const dueDistance = task.dueDate
    ? Math.floor((new Date(task.dueDate) - now) / (24 * 60 * 60 * 1000))
    : 21;
  const duePressure = clamp((7 - dueDistance) / 7, -1, 2);
  const projectDueDates = (state.goals || [])
    .filter((goal) => goal.projectId === task.projectId && goal.targetDate && goal.status !== "completed")
    .map((goal) => new Date(goal.targetDate));
  const projectNearest = projectDueDates.length
    ? Math.min(...projectDueDates.map((date) => Math.floor((date - now) / (24 * 60 * 60 * 1000))))
    : 30;
  const projectPressure = clamp((10 - projectNearest) / 10, -1, 2);
  const energy = context.energy || "medium";
  const focus = context.focus || "steady";
  const energyMatch = energy === "low"
    ? (task.effort === "low" ? 1 : task.effort === "medium" ? 0.2 : -1)
    : energy === "high"
      ? (task.effort === "high" ? 1 : 0.4)
      : (task.effort === "medium" ? 1 : 0.5);
  const focusMatch = focus === "scattered" ? (task.durationMins <= 30 ? 1 : -0.6) : 0.8;
  const durationFit = task.durationMins <= 30 ? 0.9 : task.durationMins <= 60 ? 0.5 : -0.2;
  const recentFeedback = (state.feedback || []).slice(0, 20);
  const completed = recentFeedback.filter((entry) => entry.kind === "completed").length;
  const skipped = recentFeedback.filter((entry) => entry.kind === "skipped" || entry.kind === "not_helpful").length;
  const completionRate = completed / Math.max(1, completed + skipped);
  return {
    duePressure,
    projectPressure,
    energyMatch,
    focusMatch,
    durationFit,
    completionRate
  };
}

function fitRoutingModel(events = []) {
  const samples = events.filter((entry) => entry.type === "chat_route_selected" && entry.text && entry.intent);
  const priors = {};
  const tokenWeights = {};

  samples.forEach((entry) => {
    priors[entry.intent] = (priors[entry.intent] || 0) + 1;
    tokenize(entry.text).forEach((token) => {
      tokenWeights[token] = tokenWeights[token] || {};
      tokenWeights[token][entry.intent] = (tokenWeights[token][entry.intent] || 0) + 1;
    });
  });

  return { priors, tokenWeights };
}

function fitGenerationModel(events = []) {
  const out = createDefaultModelState().generation;
  events.forEach((entry) => {
    if (entry.type === "generation_feedback") {
      const kind = entry.kind;
      const delta = kind === "accepted" ? 0.2 : kind === "edited" ? -0.05 : -0.18;
      const outputKind = entry.outputKind || "plan";
      if (out.outputAffinity[outputKind] === undefined) {
        out.outputAffinity[outputKind] = 0;
      }
      out.outputAffinity[outputKind] = clamp(out.outputAffinity[outputKind] + delta, -2.5, 2.5);
    }
    if (entry.type === "chat_style_signal") {
      const style = entry.style || "concise";
      if (out.styleAffinity[style] === undefined) {
        out.styleAffinity[style] = 0;
      }
      out.styleAffinity[style] = clamp(out.styleAffinity[style] + 0.08, -2.5, 2.5);
    }
  });
  return out;
}

async function retrainLocalModels() {
  const events = await readMlEvents();
  const current = await readModelState();
  const schedule = fitScheduleModel(events);
  const routing = fitRoutingModel(events);
  const generation = fitGenerationModel(events);
  const next = {
    ...current,
    stats: {
      totalEvents: events.length,
      trainedAt: new Date().toISOString()
    },
    schedule,
    routing,
    generation
  };
  await writeModelState(next);
  return next;
}

function scheduleMlScore(features = {}, modelState) {
  const model = modelState?.schedule || createDefaultModelState().schedule;
  const weights = model.weights || {};
  const raw = Object.entries(weights).reduce(
    (sum, [key, weight]) => sum + Number(weight || 0) * Number(features[key] || 0),
    Number(model.bias || 0)
  );
  return clamp(raw, -4, 4) * 6;
}

function predictRoute(text, modelState, intents = []) {
  const model = modelState?.routing || createDefaultModelState().routing;
  const options = intents.length ? intents : Object.keys(model.priors || {});
  if (!options.length) {
    return { intent: null, confidence: 0 };
  }
  const tokens = tokenize(text);
  const scores = {};
  const totalPrior = Object.values(model.priors || {}).reduce((sum, value) => sum + value, 0) || 1;
  options.forEach((intent) => {
    const prior = (model.priors?.[intent] || 1) / totalPrior;
    let score = Math.log(prior);
    tokens.forEach((token) => {
      const count = model.tokenWeights?.[token]?.[intent] || 0;
      score += Math.log((count + 1) / (model.priors?.[intent] || 1));
    });
    scores[intent] = score;
  });
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [bestIntent, bestScore] = ranked[0];
  const second = ranked[1]?.[1] ?? bestScore - 2;
  const confidence = clamp((bestScore - second) / 4, 0, 1);
  return { intent: bestIntent, confidence };
}

function rankGenerationCandidates(candidates = [], context = {}, modelState) {
  const model = modelState?.generation || createDefaultModelState().generation;
  const style = context.preferredStyle || "concise";
  const outputKind = context.outputKind || "plan";
  return candidates
    .map((candidate, index) => {
      const len = JSON.stringify(candidate || {}).length;
      const conciseBias = len < 1300 ? 0.2 : -0.05;
      const styleBoost = Number(model.styleAffinity?.[style] || 0) * 0.6;
      const outputBoost = Number(model.outputAffinity?.[outputKind] || 0) * 0.6;
      const score = styleBoost + outputBoost + conciseBias - index * 0.01;
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.candidate);
}

async function getMlMetrics() {
  const events = await readMlEvents();
  const modelState = await readModelState();
  const byType = {};
  events.forEach((event) => {
    byType[event.type] = (byType[event.type] || 0) + 1;
  });
  const completed = events.filter((event) => event.type === "task_completed").length;
  const skipped = events.filter((event) => event.type === "task_skipped").length;
  const deferRegret = events.filter((event) => event.type === "task_defer_regret").length;
  const routeCorrect = events.filter((event) => event.type === "chat_route_feedback" && event.correct === true).length;
  const routeWrong = events.filter((event) => event.type === "chat_route_feedback" && event.correct === false).length;
  return {
    events: {
      total: events.length,
      byType
    },
    schedule: {
      completionLiftProxy: completed - skipped,
      deferRegretRate: deferRegret / Math.max(1, events.filter((event) => event.type === "task_auto_deferred").length)
    },
    routing: {
      correctRate: routeCorrect / Math.max(1, routeCorrect + routeWrong)
    },
    model: {
      updatedAt: modelState.updatedAt,
      trainedAt: modelState.stats?.trainedAt || null
    }
  };
}

async function runShadowComparison(heuristicScore, mlFeatures) {
  const modelState = await readModelState();
  const ml = scheduleMlScore(mlFeatures, modelState);
  return {
    heuristicScore,
    mlScore: ml,
    delta: Number((ml - heuristicScore).toFixed(2)),
    mode: "shadow_only"
  };
}

async function setMysqlAuthPlan(summary) {
  const current = await readModelState();
  current.mysqlAuthPlan = {
    draftedAt: new Date().toISOString(),
    summary: String(summary || "").trim()
  };
  return writeModelState(current);
}

module.exports = {
  EVENTS_FILE,
  MODELS_FILE,
  getEventsFile,
  getModelsFile,
  appendMlEvent,
  readMlEvents,
  readModelState,
  writeModelState,
  retrainLocalModels,
  buildScheduleFeatures,
  scheduleMlScore,
  predictRoute,
  rankGenerationCandidates,
  getMlMetrics,
  runShadowComparison,
  setMysqlAuthPlan
};
