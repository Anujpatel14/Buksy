const crypto = require("node:crypto");
const https = require("node:https");
const querystring = require("node:querystring");

const STATE_TTL_MS = 15 * 60 * 1000;
const oauthStates = new Map();

function cleanupOAuthStates() {
  const now = Date.now();
  for (const [key, entry] of oauthStates) {
    if (now - entry.createdAt > STATE_TTL_MS) {
      oauthStates.delete(key);
    }
  }
}

/**
 * @param {string|null} userId - null for single-user (JSON file) mode
 */
function issueOAuthState(userId) {
  cleanupOAuthStates();
  const state = crypto.randomBytes(24).toString("hex");
  oauthStates.set(state, { userId: userId === undefined ? null : userId, createdAt: Date.now() });
  return state;
}

/** @returns {{ userId: string|null } | null} */
function consumeOAuthState(state) {
  if (!state || typeof state !== "string") {
    return null;
  }
  cleanupOAuthStates();
  const entry = oauthStates.get(state);
  if (!entry) {
    return null;
  }
  oauthStates.delete(state);
  if (Date.now() - entry.createdAt > STATE_TTL_MS) {
    return null;
  }
  return { userId: entry.userId };
}

function getPublicBaseUrl() {
  const fromEnv = process.env.BUKSY_PUBLIC_URL;
  if (fromEnv) {
    return String(fromEnv).replace(/\/$/, "");
  }
  const port = process.env.PORT || 3000;
  return `http://127.0.0.1:${port}`;
}

function httpsRequest(hostname, path, method, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname,
        path,
        method,
        headers: { "User-Agent": "Buksy/1.0", ...headers },
        timeout: 25000
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            body: Buffer.concat(chunks).toString("utf8")
          });
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("OAuth HTTP request timed out"));
    });
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function exchangeGitHubCode(code, redirectUri) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GitHub OAuth is not configured (GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET).");
  }
  const post = querystring.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri
  });
  const { statusCode, body } = await httpsRequest("github.com", "/login/oauth/access_token", "POST", {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json"
  }, post);
  let json;
  try {
    json = JSON.parse(body);
  } catch {
    throw new Error(`GitHub token response invalid (HTTP ${statusCode})`);
  }
  if (!json.access_token) {
    throw new Error(json.error_description || json.error || "GitHub token exchange failed");
  }
  return { accessToken: json.access_token, scope: json.scope || "" };
}

async function exchangeNotionCode(code, redirectUri) {
  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Notion OAuth is not configured (NOTION_CLIENT_ID / NOTION_CLIENT_SECRET).");
  }
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const payload = JSON.stringify({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri
  });
  const { body } = await httpsRequest("api.notion.com", "/v1/oauth/token", "POST", {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28"
  }, payload);
  const json = JSON.parse(body);
  if (!json.access_token) {
    throw new Error(json.error || "Notion token exchange failed");
  }
  return {
    accessToken: json.access_token,
    workspaceId: json.workspace_id || null,
    workspaceName: json.workspace_name || null
  };
}

async function exchangeGoogleCode(code, redirectUri) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).");
  }
  const post = querystring.stringify({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code"
  });
  const { body } = await httpsRequest("oauth2.googleapis.com", "/token", "POST", {
    "Content-Type": "application/x-www-form-urlencoded"
  }, post);
  const json = JSON.parse(body);
  if (!json.access_token) {
    throw new Error(json.error_description || json.error || "Google token exchange failed");
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token || null,
    expiresIn: Number(json.expires_in) || 3600
  };
}

function oauthConfigFlags() {
  return {
    githubOAuth: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    notionOAuth: Boolean(process.env.NOTION_CLIENT_ID && process.env.NOTION_CLIENT_SECRET),
    googleOAuth: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    redirectBase: getPublicBaseUrl()
  };
}

module.exports = {
  issueOAuthState,
  consumeOAuthState,
  getPublicBaseUrl,
  oauthConfigFlags,
  exchangeGitHubCode,
  exchangeNotionCode,
  exchangeGoogleCode
};
