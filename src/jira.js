/**
 * Jira Integration Module
 * Connects Buksy to Jira Cloud boards to import and sync tasks.
 */

const https = require("node:https");
const http = require("node:http");

/**
 * Make a request to the Jira REST API v3.
 */
async function jiraRequest(method, path, config, body = null) {
  const { baseUrl, email, apiToken } = config;
  if (!baseUrl || !email || !apiToken) {
    throw new Error("Jira credentials are not configured. Set baseUrl, email, and apiToken.");
  }

  const url = new URL(path, baseUrl.replace(/\/$/, ""));
  const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");
  const isHttps = url.protocol === "https:";
  const transport = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        "Authorization": `Basic ${auth}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      timeout: 15000
    };

    const req = transport.request(options, (res) => {
      const chunks = [];
      res.on("data", chunk => chunks.push(chunk));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");
        try {
          const data = raw ? JSON.parse(raw) : {};
          if (res.statusCode >= 400) {
            reject(new Error(data.errorMessages?.[0] || data.message || `Jira API returned ${res.statusCode}`));
          } else {
            resolve(data);
          }
        } catch {
          reject(new Error(`Jira returned invalid JSON (status ${res.statusCode})`));
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Jira request timed out")); });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Test the Jira connection.
 */
async function testConnection(config) {
  try {
    const data = await jiraRequest("GET", "/rest/api/3/myself", config);
    return {
      connected: true,
      user: { displayName: data.displayName, email: data.emailAddress, accountId: data.accountId },
      message: `Connected as ${data.displayName}`
    };
  } catch (error) {
    return { connected: false, user: null, message: error.message };
  }
}

/**
 * List available Jira boards.
 */
async function listBoards(config) {
  const data = await jiraRequest("GET", "/rest/agile/1.0/board?maxResults=50", config);
  return (data.values || []).map(board => ({
    id: board.id,
    name: board.name,
    type: board.type,
    projectKey: board.location?.projectKey || null,
    projectName: board.location?.projectName || null
  }));
}

/**
 * Fetch issues from a specific board.
 */
async function fetchBoardIssues(config, boardId) {
  const jql = encodeURIComponent(`status in ("To Do", "In Progress") ORDER BY priority DESC, updated DESC`);
  const data = await jiraRequest(
    "GET",
    `/rest/agile/1.0/board/${boardId}/issue?jql=${jql}&maxResults=100&fields=summary,priority,status,assignee,duedate,timeoriginalestimate,story_points,labels,issuetype`,
    config
  );

  return (data.issues || []).map(issue => {
    const fields = issue.fields || {};
    const storyPoints = fields.story_points || fields.customfield_10028 || 0;
    const timeEstimate = fields.timeoriginalestimate; // in seconds

    return {
      key: issue.key,
      summary: fields.summary || "",
      priority: mapJiraPriority(fields.priority?.name),
      status: fields.status?.name || "To Do",
      dueDate: fields.duedate || null,
      estimatedMins: timeEstimate ? Math.round(timeEstimate / 60) : storyPointsToMins(storyPoints),
      storyPoints,
      labels: fields.labels || [],
      issueType: fields.issuetype?.name || "Task",
      assignee: fields.assignee?.displayName || null,
      url: `${config.baseUrl}/browse/${issue.key}`
    };
  });
}

function mapJiraPriority(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("highest") || n.includes("critical") || n.includes("blocker")) return "high";
  if (n.includes("high")) return "high";
  if (n.includes("low") || n.includes("lowest")) return "low";
  return "medium";
}

function storyPointsToMins(points) {
  // Rough mapping: 1 SP = 30 mins, 2 = 60, 3 = 90, 5 = 150, 8 = 240, 13 = 390
  const map = { 0: 25, 1: 30, 2: 60, 3: 90, 5: 150, 8: 240, 13: 390 };
  return map[points] || Math.round((points || 1) * 30);
}

/**
 * Convert Jira issues to Buksy task format.
 */
function mapIssuesToTasks(issues, projectId = null) {
  return issues.map(issue => ({
    title: `[${issue.key}] ${issue.summary}`,
    category: "work",
    priority: issue.priority,
    effort: issue.estimatedMins > 120 ? "high" : issue.estimatedMins > 45 ? "medium" : "low",
    durationMins: issue.estimatedMins,
    dueDate: issue.dueDate || null,
    projectId: projectId || null,
    tags: ["jira", ...issue.labels],
    notes: `Imported from Jira: ${issue.url}`,
    externalId: issue.key,
    source: "jira"
  }));
}

function defaultJiraConfig() {
  return {
    enabled: false,
    baseUrl: "",
    email: "",
    apiToken: "",
    boardId: "",
    syncedAt: null,
    projectMappings: {}
  };
}

module.exports = {
  testConnection,
  listBoards,
  fetchBoardIssues,
  mapIssuesToTasks,
  defaultJiraConfig
};
