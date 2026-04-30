const $ = (id) => document.getElementById(id);
const ui = {
  navLinks: [...document.querySelectorAll(".nav-link")],
  pages: [...document.querySelectorAll(".page")],
  projectSelects: [...document.querySelectorAll(".project-select")],
  pageTitle: $("pageTitle"),
  pageSubtitle: $("pageSubtitle"),
  modeBadge: $("modeBadge"),
  contextSummary: $("contextSummary"),
  aiConnectionBadge: $("aiConnectionBadge"),
  aiConnectionCopy: $("aiConnectionCopy"),
  mlHealthCard: $("mlHealthCard"),
  flash: $("flash"),
  topMetrics: $("topMetrics"),
  suggestionCard: $("suggestionCard"),
  statsGrid: $("statsGrid"),
  dailyPlan: $("dailyPlan"),
  predictiveDayCard: $("predictiveDayCard"),
  cognitiveLoadCard: $("cognitiveLoadCard"),
  focusGuardCard: $("focusGuardCard"),
  consequenceCard: $("consequenceCard"),
  priorityRebalanceCard: $("priorityRebalanceCard"),
  constraintResult: $("constraintResult"),
  behaviorModelCard: $("behaviorModelCard"),
  reflectionCard: $("reflectionCard"),
  weaknessCard: $("weaknessCard"),
  goalHealthCard: $("goalHealthCard"),
  dailyBriefCard: $("dailyBriefCard"),
  assistantActionCard: $("assistantActionCard"),
  conversation: $("conversation"),
  learningInsights: $("learningInsights"),
  workspaceOpportunityCard: $("workspaceOpportunityCard"),
  workspaceSurpriseCard: $("workspaceSurpriseCard"),
  openTasks: $("openTasks"),
  completedTasks: $("completedTasks"),
  projectCards: $("projectCards"),
  goalCards: $("goalCards"),
  trendWatchCard: $("trendWatchCard"),
  memoryGraphCard: $("memoryGraphCard"),
  artifactStream: $("artifactStream"),
  refreshSuggestionBtn: $("refreshSuggestionBtn"),
  chatInput: $("chatInput"),
  fileInput: $("fileInput"),
  compareFileInput: $("compareFileInput"),
  aiSetupForm: $("aiSetupForm"),
  aiSetupResult: $("aiSetupResult"),
  authCard: $("authCard"),
  authLocalNote: $("authLocalNote"),
  authLoggedOut: $("authLoggedOut"),
  authLoggedIn: $("authLoggedIn"),
  loginForm: $("loginForm"),
  registerBtn: $("registerBtn"),
  logoutBtn: $("logoutBtn"),
  authEmail: $("authEmail"),
  authError: $("authError")
};

[
  "taskForm", "checkinForm", "projectForm", "goalForm", "constraintForm", "chatForm",
  "docForm", "todoBuilderForm", "researchForm", "compareForm", "debateForm", "decisionForm",
  "fileForm", "meetingForm", "hiddenInsightForm", "ideasForm", "multiAgentForm",
  "simulationForm", "presentationForm", "learningForm", "roleForm", "actionHubForm",
  "negotiationForm", "workflowForm", "sandboxForm", "knowledgeForm", "knowledgeQueryForm",
  "aiSetupForm", "jiraConnectForm", "githubConnectForm", "notionConnectForm",
  "docResult", "todoBuilderResult", "researchResult", "compareResult", "debateResult",
  "decisionResult", "fileResult", "meetingResult", "hiddenInsightResult", "ideasResult",
  "multiAgentResult", "simulationResult", "presentationResult", "learningResult", "roleResult",
  "actionHubResult", "negotiationResult", "workflowResult", "sandboxResult", "knowledgeResults",
  "aiSetupResult",
  "scheduleTimeline", "scheduleWarnings", "scheduleSummary", "scheduleAtRisk",
  "scheduleRebalanceBtn",
  "executionPlanForm", "executionPlannerResult", "executionQueue",
  "automationBuildForm", "automationBuildResult", "automationSuggestions", "automationWorkflowList", "runAutomationsBtn",
  "voiceCommandForm", "voiceCommandResult", "voiceCommandStartBtn", "voiceCommandStopBtn", "voiceCommandStatus",
  "voiceCommandTranscript", "voiceCommandConfirmBtn", "voiceCommandSpeakMode",
  "voiceJournalForm", "voiceJournalResult", "voiceStartBtn", "voiceStopBtn", "voiceStatus", "voiceTranscript",
  "analyticsSummary", "analyticsWeeklyCard", "analyticsPerformanceCard", "analyticsBurnoutCard",
  "analyticsGoalProbabilityCard", "analyticsAvoidanceCard", "analyticsPersonalizationCard", "analyticsUsageCard",
  "timeSimulationForm", "timeSimulationResult", "delayExplainForm", "delayExplainResult",
  "digitalTwinCard", "digitalTwinSimulationForm", "digitalTwinSimulationResult", "futureTimelineCard",
  "habitDnaCard", "emotionalIntelligenceCard", "playbooksCard", "strategyEngineCard",
  "subconsciousPatternsCard", "gamificationCard", "privacyModeCard", "privacySettingsForm",
  "teamBrainCard", "contextEngineCard", "metaLearningCard", "autopilotAnalyticsCard",
  "autopilotSettingsForm", "runAutopilotBtn", "autopilotResult",
  "worldContextForm", "worldContextResult",
  "teamMemberForm", "teamResult",
  "goalAutoplanForm", "goalAutoplanResult",
  "pluginCatalog", "pluginSettingsForm", "pluginSettingsResult",
  "developerImportBtn", "developerImportResult",
  "jiraStatus", "jiraSyncBtn", "jiraSyncResult",
  "githubStatus", "githubRefreshBtn", "githubDashboard",
  "notionStatus", "notionListBtn", "notionDatabaseList", "notionSyncBtn", "notionSyncResult", "notionCreateProject",
  "schedulePreviewCard",
  "oauthCallbackHints", "githubOAuthBtn", "notionOAuthBtn", "googleOAuthBtn",
  "githubOauthOrPat", "notionOauthOrPat", "googleCalStatus"
].forEach((id) => {
  ui[id] = $(id);
});

const state = {
  dashboard: null,
  knowledgeQuery: null,
  workflowBlueprint: null,
  automationDraft: null,
  latestExecution: null,
  delayAnalysis: null,
  timeSimulation: null,
  twinSimulation: null,
  voiceCommand: null,
  voiceJournal: null,
  worldContext: null,
  autopilotRun: null,
  goalAutoplan: null,
  teamUpdate: null,
  privacyUpdate: null,
  pluginUpdate: null,
  developerImport: null,
  aiStatus: null,
  mlMetrics: null,
  auth: null
};
const pageTitles = Object.fromEntries(ui.navLinks.map((button) => [button.dataset.viewTarget, (button.querySelector("span") || button).textContent.trim()]));
const pageSubtitles = {
  today: "Your clearest next move, today only",
  schedule: "See capacity, overload, and deadline pressure",
  agent: "Autopilot, actions, automations, voice, and team control",
  analytics: "Digital twin, future timelines, habits, and strategy",
  create: "Build documents, to-do lists, research, and drafts",
  projects: "Goals, constraints, and decisions across projects",
  memory: "Files, notes, meetings, and connected memory",
  integrations: "Connect external tools and manage plugins"
};
const artifactTargets = {
  document: "docResult",
  "todo-plan": "todoBuilderResult",
  research: "researchResult",
  comparison: "compareResult",
  debate: "debateResult",
  decision: "decisionResult",
  "file-analysis": "fileResult",
  meeting: "meetingResult",
  "hidden-insight": "hiddenInsightResult",
  "idea-set": "ideasResult",
  "multi-agent": "multiAgentResult",
  simulation: "simulationResult",
  presentation: "presentationResult",
  learning: "learningResult",
  "role-lens": "roleResult",
  "action-pack": "actionHubResult",
  negotiation: "negotiationResult",
  sandbox: "sandboxResult",
  "time-simulation": "timeSimulationResult",
  "voice-journal": "voiceJournalResult",
  "meeting-plan": "executionPlannerResult",
  "developer-sync": "developerImportResult",
  "digital-twin-simulation": "digitalTwinSimulationResult",
  "autonomous-goal-plan": "goalAutoplanResult",
  "autopilot-run": "autopilotResult",
  "spreadsheet-pack": "actionHubResult",
  "crm-pack": "actionHubResult"
};

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeUiText(value) {
  return String(value || "")
    .replaceAll("â€™", "'")
    .replaceAll("Â·", "|")
    .replaceAll("â€”", "-");
}

function setHtml(node, html) {
  if (node) node.innerHTML = html;
}

function titleCase(value) {
  return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value, withTime = false) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, withTime ? {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit"
  } : {
    day: "numeric", month: "short"
  });
}

function formatClock(value) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return value || "";
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function flash(message) {
  if (!ui.flash) return;
  ui.flash.textContent = message || "";
  clearTimeout(flash.timer);
  flash.timer = setTimeout(() => {
    ui.flash.textContent = "";
  }, 2800);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

function listHtml(items, empty = "Nothing here yet.") {
  return items?.length
    ? `<ul class="bullet-list">${items.map((item) => `<li>${typeof item === "string" ? escapeHtml(item) : objectHtml(item)}</li>`).join("")}</ul>`
    : `<p class="empty-state">${escapeHtml(empty)}</p>`;
}

function objectHtml(value) {
  if (value === null || value === undefined || value === "") return `<p class="note-copy">None yet.</p>`;
  if (Array.isArray(value)) return listHtml(value);
  if (typeof value !== "object") return `<p class="note-copy">${escapeHtml(value)}</p>`;
  return Object.entries(value).map(([key, inner]) => `
    <div class="detail-row">
      <strong>${escapeHtml(titleCase(key))}</strong>
      ${Array.isArray(inner) || typeof inner === "object" ? objectHtml(inner) : `<p class="note-copy">${escapeHtml(inner)}</p>`}
    </div>
  `).join("");
}

function voiceCommandHtml(result) {
  if (!result) {
    return `<p class="empty-state">Voice commands will show the spoken reply, planned actions, and execution result here.</p>`;
  }

  const actions = result.actions || [];
  const executed = result.execution?.results || [];

  return `
    <div class="result-stack">
      <div class="pill-row">
        <span class="pill">${result.requires_confirmation ? "Confirmation needed" : "Safe to run"}</span>
        <span class="pill">${escapeHtml(actions.length)} action${actions.length === 1 ? "" : "s"}</span>
      </div>
      <p class="result-copy">${escapeHtml(result.response || "")}</p>
      ${actions.length ? `
        <div class="mini-card dense-card">
          <strong>Planned actions</strong>
          ${listHtml(actions.map((action) => `${titleCase(action.type)}: ${Object.keys(action.parameters || {}).length ? JSON.stringify(action.parameters) : "no extra parameters"}`), "No actions planned.")}
        </div>
      ` : ""}
      ${executed.length ? `
        <div class="mini-card dense-card">
          <strong>Execution</strong>
          ${listHtml(executed.map((item) => item.summary || "Done"), "No execution output.")}
        </div>
      ` : ""}
    </div>
  `;
}

function documentHtml(document) {
  if (!document) {
    return `<p class="empty-state">No document here yet.</p>`;
  }

  return `
    <div class="result-stack">
      <p class="result-copy">${escapeHtml(document.summary || "")}</p>
      ${(document.sections || []).map((section) => `
        <div class="mini-card dense-card">
          <strong>${escapeHtml(section.heading)}</strong>
          ${listHtml(section.bullets || [], "No points yet.")}
        </div>
      `).join("")}
      ${document.nextActions?.length ? `<div class="mini-card dense-card"><strong>Next actions</strong>${listHtml(document.nextActions, "No next actions yet.")}</div>` : ""}
    </div>
  `;
}

function todoHtml(plan) {
  if (!plan) {
    return `<p class="empty-state">No to-do list here yet.</p>`;
  }

  return `
    <div class="result-stack">
      <p class="result-copy">${escapeHtml(plan.summary || "")}</p>
      <ol class="plan-list">
        ${(plan.tasks || []).map((task) => `
          <li>
            <strong>${escapeHtml(task.title)}</strong>
            <div class="pill-row">
              <span class="pill">${escapeHtml(task.category || "general")}</span>
              <span class="pill">${escapeHtml(task.priority || "medium")} priority</span>
              <span class="pill">${escapeHtml(task.durationMins || 25)} mins</span>
            </div>
          </li>
        `).join("")}
      </ol>
    </div>
  `;
}

function artifactHtml(kind, payload) {
  if (kind === "document") {
    return documentHtml(payload);
  }

  if (kind === "todo-plan") {
    return todoHtml(payload);
  }

  return objectHtml(payload);
}

function graphColor(type) {
  return {
    goal: "var(--accent)",
    task: "var(--teal)",
    project: "var(--gold)",
    person: "var(--sky)",
    habit: "var(--red)",
    document: "#c084fc",
    decision: "#fb7185",
    research: "#22c55e",
    artifact: "#f97316",
    memory: "#eab308"
  }[type] || "var(--ink-soft)";
}

function memoryGraphHtml(graph) {
  const nodes = graph?.nodes || [];
  const edges = graph?.edges || [];
  if (!nodes.length) {
    return `<p class="empty-state">As you add tasks, goals, docs, and notes, Buksy will connect them here.</p>`;
  }

  const width = 720;
  const height = 320;
  const centerX = width / 2;
  const centerY = height / 2;
  const byType = {};

  nodes.forEach((node) => {
    const type = node.type || "node";
    byType[type] = byType[type] || [];
    byType[type].push(node);
  });

  const positions = {};
  const types = Object.keys(byType);
  types.forEach((type, typeIndex) => {
    const bucket = byType[type];
    const orbit = 58 + typeIndex * 26;
    bucket.forEach((node, index) => {
      const angle = ((Math.PI * 2) / Math.max(1, bucket.length)) * index + typeIndex * 0.48;
      positions[node.id] = {
        x: centerX + Math.cos(angle) * orbit,
        y: centerY + Math.sin(angle) * orbit
      };
    });
  });

  return `
    <div class="memory-graph-wrap">
      <svg class="memory-graph" viewBox="0 0 ${width} ${height}" role="img" aria-label="Buksy memory graph">
        <defs>
          <filter id="memoryGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="coloredBlur"></feGaussianBlur>
            <feMerge>
              <feMergeNode in="coloredBlur"></feMergeNode>
              <feMergeNode in="SourceGraphic"></feMergeNode>
            </feMerge>
          </filter>
        </defs>
        ${edges.map((edge) => {
          const from = positions[edge.from];
          const to = positions[edge.to];
          if (!from || !to) return "";
          const labelX = (from.x + to.x) / 2;
          const labelY = (from.y + to.y) / 2;
          return `
            <line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="rgba(255,255,255,0.16)" stroke-width="1.5" />
            <text x="${labelX}" y="${labelY - 4}" text-anchor="middle" class="memory-edge-label">${escapeHtml(edge.label || "")}</text>
          `;
        }).join("")}
        ${nodes.map((node) => {
          const pos = positions[node.id];
          if (!pos) return "";
          return `
            <g transform="translate(${pos.x} ${pos.y})" filter="url(#memoryGlow)">
              <circle r="18" fill="${graphColor(node.type)}" fill-opacity="0.18" stroke="${graphColor(node.type)}" stroke-width="2"></circle>
              <text y="4" text-anchor="middle" class="memory-node-label">${escapeHtml(String(node.label || "").slice(0, 14))}</text>
            </g>
          `;
        }).join("")}
      </svg>
      <div class="pill-row">
        ${types.map((type) => `<span class="pill"><span class="legend-dot" style="background:${graphColor(type)}"></span>${escapeHtml(titleCase(type))}</span>`).join("")}
      </div>
    </div>
  `;
}

function executionQueueHtml(executions = []) {
  if (!executions.length) {
    return `<p class="empty-state">Planned actions waiting for confirmation will appear here.</p>`;
  }

  return executions.map((execution) => `
    <article class="mini-card dense-card execution-card execution-${escapeHtml(execution.status)}">
      <div class="task-card-header">
        <div>
          <strong>${escapeHtml(execution.title)}</strong>
          <p class="note-copy">${escapeHtml(execution.prompt || execution.preview?.summary || "")}</p>
        </div>
        <span class="status-chip">${escapeHtml(titleCase(execution.status))}</span>
      </div>
      <div class="pill-row">
        <span class="pill">${escapeHtml(execution.actionType)}</span>
        <span class="pill">${escapeHtml(execution.pluginId || "local")}</span>
        <span class="pill">${escapeHtml(formatDate(execution.updatedAt || execution.createdAt, true))}</span>
      </div>
      ${(execution.preview?.steps || []).length ? listHtml(execution.preview.steps, "No preview steps.") : ""}
      ${execution.error ? `<p class="note-copy">${escapeHtml(execution.error)}</p>` : ""}
      <div class="action-row">
        ${execution.status === "pending_confirmation" ? `<button class="primary-button" type="button" data-execution-approve="${escapeHtml(execution.id)}">Approve</button>` : ""}
        ${["approved", "pending_confirmation"].includes(execution.status) ? `<button class="soft-button" type="button" data-execution-run="${escapeHtml(execution.id)}">Run</button>` : ""}
        ${["pending_confirmation", "approved"].includes(execution.status) ? `<button class="ghost-button" type="button" data-execution-cancel="${escapeHtml(execution.id)}">Cancel</button>` : ""}
      </div>
    </article>
  `).join("");
}

function executionPreviewHtml(execution) {
  if (!execution) {
    return `<p class="empty-state">Plan an action and Buksy will show the exact confirmation preview here.</p>`;
  }

  return `
    <div class="mini-card dense-card">
      <div class="task-card-header">
        <div>
          <strong>${escapeHtml(execution.title)}</strong>
          <p class="note-copy">${escapeHtml(execution.preview?.summary || execution.prompt || "")}</p>
        </div>
        <span class="status-chip">${escapeHtml(titleCase(execution.status || "pending_confirmation"))}</span>
      </div>
      ${listHtml(execution.preview?.steps || [], "No preview steps yet.")}
    </div>
  `;
}

function automationSuggestionsHtml(suggestions = []) {
  return suggestions.length
    ? suggestions.map((item) => `
      <div class="mini-card dense-card">
        <strong>${escapeHtml(item.title)}</strong>
        <p class="note-copy">${escapeHtml(titleCase(item.trigger))}</p>
        ${listHtml(item.matches || [], "No trigger matches.")}
        ${listHtml(item.recommendedActions || [], "No actions yet.")}
      </div>
    `).join("")
    : `<p class="empty-state">No automation is currently firing. Create a rule and Buksy will watch for the trigger.</p>`;
}

function automationWorkflowHtml(workflows = []) {
  return workflows.length
    ? workflows.map((workflow) => `
      <div class="mini-card dense-card">
        <div class="task-card-header">
          <div>
            <strong>${escapeHtml(workflow.title)}</strong>
            <p class="note-copy">${escapeHtml(workflow.description || workflow.triggerLabel || "")}</p>
          </div>
          <span class="status-chip">${escapeHtml(workflow.status || "draft")}</span>
        </div>
        ${listHtml(workflow.actions || workflow.steps || [], "No workflow steps yet.")}
      </div>
    `).join("")
    : `<p class="empty-state">Automation rules will appear here after you create one.</p>`;
}

function pluginCatalogHtml(plugins = []) {
  if (!plugins.length) {
    return `<p class="empty-state">No plugins loaded yet.</p>`;
  }

  return `
    <div class="plugin-grid">
      ${plugins.map((plugin) => `
        <div class="mini-card dense-card plugin-card">
          <div class="task-card-header">
            <div>
              <strong>${escapeHtml(plugin.name)}</strong>
              <p class="note-copy">${escapeHtml(plugin.statusCopy || "")}</p>
            </div>
            <span class="status-chip">${plugin.connected ? "Connected" : "Local"}</span>
          </div>
          <div class="pill-row">
            <span class="pill">${escapeHtml(plugin.category || "general")}</span>
            <span class="pill">${escapeHtml(plugin.mode || "default")}</span>
          </div>
          ${listHtml(plugin.capabilities || [], "No capabilities listed.")}
        </div>
      `).join("")}
    </div>
  `;
}

function analyticsSummaryHtml(analytics = {}) {
  const weekly = analytics.weekly || {};
  const burnout = analytics.burnout || {};
  const performance = analytics.performance || {};
  const usage = analytics.usage || {};
  return `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">Completed 7d</div><div class="stat-value">${escapeHtml(weekly.completedLast7Days || 0)}</div></div>
      <div class="stat-card"><div class="stat-label">Best window</div><div class="stat-value">${escapeHtml(performance.bestWindow || "Learning")}</div></div>
      <div class="stat-card"><div class="stat-label">Burnout</div><div class="stat-value">${escapeHtml(titleCase(burnout.level || "low"))}</div></div>
      <div class="stat-card"><div class="stat-label">Credits left</div><div class="stat-value">${escapeHtml(usage.remainingCredits || 0)}</div></div>
    </div>
  `;
}

function performanceHtml(performance = {}) {
  return `
    <div class="result-stack">
      <p class="result-copy">${escapeHtml(performance.bestWindow ? `Best recent window: ${performance.bestWindow}.` : "Buksy is still learning your best work windows.")}</p>
      ${(performance.windows || []).length ? `
        <div class="window-list">
          ${(performance.windows || []).map((window) => `
            <div class="detail-row">
              <strong>${escapeHtml(window.window)}</strong>
              <span class="pill">${escapeHtml(window.completions)} completions</span>
              <span class="pill">${escapeHtml(Math.round(window.minutes || 0))} mins</span>
            </div>
          `).join("")}
        </div>
      ` : `<p class="empty-state">Complete more tasks to reveal performance windows.</p>`}
    </div>
  `;
}

function burnoutHtml(burnout = {}) {
  return `
    <div class="result-stack">
      <div class="metric-band">
        <span class="metric-pill">Score ${escapeHtml(burnout.score || 0)}</span>
        <span class="metric-pill">${escapeHtml(titleCase(burnout.level || "low"))}</span>
      </div>
      <p class="result-copy">${escapeHtml(burnout.message || "No burnout signal yet.")}</p>
      <div class="pill-row">
        <span class="pill">${escapeHtml(burnout.lowEnergyCount || 0)} low-energy check-ins</span>
        <span class="pill">${escapeHtml(burnout.scatteredCount || 0)} scattered-focus check-ins</span>
        <span class="pill">${escapeHtml(burnout.autoDeferred || 0)} auto deferrals</span>
      </div>
    </div>
  `;
}

function goalProbabilityHtml(goals = []) {
  return goals.length
    ? goals.map((goal) => `
      <div class="goal-probability">
        <div class="detail-row">
          <strong>${escapeHtml(goal.title)}</strong>
          <span class="pill">${escapeHtml(goal.probability)}%</span>
        </div>
        <div class="progress-bar"><span style="width:${Math.max(6, Number(goal.probability || 0))}%"></span></div>
        <p class="note-copy">${escapeHtml(goal.message)}</p>
      </div>
    `).join("")
    : `<p class="empty-state">Create a goal and Buksy will start projecting success odds here.</p>`;
}

function avoidanceHtml(items = []) {
  return items.length
    ? items.map((item) => `
      <div class="mini-card dense-card">
        <div class="detail-row">
          <strong>${escapeHtml(item.title)}</strong>
          <span class="pill">${escapeHtml(item.skippedCount || 0)} skips</span>
          <span class="pill">${escapeHtml(item.suggestionCount || 0)} nudges</span>
        </div>
        <p class="note-copy">${escapeHtml(item.notes || "Buksy is seeing hesitation here.")}</p>
      </div>
    `).join("")
    : `<p class="empty-state">No strong avoidance pattern yet.</p>`;
}

function personalizationHtml(profile = {}) {
  return `
    <div class="result-stack">
      <div class="pill-row">
        <span class="pill">${escapeHtml(profile.operatingMode || "learning")} mode</span>
        <span class="pill">${escapeHtml(profile.suggestionStyle || "adaptive")} style</span>
        <span class="pill">${escapeHtml(profile.preferredDuration || "short")} duration</span>
        <span class="pill">${escapeHtml(profile.preferredEffort || "medium")} effort</span>
      </div>
      <p class="result-copy">${escapeHtml(profile.lowEnergyStrategy || "Buksy is still learning your low-energy pattern.")}</p>
      ${listHtml((profile.taskDifficultyByTime || []).map((item) => `${item.window}: ${item.suggestion}`), "No timing rules yet.")}
    </div>
  `;
}

function usageHtml(usage = {}) {
  return `
    <div class="result-stack">
      <div class="metric-band">
        <span class="metric-pill">${escapeHtml(usage.plan || "Free")}</span>
        <span class="metric-pill">${escapeHtml(usage.creditsUsed || 0)} used</span>
        <span class="metric-pill">${escapeHtml(usage.remainingCredits || 0)} left</span>
      </div>
      <div class="pill-row">
        <span class="pill">${escapeHtml(usage.aiRequests || 0)} AI requests</span>
        <span class="pill">${escapeHtml(usage.advancedRuns || 0)} advanced runs</span>
      </div>
      <p class="note-copy">This is local plan scaffolding for premium usage design, not billing.</p>
    </div>
  `;
}

function timeSimulationHtml(result) {
  if (!result) {
    return `<p class="empty-state">Run a simulation to see projected finish dates and weekly pressure.</p>`;
  }

  return `
    <div class="result-stack">
      <p class="result-copy">${escapeHtml(result.message || "")}</p>
      <div class="pill-row">
        <span class="pill">${escapeHtml(result.totalMinutes || 0)} mins total</span>
        <span class="pill">${escapeHtml(result.dailyHours || 0)} hrs/day</span>
        <span class="pill">${escapeHtml(result.projectedFinishDate || "n/a")}</span>
        ${result.targetDate ? `<span class="pill">Target ${escapeHtml(result.targetDate)}</span>` : ""}
      </div>
      ${listHtml((result.whatMustHappenThisWeek || []).map((item) => `This week: ${item}`), "No weekly pressure items.")}
      ${listHtml((result.timeline || []).map((item) => `${item.date}: ${item.plannedMinutes} mins, ${item.remainingMinutes} mins left`), "No timeline yet.")}
    </div>
  `;
}

function futureTimelineHtml(future = {}) {
  const modes = future.modes || [];
  if (!modes.length) {
    return `<p class="empty-state">Buksy needs active work to project multiple futures.</p>`;
  }

  const width = 680;
  const height = 220;
  const padding = 28;
  const colors = {
    aggressive: "#f97316",
    balanced: "var(--accent)",
    lazy: "#34d399"
  };

  const svg = `
    <svg class="future-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Future timeline chart">
      ${[0, 25, 50, 75, 100].map((mark) => {
        const y = height - padding - ((height - padding * 2) * mark / 100);
        return `
          <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
          <text x="8" y="${y + 4}" class="chart-axis-label">${mark}%</text>
        `;
      }).join("")}
      ${modes.map((mode) => {
        const points = (mode.points || []).map((point, index, rows) => {
          const x = padding + ((width - padding * 2) * index / Math.max(1, rows.length - 1));
          const y = height - padding - ((height - padding * 2) * Number(point.completion || 0) / 100);
          return { ...point, x, y };
        });
        return `
          <polyline fill="none" stroke="${colors[mode.id] || "var(--ink)"}" stroke-width="3" points="${points.map((point) => `${point.x},${point.y}`).join(" ")}"></polyline>
          ${points.map((point) => `
            <circle cx="${point.x}" cy="${point.y}" r="4" fill="${colors[mode.id] || "var(--ink)"}"></circle>
            <text x="${point.x}" y="${height - 8}" text-anchor="middle" class="chart-axis-label">${point.day}d</text>
          `).join("")}
        `;
      }).join("")}
    </svg>
  `;

  return `
    <div class="result-stack">
      <p class="result-copy">${escapeHtml(future.summary || "")}</p>
      ${svg}
      <div class="timeline-mode-grid">
        ${modes.map((mode) => `
          <div class="mini-card dense-card">
            <div class="detail-row">
              <strong>${escapeHtml(mode.label)}</strong>
              <span class="pill">${escapeHtml(mode.projectedTasksPer30Days)} tasks / 30d</span>
            </div>
            <p class="note-copy">${escapeHtml(mode.summary || "")}</p>
            <p class="note-copy">${escapeHtml(mode.sixMonthMessage || "")}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function digitalTwinHtml(twin = {}) {
  const triggers = twin.procrastinationTriggers || [];
  return `
    <div class="result-stack">
      <div class="pill-row">
        <span class="pill">${escapeHtml(titleCase(twin.riskTolerance || "medium"))} risk</span>
        <span class="pill">${escapeHtml(twin.followThroughScore || 0)}% follow-through</span>
      </div>
      <p class="result-copy">${escapeHtml(twin.summary || "Buksy is still learning your behavioral profile.")}</p>
      ${twin.likelyToday ? `<p class="note-copy"><strong>Likely today:</strong> ${escapeHtml(twin.likelyToday)}</p>` : ""}
      ${(twin.decisionPatterns || []).length ? `<div class="mini-card dense-card"><strong>How you usually commit</strong>${listHtml(twin.decisionPatterns, "No decision patterns yet.")}</div>` : ""}
      ${triggers.length ? `
        <div class="mini-stack">
          ${triggers.map((trigger) => `
            <div class="mini-card dense-card">
              <strong>${escapeHtml(trigger.title)}</strong>
              ${listHtml(trigger.reasons || [], "No friction signals yet.")}
            </div>
          `).join("")}
        </div>
      ` : `<p class="empty-state">No strong hesitation triggers yet.</p>`}
    </div>
  `;
}

function habitDnaHtml(report = {}) {
  const patterns = report.patterns || [];
  return `
    <div class="result-stack">
      <p class="result-copy">${escapeHtml(report.summary || "Buksy is still learning your root behavior patterns.")}</p>
      ${patterns.length ? patterns.map((pattern) => `
        <div class="mini-card dense-card">
          <strong>${escapeHtml(pattern.title)}</strong>
          <p class="note-copy">${escapeHtml(pattern.pattern || "")}</p>
          <p class="note-copy"><strong>Adjustment:</strong> ${escapeHtml(pattern.intervention || "No intervention yet.")}</p>
        </div>
      `).join("") : `<p class="empty-state">No habit DNA patterns yet.</p>`}
    </div>
  `;
}

function emotionalIntelligenceHtml(report = {}) {
  return `
    <div class="result-stack">
      <div class="pill-row">
        <span class="pill">${escapeHtml(report.lowEnergyDays || 0)} low-energy days</span>
        <span class="pill">${escapeHtml(report.scatteredMoments || 0)} scattered moments</span>
        <span class="pill">${escapeHtml(report.frustrationSignals || 0)} frustration signals</span>
      </div>
      <p class="result-copy">${escapeHtml(report.summary || "Buksy is monitoring emotional workload.")}</p>
      ${listHtml(report.interventions || [], "No interventions needed right now.")}
    </div>
  `;
}

function playbooksHtml(playbooks = {}) {
  const rows = playbooks.playbooks || [];
  return rows.length
    ? rows.map((playbook) => `
      <div class="mini-card dense-card">
        <strong>${escapeHtml(playbook.title)}</strong>
        <p class="note-copy">${escapeHtml(playbook.pattern)}</p>
        <p class="note-copy"><strong>When:</strong> ${escapeHtml(playbook.whenToUse || "Whenever it fits.")}</p>
        ${listHtml(playbook.steps || [], "No steps yet.")}
      </div>
    `).join("")
    : `<p class="empty-state">Buksy is still learning reusable playbooks from your behavior.</p>`;
}

function strategyHtml(strategy = {}) {
  return `
    <div class="result-stack">
      <p class="result-copy">${escapeHtml(strategy.summary || "")}</p>
      ${strategy.recommendation ? `<p class="note-copy">${escapeHtml(strategy.recommendation)}</p>` : ""}
      ${(strategy.focusAreas || []).length ? (strategy.focusAreas || []).map((item) => `
        <div class="mini-card dense-card">
          <div class="detail-row">
            <strong>${escapeHtml(item.title)}</strong>
            <span class="pill">${escapeHtml(item.score)}</span>
          </div>
          <p class="note-copy">${escapeHtml(item.reason || "")}</p>
        </div>
      `).join("") : `<p class="empty-state">No strategic focus areas yet.</p>`}
      ${(strategy.goalOpportunities || []).length ? `<div class="mini-card dense-card"><strong>Goal opportunities</strong>${listHtml(strategy.goalOpportunities, "No goal opportunities yet.")}</div>` : ""}
    </div>
  `;
}

function teamBrainHtml(team = {}) {
  return `
    <div class="result-stack">
      <p class="result-copy">${escapeHtml(team.summary || "Add teammates and tagged tasks to unlock shared planning.")}</p>
      ${(team.members || []).length ? `
        <div class="mini-stack">
          ${(team.members || []).map((member) => `
            <div class="mini-card dense-card">
              <div class="detail-row">
                <strong>${escapeHtml(member.name)}</strong>
                <span class="pill">${escapeHtml(member.openItems || 0)} open</span>
              </div>
              <p class="note-copy">${escapeHtml(member.role || "Teammate")}${member.focusArea ? ` - ${escapeHtml(member.focusArea)}` : ""}</p>
            </div>
          `).join("")}
        </div>
      ` : `<p class="empty-state">No teammates added yet.</p>`}
      ${(team.blockers || []).length ? `
        <div class="mini-card dense-card">
          <strong>Active blockers</strong>
          ${listHtml((team.blockers || []).map((blocker) => `${blocker.title}: ${blocker.reason}`), "No blockers right now.")}
        </div>
      ` : ""}
      ${(team.suggestions || []).length ? `<div class="mini-card dense-card"><strong>What Buksy would do</strong>${listHtml(team.suggestions, "No team suggestions yet.")}</div>` : ""}
    </div>
  `;
}

function gamificationHtml(game = {}) {
  return `
    <div class="result-stack">
      <div class="metric-band">
        <span class="metric-pill">XP ${escapeHtml(game.xp || 0)}</span>
        <span class="metric-pill">Level ${escapeHtml(game.level || 1)}</span>
        <span class="metric-pill">${escapeHtml(game.streak || 0)} day streak</span>
      </div>
      <p class="result-copy">${escapeHtml(game.summary || "")}</p>
      ${listHtml((game.unlocks || []).map((item) => `Unlocked: ${item}`), "No unlocks yet.")}
    </div>
  `;
}

function contextEngineHtml(report = {}) {
  return `
    <div class="result-stack">
      <div class="pill-row">
        <span class="pill">${escapeHtml(report.locationLabel || "No location")}</span>
        <span class="pill">${escapeHtml(report.workMode || "auto")}</span>
        <span class="pill">${escapeHtml(report.sleepHours || 0)}h sleep</span>
      </div>
      <p class="note-copy"><strong>Weather:</strong> ${escapeHtml(report.weather || "No local snapshot")}</p>
      <p class="note-copy"><strong>Signal:</strong> ${escapeHtml(report.newsSignal || "No outside-world note")}</p>
      ${listHtml(report.recommendations || [], "No context recommendations yet.")}
    </div>
  `;
}

function subconsciousHtml(report = {}) {
  return `
    <div class="result-stack">
      <p class="result-copy">${escapeHtml(report.summary || "Buksy is looking for hidden patterns in your behavior.")}</p>
      ${listHtml(report.patterns || [], "No subconscious patterns yet.")}
    </div>
  `;
}

function metaLearningHtml(report = {}) {
  return `
    <div class="result-stack">
      <p class="result-copy">${escapeHtml(report.summary || "Buksy is learning what works for you.")}</p>
      <div class="mini-card dense-card">
        <strong>Current biases</strong>
        ${listHtml(report.currentBiases || [], "No learned biases yet.")}
      </div>
      <div class="mini-card dense-card">
        <strong>Next optimizations</strong>
        ${listHtml(report.nextOptimizations || [], "No optimizations yet.")}
      </div>
    </div>
  `;
}

function privacyHtml(privacy = {}) {
  return `
    <div class="result-stack">
      <div class="pill-row">
        <span class="pill">${privacy.localFirst ? "Local-first" : "Hybrid"}</span>
        <span class="pill">${privacy.offlinePreferred ? "Offline preferred" : "Online mixed"}</span>
        <span class="pill">${escapeHtml(privacy.dataSharing || "local_only")}</span>
      </div>
      <p class="result-copy">${escapeHtml(privacy.summary || "")}</p>
      <div class="pill-row">
        <span class="pill">${escapeHtml(privacy.connectedIntegrations || 0)} integrations</span>
        <span class="pill">${escapeHtml(privacy.connectedPlugins || 0)} plugins</span>
      </div>
    </div>
  `;
}

function autopilotHtml(autopilot = {}) {
  return `
    <div class="result-stack">
      <div class="pill-row">
        <span class="pill">${autopilot.ready ? "Enabled" : "Preview"}</span>
        <span class="pill">${escapeHtml(autopilot.settings?.mode || "balanced")}</span>
        <span class="pill">${escapeHtml(autopilot.confidence || 0)}% twin confidence</span>
      </div>
      <p class="result-copy">${escapeHtml(autopilot.summary || "")}</p>
      ${autopilot.nextAnchor ? `<p class="note-copy"><strong>Next anchor:</strong> ${escapeHtml(autopilot.nextAnchor)}</p>` : ""}
      ${listHtml(autopilot.guardrails || [], "No guardrails yet.")}
    </div>
  `;
}

function dailyBriefHtml(dashboard) {
  const openTasks = dashboard.stats.openTasks;
  const suggestion = dashboard.suggestion?.task?.title;
  const goalPressure = dashboard.advanced.driftAlerts?.[0]?.message || dashboard.advanced.futureYou?.[0]?.message;
  const workload = dashboard.advanced.cognitiveLoad?.message;

  return `
    <div class="mini-card dense-card">
      <p class="panel-kicker">Today in plain English</p>
      <h3 class="subheadline">${openTasks === 0 ? "You’re starting clear." : `You have ${openTasks} things on your plate.`}</h3>
      <ul class="bullet-list">
        <li>${escapeHtml(suggestion ? `Start with ${suggestion}.` : "Tell Buksy what you need and it will turn it into a plan, doc, or task list.")}</li>
        <li>${escapeHtml(workload || "Your workload looks manageable.")}</li>
        <li>${escapeHtml(goalPressure || "No major drift or deadline pressure is showing yet.")}</li>
      </ul>
    </div>
  `;
}

function latestAssistantAction(dashboard) {
  const latest = ["document", "todo-plan", "action-pack", "negotiation"]
    .map((kind) => [kind, dashboard.latestArtifacts?.[kind]])
    .find(([, artifact]) => artifact);

  if (!latest) {
    return `<p class="empty-state">When Buksy builds something for you, the latest result shows here.</p>`;
  }

  const [kind, artifact] = latest;
  return `
    <div class="mini-card dense-card">
      <p class="panel-kicker">Latest build</p>
      <h3 class="subheadline">${escapeHtml(artifact.title)}</h3>
      ${artifactHtml(kind, artifact.payload)}
    </div>
  `;
}

function aiStatusHtml(status) {
  if (!status) {
    return `<p class="empty-state">Buksy is checking Ollama.</p>`;
  }

  const models = (status.availableModels || []).slice(0, 6).map((model) => model.name);

  return `
    <div class="result-stack">
      <p class="result-copy">${escapeHtml(status.message || "")}</p>
      <div class="pill-row">
        <span class="pill">${escapeHtml(status.baseUrl || "")}</span>
        <span class="pill">${escapeHtml(status.model || "No model")}</span>
        <span class="pill">${status.connected ? "connected" : "offline"}</span>
      </div>
      ${models.length ? `<div class="detail-row"><strong>Installed models</strong>${listHtml(models, "No local models yet.")}</div>` : ""}
      ${status.connected ? "" : `
        <div class="mini-card dense-card">
          <strong>Quick setup</strong>
          <ul class="bullet-list">
            <li>Install Ollama and start it.</li>
            <li>Pull a model like <code>ollama pull qwen3</code>.</li>
            <li>Keep the base URL as <code>http://127.0.0.1:11434</code> unless you changed it.</li>
          </ul>
        </div>
      `}
    </div>
  `;
}

function renderAiStatus(status) {
  state.aiStatus = status;

  if (ui.aiConnectionBadge) {
    ui.aiConnectionBadge.textContent = status?.connected ? `Ollama · ${status.model}` : "Ollama offline";
    ui.aiConnectionBadge.classList.toggle("status-online", Boolean(status?.connected));
    ui.aiConnectionBadge.classList.toggle("status-offline", !status?.connected);
  }

  if (ui.aiConnectionCopy) {
    ui.aiConnectionCopy.textContent = status?.message || "Buksy can use Ollama for natural chat and richer replies.";
  }

  setHtml(ui.aiSetupResult, aiStatusHtml(status));

  if (ui.aiSetupForm) {
    const baseUrl = ui.aiSetupForm.elements.namedItem("baseUrl");
    const model = ui.aiSetupForm.elements.namedItem("model");
    if (baseUrl && !baseUrl.value) baseUrl.value = status?.baseUrl || "";
    if (model && !model.value) model.value = status?.model || "";
  }
}

function mlHealthHtml(metrics) {
  if (!metrics) {
    return "Local ML metrics unavailable.";
  }
  const trained = metrics.model?.trainedAt ? formatDate(metrics.model.trainedAt, true) : "Not trained yet";
  const routing = Number(metrics.routing?.correctRate || 0);
  const completionLift = Number(metrics.schedule?.completionLiftProxy || 0);
  const deferRegret = Number(metrics.schedule?.deferRegretRate || 0);
  const prev = state.mlMetrics;
  const prevRouting = Number(prev?.routing?.correctRate || 0);
  const prevCompletionLift = Number(prev?.schedule?.completionLiftProxy || 0);
  const prevDeferRegret = Number(prev?.schedule?.deferRegretRate || 0);
  const trendScore =
    (routing - prevRouting) * 2 +
    (completionLift - prevCompletionLift) * 0.02 +
    (prevDeferRegret - deferRegret) * 1.5;
  const trendLabel = trendScore > 0.08
    ? "Improving"
    : trendScore < -0.08
      ? "Regressing"
      : "Flat";
  const trendCopy = trendLabel === "Improving"
    ? "Model signals are moving in the right direction."
    : trendLabel === "Regressing"
      ? "Recent signals dipped. Buksy will self-correct with more feedback."
      : "Signals are stable right now.";

  return `
    <div class="result-stack">
      <div class="pill-row">
        <span class="pill">Events ${escapeHtml(metrics.events?.total || 0)}</span>
        <span class="pill">Route ${(routing * 100).toFixed(0)}%</span>
        <span class="pill">Trend ${escapeHtml(trendLabel)}</span>
      </div>
      <p class="note-copy">Trained: ${escapeHtml(trained)}</p>
      <p class="note-copy">Completion lift proxy: ${escapeHtml(completionLift)}</p>
      <p class="note-copy">Defer regret: ${escapeHtml((deferRegret * 100).toFixed(1))}%</p>
      <p class="note-copy">${escapeHtml(trendCopy)}</p>
    </div>
  `;
}

function renderMlMetrics(metrics) {
  state.mlMetrics = metrics;
  setHtml(ui.mlHealthCard, mlHealthHtml(metrics));
}

function view(name) {
  ui.navLinks.forEach((button) => button.classList.toggle("active", button.dataset.viewTarget === name));
  ui.pages.forEach((page) => page.classList.toggle("active", page.dataset.view === name));
  if (ui.pageTitle) ui.pageTitle.textContent = pageTitles[name] || "Buksy";
  if (ui.pageSubtitle) ui.pageSubtitle.textContent = pageSubtitles[name] || "One place for tasks, plans, docs, and memory";
}

function formObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function latestPayload(kind) {
  return state.dashboard?.latestArtifacts?.[kind]?.payload || null;
}

function populateProjects(projects = []) {
  ui.projectSelects.forEach((select) => {
    const current = select.value;
    if (!select.dataset.defaultLabel) {
      select.dataset.defaultLabel = select.options[0]?.textContent || "No project";
      select.dataset.defaultValue = select.options[0]?.value || "";
    }
    select.innerHTML = `<option value="${escapeHtml(select.dataset.defaultValue)}">${escapeHtml(select.dataset.defaultLabel)}</option>` +
      projects.map((project) => `<option value="${escapeHtml(project.id)}">${escapeHtml(project.name)}</option>`).join("");
    if (projects.some((project) => project.id === current)) select.value = current;
  });
}

function taskCard(task, maps, completed = false) {
  const goal = task.goalId ? maps.goals.get(task.goalId) : null;
  const project = task.projectId ? maps.projects.get(task.projectId) : null;
  return `
    <article class="task-card ${completed ? "completed" : ""}">
      <div class="task-card-header">
        <div>
          <h4 class="task-title">${escapeHtml(task.title)}</h4>
          <div class="meta-row">
            <span class="pill">${escapeHtml(task.category)}</span>
            <span class="pill">${escapeHtml(task.priority)}</span>
            <span class="pill">${escapeHtml(task.effort)}</span>
            <span class="pill">${escapeHtml(task.durationMins)} mins</span>
            <span class="pill">${escapeHtml(formatDate(task.dueDate))}</span>
            ${task.deferUntil ? `<span class="pill">carry ${escapeHtml(formatDate(task.deferUntil))}</span>` : ""}
            ${task.scheduledTime ? `<span class="pill">${escapeHtml(formatClock(task.scheduledTime))}</span>` : ""}
            ${goal ? `<span class="pill">${escapeHtml(goal.title)}</span>` : ""}
            ${project ? `<span class="pill">${escapeHtml(project.name)}</span>` : ""}
          </div>
        </div>
      </div>
      ${task.notes ? `<p class="task-notes">${escapeHtml(task.notes)}</p>` : ""}
      ${completed ? "" : `
        <div class="action-row">
          <button class="primary-button" type="button" data-feedback-kind="completed" data-task-id="${escapeHtml(task.id)}">Done</button>
          <button class="soft-button" type="button" data-feedback-kind="helpful" data-task-id="${escapeHtml(task.id)}">Helpful</button>
          <button class="ghost-button" type="button" data-focus-task-id="${escapeHtml(task.id)}">Focus</button>
          <button class="ghost-button" type="button" data-carry-forward="${escapeHtml(task.id)}">Carry forward</button>
          <button class="danger-button" type="button" data-delete-task-id="${escapeHtml(task.id)}">Delete</button>
        </div>
      `}
    </article>
  `;
}

function renderDashboard(dashboard) {
  state.dashboard = dashboard;
  populateProjects(dashboard.state.projects || []);
  const projectMap = new Map((dashboard.state.projects || []).map((item) => [item.id, item]));
  const goalMap = new Map((dashboard.state.goals || []).map((item) => [item.id, item]));

  ui.modeBadge.textContent = dashboard.advanced.behaviorModel.operatingMode;
  const ctxParts = [`${dashboard.context.energy} energy`, `${dashboard.context.focus} focus`];
  const cal = dashboard.calendar;
  if (cal && Number.isFinite(cal.busyMinutesToday) && cal.busyMinutesToday > 0 && !cal.error) {
    ctxParts.push(`~${Math.round(cal.busyMinutesToday)}m busy on calendar today`);
  }
  ui.contextSummary.textContent = ctxParts.join(", ");

  const oauth = dashboard.oauth || {};
  const rBase = oauth.redirectBase || "";
  if (ui.oauthCallbackHints) {
    const paths = ["/api/oauth/github/callback", "/api/oauth/notion/callback", "/api/oauth/google/callback"];
    const lines = rBase
      ? paths.map((p) => `<div><code>${escapeHtml(rBase + p)}</code></div>`).join("")
      : "<div>Configure OAuth client env vars and set BUKSY_PUBLIC_URL to see exact callback URLs.</div>";
    setHtml(ui.oauthCallbackHints, `<strong>Register these redirect URIs</strong> in each provider:${lines}`);
  }
  ui.githubOAuthBtn?.classList.toggle("hidden", !oauth.githubOAuth);
  ui.notionOAuthBtn?.classList.toggle("hidden", !oauth.notionOAuth);
  ui.googleOAuthBtn?.classList.toggle("hidden", !oauth.googleOAuth);
  ui.githubOauthOrPat?.classList.toggle("hidden", !oauth.githubOAuth);
  ui.notionOauthOrPat?.classList.toggle("hidden", !oauth.notionOAuth);

  const gCal = dashboard.state.profile?.integrations?.googleCalendar;
  if (ui.googleCalStatus) {
    if (gCal?.enabled || gCal?.accessToken) {
      const err = gCal.lastError ? ` Last error: ${escapeHtml(gCal.lastError)}` : "";
      const busy =
        cal && !cal.error && Number.isFinite(cal.busyMinutesToday)
          ? ` Today’s calendar busy: ~${Math.round(cal.busyMinutesToday)} minutes.`
          : "";
      setHtml(
        ui.googleCalStatus,
        `<span class="pill">${escapeHtml(gCal.authMethod || "connected")}</span> Connected.${busy}${err}`
      );
    } else {
      setHtml(ui.googleCalStatus, oauth.googleOAuth ? "Not connected yet." : "Add Google OAuth env vars to enable.");
    }
    ui.googleCalStatus.innerHTML = normalizeUiText(ui.googleCalStatus.innerHTML);
  }
  if (ui.aiSetupForm) {
    const ai = dashboard.state.profile?.ai || {};
    const baseUrl = ui.aiSetupForm.elements.namedItem("baseUrl");
    const model = ui.aiSetupForm.elements.namedItem("model");
    if (baseUrl) baseUrl.value = ai.baseUrl || "";
    if (model) model.value = ai.model || "";
  }
  if (ui.pluginSettingsForm) {
    const plugins = dashboard.state.profile?.plugins || {};
    const gmailMode = ui.pluginSettingsForm.elements.namedItem("gmailMode");
    const googleCalendarWritable = ui.pluginSettingsForm.elements.namedItem("googleCalendarWritable");
    const slackEnabled = ui.pluginSettingsForm.elements.namedItem("slackEnabled");
    const stripeEnabled = ui.pluginSettingsForm.elements.namedItem("stripeEnabled");
    const webhookEnabled = ui.pluginSettingsForm.elements.namedItem("webhookEnabled");
    const webhookUrl = ui.pluginSettingsForm.elements.namedItem("webhookUrl");
    if (gmailMode) gmailMode.value = plugins.gmail?.mode || "draft_only";
    if (googleCalendarWritable) googleCalendarWritable.value = String(Boolean(plugins.googleCalendar?.writable));
    if (slackEnabled) slackEnabled.value = String(Boolean(plugins.slack?.enabled));
    if (stripeEnabled) stripeEnabled.value = String(Boolean(plugins.stripe?.enabled));
    if (webhookEnabled) webhookEnabled.value = String(Boolean(plugins.webhook?.enabled));
    if (webhookUrl) webhookUrl.value = plugins.webhook?.url || "";
  }
  if (ui.worldContextForm) {
    const world = dashboard.state.profile?.worldContext || {};
    ["locationLabel", "weather", "newsSignal", "commuteMinutes", "sleepHours", "workMode"].forEach((name) => {
      const field = ui.worldContextForm.elements.namedItem(name);
      if (!field) return;
      field.value = world[name] ?? (name === "workMode" ? "auto" : "");
    });
  }
  if (ui.autopilotSettingsForm) {
    const settings = dashboard.state.profile?.autopilot || {};
    ["enabled", "mode", "approvalMode", "maxDailyDeepTasks"].forEach((name) => {
      const field = ui.autopilotSettingsForm.elements.namedItem(name);
      if (!field) return;
      if (name === "enabled") field.value = String(Boolean(settings.enabled));
      else field.value = settings[name] ?? "";
    });
  }
  if (ui.privacySettingsForm) {
    const privacy = dashboard.state.profile?.privacy || {};
    ["dataSharing", "localFirst", "offlinePreferred"].forEach((name) => {
      const field = ui.privacySettingsForm.elements.namedItem(name);
      if (!field) return;
      if (typeof privacy[name] === "boolean") field.value = String(Boolean(privacy[name]));
      else field.value = privacy[name] ?? "";
    });
  }
  const notionCfg = dashboard.state.profile?.integrations?.notion;
  if (notionCfg?.enabled && notionCfg?.token) {
    ui.notionSyncBtn?.classList.remove("hidden");
  } else {
    ui.notionSyncBtn?.classList.add("hidden");
  }
  setHtml(ui.topMetrics, [
    `Open ${dashboard.stats.openTasks}`,
    `Projects ${dashboard.stats.projectCount}`,
    `Team ${dashboard.stats.teamCount}`,
    `Queued ${dashboard.autonomy?.executions?.filter((item) => item.status !== "completed" && item.status !== "cancelled")?.length || 0}`,
    `Autopilot ${dashboard.meta?.autopilot?.ready ? "active" : "preview"}`,
    `Mode ${dashboard.advanced.behaviorModel.operatingMode}`
  ].map((item) => `<span class="metric-pill">${escapeHtml(item)}</span>`).join(""));
  setHtml(ui.statsGrid, [
    ["Open tasks", dashboard.stats.openTasks],
    ["Completed", dashboard.stats.completedTasks],
    ["Goals", dashboard.stats.goalCount],
    ["Team", dashboard.stats.teamCount],
    ["Workflows", dashboard.stats.workflowCount]
  ].map(([label, value]) => `<div class="stat-card"><div class="stat-label">${escapeHtml(label)}</div><div class="stat-value">${escapeHtml(value)}</div></div>`).join(""));
  setHtml(ui.dailyPlan, (dashboard.dailyPlan || []).length ? dashboard.dailyPlan.map((item) => `<li><strong>${escapeHtml(item.title)}</strong> - ${escapeHtml(item.durationMins)} mins</li>`).join("") : `<li class="empty-state">Add tasks and Buksy will shape the day here.</li>`);

  const sp = dashboard.schedulePreview;
  if (ui.schedulePreviewCard) {
    if (sp?.summary) {
      const s = sp.summary;
      const warn = (sp.warnings || []).map((w) => `<div class="schedule-warning schedule-warning--compact"><i class="ph ph-warning"></i> ${escapeHtml(w)}</div>`).join("");
      const dayLines = (sp.days || [])
        .filter((d) => d.isToday || (d.tasks && d.tasks.length > 0))
        .slice(0, 8)
        .map((d) => {
          const names = (d.tasks || [])
            .slice(0, 4)
            .map((t) => escapeHtml(t.title))
            .join(" · ");
          const more = (d.tasks || []).length > 4 ? ` (+${d.tasks.length - 4} more)` : "";
          return `<li><strong>${escapeHtml(d.date)}</strong>${d.isToday ? " (today)" : ""} — ${names || "—"}${more}</li>`;
        })
        .join("");
      setHtml(
        ui.schedulePreviewCard,
        `
        <p class="panel-kicker">Multi-project outlook</p>
        <p class="note-copy">${escapeHtml(s.totalOpenTasks || 0)} open tasks across ${escapeHtml(s.scheduledDays || 0)} days. ${s.atRiskProjects ? `${escapeHtml(s.atRiskProjects)} project(s) need attention.` : ""}</p>
        ${warn ? `<div class="stack-warn">${warn}</div>` : ""}
        <ol class="plan-list">${dayLines || "<li class=\"empty-state\">Add due dates or project deadlines to see a cross-project timeline.</li>"}</ol>
        <p class="note-copy">Buksy respects carry-forward dates and your latest check-in. Open <strong>Schedule</strong> for the full view.</p>
      `
      );
      ui.schedulePreviewCard.innerHTML = normalizeUiText(ui.schedulePreviewCard.innerHTML).replaceAll(" - -", " - No tasks");
    } else {
      setHtml(ui.schedulePreviewCard, `<p class="empty-state">Schedule preview will appear when you have open tasks.</p>`);
    }
  }

  const suggestion = dashboard.suggestion?.task ? `
    <p class="panel-kicker">Best next action</p>
    <h3 class="suggestion-title">${escapeHtml(dashboard.suggestion.task.title)}</h3>
    <p class="suggestion-copy">${escapeHtml(dashboard.suggestion.coachMessage)}</p>
    <div class="meta-row">
      <span class="pill">${escapeHtml(dashboard.suggestion.task.category)}</span>
      <span class="pill">${escapeHtml(dashboard.suggestion.task.priority)} priority</span>
      <span class="pill">${escapeHtml(dashboard.suggestion.task.durationMins)} mins</span>
    </div>
    ${listHtml(dashboard.suggestion.reasons || [], "No reasons yet.")}
    <div class="divider"></div>
    <div class="action-row">
      <button class="primary-button" type="button" data-feedback-kind="completed" data-task-id="${escapeHtml(dashboard.suggestion.task.id)}">I did it</button>
      <button class="soft-button" type="button" data-feedback-kind="helpful" data-task-id="${escapeHtml(dashboard.suggestion.task.id)}">Helpful</button>
      <button class="ghost-button" type="button" data-feedback-kind="skipped" data-task-id="${escapeHtml(dashboard.suggestion.task.id)}">Not now</button>
      <button class="danger-button" type="button" data-feedback-kind="not_helpful" data-task-id="${escapeHtml(dashboard.suggestion.task.id)}">Bad pick</button>
    </div>
  ` : `<p class="empty-state">Add a task, project, or goal and Buksy will choose the smartest next move here.</p>`;
  setHtml(ui.suggestionCard, suggestion);
  setHtml(ui.dailyBriefCard, normalizeUiText(dailyBriefHtml(dashboard)));
  setHtml(ui.assistantActionCard, latestAssistantAction(dashboard));

  setHtml(ui.predictiveDayCard, objectHtml(dashboard.advanced.predictiveDay || {}));
  setHtml(ui.cognitiveLoadCard, objectHtml(dashboard.advanced.cognitiveLoad || {}));
  setHtml(ui.focusGuardCard, objectHtml(dashboard.advanced.focusGuard || {}));
  setHtml(ui.consequenceCard, (dashboard.advanced.delayedConsequences || []).map((item) => `<div class="mini-card"><strong>${escapeHtml(item.title)}</strong><p class="note-copy">${escapeHtml(item.message)}</p></div>`).join("") || `<p class="empty-state">No major downstream risk yet.</p>`);
  setHtml(ui.priorityRebalanceCard, objectHtml(dashboard.advanced.priorityRebalance || {}));
  setHtml(ui.constraintResult, latestPayload("constraint") ? objectHtml(latestPayload("constraint")) : `<p class="empty-state">Solve a time window and Buksy will fit the best tasks here.</p>`);
  setHtml(ui.behaviorModelCard, objectHtml(dashboard.advanced.behaviorModel || {}));
  setHtml(ui.reflectionCard, listHtml(dashboard.advanced.reflectionMemory || [], "No reflection memory yet."));
  setHtml(ui.weaknessCard, objectHtml(dashboard.advanced.weaknessReport || {}));
  setHtml(ui.goalHealthCard, [...(dashboard.advanced.futureYou || []).map((item) => item.message), ...(dashboard.advanced.driftAlerts || []).map((item) => item.message)].length ? listHtml([...(dashboard.advanced.futureYou || []).map((item) => item.message), ...(dashboard.advanced.driftAlerts || []).map((item) => item.message)], "No future pressure signal yet.") : `<p class="empty-state">Create a goal and Buksy will model forward pressure here.</p>`);
  setHtml(ui.conversation, (dashboard.state.conversations || []).slice(-12).map((message) => `<div class="bubble ${escapeHtml(message.role)}">${escapeHtml(message.text)}</div>`).join(""));
  if (ui.conversation) ui.conversation.scrollTop = ui.conversation.scrollHeight;
  setHtml(ui.learningInsights, (dashboard.learningInsights || []).length ? dashboard.learningInsights.map((item) => `<li>${escapeHtml(item)}</li>`).join("") : `<li>Buksy is still learning your preferences.</li>`);
  setHtml(ui.workspaceOpportunityCard, listHtml([...(dashboard.workspace.opportunityScanner || []), ...(dashboard.advanced.opportunities || []).map((item) => item.message)], "Buksy is scanning for opportunities across your work."));
  setHtml(ui.workspaceSurpriseCard, listHtml([...(dashboard.workspace.surpriseInsights || []), ...(dashboard.workspace.hiddenInsights || [])], "Surprise insights will appear as Buksy sees more patterns."));
  setHtml(ui.analyticsSummary, analyticsSummaryHtml(dashboard.analytics || {}));
  setHtml(ui.analyticsWeeklyCard, listHtml(dashboard.analytics?.weekly?.report || [], "Buksy is still collecting enough data for a weekly report."));
  setHtml(ui.analyticsPerformanceCard, performanceHtml(dashboard.analytics?.performance || {}));
  setHtml(ui.analyticsBurnoutCard, burnoutHtml(dashboard.analytics?.burnout || {}));
  setHtml(ui.analyticsGoalProbabilityCard, goalProbabilityHtml(dashboard.analytics?.goals || []));
  setHtml(ui.analyticsAvoidanceCard, avoidanceHtml(dashboard.analytics?.avoidance || []));
  setHtml(ui.analyticsPersonalizationCard, personalizationHtml(dashboard.analytics?.personalization || {}));
  setHtml(ui.analyticsUsageCard, usageHtml(dashboard.analytics?.usage || {}));
  setHtml(ui.digitalTwinCard, digitalTwinHtml(dashboard.meta?.digitalTwin || {}));
  setHtml(ui.futureTimelineCard, futureTimelineHtml(dashboard.meta?.futureTimelines || {}));
  setHtml(ui.habitDnaCard, habitDnaHtml(dashboard.meta?.habitDna || {}));
  setHtml(ui.emotionalIntelligenceCard, emotionalIntelligenceHtml(dashboard.meta?.emotionalIntelligence || {}));
  setHtml(ui.playbooksCard, playbooksHtml(dashboard.meta?.playbooks || {}));
  setHtml(ui.strategyEngineCard, strategyHtml(dashboard.meta?.strategyEngine || {}));
  setHtml(ui.subconsciousPatternsCard, subconsciousHtml(dashboard.meta?.subconsciousPatterns || {}));
  setHtml(ui.gamificationCard, gamificationHtml(dashboard.meta?.gamification || {}));
  setHtml(ui.privacyModeCard, privacyHtml(dashboard.meta?.privacyMode || {}));
  setHtml(ui.teamBrainCard, teamBrainHtml(dashboard.meta?.teamBrain || {}));
  setHtml(ui.contextEngineCard, contextEngineHtml(dashboard.meta?.contextEngine || {}));
  setHtml(ui.metaLearningCard, metaLearningHtml(dashboard.meta?.metaLearning || {}));
  setHtml(ui.autopilotAnalyticsCard, autopilotHtml(dashboard.meta?.autopilot || {}));

  const openTasks = (dashboard.state.tasks || []).filter((task) => task.status === "open");
  const doneTasks = (dashboard.state.tasks || []).filter((task) => task.status === "completed").slice(0, 10);
  setHtml(ui.openTasks, openTasks.length ? openTasks.map((task) => taskCard(task, { projects: projectMap, goals: goalMap })).join("") : `<p class="empty-state">Your open task list is empty.</p>`);
  setHtml(ui.completedTasks, doneTasks.length ? doneTasks.map((task) => taskCard(task, { projects: projectMap, goals: goalMap }, true)).join("") : `<p class="empty-state">Completed work will collect here.</p>`);
  setHtml(ui.projectCards, (dashboard.workspace.projectSnapshots || []).length ? dashboard.workspace.projectSnapshots.map((project) => `<article class="mini-card project-snapshot"><div class="task-card-header"><div><h4>${escapeHtml(project.name)}</h4><p class="note-copy">${escapeHtml(project.description || "No description yet.")}</p></div><span class="status-chip">${escapeHtml(project.status)}</span></div><div class="pill-row"><span class="pill">${escapeHtml(project.counts.openTasks)} open tasks</span><span class="pill">${escapeHtml(project.counts.goals)} goals</span><span class="pill">${escapeHtml(project.counts.knowledge)} vault items</span><span class="pill">${escapeHtml(project.counts.artifacts)} artifacts</span></div></article>`).join("") : `<p class="empty-state">Create a project and Buksy will keep its memory separate here.</p>`);
  setHtml(ui.goalCards, (dashboard.advanced.goals || []).length ? dashboard.advanced.goals.map((goal) => `<article class="goal-card"><div class="goal-card-header"><div><h4>${escapeHtml(goal.title)}</h4><p class="note-copy">${escapeHtml(goal.progressLabel || "No linked tasks yet.")}</p></div><span class="status-chip">${escapeHtml(goal.status)}</span></div><div class="meta-row"><span class="pill">${escapeHtml(goal.theme)}</span><span class="pill">${escapeHtml(formatDate(goal.targetDate))}</span></div>${listHtml((goal.weeklyRoadmap || []).map((step) => `${step.label} - ${step.focus}: ${(step.moves || []).join(", ")}`), "No roadmap yet.")}</article>`).join("") : `<p class="empty-state">No goals yet. Build one and Buksy will reverse-plan it here.</p>`);
  setHtml(ui.trendWatchCard, objectHtml(dashboard.workspace.trendWatch || {}));
  setHtml(ui.memoryGraphCard, memoryGraphHtml(dashboard.advanced.memoryGraph || {}));
  setHtml(ui.artifactStream, (dashboard.state.artifacts || []).slice(0, 10).map((artifact) => `<div class="mini-card dense-card"><div class="task-card-header"><div><strong>${escapeHtml(artifact.title)}</strong><p class="note-copy">${escapeHtml(artifact.category || artifact.kind)}</p></div><span class="status-chip">${escapeHtml(artifact.kind)}</span></div><p class="note-copy">${escapeHtml(formatDate(artifact.createdAt, true))}</p></div>`).join("") || `<p class="empty-state">Generated briefs, simulations, and other artifacts will collect here.</p>`);
  setHtml(ui.pluginCatalog, pluginCatalogHtml(dashboard.autonomy?.plugins || []));
  setHtml(ui.executionQueue, executionQueueHtml(dashboard.autonomy?.executions || []));
  setHtml(ui.automationSuggestions, automationSuggestionsHtml(dashboard.autonomy?.automationSuggestions || []));
  setHtml(
    ui.automationWorkflowList,
    automationWorkflowHtml(
      (dashboard.state.workflows || []).filter((workflow) =>
        workflow.type === "automation" || ["task_overdue", "low_energy", "developer_pr"].includes(String(workflow.trigger || "").trim().toLowerCase())
      )
    )
  );

  Object.entries(artifactTargets).forEach(([kind, target]) => {
    setHtml(ui[target], latestPayload(kind) ? artifactHtml(kind, latestPayload(kind)) : `<p class="empty-state">No result here yet.</p>`);
  });
  setHtml(ui.workflowResult, state.workflowBlueprint ? objectHtml(state.workflowBlueprint) : state.dashboard?.state?.workflows?.[0] ? objectHtml(state.dashboard.state.workflows[0]) : `<p class="empty-state">Built workflows will appear here.</p>`);
  setHtml(ui.executionPlannerResult, executionPreviewHtml(state.latestExecution || dashboard.autonomy?.executions?.[0]));
  setHtml(ui.automationBuildResult, state.automationDraft ? objectHtml(state.automationDraft) : `<p class="empty-state">Create an automation and Buksy will show the trigger and safeguard details here.</p>`);
  setHtml(ui.delayExplainResult, state.delayAnalysis ? objectHtml(state.delayAnalysis) : `<p class="empty-state">Ask Buksy why something is delayed and it will break down the likely reasons here.</p>`);
  setHtml(ui.timeSimulationResult, state.timeSimulation ? timeSimulationHtml(state.timeSimulation) : timeSimulationHtml(latestPayload("time-simulation")));
  setHtml(ui.digitalTwinSimulationResult, state.twinSimulation ? objectHtml(state.twinSimulation) : latestPayload("digital-twin-simulation") ? artifactHtml("digital-twin-simulation", latestPayload("digital-twin-simulation")) : `<p class="empty-state">Run a digital twin simulation to see how Buksy expects you to respond.</p>`);
  setHtml(ui.voiceCommandResult, voiceCommandHtml(state.voiceCommand));
  ui.voiceCommandConfirmBtn?.classList.toggle("hidden", !(state.voiceCommand?.requires_confirmation));
  setHtml(ui.voiceJournalResult, state.voiceJournal ? objectHtml(state.voiceJournal) : latestPayload("voice-journal") ? artifactHtml("voice-journal", latestPayload("voice-journal")) : `<p class="empty-state">Voice summaries, extracted tasks, and reflection insights will show here.</p>`);
  setHtml(ui.worldContextResult, state.worldContext ? objectHtml(state.worldContext) : objectHtml(dashboard.meta?.contextEngine || {}));
  setHtml(ui.autopilotResult, state.autopilotRun ? objectHtml(state.autopilotRun) : latestPayload("autopilot-run") ? artifactHtml("autopilot-run", latestPayload("autopilot-run")) : autopilotHtml(dashboard.meta?.autopilot || {}));
  setHtml(ui.goalAutoplanResult, state.goalAutoplan ? objectHtml(state.goalAutoplan) : latestPayload("autonomous-goal-plan") ? artifactHtml("autonomous-goal-plan", latestPayload("autonomous-goal-plan")) : `<p class="empty-state">Run a full AI goal plan and Buksy will show the roadmap, tasks, and mitigation here.</p>`);
  setHtml(ui.teamResult, state.teamUpdate ? objectHtml(state.teamUpdate) : objectHtml(dashboard.meta?.teamBrain || {}));
  setHtml(ui.pluginSettingsResult, state.pluginUpdate ? objectHtml(state.pluginUpdate) : `<p class="empty-state">Plugin settings will be reflected here after you save them.</p>`);
  setHtml(ui.developerImportResult, state.developerImport ? objectHtml(state.developerImport) : latestPayload("developer-sync") ? artifactHtml("developer-sync", latestPayload("developer-sync")) : `<p class="empty-state">Developer mode imports PR pressure into tasks and shows the result here.</p>`);
  const vaultItems = state.knowledgeQuery?.items || (dashboard.state.knowledge || []).slice(0, 8);
  setHtml(ui.knowledgeResults, vaultItems.length ? vaultItems.map((item) => `<div class="mini-card dense-card"><div class="task-card-header"><div><strong>${escapeHtml(item.title || "Untitled")}</strong><p class="note-copy">${escapeHtml(String(item.content || "").slice(0, 180))}${String(item.content || "").length > 180 ? "..." : ""}</p></div><span class="status-chip">${escapeHtml(item.category || item.type || "item")}</span></div><p class="note-copy">${escapeHtml(formatDate(item.createdAt, true))}</p></div>`).join("") : `<p class="empty-state">The vault is empty. Save notes, research, or files to start building memory.</p>`);
}

async function refreshDashboard() {
  renderDashboard(await api("/api/state"));
  refreshAiStatus().catch(() => {});
  refreshMlMetrics().catch(() => {});
}

function renderAuth() {
  const auth = state.auth;
  if (!auth) {
    return;
  }
  if (!auth.authRequired) {
    ui.authCard?.classList.add("hidden");
    return;
  }
  ui.authCard?.classList.remove("hidden");
  ui.authLocalNote?.classList.add("hidden");
  ui.authError && (ui.authError.textContent = "");
  if (auth.user) {
    ui.authLoggedOut?.classList.add("hidden");
    ui.authLoggedIn?.classList.remove("hidden");
    if (ui.authEmail) ui.authEmail.textContent = auth.user.email;
  } else {
    ui.authLoggedIn?.classList.add("hidden");
    ui.authLoggedOut?.classList.remove("hidden");
  }
}

async function refreshAuth() {
  const data = await api("/api/auth/status");
  state.auth = data;
  renderAuth();
}

async function refreshAiStatus() {
  const response = await api("/api/ai/status");
  renderAiStatus(response.status);
}

async function refreshMlMetrics() {
  const response = await api("/api/ml/metrics");
  renderMlMetrics(response.metrics);
}

async function uploadedText(file) {
  if (!file) return "";
  try {
    return await file.text();
  } catch {
    return "";
  }
}

async function runAndRefresh(task, message) {
  await task();
  if (message) flash(message);
  await refreshDashboard();
}

function bindJsonForm(id, path, message, mutate) {
  ui[id]?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const payload = mutate ? await mutate(formObject(ui[id])) : formObject(ui[id]);
      const response = await api(path, { method: "POST", body: JSON.stringify(payload) });
      if (id === "workflowForm") state.workflowBlueprint = response.result;
      if (id === "knowledgeQueryForm") state.knowledgeQuery = response.result;
      if (id === "knowledgeQueryForm") {
        flash(`Found ${response.result.count} matching item${response.result.count === 1 ? "" : "s"}.`);
        renderDashboard(state.dashboard || { state: { knowledge: [] }, latestArtifacts: {}, advanced: {}, workspace: {}, stats: {}, dailyPlan: [], learningInsights: [], context: {} });
        return;
      }
      flash(message);
      await refreshDashboard();
      if (id === "taskForm") {
        ui.taskForm.reset();
        ui.taskForm.elements.namedItem("durationMins").value = 25;
      }
      if (id === "goalForm") {
        ui.goalForm.reset();
        ui.goalForm.elements.namedItem("targetDays").value = 20;
      }
      if (["projectForm", "knowledgeForm"].includes(id)) ui[id].reset();
    } catch (error) {
      flash(error.message);
    }
  });
}

bindJsonForm("taskForm", "/api/tasks", "Task added to Buksy.", (payload) => ({ ...payload, durationMins: Number(payload.durationMins || 25) }));
bindJsonForm("checkinForm", "/api/checkins", "Buksy updated your mode.");
bindJsonForm("projectForm", "/api/projects", "Project space created.");
bindJsonForm("goalForm", "/api/goals", "Goal roadmap created.", (payload) => ({ ...payload, targetDays: Number(payload.targetDays || 20) }));
bindJsonForm("constraintForm", "/api/constraints/solve", "Constraint plan updated.", (payload) => ({ ...payload, availableMinutes: Number(payload.availableMinutes || 120) }));
bindJsonForm("docForm", "/api/docs/build", "Document built.");
bindJsonForm("todoBuilderForm", "/api/todos/build", "To-do list built.");
bindJsonForm("researchForm", "/api/research", "Research brief created.");
bindJsonForm("compareForm", "/api/compare", "Comparison updated.");
bindJsonForm("debateForm", "/api/debate", "Debate generated.");
bindJsonForm("decisionForm", "/api/decisions/analyze", "Decision timeline updated.", (payload) => ({ ...payload, horizonDays: Number(payload.horizonDays || 90) }));
bindJsonForm("meetingForm", "/api/meetings/analyze", "Meeting summary ready.");
bindJsonForm("hiddenInsightForm", "/api/insights/hidden", "Hidden insight scan complete.");
bindJsonForm("ideasForm", "/api/ideas/generate", "Idea set generated.", (payload) => ({ ...payload, count: Number(payload.count || 5) }));
bindJsonForm("multiAgentForm", "/api/multi-agent/analyze", "Multi-agent thinking complete.");
bindJsonForm("simulationForm", "/api/simulations/run", "Simulation complete.", (payload) => ({ ...payload, currentValue: Number(payload.currentValue || 100), changePercent: Number(payload.changePercent || 0) }));
bindJsonForm("presentationForm", "/api/presentations/build", "Presentation structure created.", (payload) => ({ ...payload, durationMins: Number(payload.durationMins || 15) }));
bindJsonForm("learningForm", "/api/learning", "Learning plan created.");
bindJsonForm("roleForm", "/api/role/analyze", "Role analysis ready.");
bindJsonForm("actionHubForm", "/api/action-hub", "Action pack created.");
bindJsonForm("negotiationForm", "/api/negotiation", "Negotiation draft ready.");
bindJsonForm("workflowForm", "/api/workflows/build", "Workflow blueprint created.");
bindJsonForm("sandboxForm", "/api/sandbox", "Sandbox finished.");
bindJsonForm("knowledgeForm", "/api/knowledge/add", "Saved to the vault.");
bindJsonForm("knowledgeQueryForm", "/api/knowledge/query", "");

ui.executionPlanForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = formObject(ui.executionPlanForm);
    if (!payload.actionType) delete payload.actionType;
    const response = await api("/api/actions/plan", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.latestExecution = response.execution;
    flash("Action planned. Review it in the execution queue.");
    await refreshDashboard();
  } catch (error) {
    flash(error.message);
  }
});

ui.automationBuildForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = formObject(ui.automationBuildForm);
    const response = await api("/api/automations/build", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        enabled: payload.enabled === "true"
      })
    });
    state.automationDraft = response.result;
    flash("Automation created.");
    await refreshDashboard();
  } catch (error) {
    flash(error.message);
  }
});

ui.runAutomationsBtn?.addEventListener("click", async () => {
  try {
    const response = await api("/api/automations/run", {
      method: "POST",
      body: JSON.stringify({})
    });
    state.automationDraft = response;
    flash("Buksy ran the active automation rules.");
    await refreshDashboard();
  } catch (error) {
    flash(error.message);
  }
});

ui.autopilotSettingsForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = formObject(ui.autopilotSettingsForm);
    const response = await api("/api/autopilot/settings", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        enabled: payload.enabled === "true",
        maxDailyDeepTasks: Number(payload.maxDailyDeepTasks || 3)
      })
    });
    state.autopilotRun = response.autopilot;
    flash("Autopilot settings saved.");
    await refreshDashboard();
  } catch (error) {
    flash(error.message);
  }
});

ui.runAutopilotBtn?.addEventListener("click", async () => {
  try {
    const response = await api("/api/autopilot/run", {
      method: "POST",
      body: JSON.stringify({})
    });
    state.autopilotRun = {
      ...response.result,
      adjustedTasks: response.adjustedTasks || [],
      createdExecutions: response.createdExecutions || []
    };
    flash("Buksy ran life autopilot.");
    await refreshDashboard();
  } catch (error) {
    flash(error.message);
  }
});

ui.worldContextForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = formObject(ui.worldContextForm);
    const response = await api("/api/world-context", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        commuteMinutes: Number(payload.commuteMinutes || 0),
        sleepHours: Number(payload.sleepHours || 0)
      })
    });
    state.worldContext = response.contextEngine;
    flash("Outside-world context updated.");
    await refreshDashboard();
  } catch (error) {
    flash(error.message);
  }
});

ui.teamMemberForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = formObject(ui.teamMemberForm);
    const response = await api("/api/team/members", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.teamUpdate = {
      member: response.member,
      teamBrain: response.teamBrain
    };
    flash("Teammate added.");
    ui.teamMemberForm.reset();
    const availability = ui.teamMemberForm.elements.namedItem("availability");
    if (availability) availability.value = "full";
    await refreshDashboard();
  } catch (error) {
    flash(error.message);
  }
});

ui.goalAutoplanForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = formObject(ui.goalAutoplanForm);
    const response = await api("/api/goals/autoplan", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        targetDays: Number(payload.targetDays || 30)
      })
    });
    state.goalAutoplan = {
      result: response.result,
      goal: response.goal,
      tasks: response.tasks
    };
    flash("Autonomous goal plan created.");
    await refreshDashboard();
  } catch (error) {
    flash(error.message);
  }
});

ui.digitalTwinSimulationForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = formObject(ui.digitalTwinSimulationForm);
    const response = await api("/api/twin/simulate", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.twinSimulation = response.result;
    flash("Digital twin simulation ready.");
    if (state.dashboard) renderDashboard(state.dashboard);
  } catch (error) {
    flash(error.message);
  }
});

ui.privacySettingsForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = formObject(ui.privacySettingsForm);
    const response = await api("/api/privacy/settings", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        localFirst: payload.localFirst === "true",
        offlinePreferred: payload.offlinePreferred === "true"
      })
    });
    state.privacyUpdate = response.privacyMode;
    flash("Privacy mode updated.");
    await refreshDashboard();
  } catch (error) {
    flash(error.message);
  }
});

ui.timeSimulationForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = formObject(ui.timeSimulationForm);
    const response = await api("/api/time/simulate", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        dailyHours: Number(payload.dailyHours || 2),
        includeWeekends: payload.includeWeekends === "true",
        daysOff: String(payload.daysOff || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      })
    });
    state.timeSimulation = response.result;
    flash("Time simulation updated.");
    await refreshDashboard();
  } catch (error) {
    flash(error.message);
  }
});

ui.delayExplainForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = formObject(ui.delayExplainForm);
    const response = await api("/api/analytics/explain-delay", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.delayAnalysis = response.analysis;
    flash("Delay analysis ready.");
    if (state.dashboard) renderDashboard(state.dashboard);
  } catch (error) {
    flash(error.message);
  }
});

ui.pluginSettingsForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = formObject(ui.pluginSettingsForm);
    const current = state.dashboard?.state?.profile?.plugins || {};
    const response = await api("/api/plugins", {
      method: "POST",
      body: JSON.stringify({
        gmail: {
          ...(current.gmail || {}),
          enabled: true,
          mode: payload.gmailMode || "draft_only"
        },
        googleCalendar: {
          ...(current.googleCalendar || {}),
          enabled: true,
          writable: payload.googleCalendarWritable === "true"
        },
        slack: {
          ...(current.slack || {}),
          enabled: payload.slackEnabled === "true"
        },
        stripe: {
          ...(current.stripe || {}),
          enabled: payload.stripeEnabled === "true"
        },
        webhook: {
          ...(current.webhook || {}),
          enabled: payload.webhookEnabled === "true",
          url: payload.webhookUrl || ""
        }
      })
    });
    state.pluginUpdate = response.config;
    flash("Plugin settings saved.");
    await refreshDashboard();
  } catch (error) {
    flash(error.message);
  }
});

function shouldSpeakVoiceReply() {
  return ui.voiceCommandSpeakMode?.value !== "false";
}

function speakOutLoud(text) {
  if (!shouldSpeakVoiceReply() || !("speechSynthesis" in window) || !text) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(String(text).trim());
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function isConfirmationPhrase(text) {
  return /^(confirm|yes|do it|go ahead|proceed|yes do it)$/i.test(String(text || "").trim());
}

async function runVoiceCommand(options = {}) {
  const confirmed = options.confirmed === true;
  const payload = ui.voiceCommandForm ? formObject(ui.voiceCommandForm) : {};
  const text = ui.voiceCommandTranscript?.value.trim() || "";
  const body = options.plan
    ? {
        plan: options.plan,
        confirmed: true,
        execute: true
      }
    : {
        text,
        execute: payload.execute === "true"
      };

  if (!options.plan && !text) {
    flash("Say something first so Buksy has a command to work with.");
    return;
  }

  const response = await api("/api/voice/command", {
    method: "POST",
    body: JSON.stringify(body)
  });
  state.voiceCommand = response;
  flash(response.requires_confirmation && !confirmed ? "Voice command needs confirmation." : "Voice command processed.");
  await refreshDashboard();
  if (response.response) {
    speakOutLoud(response.response);
  }
}

ui.voiceCommandForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const text = ui.voiceCommandTranscript?.value.trim() || "";
    if (state.voiceCommand?.requires_confirmation && isConfirmationPhrase(text)) {
      await runVoiceCommand({ confirmed: true, plan: state.voiceCommand });
      if (ui.voiceCommandTranscript) ui.voiceCommandTranscript.value = "";
      return;
    }
    await runVoiceCommand();
  } catch (error) {
    flash(error.message);
  }
});

ui.voiceCommandConfirmBtn?.addEventListener("click", async () => {
  try {
    if (!state.voiceCommand?.requires_confirmation) {
      flash("There is no pending voice action to confirm.");
      return;
    }
    await runVoiceCommand({ confirmed: true, plan: state.voiceCommand });
  } catch (error) {
    flash(error.message);
  }
});

ui.voiceJournalForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = formObject(ui.voiceJournalForm);
    const response = await api("/api/voice/journal", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        createTasks: payload.createTasks === "true",
        saveToKnowledge: payload.saveToKnowledge === "true"
      })
    });
    state.voiceJournal = {
      ...response.result,
      createdTasks: response.createdTasks || []
    };
    flash("Voice journal processed.");
    await refreshDashboard();
  } catch (error) {
    flash(error.message);
  }
});

ui.developerImportBtn?.addEventListener("click", async () => {
  try {
    const response = await api("/api/developer/github/import", {
      method: "POST",
      body: JSON.stringify({})
    });
    state.developerImport = response;
    flash(`Imported ${response.createdTasks?.length || 0} developer tasks.`);
    await refreshDashboard();
  } catch (error) {
    flash(error.message);
  }
});

ui.fileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = formObject(ui.fileForm);
    const primaryFile = ui.fileInput?.files?.[0];
    const compareFile = ui.compareFileInput?.files?.[0];
    const content = payload.manualText?.trim() || await uploadedText(primaryFile);
    const compareContent = await uploadedText(compareFile);
    if (!content && primaryFile && !payload.manualText?.trim()) flash("For PDFs, docs, or images, paste extracted text for the best local analysis.");
    await runAndRefresh(() => api("/api/files/analyze", {
      method: "POST",
      body: JSON.stringify({
        projectId: payload.projectId,
        fileName: primaryFile?.name || "Untitled file",
        fileType: primaryFile?.type || "",
        content,
        compareContent,
        saveToKnowledge: payload.saveToKnowledge === "true"
      })
    }), "File analysis ready.");
  } catch (error) {
    flash(error.message);
  }
});

ui.chatForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = ui.chatInput?.value.trim();
  if (!message) return;
  try {
    await api("/api/chat", { method: "POST", body: JSON.stringify({ message }) });
    ui.chatInput.value = "";
    await refreshDashboard();
  } catch (error) {
    flash(error.message);
  }
});

ui.aiSetupForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = formObject(ui.aiSetupForm);
    const response = await api("/api/ai/settings", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    renderAiStatus(response.status);
    flash(response.status.connected ? "Buksy saved the Ollama settings." : "Settings saved. Ollama still needs to come online.");
    await refreshDashboard();
  } catch (error) {
    flash(error.message);
  }
});

ui.refreshSuggestionBtn?.addEventListener("click", async () => {
  try {
    await runAndRefresh(() => api("/api/suggestions/refresh", { method: "POST", body: JSON.stringify({}) }), "Buksy refreshed the recommendation.");
  } catch (error) {
    flash(error.message);
  }
});

document.body.addEventListener("click", (event) => {
  const promptButton = event.target.closest("[data-chat-prompt]");
  if (!promptButton || !ui.chatInput) return;
  ui.chatInput.value = promptButton.dataset.chatPrompt;
  ui.chatInput.focus();
});

document.body.addEventListener("click", async (event) => {
  const feedbackButton = event.target.closest("[data-feedback-kind]");
  const deleteButton = event.target.closest("[data-delete-task-id]");
  const focusButton = event.target.closest("[data-focus-task-id]");
  try {
    if (feedbackButton) {
      const response = await api("/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          taskId: feedbackButton.dataset.taskId,
          kind: feedbackButton.dataset.feedbackKind
        })
      });
      const moved = Number(response?.feedback?.autoAdjustment?.movedTaskCount || 0);
      flash(
        moved > 0
          ? `Buksy learned and auto-shifted ${moved} lower-pressure task${moved === 1 ? "" : "s"} to tomorrow.`
          : "Buksy learned from that signal."
      );

      if (response?.feedback?.autoAdjustment?.shouldPromptCheckin) {
        const energy = window.prompt("Quick check-in: energy right now? (high / medium / low)", "medium");
        const focus = window.prompt("Focus right now? (locked_in / steady / scattered)", "steady");
        const mood = window.prompt("Mood in one word (optional)", "");
        const safeEnergy = ["high", "medium", "low"].includes(String(energy || "").trim().toLowerCase())
          ? String(energy || "").trim().toLowerCase()
          : "medium";
        const safeFocus = ["locked_in", "steady", "scattered"].includes(String(focus || "").trim().toLowerCase())
          ? String(focus || "").trim().toLowerCase()
          : "steady";
        await api("/api/checkins", {
          method: "POST",
          body: JSON.stringify({
            energy: safeEnergy,
            focus: safeFocus,
            mood: String(mood || "").trim()
          })
        });
        flash("Check-in saved. Buksy will adapt upcoming workload automatically.");
      }

      await refreshDashboard();
      return;
    }
    if (focusButton) {
      await runAndRefresh(() => api("/api/activity", { method: "POST", body: JSON.stringify({ type: "focus_task", taskId: focusButton.dataset.focusTaskId }) }), "Focus session logged.");
      return;
    }
    if (deleteButton) {
      await runAndRefresh(() => api(`/api/tasks/${deleteButton.dataset.deleteTaskId}`, { method: "DELETE" }), "Task removed.");
    }
  } catch (error) {
    flash(error.message);
  }
});

document.body.addEventListener("click", async (event) => {
  const approveButton = event.target.closest("[data-execution-approve]");
  const runButton = event.target.closest("[data-execution-run]");
  const cancelButton = event.target.closest("[data-execution-cancel]");
  try {
    if (approveButton) {
      const response = await api(`/api/executions/${approveButton.dataset.executionApprove}/approve`, {
        method: "POST",
        body: JSON.stringify({})
      });
      state.latestExecution = response.execution;
      flash("Action approved.");
      await refreshDashboard();
      return;
    }
    if (runButton) {
      const response = await api(`/api/executions/${runButton.dataset.executionRun}/run`, {
        method: "POST",
        body: JSON.stringify({})
      });
      state.latestExecution = response.execution;
      flash(response.result?.summary || "Action executed.");
      await refreshDashboard();
      return;
    }
    if (cancelButton) {
      const response = await api(`/api/executions/${cancelButton.dataset.executionCancel}/cancel`, {
        method: "POST",
        body: JSON.stringify({})
      });
      state.latestExecution = response.execution;
      flash("Action cancelled.");
      await refreshDashboard();
    }
  } catch (error) {
    flash(error.message);
  }
});

const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
let voiceRecognition = null;
let voiceTranscriptBuffer = "";
let voiceErrorMessage = "";
let voiceIsListening = false;
let activeVoiceTarget = {
  input: null,
  status: null,
  startMessage: ""
};

function setVoiceStatus(text) {
  if (activeVoiceTarget.status) {
    activeVoiceTarget.status.textContent = text;
  }
}

function humanVoiceError(errorCode, fallback = "") {
  const code = String(errorCode || "").trim();
  const normalized = code.toLowerCase().replace(/[^a-z]/g, "");

  if (["notallowed", "notallowederror", "servicenotallowed", "permissiondeniederror"].includes(normalized)) {
    return "Microphone permission was blocked. Allow mic access for this site, then try again.";
  }
  if (["audiocapture", "notfound", "notfounderror", "devicesnotfounderror"].includes(normalized)) {
    return "Buksy could not find a microphone. Check that a mic is connected and enabled in Windows.";
  }
  if (["notreadable", "notreadableerror", "trackstarterror"].includes(normalized)) {
    return "Buksy found the microphone, but another app may already be using it. Close apps like Zoom, Meet, or Discord and try again.";
  }
  if (normalized === "network") {
    return "Voice recognition had a network/service issue. Try again in Chrome or Edge.";
  }
  if (["security", "securityerror"].includes(normalized)) {
    return "The browser blocked microphone access for security reasons. Open Buksy on localhost or 127.0.0.1 in Chrome or Edge.";
  }
  if (["aborted", "aborterror"].includes(normalized)) {
    return "Voice capture was interrupted before it could start listening.";
  }
  if (normalized === "nospeech") {
    return "Buksy opened the mic but did not hear speech. Try again and start speaking right away.";
  }
  return fallback || (code ? `Voice capture error: ${code}` : "Buksy could not start voice capture.");
}

async function microphonePermissionState() {
  try {
    if (!navigator.permissions?.query) {
      return "";
    }
    const result = await navigator.permissions.query({ name: "microphone" });
    return String(result?.state || "");
  } catch (error) {
    return "";
  }
}

async function ensureMicrophoneReady() {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { ok: true, reason: "permission_api_unavailable" };
  }

  if (!window.isSecureContext) {
    return {
      ok: false,
      message: "Microphone access needs a secure page. Open Buksy on localhost or HTTPS and try again."
    };
  }

  const permissionState = await microphonePermissionState();
  if (permissionState === "denied") {
    return {
      ok: false,
      message: "Microphone permission is blocked in your browser settings. Allow mic access for this site, then reload Buksy."
    };
  }

  let stream = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: humanVoiceError(error?.name || error?.message, "Buksy could not get microphone permission.")
    };
  } finally {
    stream?.getTracks?.().forEach((track) => track.stop());
  }
}

async function beginVoiceCapture(inputNode, statusNode, startMessage) {
  if (!voiceRecognition) {
    const message = "Voice capture is not available in this browser. Try Chrome or Edge, or paste the transcript manually.";
    if (statusNode) statusNode.textContent = message;
    flash(message);
    return;
  }

  activeVoiceTarget = {
    input: inputNode,
    status: statusNode,
    startMessage
  };
  voiceErrorMessage = "";
  voiceTranscriptBuffer = inputNode?.value ? `${inputNode.value.trim()} ` : "";
  setVoiceStatus("Requesting microphone access...");
  const mic = await ensureMicrophoneReady();
  if (!mic.ok) {
    voiceErrorMessage = mic.message;
    setVoiceStatus(mic.message);
    return;
  }

  setVoiceStatus("Starting microphone...");
  try {
    voiceRecognition.start();
  } catch (error) {
    const message = voiceIsListening
      ? "Voice capture is already running. Stop it first or wait a moment."
      : humanVoiceError(error?.name || error?.message, "Buksy could not start voice capture.");
    voiceErrorMessage = message;
    setVoiceStatus(message);
    flash(message);
  }
}

if (SpeechRecognitionCtor) {
  voiceRecognition = new SpeechRecognitionCtor();
  voiceRecognition.lang = "en-US";
  voiceRecognition.continuous = true;
  voiceRecognition.interimResults = true;
  voiceRecognition.maxAlternatives = 1;

  voiceRecognition.onstart = () => {
    voiceIsListening = true;
    voiceErrorMessage = "";
    setVoiceStatus(activeVoiceTarget.startMessage || "Listening...");
  };

  voiceRecognition.onresult = (event) => {
    let interim = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      if (result.isFinal) {
        voiceTranscriptBuffer += `${result[0].transcript.trim()} `;
      } else {
        interim += result[0].transcript;
      }
    }
    if (activeVoiceTarget.input) {
      activeVoiceTarget.input.value = `${voiceTranscriptBuffer}${interim}`.trim();
    }
  };

  voiceRecognition.onerror = (event) => {
    voiceIsListening = false;
    voiceErrorMessage = humanVoiceError(event.error, `Voice capture error: ${event.error}`);
    setVoiceStatus(voiceErrorMessage);
  };

  voiceRecognition.onend = () => {
    const hadError = Boolean(voiceErrorMessage);
    voiceIsListening = false;
    setVoiceStatus(
      hadError
        ? voiceErrorMessage
        : "Voice capture stopped. You can keep editing the transcript before processing it."
    );
  };
} else {
  if (ui.voiceStatus) {
    ui.voiceStatus.textContent = "This browser does not expose speech recognition, so paste your transcript manually.";
  }
  if (ui.voiceCommandStatus) {
    ui.voiceCommandStatus.textContent = "This browser does not expose speech recognition, so paste your command manually.";
  }
}

ui.voiceStartBtn?.addEventListener("click", async () => {
  await beginVoiceCapture(
    ui.voiceTranscript,
    ui.voiceStatus,
    "Listening for a journal note... speak naturally and Buksy will capture the transcript."
  );
});

ui.voiceStopBtn?.addEventListener("click", () => {
  voiceRecognition?.stop();
});

ui.voiceCommandStartBtn?.addEventListener("click", async () => {
  await beginVoiceCapture(
    ui.voiceCommandTranscript,
    ui.voiceCommandStatus,
    "Listening for a command... speak naturally and Buksy will translate it into actions."
  );
});

ui.voiceCommandStopBtn?.addEventListener("click", () => {
  voiceRecognition?.stop();
});

ui.loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = formObject(ui.loginForm);
    await api("/api/auth/login", { method: "POST", body: JSON.stringify(payload) });
    await refreshAuth();
    await refreshDashboard();
    flash("Welcome back.");
  } catch (error) {
    if (ui.authError) ui.authError.textContent = error.message;
  }
});

ui.registerBtn?.addEventListener("click", async () => {
  try {
    const payload = formObject(ui.loginForm);
    await api("/api/auth/register", { method: "POST", body: JSON.stringify(payload) });
    await refreshAuth();
    await refreshDashboard();
    flash("Account created. You are logged in.");
  } catch (error) {
    if (ui.authError) ui.authError.textContent = error.message;
  }
});

ui.logoutBtn?.addEventListener("click", async () => {
  try {
    await api("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
    flash("Logged out.");
    window.location.reload();
  } catch (error) {
    flash(error.message);
  }
});

async function boot() {
  const params = new URLSearchParams(window.location.search);
  const viewName = params.get("view");
  const oauthOk = params.get("oauth");
  const oauthErr = params.get("oauth_error");
  const oauthReason = params.get("reason");

  try {
    await refreshAuth();
  } catch {
    state.auth = { authRequired: false, user: null };
    renderAuth();
  }
  if (state.auth?.authRequired && !state.auth?.user) {
    flash("Log in to load your Buksy workspace.");
    return;
  }
  await refreshDashboard().catch((error) => flash(error.message));

  if (viewName && ui.pages?.some((p) => p.dataset.view === viewName)) {
    view(viewName);
  }
  if (oauthOk === "github_ok") {
    flash("GitHub connected with OAuth.");
  } else if (oauthOk === "notion_ok") {
    flash("Notion connected with OAuth.");
  } else if (oauthOk === "google_ok") {
    flash("Google Calendar connected. Buksy will use free/busy when planning your day.");
  }
  if (oauthErr) {
    flash(`OAuth error (${oauthErr}): ${oauthReason ? decodeURIComponent(oauthReason) : "unknown"}`);
  }
  if (viewName || oauthOk || oauthErr) {
    const u = new URL(window.location.href);
    u.search = "";
    window.history.replaceState({}, "", u.pathname + u.hash);
  }
}

// ── Schedule View Rendering ──────────────────────────────────
function renderSchedule(schedule) {
  if (!schedule) {
    setHtml(ui.scheduleTimeline, `<p class="empty-state">Loading schedule...</p>`);
    return;
  }

  // Warnings
  setHtml(ui.scheduleWarnings, (schedule.warnings || []).length
    ? schedule.warnings.map(w => `<div class="schedule-warning"><i class="ph ph-warning"></i> ${escapeHtml(w)}</div>`).join("")
    : "");

  // Summary
  const s = schedule.summary || {};
  setHtml(ui.scheduleSummary, `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">Open Tasks</div><div class="stat-value">${escapeHtml(s.totalOpenTasks || 0)}</div></div>
      <div class="stat-card"><div class="stat-label">Scheduled Days</div><div class="stat-value">${escapeHtml(s.scheduledDays || 0)}</div></div>
      <div class="stat-card"><div class="stat-label">Total Hours</div><div class="stat-value">${escapeHtml(Math.round((s.totalScheduledMins || 0) / 60))}</div></div>
      <div class="stat-card"><div class="stat-label">At Risk</div><div class="stat-value">${escapeHtml(s.atRiskProjects || 0)}</div></div>
    </div>
  `);

  // Timeline
  const days = (schedule.days || []).filter(d => d.tasks.length > 0 || d.isToday);
  setHtml(ui.scheduleTimeline, days.length
    ? days.map(day => {
      const capacityPct = day.capacityMins > 0 ? Math.min(100, Math.round((day.usedMins / day.capacityMins) * 100)) : 0;
      const barColor = day.overloaded ? "var(--danger)" : capacityPct > 75 ? "var(--warning, #f59e0b)" : "var(--accent)";
      return `
        <div class="schedule-day ${day.isToday ? 'schedule-day--today' : ''} ${day.overloaded ? 'schedule-day--overloaded' : ''}">
          <div class="schedule-day-header">
            <div>
              <strong>${escapeHtml(day.dayOfWeek)}, ${escapeHtml(day.date)}</strong>
              ${day.isToday ? '<span class="pill" style="background: var(--accent); color: #fff;">Today</span>' : ''}
              ${day.overloaded ? '<span class="pill" style="background: var(--danger); color: #fff;">Overloaded</span>' : ''}
            </div>
            <span class="note-copy">${escapeHtml(day.usedMins)} / ${escapeHtml(day.capacityMins)} mins</span>
          </div>
          <div class="schedule-capacity-bar">
            <div class="schedule-capacity-fill" style="width: ${capacityPct}%; background: ${barColor};"></div>
          </div>
          <div class="schedule-tasks">
            ${day.tasks.map(task => `
              <div class="schedule-task">
                <div class="schedule-task-info">
                  <span class="task-title">${escapeHtml(task.title)}</span>
                  <div class="pill-row">
                    <span class="pill">${escapeHtml(task.priority)}</span>
                    <span class="pill">${escapeHtml(task.durationMins)} mins</span>
                    ${task.dueDate ? `<span class="pill">Due ${escapeHtml(task.dueDate)}</span>` : ''}
                  </div>
                </div>
                <div class="action-row">
                  <button class="primary-button" type="button" data-feedback-kind="completed" data-task-id="${escapeHtml(task.id)}">Done</button>
                  <button class="ghost-button" type="button" data-carry-forward="${escapeHtml(task.id)}"><i class="ph ph-arrow-right"></i> Carry</button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }).join("")
    : `<p class="empty-state">No tasks scheduled yet. Add tasks with due dates or create projects with deadlines.</p>`);

  // At Risk
  setHtml(ui.scheduleAtRisk, (schedule.atRisk || []).length
    ? schedule.atRisk.map(r => `
      <div class="mini-card dense-card" style="border-left: 3px solid var(--danger);">
        <strong>${escapeHtml(r.projectName)}</strong>
        <p class="note-copy">Due: ${escapeHtml(r.dueDate)} · ${escapeHtml(r.daysLeft)} days left · ${escapeHtml(Math.round(r.totalMinsRemaining / 60))} hours remaining</p>
        <p class="note-copy">${escapeHtml(r.reason)}</p>
      </div>
    `).join("")
    : `<p class="empty-state">No projects at risk. Looking good!</p>`);
}

async function refreshSchedule() {
  try {
    const response = await api("/api/schedule");
    renderSchedule(response.schedule);
  } catch (error) {
    setHtml(ui.scheduleTimeline, `<p class="empty-state">Could not load schedule: ${escapeHtml(error.message)}</p>`);
  }
}

// Carry forward handler (prompts for date; default tomorrow)
document.body.addEventListener("click", async (event) => {
  const carryBtn = event.target.closest("[data-carry-forward]");
  if (!carryBtn) return;
  const taskId = carryBtn.dataset.carryForward;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().slice(0, 10);
  const raw = window.prompt("Carry this task to which date? (YYYY-MM-DD)", defaultDate);
  const targetDate = /^\d{4}-\d{2}-\d{2}$/.test(String(raw || "").trim())
    ? String(raw).trim()
    : defaultDate;
  try {
    await api("/api/schedule/carry-forward", {
      method: "POST",
      body: JSON.stringify({ taskId, targetDate })
    });
    flash(`Task carried forward to ${targetDate}.`);
    await refreshSchedule();
    await refreshDashboard();
  } catch (error) {
    flash(error.message);
  }
});

ui.scheduleRebalanceBtn?.addEventListener("click", async () => {
  try {
    const result = await api("/api/schedule/rebalance", { method: "POST", body: JSON.stringify({}) });
    renderSchedule(result.schedule);
    flash(`Schedule rebalanced. ${result.movedTasks?.length || 0} tasks shifted.`);
  } catch (error) {
    flash(error.message);
  }
});

// ── Jira Integration ─────────────────────────────────────────
ui.jiraConnectForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = formObject(ui.jiraConnectForm);
    const response = await api("/api/integrations/jira/connect", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    if (response.jira?.connected) {
      setHtml(ui.jiraStatus, `<div class="mini-card dense-card"><i class="ph ph-check-circle" style="color: var(--accent);"></i> ${escapeHtml(response.jira.message)}</div>`);
      ui.jiraSyncBtn?.classList.remove("hidden");
      flash("Jira connected!");
    } else {
      setHtml(ui.jiraStatus, `<div class="mini-card dense-card" style="border-left: 3px solid var(--danger);"><i class="ph ph-x-circle"></i> ${escapeHtml(response.jira?.message || "Connection failed")}</div>`);
    }
  } catch (error) {
    flash(error.message);
  }
});

ui.jiraSyncBtn?.addEventListener("click", async () => {
  try {
    flash("Syncing Jira tasks...");
    const response = await api("/api/integrations/jira/sync", { method: "POST", body: JSON.stringify({}) });
    setHtml(ui.jiraSyncResult, `
      <div class="mini-card dense-card">
        <strong>Sync complete</strong>
        <p class="note-copy">${escapeHtml(response.imported)} new tasks imported out of ${escapeHtml(response.total)} Jira issues.</p>
      </div>
    `);
    flash(`Imported ${response.imported} tasks from Jira.`);
    await refreshDashboard();
  } catch (error) {
    flash(error.message);
  }
});

// ── GitHub Integration ───────────────────────────────────────
function renderGitHubDashboard(dashboard) {
  if (!dashboard || !dashboard.connected) {
    setHtml(ui.githubDashboard, `<p class="empty-state">Connect your GitHub account to see stats here.</p>`);
    return;
  }

  const summary = dashboard.summary || {};
  const heatmap = dashboard.heatmap || [];

  // Build commit heatmap
  const maxCount = Math.max(1, ...heatmap.map(d => d.count));
  const heatmapHtml = `
    <div class="github-heatmap">
      <p class="panel-kicker">Commit activity (last 30 days)</p>
      <div class="heatmap-grid">
        ${heatmap.map(d => {
          const intensity = d.count > 0 ? Math.max(0.2, d.count / maxCount) : 0;
          const bg = d.count > 0 ? `rgba(134, 239, 172, ${intensity})` : "var(--surface-2, rgba(255,255,255,0.05))";
          return `<div class="heatmap-cell" style="background: ${bg};" title="${d.date}: ${d.count} commits"></div>`;
        }).join("")}
      </div>
    </div>
  `;

  // Build repo cards
  const reposHtml = (dashboard.repos || []).map(repo => {
    if (repo.error) {
      return `<div class="mini-card dense-card"><strong>${escapeHtml(repo.fullName)}</strong><p class="note-copy">${escapeHtml(repo.error)}</p></div>`;
    }
    return `
      <div class="mini-card dense-card">
        <div class="task-card-header">
          <div>
            <strong><a href="${escapeHtml(repo.url)}" target="_blank" rel="noopener">${escapeHtml(repo.fullName)}</a></strong>
            <p class="note-copy">${escapeHtml(repo.language || "No language")} · ⭐ ${escapeHtml(repo.stars)}</p>
          </div>
          <span class="pill">${escapeHtml(repo.commitCount7d)} commits/wk</span>
        </div>
        <div class="pill-row">
          <span class="pill">${escapeHtml(repo.openIssues)} issues</span>
          <span class="pill">${escapeHtml(repo.openPRs?.length || 0)} PRs</span>
          ${repo.lastPush ? `<span class="pill">pushed ${escapeHtml(formatDate(repo.lastPush))}</span>` : ''}
        </div>
        ${(repo.openPRs || []).length > 0 ? `
          <div style="margin-top: 0.5rem;">
            <p class="panel-kicker">Open PRs</p>
            ${repo.openPRs.slice(0, 3).map(pr => `
              <div class="detail-row">
                <a href="${escapeHtml(pr.url)}" target="_blank" rel="noopener">#${escapeHtml(pr.number)} ${escapeHtml(pr.title)}</a>
                <span class="pill">${pr.draft ? 'Draft' : escapeHtml(pr.reviewStatus)}</span>
              </div>
            `).join("")}
          </div>
        ` : ''}
        ${(repo.recentCommits || []).length > 0 ? `
          <div style="margin-top: 0.5rem;">
            <p class="panel-kicker">Recent commits</p>
            ${repo.recentCommits.slice(0, 5).map(c => `
              <div class="detail-row">
                <code>${escapeHtml(c.sha)}</code>
                <span class="note-copy">${escapeHtml(c.message)}</span>
              </div>
            `).join("")}
          </div>
        ` : ''}
      </div>
    `;
  }).join("");

  setHtml(ui.githubDashboard, `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">Repos</div><div class="stat-value">${escapeHtml(summary.totalRepos)}</div></div>
      <div class="stat-card"><div class="stat-label">Commits/Week</div><div class="stat-value">${escapeHtml(summary.commitsThisWeek)}</div></div>
      <div class="stat-card"><div class="stat-label">Open PRs</div><div class="stat-value">${escapeHtml(summary.openPRs)}</div></div>
      <div class="stat-card"><div class="stat-label">Open Issues</div><div class="stat-value">${escapeHtml(summary.openIssues)}</div></div>
    </div>
    ${heatmapHtml}
    <div class="divider"></div>
    ${reposHtml || '<p class="empty-state">No tracked repos yet.</p>'}
  `);
}

ui.githubConnectForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = formObject(ui.githubConnectForm);
    const repos = payload.repos ? payload.repos.split(",").map(r => r.trim()).filter(Boolean) : [];
    const response = await api("/api/integrations/github/connect", {
      method: "POST",
      body: JSON.stringify({ token: payload.token, repos })
    });
    if (response.github?.connected) {
      setHtml(ui.githubStatus, `<div class="mini-card dense-card"><i class="ph ph-check-circle" style="color: var(--accent);"></i> ${escapeHtml(response.github.message)}</div>`);
      ui.githubRefreshBtn?.classList.remove("hidden");
      flash("GitHub connected!");
      // Auto-fetch stats
      await refreshGitHub();
    } else {
      setHtml(ui.githubStatus, `<div class="mini-card dense-card" style="border-left: 3px solid var(--danger);"><i class="ph ph-x-circle"></i> ${escapeHtml(response.github?.message || "Connection failed")}</div>`);
    }
  } catch (error) {
    flash(error.message);
  }
});

async function refreshGitHub() {
  try {
    const response = await api("/api/integrations/github/stats");
    renderGitHubDashboard(response.dashboard);
  } catch {
    // silently fail - not connected
  }
}

ui.githubRefreshBtn?.addEventListener("click", async () => {
  try {
    flash("Refreshing GitHub stats...");
    await refreshGitHub();
    flash("GitHub stats updated.");
  } catch (error) {
    flash(error.message);
  }
});

[
  ["githubOAuthBtn", "/api/oauth/github/start"],
  ["notionOAuthBtn", "/api/oauth/notion/start"],
  ["googleOAuthBtn", "/api/oauth/google/start"]
].forEach(([id, path]) => {
  ui[id]?.addEventListener("click", () => {
    window.location.href = path;
  });
});

// ── Notion Integration ───────────────────────────────────────
ui.notionConnectForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = formObject(ui.notionConnectForm);
    const response = await api("/api/integrations/notion/connect", {
      method: "POST",
      body: JSON.stringify({
        token: payload.token,
        databaseId: payload.databaseId || ""
      })
    });
    if (response.notion?.connected) {
      setHtml(
        ui.notionStatus,
        `<div class="mini-card dense-card"><i class="ph ph-check-circle" style="color: var(--accent);"></i> ${escapeHtml(response.notion.message || "Connected")}</div>`
      );
      ui.notionSyncBtn?.classList.remove("hidden");
      flash("Notion connected.");
    } else {
      setHtml(
        ui.notionStatus,
        `<div class="mini-card dense-card" style="border-left: 3px solid var(--danger);"><i class="ph ph-x-circle"></i> ${escapeHtml(response.notion?.message || "Connection failed")}</div>`
      );
    }
  } catch (error) {
    flash(error.message);
  }
});

ui.notionListBtn?.addEventListener("click", async () => {
  try {
    const response = await api("/api/integrations/notion/databases");
    const rows = (response.databases || [])
      .map((d) => `<div><strong>${escapeHtml(d.title)}</strong> — <code>${escapeHtml(d.id)}</code></div>`)
      .join("");
    setHtml(ui.notionDatabaseList, rows || "<p>No databases found. Share a database with your integration.</p>");
  } catch (error) {
    flash(error.message);
  }
});

ui.notionSyncBtn?.addEventListener("click", async () => {
  try {
    const dbField = ui.notionConnectForm?.elements.namedItem("databaseId");
    const databaseId = dbField?.value?.trim() || "";
    flash("Syncing from Notion...");
    const response = await api("/api/integrations/notion/sync", {
      method: "POST",
      body: JSON.stringify({
        databaseId: databaseId || undefined,
        createProject: Boolean(ui.notionCreateProject?.checked)
      })
    });
    setHtml(
      ui.notionSyncResult,
      `<div class="mini-card dense-card"><strong>Sync complete</strong><p class="note-copy">${escapeHtml(response.imported)} new tasks from ${escapeHtml(response.total)} rows.</p></div>`
    );
    flash(`Imported ${response.imported} tasks from Notion.`);
    await refreshDashboard();
  } catch (error) {
    flash(error.message);
  }
});

// ── Navigate to schedule on tab switch ───────────────────────
const originalView = view;
const patchedView = (name) => {
  originalView(name);
  if (name === "schedule") refreshSchedule();
  if (name === "integrations") refreshGitHub().catch(() => {});
};
ui.navLinks.forEach((button) => {
  button.addEventListener("click", () => patchedView(button.dataset.viewTarget));
});

view(document.querySelector(".nav-link.active")?.dataset.viewTarget || "today");
boot();
