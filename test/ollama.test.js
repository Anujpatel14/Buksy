const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const {
  getOllamaStatus,
  planChatAction,
  generateBuddyReply
} = require("../src/ollama");

function startFakeOllama(handler) {
  const server = http.createServer(handler);

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        server,
        baseUrl: `http://${address.address}:${address.port}`
      });
    });
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

test("getOllamaStatus reports connected models from a local Ollama endpoint", async () => {
  const { server, baseUrl } = await startFakeOllama((req, res) => {
    if (req.url === "/api/tags") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        models: [
          {
            name: "qwen3",
            model: "qwen3",
            modified_at: "2026-04-07T00:00:00Z",
            details: {
              family: "qwen",
              parameter_size: "4B"
            }
          }
        ]
      }));
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  try {
    const status = await getOllamaStatus({ baseUrl, model: "qwen3" });
    assert.equal(status.connected, true);
    assert.equal(status.selectedInstalled, true);
    assert.equal(status.availableModels[0].name, "qwen3");
  } finally {
    await closeServer(server);
  }
});

test("planChatAction and generateBuddyReply parse chat responses from Ollama", async () => {
  const { server, baseUrl } = await startFakeOllama(async (req, res) => {
    if (req.url !== "/api/chat" || req.method !== "POST") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    const isRouter = typeof body.format === "object";
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      message: {
        content: isRouter
          ? JSON.stringify({
              intent: "build_todo",
              confidence: 0.88,
              title: "Launch checklist",
              prompt: "todo list for app launch",
              targetDays: 0,
              availableMinutes: 0,
              optionA: "",
              optionB: "",
              reply: "",
              reason: "The user wants a checklist."
            })
          : "You should start by locking the launch checklist and then setting a ship date."
      }
    }));
  });

  try {
    const route = await planChatAction("Make me a launch checklist", "Open tasks:\n- none", {
      baseUrl,
      model: "qwen3"
    });
    assert.equal(route.intent, "build_todo");
    assert.equal(route.prompt, "todo list for app launch");

    const reply = await generateBuddyReply("What should I focus on?", "Open tasks:\n- none", "coach", {
      baseUrl,
      model: "qwen3"
    });
    assert.match(reply, /launch checklist/i);
  } finally {
    await closeServer(server);
  }
});
