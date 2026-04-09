/**
 * Notion Integration Module
 * Connects to Notion API to import databases, pages, and boards as Buksy tasks/projects.
 */

const https = require("https");
const http = require("http");

const NOTION_API_VERSION = "2022-06-28";
const NOTION_BASE_URL = "https://api.notion.com";

/**
 * Make a request to the Notion API.
 */
function notionRequest(method, path, token, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, NOTION_BASE_URL);
    const isHttps = url.protocol === "https:";
    const transport = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method.toUpperCase(),
      headers: {
        "Authorization": `Bearer ${token}`,
        "Notion-Version": NOTION_API_VERSION,
        "Content-Type": "application/json"
      }
    };

    const req = transport.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(parsed.message || `Notion API error: ${res.statusCode}`));
          } else {
            resolve(parsed);
          }
        } catch {
          reject(new Error(`Failed to parse Notion response: ${res.statusCode}`));
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("Notion API request timed out"));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Test the Notion connection.
 */
async function testConnection(token) {
  try {
    const user = await notionRequest("GET", "/v1/users/me", token);
    return {
      connected: true,
      message: `Connected to Notion as ${user.name || user.id}`,
      user: {
        id: user.id,
        name: user.name || "Notion User",
        type: user.type,
        avatarUrl: user.avatar_url
      }
    };
  } catch (error) {
    return {
      connected: false,
      message: `Could not connect to Notion: ${error.message}`,
      user: null
    };
  }
}

/**
 * Search for databases accessible by the integration.
 */
async function listDatabases(token) {
  try {
    const result = await notionRequest("POST", "/v1/search", token, {
      filter: { value: "database", property: "object" },
      page_size: 20
    });

    return (result.results || []).map(db => ({
      id: db.id,
      title: extractPlainText(db.title) || "Untitled Database",
      description: extractPlainText(db.description) || "",
      url: db.url,
      createdTime: db.created_time,
      lastEditedTime: db.last_edited_time,
      properties: Object.keys(db.properties || {})
    }));
  } catch (error) {
    return [];
  }
}

/**
 * Query a Notion database for its items (pages).
 */
async function queryDatabase(token, databaseId, filter = null) {
  try {
    const body = { page_size: 100 };
    if (filter) body.filter = filter;

    const result = await notionRequest("POST", `/v1/databases/${databaseId}/query`, token, body);
    return (result.results || []).map(page => mapNotionPageToItem(page));
  } catch (error) {
    return [];
  }
}

/**
 * Get a single Notion page by ID.
 */
async function getPage(token, pageId) {
  try {
    const page = await notionRequest("GET", `/v1/pages/${pageId}`, token);
    return mapNotionPageToItem(page);
  } catch (error) {
    return null;
  }
}

/**
 * Search across all Notion content.
 */
async function searchContent(token, query) {
  try {
    const result = await notionRequest("POST", "/v1/search", token, {
      query,
      page_size: 20
    });

    return (result.results || []).map(item => {
      if (item.object === "database") {
        return {
          type: "database",
          id: item.id,
          title: extractPlainText(item.title) || "Untitled",
          url: item.url
        };
      }
      return {
        type: "page",
        ...mapNotionPageToItem(item)
      };
    });
  } catch (error) {
    return [];
  }
}

/**
 * Map a Notion page object to a Buksy-compatible item.
 */
function mapNotionPageToItem(page) {
  const props = page.properties || {};

  // Extract title
  const titleProp = Object.values(props).find(p => p.type === "title");
  const title = extractPlainText(titleProp?.title) || "Untitled";

  // Extract status
  const statusProp = Object.values(props).find(p => p.type === "status" || p.type === "select");
  const status = statusProp?.status?.name || statusProp?.select?.name || "open";

  // Extract priority
  const priorityProp = props.Priority || props.priority;
  const priority = priorityProp?.select?.name?.toLowerCase() || "medium";

  // Extract due date
  const dateProp = Object.values(props).find(p => p.type === "date");
  const dueDate = dateProp?.date?.start || null;

  // Extract assignee
  const peopleProp = Object.values(props).find(p => p.type === "people");
  const assignee = peopleProp?.people?.[0]?.name || null;

  // Extract tags/labels
  const tagsProp = Object.values(props).find(p => p.type === "multi_select");
  const tags = (tagsProp?.multi_select || []).map(t => t.name);

  // Extract description/rich text
  const richTextProp = Object.values(props).find(p => p.type === "rich_text" && p !== titleProp);
  const description = extractPlainText(richTextProp?.rich_text) || "";

  // Extract number fields (estimate, effort)
  const numberProp = Object.values(props).find(p => p.type === "number");
  const estimate = numberProp?.number || null;

  return {
    notionId: page.id,
    title,
    status: mapNotionStatus(status),
    priority: mapNotionPriority(priority),
    dueDate,
    assignee,
    tags,
    description,
    estimate,
    url: page.url,
    createdTime: page.created_time,
    lastEditedTime: page.last_edited_time
  };
}

/**
 * Convert Notion items to Buksy task format.
 */
function mapItemsToTasks(items, projectId = "") {
  return items
    .filter(item => item.status !== "completed")
    .map(item => ({
      title: item.title,
      category: inferCategoryFromTags(item.tags),
      priority: item.priority,
      effort: inferEffortFromEstimate(item.estimate),
      durationMins: item.estimate ? Math.min(item.estimate * 60, 480) : 30,
      dueDate: item.dueDate || null,
      projectId: projectId || "",
      notes: [
        item.description,
        item.assignee ? `Assigned to: ${item.assignee}` : "",
        item.tags.length ? `Tags: ${item.tags.join(", ")}` : "",
        `Notion: ${item.url || item.notionId}`
      ].filter(Boolean).join(" | "),
      source: "notion",
      sourceId: item.notionId
    }));
}

/**
 * Map Notion database as a Buksy project.
 */
function mapDatabaseToProject(db) {
  return {
    name: db.title || "Notion Import",
    description: db.description || `Imported from Notion database ${db.id}`,
    tags: ["notion", "imported"],
    source: "notion",
    sourceId: db.id,
    sourceUrl: db.url
  };
}

// ── Helpers ───────────────────────────────────────────────────

function extractPlainText(richTextArray) {
  if (!Array.isArray(richTextArray)) return "";
  return richTextArray.map(t => t.plain_text || "").join("");
}

function mapNotionStatus(status) {
  const lower = String(status).toLowerCase();
  if (["done", "completed", "finished", "closed", "resolved"].includes(lower)) return "completed";
  if (["in progress", "in-progress", "doing", "started", "active"].includes(lower)) return "in_progress";
  return "open";
}

function mapNotionPriority(priority) {
  const lower = String(priority).toLowerCase();
  if (["high", "urgent", "critical", "p1", "p0"].includes(lower)) return "high";
  if (["low", "minor", "p3", "p4"].includes(lower)) return "low";
  return "medium";
}

function inferCategoryFromTags(tags = []) {
  const joined = tags.join(" ").toLowerCase();
  if (/(bug|fix|debug|error)/.test(joined)) return "work";
  if (/(design|ui|ux)/.test(joined)) return "work";
  if (/(docs|documentation|write)/.test(joined)) return "admin";
  if (/(test|qa|quality)/.test(joined)) return "work";
  if (/(plan|strategy|roadmap)/.test(joined)) return "planning";
  if (/(learn|study|course)/.test(joined)) return "learning";
  return "work";
}

function inferEffortFromEstimate(estimate) {
  if (!estimate) return "medium";
  if (estimate >= 4) return "high";
  if (estimate <= 1) return "low";
  return "medium";
}

function defaultNotionConfig() {
  return {
    enabled: false,
    authMethod: "pat",
    token: "",
    databaseId: "",
    defaultProjectId: null,
    syncedAt: null
  };
}

module.exports = {
  testConnection,
  listDatabases,
  queryDatabase,
  getPage,
  searchContent,
  mapItemsToTasks,
  mapDatabaseToProject,
  mapNotionPageToItem,
  defaultNotionConfig
};
