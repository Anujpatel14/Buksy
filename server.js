require("dotenv").config();

const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const {
  readState,
  createDefaultState,
  addTask,
  updateTask,
  deleteTask,
  addGoal,
  addProject,
  addKnowledgeItem,
  addWorkflow,
  updateWorkflow,
  addCheckin,
  addFeedback,
  addActivity,
  addArtifact,
  markSuggested,
  updateAiSettings,
  updateIntegrations,
  updatePlugins,
  updateWorldContext,
  updatePrivacySettings,
  updateAutopilotSettings,
  addTeamMember,
  addExecutionRequest,
  updateExecutionRequest,
  updateProductivityHistory
} = require("./src/store");
const { isMysqlConfigured, initSchema, saveUserStateJson } = require("./src/db");
const {
  getSessionTokenFromRequest,
  buildSetCookieHeader,
  buildClearCookieHeader,
  createUser,
  findUserByEmail,
  verifyPassword,
  createSession,
  deleteSessionByToken,
  getSessionUser,
  SESSION_MAX_AGE_SECONDS
} = require("./src/auth");
const { requestContext, getCurrentUserId } = require("./src/context");
const {
  suggestNextTask,
  buildDailyPlan,
  summarizeLearning
} = require("./src/engine");
const { buildAdvancedInsights } = require("./src/intelligence");
const {
  buildLifeAnalytics,
  explainDelay,
  simulateTimeline
} = require("./src/analytics");
const {
  buildGoalBlueprint,
  buildNegotiationAssist,
  buildDecisionTimeline,
  solveConstraints
} = require("./src/strategy");
const {
  buildResearchBrief,
  analyzeFileContents,
  buildMeetingAssist,
  generateIdeas,
  runMultiAgentAnalysis,
  runScenarioSimulation,
  buildPresentationOutline,
  buildDebate,
  buildWorkflowBlueprint,
  runSandbox,
  buildLearningCompanion,
  buildRoleAnalysis,
  buildComparisonEngine,
  buildActionHubResult,
  buildStructuredDocument,
  buildTodoList,
  buildKnowledgeQuery,
  buildProjectSnapshots,
  buildTrendWatch,
  buildOpportunityScanner,
  buildSurpriseInsights,
  buildHiddenInsights
} = require("./src/workbench");
const {
  buildPluginCatalog,
  buildExecutionPlan,
  buildAutomationRule,
  evaluateAutomationRules,
  executePlannedAction
} = require("./src/autonomy");
const {
  buildExtendedIntelligence,
  simulateTwinResponse,
  runLifeAutopilot,
  buildAutonomousGoalPlan
} = require("./src/meta");
const { handleChat, buildRuntimeContext } = require("./src/assistant");
const { getOllamaStatus } = require("./src/ollama");
const {
  getMlMetrics,
  runShadowComparison,
  appendMlEvent,
  buildScheduleFeatures,
  retrainLocalModels,
  setMysqlAuthPlan
} = require("./src/ml");
const { predictScheduleScore, trainRuntime } = require("./src/mlRuntime");
const {
  buildFullSchedule,
  rebalanceSchedule,
  getTodaySchedule
} = require("./src/scheduler");
const jira = require("./src/jira");
const github = require("./src/github");
const notion = require("./src/notion");
const {
  issueOAuthState,
  consumeOAuthState,
  getPublicBaseUrl,
  oauthConfigFlags,
  exchangeGitHubCode,
  exchangeNotionCode,
  exchangeGoogleCode
} = require("./src/oauthService");
const { buildCalendarHints, defaultGoogleCalendarConfig } = require("./src/googleCalendar");

const HOST = "127.0.0.1";
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const IMG_DIR = path.join(__dirname, "img");

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon"
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8"
  });
  res.end(text);
}

async function readBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf8");

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    const parseError = new Error("Request body must be valid JSON");
    parseError.statusCode = 400;
    throw parseError;
  }
}

function getLatestArtifacts(state) {
  const byKind = {};

  (state.artifacts || []).forEach((artifact) => {
    if (!byKind[artifact.kind]) {
      byKind[artifact.kind] = artifact;
    }
  });

  return byKind;
}

function buildWorkspaceInsights(state) {
  return {
    projectSnapshots: buildProjectSnapshots(state),
    trendWatch: buildTrendWatch(state),
    opportunityScanner: buildOpportunityScanner(state),
    surpriseInsights: buildSurpriseInsights(state),
    hiddenInsights: buildHiddenInsights({}, state)
  };
}

async function resolveCalendarAndContext(state) {
  const calendar = await buildCalendarHints(state.profile?.integrations?.googleCalendar, async (patch) => {
    const latest = await readState();
    const prev = latest.profile?.integrations?.googleCalendar || {};
    await updateIntegrations({ googleCalendar: { ...defaultGoogleCalendarConfig(), ...prev, ...patch } });
  });
  return {
    calendar,
    context: buildRuntimeContext(state, { calendar })
  };
}

async function buildDashboard(state) {
  const { calendar, context } = await resolveCalendarAndContext(state);
  const openTasks = state.tasks.filter((task) => task.status === "open").slice(0, 40);
  const mlEntries = await Promise.all(
    openTasks.map(async (task) => [task.id, await predictScheduleScore(buildScheduleFeatures(task, state, context))])
  );
  const mlScoreByTask = Object.fromEntries(mlEntries);
  const advanced = buildAdvancedInsights(state, context);
  const analytics = buildLifeAnalytics(state, context);
  const meta = buildExtendedIntelligence(state, {
    ...context,
    mlScoreByTask,
    suggestionStyle: advanced.behaviorModel.suggestionStyle
  });
  const suggestion = suggestNextTask(state, {
    ...context,
    mlScoreByTask,
    suggestionStyle: advanced.behaviorModel.suggestionStyle
  });

  return {
    state,
    context,
    suggestion,
    dailyPlan: buildDailyPlan(state, { ...context, mlScoreByTask }, 4),
    schedulePreview: (() => {
      const full = buildFullSchedule(state, context);
      return {
        summary: full.summary,
        warnings: (full.warnings || []).slice(0, 6),
        atRisk: (full.atRisk || []).slice(0, 5),
        days: (full.days || []).slice(0, 10)
      };
    })(),
    learningInsights: summarizeLearning(state.profile),
    latestArtifacts: getLatestArtifacts(state),
    workspace: buildWorkspaceInsights(state),
    analytics,
    meta,
    autonomy: {
      plugins: buildPluginCatalog(state),
      automationSuggestions: evaluateAutomationRules(state, context),
      executions: (state.executions || []).slice(0, 10)
    },
    stats: {
      openTasks: state.tasks.filter((task) => task.status === "open").length,
      completedTasks: state.tasks.filter((task) => task.status === "completed").length,
      goalCount: state.goals.length,
      projectCount: state.projects.length,
      knowledgeCount: state.knowledge.length,
      workflowCount: state.workflows.length,
      teamCount: (state.team || []).length,
      helpfulSignals:
        state.profile.learning.responsePatterns.helpful +
        state.profile.learning.responsePatterns.completed,
      skippedSignals:
        state.profile.learning.responsePatterns.skipped +
        state.profile.learning.responsePatterns.notHelpful
    },
    advanced,
    oauth: oauthConfigFlags(),
    calendar
  };
}

function isFileInsideDir(filePath, dirPath) {
  const resolvedFile = path.resolve(filePath);
  const resolvedDir = path.resolve(dirPath);
  return resolvedFile === resolvedDir || resolvedFile.startsWith(resolvedDir + path.sep);
}

/** Serves files from repo `/img` at URL `/img/*` (official logo and brand assets). */
async function serveImg(req, res, pathname) {
  if (!pathname.startsWith("/img/")) {
    return false;
  }
  const rel = pathname.slice("/img/".length).replace(/\\/g, "/");
  if (!rel || rel.includes("..")) {
    sendText(res, 403, "Forbidden");
    return true;
  }
  const target = path.join(IMG_DIR, rel);
  if (!isFileInsideDir(target, IMG_DIR)) {
    sendText(res, 403, "Forbidden");
    return true;
  }
  try {
    const content = await fs.readFile(target);
    const extension = path.extname(target).toLowerCase();
    res.writeHead(200, {
      "Content-Type": CONTENT_TYPES[extension] || "application/octet-stream",
      "Cache-Control": "public, max-age=86400"
    });
    res.end(content);
  } catch {
    sendText(res, 404, "Not found");
  }
  return true;
}

async function serveStatic(req, res, pathname) {
  if (await serveImg(req, res, pathname)) {
    return;
  }
  const requested = pathname === "/" ? "/index.html" : pathname;
  const normalized = path.normalize(requested).replace(/^(\.\.[\\/])+/, "");
  const target = path.join(PUBLIC_DIR, normalized);

  if (!target.startsWith(PUBLIC_DIR)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  try {
    const content = await fs.readFile(target);
    const extension = path.extname(target).toLowerCase();
    res.writeHead(200, {
      "Content-Type": CONTENT_TYPES[extension] || "application/octet-stream"
    });
    res.end(content);
  } catch (error) {
    sendText(res, 404, "Not found");
  }
}

async function storeArtifact(kind, title, payload, projectId = null, category = "general") {
  return addArtifact({
    kind,
    title,
    payload,
    projectId,
    category
  });
}

function findExecution(state, id) {
  return (state.executions || []).find((entry) => entry.id === id) || null;
}

async function createTasksFromBlueprint(items = [], projectId = null, source = "") {
  const createdTasks = [];

  for (const item of items) {
    createdTasks.push(
      await addTask({
        title: item.title,
        category: item.category,
        priority: item.priority,
        effort: item.effort,
        durationMins: item.durationMins,
        notes: item.notes,
        projectId,
        source,
        externalId: item.externalId || ""
      })
    );
  }

  return createdTasks;
}

const PUBLIC_API_PATHS = new Set([
  "/api/auth/status",
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/oauth/github/callback",
  "/api/oauth/notion/callback",
  "/api/oauth/google/callback"
]);

function redirectBrowser(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

async function handleApi(req, res, url) {
  const pathname = url.pathname;
  const sp = url.searchParams;

  try {
    if (req.method === "GET" && pathname === "/api/auth/status") {
      if (!isMysqlConfigured()) {
        sendJson(res, 200, { authRequired: false, user: null });
        return;
      }
      const token = getSessionTokenFromRequest(req);
      const user = token ? await getSessionUser(token) : null;
      sendJson(res, 200, {
        authRequired: true,
        user: user ? { id: user.id, email: user.email } : null
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/auth/register") {
      if (!isMysqlConfigured()) {
        sendJson(res, 400, { error: "MySQL is not configured. Set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE." });
        return;
      }
      const body = await readBody(req);
      const user = await createUser(body.email, body.password);
      await saveUserStateJson(user.id, JSON.stringify(createDefaultState()));
      const sess = await createSession(user.id);
      res.writeHead(201, {
        "Content-Type": "application/json; charset=utf-8",
        "Set-Cookie": buildSetCookieHeader(sess.token, SESSION_MAX_AGE_SECONDS)
      });
      res.end(JSON.stringify({ user: { id: user.id, email: user.email } }));
      return;
    }

    if (req.method === "POST" && pathname === "/api/auth/login") {
      if (!isMysqlConfigured()) {
        sendJson(res, 400, { error: "MySQL is not configured." });
        return;
      }
      const body = await readBody(req);
      const user = await findUserByEmail(body.email);
      if (!user || !(await verifyPassword(user, body.password))) {
        sendJson(res, 401, { error: "Invalid email or password." });
        return;
      }
      const sess = await createSession(user.id);
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Set-Cookie": buildSetCookieHeader(sess.token, SESSION_MAX_AGE_SECONDS)
      });
      res.end(JSON.stringify({ user: { id: user.id, email: user.email } }));
      return;
    }

    if (req.method === "POST" && pathname === "/api/auth/logout") {
      const token = getSessionTokenFromRequest(req);
      await deleteSessionByToken(token);
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Set-Cookie": buildClearCookieHeader()
      });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    // ── OAuth: GitHub ───────────────────────────────────────────
    if (req.method === "GET" && pathname === "/api/oauth/github/start") {
      const flags = oauthConfigFlags();
      if (!flags.githubOAuth) {
        sendJson(res, 503, { error: "GitHub OAuth is not configured (set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET)." });
        return;
      }
      if (isMysqlConfigured() && typeof getCurrentUserId() !== "string") {
        sendJson(res, 401, { error: "Login required to connect GitHub with OAuth." });
        return;
      }
      const state = issueOAuthState(getCurrentUserId());
      const base = getPublicBaseUrl();
      const redirectUri = `${base}/api/oauth/github/callback`;
      const scope = encodeURIComponent(process.env.GITHUB_OAUTH_SCOPE || "read:user repo");
      const loc = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(process.env.GITHUB_CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
      redirectBrowser(res, loc);
      return;
    }

    if (req.method === "GET" && pathname === "/api/oauth/github/callback") {
      const base = getPublicBaseUrl();
      const err = sp.get("error_description") || sp.get("error");
      if (err) {
        redirectBrowser(
          res,
          `${base}/?view=integrations&oauth_error=github&reason=${encodeURIComponent(err)}`
        );
        return;
      }
      const code = sp.get("code");
      const consumed = consumeOAuthState(sp.get("state") || "");
      if (!code || !consumed) {
        redirectBrowser(res, `${base}/?view=integrations&oauth_error=github&reason=invalid_state`);
        return;
      }
      if (isMysqlConfigured() && typeof consumed.userId !== "string") {
        redirectBrowser(res, `${base}/?view=integrations&oauth_error=github&reason=invalid_state`);
        return;
      }
      try {
        const redirectUri = `${base}/api/oauth/github/callback`;
        const tok = await exchangeGitHubCode(code, redirectUri);
        await requestContext.run({ userId: consumed.userId || undefined }, async () => {
          const st = await readState();
          const prev = st.profile?.integrations?.github || {};
          const conn = await github.testConnection(tok.accessToken);
          const login =
            conn.connected && conn.user?.login ? conn.user.login : prev.username || "";
          await updateIntegrations({
            github: {
              ...prev,
              token: tok.accessToken,
              authMethod: "oauth",
              enabled: true,
              oauthScope: tok.scope || "",
              username: login
            }
          });
        });
        redirectBrowser(res, `${base}/?view=integrations&oauth=github_ok`);
      } catch (e) {
        redirectBrowser(
          res,
          `${base}/?view=integrations&oauth_error=github&reason=${encodeURIComponent(e.message || String(e))}`
        );
      }
      return;
    }

    // ── OAuth: Notion ────────────────────────────────────────────
    if (req.method === "GET" && pathname === "/api/oauth/notion/start") {
      const flags = oauthConfigFlags();
      if (!flags.notionOAuth) {
        sendJson(res, 503, { error: "Notion OAuth is not configured (set NOTION_CLIENT_ID and NOTION_CLIENT_SECRET)." });
        return;
      }
      if (isMysqlConfigured() && typeof getCurrentUserId() !== "string") {
        sendJson(res, 401, { error: "Login required to connect Notion with OAuth." });
        return;
      }
      const state = issueOAuthState(getCurrentUserId());
      const base = getPublicBaseUrl();
      const redirectUri = `${base}/api/oauth/notion/callback`;
      const loc = `https://api.notion.com/v1/oauth/authorize?client_id=${encodeURIComponent(process.env.NOTION_CLIENT_ID)}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
      redirectBrowser(res, loc);
      return;
    }

    if (req.method === "GET" && pathname === "/api/oauth/notion/callback") {
      const base = getPublicBaseUrl();
      const err = sp.get("error");
      if (err) {
        redirectBrowser(
          res,
          `${base}/?view=integrations&oauth_error=notion&reason=${encodeURIComponent(err)}`
        );
        return;
      }
      const code = sp.get("code");
      const consumed = consumeOAuthState(sp.get("state") || "");
      if (!code || !consumed) {
        redirectBrowser(res, `${base}/?view=integrations&oauth_error=notion&reason=invalid_state`);
        return;
      }
      if (isMysqlConfigured() && typeof consumed.userId !== "string") {
        redirectBrowser(res, `${base}/?view=integrations&oauth_error=notion&reason=invalid_state`);
        return;
      }
      try {
        const redirectUri = `${base}/api/oauth/notion/callback`;
        const tok = await exchangeNotionCode(code, redirectUri);
        await requestContext.run({ userId: consumed.userId || undefined }, async () => {
          const st = await readState();
          const prev = st.profile?.integrations?.notion || {};
          await updateIntegrations({
            notion: {
              ...prev,
              token: tok.accessToken,
              authMethod: "oauth",
              enabled: true,
              workspaceId: tok.workspaceId,
              workspaceName: tok.workspaceName
            }
          });
        });
        redirectBrowser(res, `${base}/?view=integrations&oauth=notion_ok`);
      } catch (e) {
        redirectBrowser(
          res,
          `${base}/?view=integrations&oauth_error=notion&reason=${encodeURIComponent(e.message || String(e))}`
        );
      }
      return;
    }

    // ── OAuth: Google Calendar ───────────────────────────────────
    if (req.method === "GET" && pathname === "/api/oauth/google/start") {
      const flags = oauthConfigFlags();
      if (!flags.googleOAuth) {
        sendJson(res, 503, { error: "Google OAuth is not configured (set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)." });
        return;
      }
      if (isMysqlConfigured() && typeof getCurrentUserId() !== "string") {
        sendJson(res, 401, { error: "Login required to connect Google Calendar." });
        return;
      }
      const state = issueOAuthState(getCurrentUserId());
      const base = getPublicBaseUrl();
      const redirectUri = `${base}/api/oauth/google/callback`;
      const calScope = "https://www.googleapis.com/auth/calendar.readonly";
      const loc =
        `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(process.env.GOOGLE_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        "&response_type=code" +
        `&scope=${encodeURIComponent(calScope)}` +
        "&access_type=offline&prompt=consent" +
        `&state=${state}`;
      redirectBrowser(res, loc);
      return;
    }

    if (req.method === "GET" && pathname === "/api/oauth/google/callback") {
      const base = getPublicBaseUrl();
      const err = sp.get("error_description") || sp.get("error");
      if (err) {
        redirectBrowser(
          res,
          `${base}/?view=integrations&oauth_error=google&reason=${encodeURIComponent(err)}`
        );
        return;
      }
      const code = sp.get("code");
      const consumed = consumeOAuthState(sp.get("state") || "");
      if (!code || !consumed) {
        redirectBrowser(res, `${base}/?view=integrations&oauth_error=google&reason=invalid_state`);
        return;
      }
      if (isMysqlConfigured() && typeof consumed.userId !== "string") {
        redirectBrowser(res, `${base}/?view=integrations&oauth_error=google&reason=invalid_state`);
        return;
      }
      try {
        const redirectUri = `${base}/api/oauth/google/callback`;
        const tok = await exchangeGoogleCode(code, redirectUri);
        await requestContext.run({ userId: consumed.userId || undefined }, async () => {
          const st = await readState();
          const prev = st.profile?.integrations?.googleCalendar || {};
          const mergedRefresh = tok.refreshToken || prev.refreshToken;
          const expiresAt = new Date(Date.now() + tok.expiresIn * 1000).toISOString();
          await updateIntegrations({
            googleCalendar: {
              ...defaultGoogleCalendarConfig(),
              ...prev,
              accessToken: tok.accessToken,
              refreshToken: mergedRefresh,
              expiresAt,
              authMethod: "oauth",
              enabled: true,
              lastError: null
            }
          });
        });
        redirectBrowser(res, `${base}/?view=integrations&oauth=google_ok`);
      } catch (e) {
        redirectBrowser(
          res,
          `${base}/?view=integrations&oauth_error=google&reason=${encodeURIComponent(e.message || String(e))}`
        );
      }
      return;
    }

    if (req.method === "GET" && pathname === "/api/state") {
      const state = await readState();
      sendJson(res, 200, await buildDashboard(state));
      return;
    }

    if (req.method === "POST" && pathname === "/api/tasks") {
      const body = await readBody(req);
      const task = await addTask(body);
      sendJson(res, 201, { task });
      return;
    }

    if (req.method === "PATCH" && pathname.startsWith("/api/tasks/")) {
      const taskId = pathname.replace("/api/tasks/", "");
      const body = await readBody(req);
      const task = await updateTask(taskId, body);
      sendJson(res, 200, { task });
      return;
    }

    if (req.method === "DELETE" && pathname.startsWith("/api/tasks/")) {
      const taskId = pathname.replace("/api/tasks/", "");
      await deleteTask(taskId);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && pathname === "/api/projects") {
      const body = await readBody(req);
      const project = await addProject(body);
      sendJson(res, 201, { project });
      return;
    }

    if (req.method === "POST" && pathname === "/api/goals") {
      const body = await readBody(req);
      const blueprint = buildGoalBlueprint(body);
      const result = await addGoal({
        ...body,
        ...blueprint
      });
      sendJson(res, 201, result);
      return;
    }

    if (req.method === "POST" && pathname === "/api/goals/autoplan") {
      const body = await readBody(req);
      const state = await readState();
      const { context } = await resolveCalendarAndContext(state);
      const result = buildAutonomousGoalPlan(state, body, context);
      const created = await addGoal({
        ...body,
        ...result.blueprint
      });
      const artifact = await storeArtifact(
        "autonomous-goal-plan",
        result.title || "Autonomous goal plan",
        {
          ...result,
          goalId: created.goal.id,
          taskIds: (created.tasks || []).map((task) => task.id)
        },
        body.projectId || null,
        "planning"
      );
      sendJson(res, 201, {
        result,
        goal: created.goal,
        tasks: created.tasks,
        artifact
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/checkins") {
      const body = await readBody(req);
      const checkin = await addCheckin(body);
      let autopilot = null;
      const state = await readState();
      if (state.profile?.autopilot?.enabled) {
        const { context } = await resolveCalendarAndContext(state);
        const plan = runLifeAutopilot(state, context);
        autopilot = { ...plan, adjustedTasks: [], createdExecutions: [] };

        for (const deferment of plan.deferments || []) {
          autopilot.adjustedTasks.push(
            await updateTask(deferment.taskId, {
              deferUntil: deferment.deferUntil
            })
          );
        }

        for (const execution of plan.plannedExecutions || []) {
          autopilot.createdExecutions.push(await addExecutionRequest(execution));
        }
      }
      sendJson(res, 201, { checkin, autopilot });
      return;
    }

    if (req.method === "POST" && pathname === "/api/activity") {
      const body = await readBody(req);
      const activity = await addActivity(body);
      sendJson(res, 201, { activity });
      return;
    }

    if (req.method === "POST" && pathname === "/api/feedback") {
      const body = await readBody(req);
      const feedback = await addFeedback(body);
      sendJson(res, 201, { feedback });
      return;
    }

    if (req.method === "POST" && pathname === "/api/chat") {
      const body = await readBody(req);
      const result = await handleChat(body.message || "");
      await appendMlEvent({
        type: "chat_outcome",
        text: body.message || "",
        payload: {
          hasSuggestion: Boolean(result?.suggestion),
          hasDocument: Boolean(result?.document),
          hasTodo: Boolean(result?.todoList)
        }
      }).catch(() => {});
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "GET" && pathname === "/api/ml/metrics") {
      sendJson(res, 200, { metrics: await getMlMetrics() });
      return;
    }

    if (req.method === "POST" && pathname === "/api/ml/shadow") {
      const body = await readBody(req);
      const state = await readState();
      const task = (state.tasks || []).find((entry) => entry.id === body.taskId);
      if (!task) {
        sendJson(res, 404, { error: "Task not found for shadow comparison" });
        return;
      }
      const { context } = await resolveCalendarAndContext(state);
      const features = buildScheduleFeatures(task, state, context);
      const shadow = await runShadowComparison(Number(body.heuristicScore || 0), features);
      sendJson(res, 200, { shadow, features });
      return;
    }

    if (req.method === "POST" && pathname === "/api/ml/retrain") {
      const model = await retrainLocalModels();
      const runtime = await trainRuntime(model?.stats?.totalEvents || 0);
      sendJson(res, 200, { model, runtime });
      return;
    }

    if (req.method === "POST" && pathname === "/api/ml/mysql-auth-plan") {
      const body = await readBody(req);
      const saved = await setMysqlAuthPlan(
        body.summary ||
        "Phase 4: migrate JSON store to MySQL, add users table, password hash, session tokens, and per-user model namespaces."
      );
      sendJson(res, 200, { mysqlAuthPlan: saved.mysqlAuthPlan });
      return;
    }

    if (req.method === "GET" && pathname === "/api/ai/status") {
      const state = await readState();
      const status = await getOllamaStatus(state.profile?.ai || {});
      sendJson(res, 200, { status });
      return;
    }

    if (req.method === "POST" && pathname === "/api/ai/settings") {
      const body = await readBody(req);
      const settings = await updateAiSettings(body);
      const status = await getOllamaStatus(settings);
      sendJson(res, 200, { settings, status });
      return;
    }

    if (req.method === "GET" && pathname === "/api/analytics") {
      const state = await readState();
      const { context } = await resolveCalendarAndContext(state);
      sendJson(res, 200, { analytics: buildLifeAnalytics(state, context) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/analytics/explain-delay") {
      const body = await readBody(req);
      const state = await readState();
      const { context } = await resolveCalendarAndContext(state);
      sendJson(res, 200, { analysis: explainDelay(state, body, context) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/time/simulate") {
      const body = await readBody(req);
      const state = await readState();
      const { context } = await resolveCalendarAndContext(state);
      const result = simulateTimeline(state, body, context);
      const artifact = await storeArtifact("time-simulation", result.scope || "Time simulation", result, body.projectId || null, "planning");
      sendJson(res, 200, { result, artifact });
      return;
    }

    if (req.method === "GET" && pathname === "/api/meta") {
      const state = await readState();
      const { context } = await resolveCalendarAndContext(state);
      sendJson(res, 200, { meta: buildExtendedIntelligence(state, context) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/twin/simulate") {
      const body = await readBody(req);
      const state = await readState();
      const { context } = await resolveCalendarAndContext(state);
      const result = simulateTwinResponse(state, body, context);
      const artifact = await storeArtifact("digital-twin-simulation", body.prompt || "Digital twin simulation", result, body.projectId || null, "analysis");
      sendJson(res, 200, { result, artifact });
      return;
    }

    if (req.method === "GET" && pathname === "/api/world-context") {
      const state = await readState();
      const { context } = await resolveCalendarAndContext(state);
      sendJson(res, 200, {
        worldContext: state.profile?.worldContext || {},
        contextEngine: buildExtendedIntelligence(state, context).contextEngine
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/world-context") {
      const body = await readBody(req);
      const worldContext = await updateWorldContext(body);
      const state = await readState();
      const { context } = await resolveCalendarAndContext(state);
      sendJson(res, 200, {
        worldContext,
        contextEngine: buildExtendedIntelligence(state, context).contextEngine
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/team") {
      const state = await readState();
      const { context } = await resolveCalendarAndContext(state);
      sendJson(res, 200, {
        team: state.team || [],
        teamBrain: buildExtendedIntelligence(state, context).teamBrain
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/team/members") {
      const body = await readBody(req);
      const member = await addTeamMember(body);
      const state = await readState();
      const { context } = await resolveCalendarAndContext(state);
      sendJson(res, 201, {
        member,
        teamBrain: buildExtendedIntelligence(state, context).teamBrain
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/privacy/settings") {
      const body = await readBody(req);
      const privacy = await updatePrivacySettings(body);
      const state = await readState();
      const meta = buildExtendedIntelligence(state, buildRuntimeContext(state));
      sendJson(res, 200, { privacy, privacyMode: meta.privacyMode });
      return;
    }

    if (req.method === "POST" && pathname === "/api/autopilot/settings") {
      const body = await readBody(req);
      const settings = await updateAutopilotSettings(body);
      const state = await readState();
      const { context } = await resolveCalendarAndContext(state);
      sendJson(res, 200, {
        settings,
        autopilot: buildExtendedIntelligence(state, context).autopilot
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/autopilot/run") {
      const body = await readBody(req);
      if (Object.keys(body || {}).length) {
        await updateAutopilotSettings(body);
      }
      const state = await readState();
      const { context } = await resolveCalendarAndContext(state);
      const result = runLifeAutopilot(state, context);
      const adjustedTasks = [];
      const createdExecutions = [];

      for (const deferment of result.deferments || []) {
        adjustedTasks.push(
          await updateTask(deferment.taskId, {
            deferUntil: deferment.deferUntil
          })
        );
      }

      for (const execution of result.plannedExecutions || []) {
        createdExecutions.push(await addExecutionRequest(execution));
      }

      const artifact = await storeArtifact(
        "autopilot-run",
        "Life autopilot run",
        {
          ...result,
          adjustedTaskIds: adjustedTasks.map((task) => task.id),
          executionIds: createdExecutions.map((execution) => execution.id)
        },
        body.projectId || null,
        "automation"
      );

      sendJson(res, 200, { result, adjustedTasks, createdExecutions, artifact });
      return;
    }

    if (req.method === "GET" && pathname === "/api/plugins") {
      const state = await readState();
      sendJson(res, 200, {
        plugins: buildPluginCatalog(state),
        config: state.profile?.plugins || {}
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/plugins") {
      const body = await readBody(req);
      const config = await updatePlugins(body);
      const state = await readState();
      sendJson(res, 200, {
        config,
        plugins: buildPluginCatalog(state)
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/executions") {
      const state = await readState();
      sendJson(res, 200, { executions: state.executions || [] });
      return;
    }

    if (req.method === "POST" && pathname === "/api/actions/plan") {
      const body = await readBody(req);
      const state = await readState();
      const plan = buildExecutionPlan(body, state);
      const execution = await addExecutionRequest(plan);
      sendJson(res, 201, { execution });
      return;
    }

    if (req.method === "POST" && pathname.startsWith("/api/executions/") && pathname.endsWith("/approve")) {
      const executionId = pathname.replace("/api/executions/", "").replace("/approve", "");
      const execution = await updateExecutionRequest(executionId, { status: "approved" });
      sendJson(res, 200, { execution });
      return;
    }

    if (req.method === "POST" && pathname.startsWith("/api/executions/") && pathname.endsWith("/cancel")) {
      const executionId = pathname.replace("/api/executions/", "").replace("/cancel", "");
      const execution = await updateExecutionRequest(executionId, { status: "cancelled" });
      sendJson(res, 200, { execution });
      return;
    }

    if (req.method === "POST" && pathname.startsWith("/api/executions/") && pathname.endsWith("/run")) {
      const executionId = pathname.replace("/api/executions/", "").replace("/run", "");
      const state = await readState();
      const execution = findExecution(state, executionId);

      if (!execution) {
        sendJson(res, 404, { error: "Execution request not found" });
        return;
      }

      const { context } = await resolveCalendarAndContext(state);
      const result = executePlannedAction(execution, state, context);
      let artifact = null;
      let createdTasks = [];

      if (result.artifact) {
        artifact = await storeArtifact(
          result.artifact.kind,
          result.artifact.title,
          result.artifact.payload,
          result.artifact.projectId || null,
          result.artifact.category || "operations"
        );
      }

      if (Array.isArray(result.createdTasks) && result.createdTasks.length) {
        createdTasks = await createTasksFromBlueprint(result.createdTasks, null, execution.pluginId || "autonomy");
      }

      const updated = await updateExecutionRequest(executionId, {
        status: "completed",
        completedAt: new Date().toISOString(),
        result: {
          summary: result.summary,
          artifactId: artifact?.id || "",
          createdTaskCount: createdTasks.length
        }
      });

      sendJson(res, 200, { execution: updated, artifact, createdTasks, result });
      return;
    }

    if (req.method === "GET" && pathname === "/api/automations") {
      const state = await readState();
      const { context } = await resolveCalendarAndContext(state);
      const workflows = (state.workflows || []).filter((workflow) =>
        workflow.type === "automation" || ["task_overdue", "low_energy", "developer_pr"].includes(String(workflow.trigger || "").trim().toLowerCase())
      );
      sendJson(res, 200, {
        automations: workflows,
        suggestions: evaluateAutomationRules(state, context)
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/automations/build") {
      const body = await readBody(req);
      const result = buildAutomationRule(body);
      const workflow = await addWorkflow({
        ...result,
        projectId: body.projectId || null
      });
      sendJson(res, 201, { result, workflow });
      return;
    }

    if (req.method === "POST" && pathname === "/api/automations/run") {
      const body = await readBody(req);
      const state = await readState();
      const workflowFilter = body.workflowId
        ? (workflow) => workflow.id === body.workflowId
        : (workflow) => workflow.status === "active";
      const workflows = (state.workflows || []).filter(workflowFilter).filter((workflow) =>
        workflow.type === "automation" || ["task_overdue", "low_energy", "developer_pr"].includes(String(workflow.trigger || "").trim().toLowerCase())
      );
      const nowIso = new Date().toISOString();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const deferDate = tomorrow.toISOString().slice(0, 10);
      const latestCheckin = state.checkins?.[0];
      let adjustedTasks = [];
      let createdExecutions = [];

      for (const workflow of workflows) {
        const trigger = String(workflow.trigger || "").trim().toLowerCase();

        if (trigger === "task_overdue") {
          const overdueTasks = (state.tasks || []).filter((task) => task.status === "open" && task.dueDate && new Date(task.dueDate) < new Date(nowIso));
          for (const task of overdueTasks.slice(0, 6)) {
            const patch = { deferUntil: deferDate };
            const actionText = (workflow.actions || workflow.steps || []).join(" ").toLowerCase();
            if (actionText.includes("reduce priority") || actionText.includes("lower priority")) {
              patch.priority = task.priority === "high" ? "medium" : "low";
            }
            adjustedTasks.push(await updateTask(task.id, patch));
          }
        }

        if (trigger === "low_energy" && latestCheckin?.energy === "low") {
          const highEffort = (state.tasks || []).filter((task) => task.status === "open" && task.effort === "high");
          for (const task of highEffort.slice(0, 5)) {
            adjustedTasks.push(await updateTask(task.id, { deferUntil: deferDate }));
          }
        }

        if (trigger === "developer_pr" && state.profile?.integrations?.github?.token) {
          createdExecutions.push(
            await addExecutionRequest(
              buildExecutionPlan(
                { actionType: "github_sync", prompt: "Sync GitHub developer pressure into Buksy tasks" },
                state
              )
            )
          );
        }

        await updateWorkflow(workflow.id, {
          lastRunAt: nowIso,
          runCount: Number(workflow.runCount || 0) + 1
        });
      }

      const artifact = await storeArtifact(
        "automation-run",
        "Automation run summary",
        {
          workflows: workflows.map((workflow) => workflow.title),
          adjustedTasks: adjustedTasks.map((task) => task.title),
          createdExecutions: createdExecutions.map((execution) => execution.title)
        },
        body.projectId || null,
        "automation"
      );
      sendJson(res, 200, { adjustedTasks, createdExecutions, artifact });
      return;
    }

    if (req.method === "POST" && pathname === "/api/voice/journal") {
      const body = await readBody(req);
      const transcript = String(body.transcript || body.text || "").trim();
      const summary = buildMeetingAssist({ transcript });
      const insights = buildHiddenInsights({ text: transcript }, await readState());
      const payload = {
        transcript,
        summary: summary.summary,
        decisions: summary.decisions,
        tasks: summary.tasks,
        followUpMessage: summary.followUpMessage,
        insights
      };
      const artifact = await storeArtifact("voice-journal", body.title || "Voice journal", payload, body.projectId || null, "reflection");
      let createdTasks = [];

      if (body.createTasks) {
        createdTasks = await createTasksFromBlueprint(
          (summary.tasks || [])
            .filter((line) => !/no explicit/i.test(line))
            .map((line, index) => ({
              title: line.replace(/^(action|follow up|next step)\s*[:\-]?\s*/i, "").trim() || `Voice task ${index + 1}`,
              category: "planning",
              priority: index === 0 ? "high" : "medium",
              effort: "medium",
              durationMins: 25,
              notes: "Created from voice journal."
            })),
          body.projectId || null,
          "voice-journal"
        );
      }

      if (body.saveToKnowledge) {
        await addKnowledgeItem({
          title: body.title || "Voice journal note",
          category: "reflection",
          content: JSON.stringify(payload, null, 2),
          sourceType: "voice",
          projectId: body.projectId || null
        });
      }

      sendJson(res, 200, { result: payload, artifact, createdTasks });
      return;
    }

    if (req.method === "POST" && pathname === "/api/developer/github/import") {
      const state = await readState();
      const cfg = state.profile?.integrations?.github || {};

      if (!cfg.token || !(cfg.repos || []).length) {
        sendJson(res, 400, { error: "Connect GitHub and track at least one repo first." });
        return;
      }

      const dashboard = await github.buildGitHubDashboard(cfg.token, cfg.repos || []);
      const existing = new Set(
        (state.tasks || [])
          .filter((task) => task.source === "github" && task.externalId)
          .map((task) => task.externalId)
      );
      const createdTasks = [];

      for (const repo of dashboard.repos || []) {
        for (const pr of repo.openPRs || []) {
          const externalId = `github:pr:${repo.fullName}:${pr.number}`;
          if (existing.has(externalId)) {
            continue;
          }
          createdTasks.push(
            await addTask({
              title: `Review PR #${pr.number}: ${pr.title}`,
              category: "work",
              priority: pr.reviewStatus === "review_requested" ? "high" : "medium",
              effort: "medium",
              durationMins: 35,
              notes: `Repo: ${repo.fullName}. Status: ${pr.reviewStatus}.`,
              externalId,
              source: "github"
            })
          );
          existing.add(externalId);
        }
      }

      const artifact = await storeArtifact("developer-sync", "GitHub task import", {
        repos: (dashboard.repos || []).map((repo) => repo.fullName),
        importedTasks: createdTasks.map((task) => task.title),
        summary: dashboard.summary
      }, null, "developer");
      sendJson(res, 200, { imported: createdTasks.length, tasks: createdTasks, dashboard, artifact });
      return;
    }

    if (req.method === "POST" && pathname === "/api/suggestions/refresh") {
      const state = await readState();
      const { context } = await resolveCalendarAndContext(state);
      const openTasks = state.tasks.filter((task) => task.status === "open").slice(0, 40);
      const mlEntries = await Promise.all(
        openTasks.map(async (task) => [task.id, await predictScheduleScore(buildScheduleFeatures(task, state, context))])
      );
      const mlScoreByTask = Object.fromEntries(mlEntries);
      const advanced = buildAdvancedInsights(state, context);
      const suggestion = suggestNextTask(state, {
        ...context,
        mlScoreByTask,
        suggestionStyle: advanced.behaviorModel.suggestionStyle
      });

      if (suggestion?.task?.id) {
        await markSuggested(suggestion.task.id);
      }

      sendJson(res, 200, { suggestion });
      return;
    }

    if (req.method === "POST" && pathname === "/api/constraints/solve") {
      const body = await readBody(req);
      const state = await readState();
      const { context } = await resolveCalendarAndContext(state);
      const result = solveConstraints(state, body, context);
      const artifact = await storeArtifact("constraint", "Constraint plan", result, body.projectId || null, "planning");
      sendJson(res, 200, { result, artifact });
      return;
    }

    if (req.method === "POST" && pathname === "/api/negotiation") {
      const body = await readBody(req);
      const draft = buildNegotiationAssist(body);
      const artifact = await storeArtifact("negotiation", body.title || "Negotiation draft", draft, body.projectId || null, "communication");
      sendJson(res, 200, { draft, artifact });
      return;
    }

    if (req.method === "POST" && pathname === "/api/decisions/analyze") {
      const body = await readBody(req);
      const analysis = buildDecisionTimeline(body);
      const artifact = await storeArtifact("decision", body.decision || "Decision analysis", analysis, body.projectId || null, "strategy");
      sendJson(res, 200, { analysis, artifact });
      return;
    }

    if (req.method === "POST" && pathname === "/api/research") {
      const body = await readBody(req);
      const brief = buildResearchBrief(body);
      const artifact = await storeArtifact("research", body.topic || "Research brief", brief, body.projectId || null, "research");
      sendJson(res, 200, { brief, artifact });
      return;
    }

    if (req.method === "POST" && pathname === "/api/files/analyze") {
      const body = await readBody(req);
      const analysis = analyzeFileContents(body);
      const artifact = await storeArtifact("file-analysis", body.fileName || "File analysis", analysis, body.projectId || null, "files");

      if (body.saveToKnowledge) {
        await addKnowledgeItem({
          title: body.fileName || "File notes",
          category: "files",
          content: JSON.stringify(analysis, null, 2),
          sourceType: "file",
          fileName: body.fileName || null,
          fileType: body.fileType || null,
          projectId: body.projectId || null
        });
      }

      sendJson(res, 200, { analysis, artifact });
      return;
    }

    if (req.method === "POST" && pathname === "/api/insights/hidden") {
      const body = await readBody(req);
      const state = await readState();
      const insights = buildHiddenInsights(body, state);
      const artifact = await storeArtifact("hidden-insight", body.title || "Hidden insights", { insights }, body.projectId || null, "analysis");
      sendJson(res, 200, { insights, artifact });
      return;
    }

    if (req.method === "POST" && pathname === "/api/meetings/analyze") {
      const body = await readBody(req);
      const summary = buildMeetingAssist(body);
      const artifact = await storeArtifact("meeting", body.title || "Meeting summary", summary, body.projectId || null, "meetings");
      sendJson(res, 200, { summary, artifact });
      return;
    }

    if (req.method === "POST" && pathname === "/api/ideas/generate") {
      const body = await readBody(req);
      const result = generateIdeas(body);
      const artifact = await storeArtifact("idea-set", body.domain || body.topic || "Idea set", result, body.projectId || null, "ideas");
      sendJson(res, 200, { result, artifact });
      return;
    }

    if (req.method === "POST" && pathname === "/api/multi-agent/analyze") {
      const body = await readBody(req);
      const result = runMultiAgentAnalysis(body);
      const artifact = await storeArtifact("multi-agent", body.prompt || "Multi-agent analysis", result, body.projectId || null, "analysis");
      sendJson(res, 200, { result, artifact });
      return;
    }

    if (req.method === "POST" && pathname === "/api/simulations/run") {
      const body = await readBody(req);
      const result = runScenarioSimulation(body);
      const artifact = await storeArtifact("simulation", body.scenario || "Scenario simulation", result, body.projectId || null, "strategy");
      sendJson(res, 200, { result, artifact });
      return;
    }

    if (req.method === "POST" && pathname === "/api/presentations/build") {
      const body = await readBody(req);
      const result = buildPresentationOutline(body);
      const artifact = await storeArtifact("presentation", body.topic || "Presentation outline", result, body.projectId || null, "communication");
      sendJson(res, 200, { result, artifact });
      return;
    }

    if (req.method === "POST" && pathname === "/api/debate") {
      const body = await readBody(req);
      const result = buildDebate(body);
      const artifact = await storeArtifact("debate", body.topic || "Debate brief", result, body.projectId || null, "strategy");
      sendJson(res, 200, { result, artifact });
      return;
    }

    if (req.method === "POST" && pathname === "/api/workflows/build") {
      const body = await readBody(req);
      const result = buildWorkflowBlueprint(body);
      const workflow = await addWorkflow({
        title: result.title,
        trigger: result.trigger,
        steps: result.steps,
        projectId: body.projectId || null,
        status: "draft"
      });
      sendJson(res, 200, { result, workflow });
      return;
    }

    if (req.method === "POST" && pathname === "/api/sandbox") {
      const body = await readBody(req);
      const result = runSandbox(body);
      const artifact = await storeArtifact("sandbox", body.expression || body.scenario || "Sandbox run", result, body.projectId || null, "analysis");
      sendJson(res, 200, { result, artifact });
      return;
    }

    if (req.method === "POST" && pathname === "/api/learning") {
      const body = await readBody(req);
      const result = buildLearningCompanion(body);
      const artifact = await storeArtifact("learning", body.topic || "Learning plan", result, body.projectId || null, "learning");
      sendJson(res, 200, { result, artifact });
      return;
    }

    if (req.method === "POST" && pathname === "/api/role/analyze") {
      const body = await readBody(req);
      const result = buildRoleAnalysis(body);
      const artifact = await storeArtifact("role-lens", body.role || "Role analysis", result, body.projectId || null, "analysis");
      sendJson(res, 200, { result, artifact });
      return;
    }

    if (req.method === "POST" && pathname === "/api/compare") {
      const body = await readBody(req);
      const result = buildComparisonEngine(body);
      const artifact = await storeArtifact("comparison", body.title || "Comparison", result, body.projectId || null, "research");
      sendJson(res, 200, { result, artifact });
      return;
    }

    if (req.method === "POST" && pathname === "/api/action-hub") {
      const body = await readBody(req);
      const result = buildActionHubResult(body);
      const artifact = await storeArtifact("action-pack", result.title || "Action pack", result, body.projectId || null, "operations");
      sendJson(res, 200, { result, artifact });
      return;
    }

    if (req.method === "POST" && pathname === "/api/docs/build") {
      const body = await readBody(req);
      const result = buildStructuredDocument(body);
      const artifact = await storeArtifact("document", result.title || "Document", result, body.projectId || null, "docs");
      sendJson(res, 200, { result, artifact });
      return;
    }

    if (req.method === "POST" && pathname === "/api/todos/build") {
      const body = await readBody(req);
      const result = buildTodoList(body);
      const createdTasks = [];

      if (body.addToTasks !== false) {
        for (const item of result.tasks) {
          createdTasks.push(
            await addTask({
              title: item.title,
              category: item.category,
              priority: item.priority,
              effort: item.effort,
              durationMins: item.durationMins,
              notes: item.notes,
              projectId: body.projectId || null
            })
          );
        }
      }

      const artifact = await storeArtifact("todo-plan", result.title || "To-do list", result, body.projectId || null, "planning");
      sendJson(res, 200, { result, createdTasks, artifact });
      return;
    }

    if (req.method === "POST" && pathname === "/api/knowledge/add") {
      const body = await readBody(req);
      const item = await addKnowledgeItem(body);
      sendJson(res, 201, { item });
      return;
    }

    if (req.method === "POST" && pathname === "/api/knowledge/query") {
      const body = await readBody(req);
      const state = await readState();
      const result = buildKnowledgeQuery(state, body);
      sendJson(res, 200, { result });
      return;
    }

    // ── Schedule endpoints ────────────────────────────────────
    if (req.method === "GET" && pathname === "/api/schedule") {
      const state = await readState();
      const { context } = await resolveCalendarAndContext(state);
      const schedule = buildFullSchedule(state, context);
      sendJson(res, 200, { schedule });
      return;
    }

    if (req.method === "GET" && pathname === "/api/schedule/today") {
      const state = await readState();
      const { context } = await resolveCalendarAndContext(state);
      const today = getTodaySchedule(state, context);
      sendJson(res, 200, { today });
      return;
    }

    if (req.method === "POST" && pathname === "/api/schedule/carry-forward") {
      const body = await readBody(req);
      if (!body.taskId || !body.targetDate) {
        sendJson(res, 400, { error: "taskId and targetDate are required" });
        return;
      }
      const task = await updateTask(body.taskId, { deferUntil: body.targetDate });
      const state = await readState();
      const { context } = await resolveCalendarAndContext(state);
      const schedule = buildFullSchedule(state, context);
      sendJson(res, 200, { task, schedule });
      return;
    }

    if (req.method === "POST" && pathname === "/api/schedule/rebalance") {
      const state = await readState();
      const { context } = await resolveCalendarAndContext(state);
      const result = rebalanceSchedule(state, context);
      sendJson(res, 200, { schedule: result.schedule, movedTasks: result.movedTasks });
      return;
    }

    // ── Jira Integration endpoints ──────────────────────────────
    if (req.method === "POST" && pathname === "/api/integrations/jira/connect") {
      const body = await readBody(req);
      const config = { baseUrl: body.baseUrl, email: body.email, apiToken: body.apiToken };
      const result = await jira.testConnection(config);
      if (result.connected) {
        await updateIntegrations({
          jira: { ...config, enabled: true, boardId: body.boardId || "", syncedAt: null, projectMappings: {} }
        });
      }
      sendJson(res, 200, { jira: result });
      return;
    }

    if (req.method === "GET" && pathname === "/api/integrations/jira/boards") {
      const state = await readState();
      const config = state.profile?.integrations?.jira || {};
      if (!config.enabled) {
        sendJson(res, 400, { error: "Jira is not connected. Configure credentials first." });
        return;
      }
      const boards = await jira.listBoards(config);
      sendJson(res, 200, { boards });
      return;
    }

    if (req.method === "POST" && pathname === "/api/integrations/jira/sync") {
      const state = await readState();
      const config = state.profile?.integrations?.jira || {};
      if (!config.enabled || !config.boardId) {
        sendJson(res, 400, { error: "Jira board is not configured. Connect and select a board first." });
        return;
      }
      const issues = await jira.fetchBoardIssues(config, config.boardId);
      const tasks = jira.mapIssuesToTasks(issues, config.projectMappings?.default || null);
      const created = [];
      const existingKeys = new Set(
        (state.tasks || []).map((t) => t.externalId).filter(Boolean)
      );
      for (const task of tasks) {
        if (task.externalId && !existingKeys.has(task.externalId)) {
          created.push(await addTask(task));
          existingKeys.add(task.externalId);
        }
      }
      await updateIntegrations({ jira: { ...config, syncedAt: new Date().toISOString() } });
      sendJson(res, 200, { imported: created.length, total: issues.length, tasks: created });
      return;
    }

    // ── GitHub Integration endpoints ──────────────────────────────
    if (req.method === "POST" && pathname === "/api/integrations/github/connect") {
      const body = await readBody(req);
      const result = await github.testConnection(body.token);
      if (result.connected) {
        const st = await readState();
        const prev = st.profile?.integrations?.github || {};
        const reposList =
          typeof body.repos === "string"
            ? body.repos.split(",").map((r) => r.trim()).filter(Boolean)
            : Array.isArray(body.repos)
              ? body.repos
              : prev.repos || [];
        await updateIntegrations({
          github: {
            ...prev,
            token: body.token,
            authMethod: "pat",
            username: result.user.login,
            enabled: true,
            repos: reposList,
            syncedAt: prev.syncedAt || null,
            projectMappings: prev.projectMappings || {}
          }
        });
      }
      sendJson(res, 200, { github: result });
      return;
    }

    if (req.method === "GET" && pathname === "/api/integrations/github/repos") {
      const state = await readState();
      const config = state.profile?.integrations?.github || {};
      if (!config.enabled || !config.token) {
        sendJson(res, 400, { error: "GitHub is not connected. Set a personal access token first." });
        return;
      }
      const repos = await github.listRepos(config.token);
      sendJson(res, 200, { repos });
      return;
    }

    if (req.method === "POST" && pathname === "/api/integrations/github/track") {
      const body = await readBody(req);
      const state = await readState();
      const config = state.profile?.integrations?.github || {};
      if (!config.enabled) {
        sendJson(res, 400, { error: "GitHub is not connected." });
        return;
      }
      const repos = Array.isArray(body.repos) ? body.repos : [body.repos].filter(Boolean);
      const merged = [...new Set([...(config.repos || []), ...repos])];
      await updateIntegrations({ github: { ...config, repos: merged } });
      sendJson(res, 200, { tracked: merged });
      return;
    }

    if (req.method === "GET" && pathname === "/api/integrations/github/stats") {
      const state = await readState();
      const config = state.profile?.integrations?.github || {};
      if (!config.enabled || !config.token) {
        sendJson(res, 400, { error: "GitHub is not connected." });
        return;
      }
      const dashboard = await github.buildGitHubDashboard(config.token, config.repos || []);
      await updateIntegrations({ github: { ...config, syncedAt: new Date().toISOString() } });
      sendJson(res, 200, { dashboard });
      return;
    }

    // ── Notion Integration ──────────────────────────────────────
    if (req.method === "POST" && pathname === "/api/integrations/notion/connect") {
      const body = await readBody(req);
      const token = String(body.token || "").trim();
      const result = await notion.testConnection(token);
      if (result.connected) {
        const st = await readState();
        const prev = st.profile?.integrations?.notion || {};
        await updateIntegrations({
          notion: {
            ...prev,
            token,
            authMethod: "pat",
            enabled: true,
            databaseId: String(body.databaseId || prev.databaseId || "").trim(),
            syncedAt: prev.syncedAt || null
          }
        });
      }
      sendJson(res, 200, { notion: result });
      return;
    }

    if (req.method === "GET" && pathname === "/api/integrations/notion/databases") {
      const state = await readState();
      const token = state.profile?.integrations?.notion?.token;
      if (!token) {
        sendJson(res, 400, { error: "Notion is not connected. Save an integration token first." });
        return;
      }
      const databases = await notion.listDatabases(token);
      sendJson(res, 200, { databases });
      return;
    }

    if (req.method === "POST" && pathname === "/api/integrations/notion/sync") {
      const body = await readBody(req);
      const state = await readState();
      const ncfg = state.profile?.integrations?.notion || {};
      const token = ncfg.token;
      const databaseId = String(body.databaseId || ncfg.databaseId || "").trim();
      if (!token || !databaseId) {
        sendJson(res, 400, { error: "Notion token and database ID are required." });
        return;
      }
      const items = await notion.queryDatabase(token, databaseId);
      let projectId = body.projectId || ncfg.defaultProjectId || null;
      if (body.createProject && !projectId) {
        const dbList = await notion.listDatabases(token);
        const dbMeta = dbList.find((d) => d.id === databaseId) || {};
        const proj = await addProject(
          notion.mapDatabaseToProject({
            id: databaseId,
            title: dbMeta.title || "Notion board",
            description: dbMeta.description || "",
            url: dbMeta.url
          })
        );
        projectId = proj.id;
      }
      const tasks = notion.mapItemsToTasks(items, projectId || null);
      const existingIds = new Set((state.tasks || []).map((t) => t.externalId).filter(Boolean));
      const created = [];
      for (const task of tasks) {
        const key = task.sourceId || "";
        if (key && !existingIds.has(key)) {
          const { sourceId, ...rest } = task;
          created.push(
            await addTask({
              ...rest,
              externalId: key,
              source: task.source || "notion"
            })
          );
          existingIds.add(key);
        }
      }
      await updateIntegrations({
        notion: {
          ...ncfg,
          databaseId,
          defaultProjectId: projectId,
          syncedAt: new Date().toISOString()
        }
      });
      sendJson(res, 200, { imported: created.length, total: items.length, tasks: created, projectId });
      return;
    }

    sendJson(res, 404, { error: "Route not found" });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    sendJson(res, statusCode, {
      error: error.message || "Unexpected server error"
    });
  }
}

function createAppServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);

    if (url.pathname.startsWith("/api/")) {
      if (isMysqlConfigured() && !PUBLIC_API_PATHS.has(url.pathname)) {
        const token = getSessionTokenFromRequest(req);
        const user = await getSessionUser(token);
        if (!user) {
          sendJson(res, 401, { error: "Unauthorized", authRequired: true });
          return;
        }
        await requestContext.run({ userId: user.id }, async () => {
          await handleApi(req, res, url);
        });
        return;
      }
      await handleApi(req, res, url);
      return;
    }

    await serveStatic(req, res, url.pathname);
  });
}

if (require.main === module) {
  const server = createAppServer();
  server.listen(PORT, HOST, async () => {
    console.log(`Buksy is running at http://${HOST}:${PORT}`);
    if (isMysqlConfigured()) {
      try {
        await initSchema();
        console.log("MySQL schema ready.");
      } catch (error) {
        console.error("MySQL schema init failed:", error.message);
      }
    }
  });
}

module.exports = {
  buildDashboard,
  createAppServer,
  handleApi
};
