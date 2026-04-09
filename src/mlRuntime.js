const { spawn } = require("node:child_process");
const path = require("node:path");
const {
  scheduleMlScore,
  readModelState
} = require("./ml");

const PYTHON_BIN = process.env.BUKSY_PYTHON_BIN || "python";
const ML_DIR = path.join(__dirname, "..", "ml");

function runPython(scriptName, payload = {}, timeoutMs = 1200) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(ML_DIR, scriptName);
    const child = spawn(PYTHON_BIN, [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Python ${scriptName} timed out`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk || "");
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk || "");
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(stderr || `Python ${scriptName} exited ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout || "{}"));
      } catch {
        reject(new Error(`Python ${scriptName} returned invalid JSON`));
      }
    });

    child.stdin.write(JSON.stringify(payload || {}));
    child.stdin.end();
  });
}

async function predictScheduleScore(features = {}) {
  try {
    const result = await runPython("predict.py", { features }, 900);
    if (Number.isFinite(Number(result.score))) {
      return Number(result.score);
    }
  } catch {
    // fall back to JS model when Python runtime is unavailable
  }

  const modelState = await readModelState();
  return scheduleMlScore(features, modelState);
}

async function trainRuntime(examples = 0) {
  try {
    return await runPython("train.py", { examples }, 3000);
  } catch {
    return { ok: false, note: "Python trainer unavailable, JS trainer still active." };
  }
}

module.exports = {
  predictScheduleScore,
  trainRuntime
};
