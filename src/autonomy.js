const { buildNegotiationAssist } = require("./strategy");
const {
  buildActionHubResult,
  buildStructuredDocument,
  buildTodoList,
  runMultiAgentAnalysis
} = require("./workbench");
const { buildFullSchedule } = require("./scheduler");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function safeLower(value) {
  return String(value || "").trim().toLowerCase();
}

function createDefaultPlugins() {
  return {
    gmail: {
      enabled: true,
      connected: false,
      mode: "draft_only"
    },
    googleCalendar: {
      enabled: true,
      connected: false,
      writable: false
    },
    github: {
      enabled: true,
      connected: false
    },
    notion: {
      enabled: true,
      connected: false
    },
    jira: {
      enabled: true,
      connected: false
    },
    slack: {
      enabled: false,
      connected: false
    },
    stripe: {
      enabled: false,
      connected: false
    },
    docs: {
      enabled: true,
      connected: false
    },
    spreadsheets: {
      enabled: true,
      connected: false
    },
    crm: {
      enabled: false,
      connected: false
    },
    webhook: {
      enabled: false,
      connected: false,
      url: ""
    }
  };
}

function normalizePlugins(input = {}) {
  const defaults = createDefaultPlugins();
  const next = {};

  Object.keys(defaults).forEach((key) => {
    next[key] = {
      ...defaults[key],
      ...((input && input[key]) || {})
    };
  });

  return next;
}

function buildPluginCatalog(state) {
  const configured = normalizePlugins(state.profile?.plugins || {});
  const integrations = state.profile?.integrations || {};

  return [
    {
      id: "gmail",
      name: "Gmail",
      category: "communication",
      connected: Boolean(configured.gmail.connected),
      mode: configured.gmail.mode || "draft_only",
      capabilities: ["draft follow-up emails", "queue outbound messages", "send with confirmation"],
      statusCopy: configured.gmail.connected
        ? "Ready for email drafting and outbound execution."
        : "Not connected yet. Buksy will draft locally until Gmail is connected."
    },
    {
      id: "googleCalendar",
      name: "Google Calendar",
      category: "calendar",
      connected: Boolean(integrations.googleCalendar?.accessToken || configured.googleCalendar.connected),
      mode: configured.googleCalendar.writable ? "write" : "read",
      capabilities: ["read busy time", "propose meeting slots", "book meetings when write access exists"],
      statusCopy:
        configured.googleCalendar.writable
          ? "Writable calendar mode is enabled."
          : "Read-only free/busy mode is active."
    },
    {
      id: "github",
      name: "GitHub",
      category: "developer",
      connected: Boolean(integrations.github?.token),
      mode: integrations.github?.authMethod || "pat",
      capabilities: ["inspect repos", "surface PR pressure", "create dev tasks"],
      statusCopy: integrations.github?.token
        ? "GitHub is connected and can power developer mode."
        : "Connect GitHub to enable developer mode."
    },
    {
      id: "jira",
      name: "Jira",
      category: "project",
      connected: Boolean(integrations.jira?.apiToken),
      mode: integrations.jira?.enabled ? "connected" : "inactive",
      capabilities: ["sync issues", "create Buksy tasks", "keep board pressure visible"],
      statusCopy: integrations.jira?.apiToken ? "Jira task sync is available." : "Connect Jira to sync board work."
    },
    {
      id: "notion",
      name: "Notion",
      category: "knowledge",
      connected: Boolean(integrations.notion?.token),
      mode: integrations.notion?.authMethod || "token",
      capabilities: ["import databases", "turn pages into tasks", "store project memory"],
      statusCopy: integrations.notion?.token ? "Notion import is available." : "Connect Notion to extend Buksy memory."
    },
    {
      id: "docs",
      name: "Docs",
      category: "documents",
      connected: Boolean(configured.docs.enabled),
      mode: "local",
      capabilities: ["create structured docs", "store action plans", "prepare launch briefs"],
      statusCopy: "Buksy can build and save structured documents locally."
    },
    {
      id: "spreadsheets",
      name: "Spreadsheets",
      category: "operations",
      connected: Boolean(configured.spreadsheets.enabled),
      mode: "local",
      capabilities: ["prepare invoice tables", "draft spreadsheet structures", "build trackers"],
      statusCopy: "Buksy can prepare spreadsheet-ready structures locally."
    },
    {
      id: "crm",
      name: "CRM",
      category: "sales",
      connected: Boolean(configured.crm.connected),
      mode: configured.crm.connected ? "connected" : "planned",
      capabilities: ["prepare CRM update packs", "queue lead updates", "summarize account state"],
      statusCopy: configured.crm.connected ? "CRM updates are ready to run." : "CRM control is staged as a local planning layer until connected."
    },
    {
      id: "webhook",
      name: "Webhook",
      category: "automation",
      connected: Boolean(configured.webhook.url),
      mode: configured.webhook.url ? "configured" : "inactive",
      capabilities: ["trigger external workflows", "bridge to Slack or custom tools", "lightweight plugin hooks"],
      statusCopy: configured.webhook.url ? "Webhook plugin is configured." : "Set a webhook URL to enable external triggers."
    }
  ];
}

function inferActionType(prompt) {
  const lower = safeLower(prompt);

  if (/\b(schedule|book|meeting|calendar)\b/.test(lower)) {
    return "schedule_meeting";
  }
  if (/\b(send|email|follow-up|follow up|reply)\b/.test(lower)) {
    return "draft_follow_up_email";
  }
  if (/\b(invoice)\b/.test(lower)) {
    return "invoice_pack";
  }
  if (/\b(crm|lead|pipeline|account)\b/.test(lower)) {
    return "update_crm";
  }
  if (/\b(sheet|spreadsheet|tracker)\b/.test(lower)) {
    return "build_spreadsheet";
  }
  if (/\b(doc|document|brief|proposal|plan)\b/.test(lower)) {
    return "build_document";
  }
  if (/\b(todo|to do|list|checklist|tasks)\b/.test(lower)) {
    return "build_todo";
  }
  if (/\b(github|pull request|pr|repo)\b/.test(lower)) {
    return "github_sync";
  }
  if (/\b(workflow|automation)\b/.test(lower)) {
    return "run_workflow";
  }

  return "general_assist";
}

function buildExecutionPlan(input = {}, state) {
  const prompt = String(input.prompt || input.message || "").trim();
  const actionType = safeLower(input.actionType) || inferActionType(prompt);
  const plugins = buildPluginCatalog(state);
  const pluginById = Object.fromEntries(plugins.map((plugin) => [plugin.id, plugin]));

  if (actionType === "schedule_meeting") {
    const calendarPlugin = pluginById.googleCalendar;
    return {
      title: "Schedule meeting",
      actionType,
      requiresConfirmation: true,
      pluginId: "googleCalendar",
      prompt,
      preview: {
        summary: calendarPlugin.connected
          ? "Buksy will propose slots from your current schedule and calendar hints."
          : "Buksy will propose slots locally. Calendar booking will need Google Calendar write access.",
        steps: [
          "Check current busy load and preferred hours.",
          "Propose the best meeting slots.",
          "Book the slot if a writable calendar plugin is available."
        ]
      }
    };
  }

  if (actionType === "draft_follow_up_email") {
    return {
      title: "Follow-up email",
      actionType,
      requiresConfirmation: true,
      pluginId: "gmail",
      prompt,
      preview: {
        summary: "Buksy will draft the follow-up and queue it for sending.",
        steps: [
          "Draft a strong follow-up message.",
          "Show the final send preview.",
          "Send through Gmail if connected, or save the draft locally."
        ]
      }
    };
  }

  if (actionType === "invoice_pack") {
    return {
      title: "Invoice and follow-up pack",
      actionType,
      requiresConfirmation: true,
      pluginId: "gmail",
      prompt,
      preview: {
        summary: "Buksy will prepare an invoice pack and follow-up email draft.",
        steps: [
          "Build invoice structure.",
          "Draft the follow-up email.",
          "Queue both in the execution center."
        ]
      }
    };
  }

  if (actionType === "github_sync") {
    return {
      title: "GitHub developer sync",
      actionType,
      requiresConfirmation: true,
      pluginId: "github",
      prompt,
      preview: {
        summary: "Buksy will inspect tracked GitHub work and create actionable tasks for PRs and repo pressure.",
        steps: [
          "Check tracked repositories.",
          "Identify open PR and stale repo pressure.",
          "Create dev-focused Buksy tasks."
        ]
      }
    };
  }

  if (actionType === "build_document") {
    return {
      title: "Build document",
      actionType,
      requiresConfirmation: true,
      pluginId: "docs",
      prompt,
      preview: {
        summary: "Buksy will create a structured document artifact.",
        steps: ["Generate the document", "Save it in memory", "Show it in the action stream"]
      }
    };
  }

  if (actionType === "build_spreadsheet") {
    return {
      title: "Build spreadsheet pack",
      actionType,
      requiresConfirmation: true,
      pluginId: "spreadsheets",
      prompt,
      preview: {
        summary: "Buksy will prepare a spreadsheet-ready structure for the request.",
        steps: ["Extract the rows and columns", "Build formulas or summary notes", "Save the pack in Buksy"]
      }
    };
  }

  if (actionType === "update_crm") {
    return {
      title: "Prepare CRM update",
      actionType,
      requiresConfirmation: true,
      pluginId: "crm",
      prompt,
      preview: {
        summary: "Buksy will prepare a CRM-ready update packet and queue it for review.",
        steps: ["Summarize account change", "Prepare next action notes", "Queue the update for approval"]
      }
    };
  }

  if (actionType === "build_todo") {
    return {
      title: "Build to-do list",
      actionType,
      requiresConfirmation: true,
      pluginId: "local",
      prompt,
      preview: {
        summary: "Buksy will turn the request into a task list and optionally add the tasks.",
        steps: ["Generate the task list", "Add tasks to Buksy", "Save the plan artifact"]
      }
    };
  }

  return {
    title: "General action",
    actionType,
    requiresConfirmation: true,
    pluginId: "local",
    prompt,
    preview: {
      summary: "Buksy will interpret the request into the best local action flow.",
      steps: ["Understand the request", "Build the output", "Save the result"]
    }
  };
}

function findScheduleSlots(state, context = {}, durationMins = 30) {
  const schedule = buildFullSchedule(state, context);
  const slots = [];

  for (const day of schedule.days.slice(0, 7)) {
    const remaining = Math.max(0, Number(day.capacityMins || 0) - Number(day.usedMins || 0));
    if (remaining < durationMins) {
      continue;
    }
    const startHour = day.isToday ? 14 : 10;
    const start = `${String(startHour).padStart(2, "0")}:00`;
    slots.push({
      date: day.date,
      start,
      durationMins,
      confidence: day.overloaded ? "medium" : "high"
    });
  }

  return slots.slice(0, 4);
}

function buildAutomationRule(input = {}) {
  const title = String(input.title || input.prompt || "Untitled automation").trim();
  const trigger = safeLower(input.trigger || input.template || "task_overdue");
  const enabled = input.enabled !== false;
  const actionText = String(input.actions || input.prompt || "").trim();
  const parsedActions = actionText
    ? actionText.split(/[,.;]\s+/).map((step) => step.trim()).filter(Boolean)
    : [];

  const templates = {
    task_overdue: {
      title: title || "Overdue task autopilot",
      description: "If a task becomes overdue, Buksy can reschedule it, lower optional priority, and notify you.",
      actions: parsedActions.length ? parsedActions : ["carry forward the task by 1 day", "notify me in the dashboard", "reduce priority if it is low-value"],
      triggerLabel: "When a task becomes overdue"
    },
    low_energy: {
      title: title || "Low energy recovery mode",
      description: "When you check in with low energy, Buksy can shrink the day automatically.",
      actions: parsedActions.length ? parsedActions : ["defer deep tasks", "surface 3 easy wins", "keep only critical due work"],
      triggerLabel: "When the latest check-in says low energy"
    },
    developer_pr: {
      title: title || "Developer PR mode",
      description: "When GitHub PR pressure rises, Buksy can create dev tasks and rebalance the schedule.",
      actions: parsedActions.length ? parsedActions : ["create review tasks", "flag stale PRs", "shift less important tasks to tomorrow"],
      triggerLabel: "When open PRs or stale repos need attention"
    }
  };

  const template = templates[trigger] || templates.task_overdue;

  return {
    title: template.title,
    description: template.description,
    type: "automation",
    trigger,
    triggerLabel: template.triggerLabel,
    actions: template.actions,
    steps: template.actions,
    status: enabled ? "active" : "draft",
    safeguards: [
      "Keep one human confirmation point for external actions.",
      "Log the automation result so Buksy can learn from it."
    ]
  };
}

function evaluateAutomationRules(state, context = {}) {
  const workflows = (state.workflows || []).filter((workflow) =>
    workflow.type === "automation" || ["task_overdue", "low_energy", "developer_pr"].includes(safeLower(workflow.trigger))
  );
  const latestCheckin = state.checkins?.[0];
  const overdueTasks = (state.tasks || []).filter((task) => task.status === "open" && task.dueDate && new Date(task.dueDate) < new Date(context.now || new Date().toISOString()));
  const suggestions = [];

  workflows.forEach((workflow) => {
    const trigger = safeLower(workflow.trigger);

    if (trigger === "task_overdue" && overdueTasks.length) {
      suggestions.push({
        workflowId: workflow.id,
        title: workflow.title,
        trigger: workflow.trigger,
        matches: overdueTasks.slice(0, 4).map((task) => task.title),
        recommendedActions: workflow.actions?.length ? workflow.actions : workflow.steps || []
      });
    }

    if (trigger === "low_energy" && latestCheckin?.energy === "low") {
      suggestions.push({
        workflowId: workflow.id,
        title: workflow.title,
        trigger: workflow.trigger,
        matches: ["Latest check-in is low energy"],
        recommendedActions: workflow.actions?.length ? workflow.actions : workflow.steps || []
      });
    }

    if (trigger === "developer_pr" && state.profile?.integrations?.github?.token) {
      suggestions.push({
        workflowId: workflow.id,
        title: workflow.title,
        trigger: workflow.trigger,
        matches: ["GitHub developer mode is connected"],
        recommendedActions: workflow.actions?.length ? workflow.actions : workflow.steps || []
      });
    }
  });

  return suggestions.slice(0, 8);
}

function executePlannedAction(plan, state, context = {}) {
  const prompt = plan.prompt || plan.title;

  if (plan.actionType === "draft_follow_up_email") {
    const draft = buildNegotiationAssist({
      scenario: prompt,
      tone: "warm",
      desiredOutcome: "move the conversation forward clearly"
    });

    return {
      summary: "Follow-up email drafted.",
      artifact: {
        kind: "negotiation",
        title: "Autonomous follow-up email",
        payload: {
          delivery: "draft_only",
          draft,
          pluginId: plan.pluginId
        },
        category: "communication"
      },
      completed: true
    };
  }

  if (plan.actionType === "schedule_meeting") {
    const slots = findScheduleSlots(state, context, Number(plan.durationMins || 30));

    return {
      summary: "Meeting slots prepared.",
      artifact: {
        kind: "meeting-plan",
        title: "Meeting scheduling plan",
        payload: {
          prompt,
          slots,
          note: "Buksy proposed the strongest slots. Booking requires a writable calendar connector."
        },
        category: "calendar"
      },
      completed: true
    };
  }

  if (plan.actionType === "invoice_pack") {
    const pack = buildActionHubResult({
      actionType: "invoice_email",
      prompt
    });

    return {
      summary: "Invoice pack created.",
      artifact: {
        kind: "action-pack",
        title: pack.title,
        payload: pack,
        category: "operations"
      },
      completed: true
    };
  }

  if (plan.actionType === "build_document") {
    const document = buildStructuredDocument({ prompt });
    return {
      summary: "Document built.",
      artifact: {
        kind: "document",
        title: document.title,
        payload: document,
        category: "docs"
      },
      completed: true
    };
  }

  if (plan.actionType === "build_spreadsheet") {
    return {
      summary: "Spreadsheet pack prepared.",
      artifact: {
        kind: "spreadsheet-pack",
        title: "Spreadsheet-ready pack",
        payload: {
          prompt,
          columns: ["Item", "Owner", "Status", "Due", "Notes"],
          notes: [
            "Use these columns as the starting tracker.",
            "Buksy can later export this to a real spreadsheet integration."
          ]
        },
        category: "operations"
      },
      completed: true
    };
  }

  if (plan.actionType === "update_crm") {
    return {
      summary: "CRM update pack prepared.",
      artifact: {
        kind: "crm-pack",
        title: "CRM command pack",
        payload: {
          prompt,
          nextFields: ["account", "contact", "stage", "next step", "risk"],
          note: "Buksy prepared the CRM-ready update. A connected CRM plugin can later push it."
        },
        category: "sales"
      },
      completed: true
    };
  }

  if (plan.actionType === "build_todo") {
    const todoList = buildTodoList({ prompt });
    return {
      summary: "To-do list built.",
      artifact: {
        kind: "todo-plan",
        title: todoList.title,
        payload: todoList,
        category: "planning"
      },
      createdTasks: todoList.tasks || [],
      completed: true
    };
  }

  if (plan.actionType === "github_sync") {
    return {
      summary: "Developer sync prepared.",
      artifact: {
        kind: "developer-sync",
        title: "Developer mode sync",
        payload: {
          prompt,
          note: "Use the connected GitHub plugin to fetch live repos and build dev tasks.",
          checklist: [
            "Review open PRs",
            "Create review tasks",
            "Rebalance today around code pressure"
          ]
        },
        category: "developer"
      },
      completed: true
    };
  }

  const crew = runMultiAgentAnalysis({ prompt });
  return {
    summary: "General agent action completed.",
    artifact: {
      kind: "multi-agent",
      title: "Agent crew output",
      payload: crew,
      category: "analysis"
    },
    completed: true
  };
}

module.exports = {
  createDefaultPlugins,
  normalizePlugins,
  buildPluginCatalog,
  buildExecutionPlan,
  buildAutomationRule,
  evaluateAutomationRules,
  executePlannedAction
};
