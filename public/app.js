const $ = (id) => document.getElementById(id);
const ui = {
  navLinks: [...document.querySelectorAll(".nav-link")],
  pages: [...document.querySelectorAll(".page")],
  projectSelects: [...document.querySelectorAll(".project-select")],
  pageTitle: $("pageTitle"),
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
  aiStatus: null,
  mlMetrics: null,
  auth: null
};
const pageTitles = Object.fromEntries(ui.navLinks.map((button) => [button.dataset.viewTarget, (button.querySelector("span") || button).textContent.trim()]));
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
  sandbox: "sandboxResult"
};

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
  }
  if (ui.aiSetupForm) {
    const ai = dashboard.state.profile?.ai || {};
    const baseUrl = ui.aiSetupForm.elements.namedItem("baseUrl");
    const model = ui.aiSetupForm.elements.namedItem("model");
    if (baseUrl) baseUrl.value = ai.baseUrl || "";
    if (model) model.value = ai.model || "";
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
    `Vault ${dashboard.stats.knowledgeCount}`,
    `Mode ${dashboard.advanced.behaviorModel.operatingMode}`
  ].map((item) => `<span class="metric-pill">${escapeHtml(item)}</span>`).join(""));
  setHtml(ui.statsGrid, [
    ["Open tasks", dashboard.stats.openTasks],
    ["Completed", dashboard.stats.completedTasks],
    ["Goals", dashboard.stats.goalCount],
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
  setHtml(ui.dailyBriefCard, dailyBriefHtml(dashboard));
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

  const openTasks = (dashboard.state.tasks || []).filter((task) => task.status === "open");
  const doneTasks = (dashboard.state.tasks || []).filter((task) => task.status === "completed").slice(0, 10);
  setHtml(ui.openTasks, openTasks.length ? openTasks.map((task) => taskCard(task, { projects: projectMap, goals: goalMap })).join("") : `<p class="empty-state">Your open task list is empty.</p>`);
  setHtml(ui.completedTasks, doneTasks.length ? doneTasks.map((task) => taskCard(task, { projects: projectMap, goals: goalMap }, true)).join("") : `<p class="empty-state">Completed work will collect here.</p>`);
  setHtml(ui.projectCards, (dashboard.workspace.projectSnapshots || []).length ? dashboard.workspace.projectSnapshots.map((project) => `<article class="mini-card project-snapshot"><div class="task-card-header"><div><h4>${escapeHtml(project.name)}</h4><p class="note-copy">${escapeHtml(project.description || "No description yet.")}</p></div><span class="status-chip">${escapeHtml(project.status)}</span></div><div class="pill-row"><span class="pill">${escapeHtml(project.counts.openTasks)} open tasks</span><span class="pill">${escapeHtml(project.counts.goals)} goals</span><span class="pill">${escapeHtml(project.counts.knowledge)} vault items</span><span class="pill">${escapeHtml(project.counts.artifacts)} artifacts</span></div></article>`).join("") : `<p class="empty-state">Create a project and Buksy will keep its memory separate here.</p>`);
  setHtml(ui.goalCards, (dashboard.advanced.goals || []).length ? dashboard.advanced.goals.map((goal) => `<article class="goal-card"><div class="goal-card-header"><div><h4>${escapeHtml(goal.title)}</h4><p class="note-copy">${escapeHtml(goal.progressLabel || "No linked tasks yet.")}</p></div><span class="status-chip">${escapeHtml(goal.status)}</span></div><div class="meta-row"><span class="pill">${escapeHtml(goal.theme)}</span><span class="pill">${escapeHtml(formatDate(goal.targetDate))}</span></div>${listHtml((goal.weeklyRoadmap || []).map((step) => `${step.label} - ${step.focus}: ${(step.moves || []).join(", ")}`), "No roadmap yet.")}</article>`).join("") : `<p class="empty-state">No goals yet. Build one and Buksy will reverse-plan it here.</p>`);
  setHtml(ui.trendWatchCard, objectHtml(dashboard.workspace.trendWatch || {}));
  setHtml(ui.memoryGraphCard, objectHtml(dashboard.advanced.memoryGraph || {}));
  setHtml(ui.artifactStream, (dashboard.state.artifacts || []).slice(0, 10).map((artifact) => `<div class="mini-card dense-card"><div class="task-card-header"><div><strong>${escapeHtml(artifact.title)}</strong><p class="note-copy">${escapeHtml(artifact.category || artifact.kind)}</p></div><span class="status-chip">${escapeHtml(artifact.kind)}</span></div><p class="note-copy">${escapeHtml(formatDate(artifact.createdAt, true))}</p></div>`).join("") || `<p class="empty-state">Generated briefs, simulations, and other artifacts will collect here.</p>`);

  Object.entries(artifactTargets).forEach(([kind, target]) => {
    setHtml(ui[target], latestPayload(kind) ? artifactHtml(kind, latestPayload(kind)) : `<p class="empty-state">No result here yet.</p>`);
  });
  setHtml(ui.workflowResult, state.workflowBlueprint ? objectHtml(state.workflowBlueprint) : state.dashboard?.state?.workflows?.[0] ? objectHtml(state.dashboard.state.workflows[0]) : `<p class="empty-state">Built workflows will appear here.</p>`);
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

ui.navLinks.forEach((button) => button.addEventListener("click", () => view(button.dataset.viewTarget)));

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
  button.removeEventListener("click", () => {});
  button.addEventListener("click", () => patchedView(button.dataset.viewTarget));
});

view(document.querySelector(".nav-link.active")?.dataset.viewTarget || "today");
boot();
