const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const { getPool } = require("./db");

const SESSION_COOKIE = "BuksySession";
const SESSION_DAYS = 30;
const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;

function hashSessionToken(token) {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

function parseCookies(header) {
  const out = {};
  if (!header || typeof header !== "string") {
    return out;
  }
  header.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    try {
      out[key] = decodeURIComponent(value);
    } catch {
      out[key] = value;
    }
  });
  return out;
}

function getSessionTokenFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  return cookies[SESSION_COOKIE] || null;
}

function buildSetCookieHeader(token, maxAgeSeconds) {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    `Max-Age=${maxAgeSeconds}`,
    "HttpOnly",
    "SameSite=Lax"
  ];
  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }
  return parts.join("; ");
}

function buildClearCookieHeader() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}

async function findUserByEmail(email) {
  const pool = getPool();
  const normalized = String(email || "").trim().toLowerCase();
  const [rows] = await pool.query(
    "SELECT id, email, password_hash, created_at FROM users WHERE email = ? LIMIT 1",
    [normalized]
  );
  return rows[0] || null;
}

async function createUser(email, password) {
  const pool = getPool();
  const id = crypto.randomUUID();
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized.includes("@")) {
    const err = new Error("Valid email is required");
    err.statusCode = 400;
    throw err;
  }
  if (!password || String(password).length < 8) {
    const err = new Error("Password must be at least 8 characters");
    err.statusCode = 400;
    throw err;
  }
  const passwordHash = await bcrypt.hash(String(password), 10);
  const now = new Date();
  try {
    await pool.query(
      `INSERT INTO users (id, email, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, normalized, passwordHash, now, now]
    );
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      const err = new Error("Email already registered");
      err.statusCode = 409;
      throw err;
    }
    throw e;
  }
  return { id, email: normalized };
}

async function verifyPassword(userRow, password) {
  return bcrypt.compare(String(password || ""), userRow.password_hash);
}

async function createSession(userId) {
  const pool = getPool();
  const sessionId = crypto.randomUUID();
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DAYS);
  const now = new Date();
  await pool.query(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [sessionId, userId, tokenHash, expires, now]
  );
  return { token, expires };
}

async function deleteSessionByToken(token) {
  const pool = getPool();
  if (!token) return;
  const tokenHash = hashSessionToken(token);
  await pool.query("DELETE FROM sessions WHERE token_hash = ?", [tokenHash]);
}

async function getSessionUser(token) {
  const pool = getPool();
  if (!token) return null;
  const tokenHash = hashSessionToken(token);
  const [rows] = await pool.query(
    `SELECT u.id, u.email
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );
  return rows[0] || null;
}

module.exports = {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  parseCookies,
  getSessionTokenFromRequest,
  buildSetCookieHeader,
  buildClearCookieHeader,
  findUserByEmail,
  createUser,
  verifyPassword,
  createSession,
  deleteSessionByToken,
  getSessionUser
};
