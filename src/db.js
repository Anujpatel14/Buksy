const mysql = require("mysql2/promise");

let pool = null;

function isMysqlConfigured() {
  return Boolean(
    process.env.MYSQL_HOST &&
    process.env.MYSQL_USER &&
    process.env.MYSQL_PASSWORD &&
    process.env.MYSQL_DATABASE
  );
}

function getPool() {
  if (!isMysqlConfigured()) {
    return null;
  }
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || "127.0.0.1",
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10
    });
  }
  return pool;
}

async function initSchema() {
  const p = getPool();
  if (!p) return;

  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id CHAR(36) NOT NULL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at DATETIME(3) NOT NULL,
      updated_at DATETIME(3) NOT NULL,
      UNIQUE KEY uq_users_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id CHAR(36) NOT NULL PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      token_hash CHAR(64) NOT NULL,
      expires_at DATETIME(3) NOT NULL,
      created_at DATETIME(3) NOT NULL,
      KEY idx_sessions_token (token_hash),
      KEY idx_sessions_user (user_id),
      CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS user_states (
      user_id CHAR(36) NOT NULL PRIMARY KEY,
      state_json LONGTEXT NOT NULL,
      updated_at DATETIME(3) NOT NULL,
      CONSTRAINT fk_user_states_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function loadUserStateJson(userId) {
  const p = getPool();
  const [rows] = await p.query(
    "SELECT state_json FROM user_states WHERE user_id = ? LIMIT 1",
    [userId]
  );
  if (!rows.length) {
    return null;
  }
  return rows[0].state_json;
}

async function saveUserStateJson(userId, json) {
  const p = getPool();
  const now = new Date();
  await p.query(
    `INSERT INTO user_states (user_id, state_json, updated_at)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE state_json = VALUES(state_json), updated_at = VALUES(updated_at)`,
    [userId, json, now]
  );
}

module.exports = {
  isMysqlConfigured,
  getPool,
  initSchema,
  loadUserStateJson,
  saveUserStateJson
};
