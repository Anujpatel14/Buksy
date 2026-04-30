const DEFAULT_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "qwen3";
const DEFAULT_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 12000);

const ROUTE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "intent",
    "confidence",
    "title",
    "prompt",
    "targetDays",
    "availableMinutes",
    "optionA",
    "optionB",
    "reply",
    "reason"
  ],
  properties: {
    intent: {
      type: "string",
      enum: [
        "build_document",
        "build_todo",
        "add_task",
        "create_goal",
        "research",
        "draft_reply",
        "suggest_next",
        "solve_constraints",
        "compare_options",
        "status_overview",
        "answer"
      ]
    },
    confidence: {
      type: "number"
    },
    title: {
      type: "string"
    },
    prompt: {
      type: "string"
    },
    targetDays: {
      type: "integer"
    },
    availableMinutes: {
      type: "integer"
    },
    optionA: {
      type: "string"
    },
    optionB: {
      type: "string"
    },
    reply: {
      type: "string"
    },
    reason: {
      type: "string"
    }
  }
};

const SUPPORTED_VOICE_ACTIONS = [
  "create_task",
  "update_task",
  "delete_task",
  "mark_done",
  "schedule_task",
  "reschedule_task",
  "plan_day",
  "rebalance_schedule",
  "create_goal",
  "update_goal",
  "generate_doc",
  "generate_todo_list",
  "query_memory",
  "analyze_project",
  "run_workflow",
  "suggest_next_step",
  "simulate_outcome",
  "decision_analysis"
];

const VOICE_PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["response", "actions", "requires_confirmation"],
  properties: {
    response: {
      type: "string"
    },
    requires_confirmation: {
      type: "boolean"
    },
    actions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "parameters"],
        properties: {
          type: {
            type: "string",
            enum: SUPPORTED_VOICE_ACTIONS
          },
          parameters: {
            type: "object"
          }
        }
      }
    }
  }
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeBaseUrl(value) {
  const raw = String(value || DEFAULT_BASE_URL).trim().replace(/\/+$/, "");

  if (!raw) {
    return DEFAULT_BASE_URL;
  }

  try {
    const url = new URL(raw.includes("://") ? raw : `http://${raw}`);
    return `${url.protocol}//${url.host}`;
  } catch (error) {
    return DEFAULT_BASE_URL;
  }
}

function normalizeOllamaSettings(input = {}) {
  return {
    provider: "ollama",
    enabled: input.enabled !== false,
    useForRouting: input.useForRouting !== false,
    useForReplies: input.useForReplies !== false,
    baseUrl: normalizeBaseUrl(input.baseUrl),
    model: String(input.model || DEFAULT_MODEL).trim() || DEFAULT_MODEL,
    timeoutMs: clamp(Number(input.timeoutMs) || DEFAULT_TIMEOUT_MS, 2000, 60000)
  };
}

function createDefaultOllamaSettings() {
  return normalizeOllamaSettings({});
}

function extractErrorMessage(error) {
  if (error?.name === "AbortError") {
    return "Timed out while waiting for Ollama.";
  }

  if (error?.cause?.code === "ECONNREFUSED") {
    return "Ollama is not accepting connections yet.";
  }

  return error?.message || "Could not reach Ollama.";
}

async function requestOllama(pathname, { method = "GET", settings = {}, body = null, timeoutMs } = {}) {
  const resolved = normalizeOllamaSettings(settings);
  const response = await fetch(`${resolved.baseUrl}${pathname}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeoutMs || resolved.timeoutMs)
  });

  const text = await response.text();
  let parsed = null;

  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      parsed = null;
    }
  }

  if (!response.ok) {
    const message = parsed?.error || parsed?.message || text || "Ollama request failed.";
    const requestError = new Error(message);
    requestError.statusCode = response.status;
    throw requestError;
  }

  return parsed || {};
}

async function chatWithOllama({ messages, settings = {}, format, temperature = 0.2 }) {
  const resolved = normalizeOllamaSettings(settings);

  return requestOllama("/api/chat", {
    method: "POST",
    settings: resolved,
    body: {
      model: resolved.model,
      messages,
      format,
      stream: false,
      keep_alive: "5m",
      options: {
        temperature
      }
    }
  });
}

function parseModelList(payload = {}) {
  return Array.isArray(payload.models)
    ? payload.models.map((model) => ({
        name: model.name || model.model || "unknown",
        family: model.details?.family || model.details?.families?.[0] || "",
        parameterSize: model.details?.parameter_size || "",
        modifiedAt: model.modified_at || null
      }))
    : [];
}

async function getOllamaStatus(settings = {}) {
  const resolved = normalizeOllamaSettings(settings);

  try {
    const payload = await requestOllama("/api/tags", {
      method: "GET",
      settings: resolved,
      timeoutMs: Math.min(resolved.timeoutMs, 2500)
    });
    const availableModels = parseModelList(payload);
    const selectedInstalled = availableModels.some((model) => model.name === resolved.model);
    const message = selectedInstalled
      ? `Connected. Buksy is ready to use ${resolved.model}.`
      : availableModels.length
        ? `Connected, but ${resolved.model} is not installed. Pick one of your local models or pull it.`
        : "Connected to Ollama, but there are no local models yet.";

    return {
      ...resolved,
      connected: true,
      selectedInstalled,
      availableModels,
      message
    };
  } catch (error) {
    return {
      ...resolved,
      connected: false,
      selectedInstalled: false,
      availableModels: [],
      error: extractErrorMessage(error),
      message: `Buksy can't reach Ollama at ${resolved.baseUrl} yet.`
    };
  }
}

function safeJsonParse(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch (nestedError) {
        return null;
      }
    }

    return null;
  }
}

async function planChatAction(message, context, settings = {}) {
  const response = await chatWithOllama({
    settings,
    temperature: 0,
    format: ROUTE_SCHEMA,
    messages: [
      {
        role: "system",
        content:
          "You are Buksy's routing brain. Return JSON only. " +
          "Choose build_document for docs, launch plans, roadmaps, briefs, proposals, or outlines. " +
          "Choose build_todo for checklists, task lists, or when the user wants something broken into steps. " +
          "Choose add_task for one task to remember. Choose create_goal for a target over days or weeks. " +
          "Choose research for investigation. Choose draft_reply for email, message, negotiation, or wording help. " +
          "Choose suggest_next for next-step guidance. Choose solve_constraints when time, energy, or fitting work into a window is the point. " +
          "Choose compare_options for option A versus option B. Choose status_overview for summaries of progress. " +
          "Use answer only for general conversation or advice."
      },
      {
        role: "user",
        content: `Workspace snapshot:\n${context}\n\nUser message:\n${message}`
      }
    ]
  });

  const route = safeJsonParse(response?.message?.content || "");

  if (!route) {
    return null;
  }

  return {
    intent: route.intent || "answer",
    confidence: Number(route.confidence) || 0,
    title: String(route.title || "").trim(),
    prompt: String(route.prompt || "").trim(),
    targetDays: Math.max(0, Number(route.targetDays) || 0),
    availableMinutes: Math.max(0, Number(route.availableMinutes) || 0),
    optionA: String(route.optionA || "").trim(),
    optionB: String(route.optionB || "").trim(),
    reply: String(route.reply || "").trim(),
    reason: String(route.reason || "").trim()
  };
}

async function generateBuddyReply(message, context, style, settings = {}) {
  const response = await chatWithOllama({
    settings,
    temperature: 0.35,
    messages: [
      {
        role: "system",
        content:
          "You are Buksy, a warm but practical AI buddy for daily work and life. " +
          "Be concise, action-oriented, and easy to understand. " +
          "Do not claim you completed an action unless the app already did it. " +
          `Current response style: ${style}.`
      },
      {
        role: "user",
        content: `Workspace snapshot:\n${context}\n\nMessage:\n${message}`
      }
    ]
  });

  return String(response?.message?.content || "").trim();
}

function normalizeVoicePlan(plan) {
  if (!plan || typeof plan !== "object") {
    return null;
  }

  const actions = Array.isArray(plan.actions)
    ? plan.actions
        .map((action) => ({
          type: SUPPORTED_VOICE_ACTIONS.includes(String(action?.type || "").trim())
            ? String(action.type).trim()
            : "",
          parameters: action?.parameters && typeof action.parameters === "object" && !Array.isArray(action.parameters)
            ? action.parameters
            : {}
        }))
        .filter((action) => action.type)
    : [];

  return {
    response: String(plan.response || "").trim(),
    actions,
    requires_confirmation: plan.requires_confirmation === true
  };
}

async function planVoiceCommand(message, context, settings = {}) {
  const prompts = [
    "You are Buksy, a fully autonomous AI-powered Personal Operating System. " +
      "You are voice-first, context-aware, and execution-focused. Return JSON only. " +
      "Understand incomplete or conversational speech. Convert the user's request into short voice-friendly response text plus a list of actions. " +
      "Break complex requests into multiple actions. Ask a short clarifying question in response and return no actions if the request is too vague. " +
      "Use current tasks, goals, mood, energy, focus, recent conversation, and calendar context to prioritize. " +
      "Prefer lighter work when energy is low. Prioritize urgency when deadlines are near. " +
      "Set requires_confirmation true for deleting tasks, major rescheduling, or other irreversible actions.",
    "Return valid JSON only. Do not include markdown or explanation outside the JSON object."
  ];

  for (let attempt = 0; attempt < prompts.length; attempt += 1) {
    const response = await chatWithOllama({
      settings,
      temperature: 0.25,
      format: VOICE_PLAN_SCHEMA,
      messages: [
        {
          role: "system",
          content: prompts[attempt]
        },
        {
          role: "user",
          content:
            `Current context:\n${context}\n\n` +
            `Supported actions:\n${SUPPORTED_VOICE_ACTIONS.join(", ")}\n\n` +
            `Voice command:\n${message}`
        }
      ]
    });

    const parsed = normalizeVoicePlan(safeJsonParse(response?.message?.content || ""));
    if (parsed && (parsed.response || parsed.actions.length > 0)) {
      return {
        ...parsed,
        response: parsed.response || "I understood the command."
      };
    }
  }

  return null;
}

module.exports = {
  DEFAULT_BASE_URL,
  DEFAULT_MODEL,
  SUPPORTED_VOICE_ACTIONS,
  createDefaultOllamaSettings,
  normalizeOllamaSettings,
  getOllamaStatus,
  planChatAction,
  generateBuddyReply,
  planVoiceCommand
};
