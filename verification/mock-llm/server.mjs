/**
 * Minimal OpenAI-compatible mock for E2E: records the last chat-completions request body.
 * No external dependencies (Node 20+).
 */
import http from "node:http";
import { randomUUID } from "node:crypto";

const port = Number(process.env.MOCK_LLM_PORT ?? "3000");
let lastChatRequestBody = "";

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/__debug/last-chat-request") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ body: lastChatRequestBody }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/v1/chat/completions") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString("utf8");
    lastChatRequestBody = raw;

    /** @type {{ model?: string; messages?: unknown[] }} */
    let parsed = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      /* ignore */
    }

    const content = "ok";
    const id = `chatcmpl-${randomUUID()}`;
    const created = Math.floor(Date.now() / 1000);
    const model = parsed.model ?? "mock";

    if (parsed.stream) {
      res.writeHead(200, {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache",
        connection: "keep-alive",
      });
      const send = (obj) => {
        res.write(`data: ${JSON.stringify(obj)}\n\n`);
      };
      send({
        id,
        object: "chat.completion.chunk",
        created,
        model,
        choices: [
          {
            index: 0,
            delta: { role: "assistant", content: "" },
            finish_reason: null,
          },
        ],
      });
      send({
        id,
        object: "chat.completion.chunk",
        created,
        model,
        choices: [
          {
            index: 0,
            delta: { content },
            finish_reason: null,
          },
        ],
      });
      send({
        id,
        object: "chat.completion.chunk",
        created,
        model,
        choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
      });
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    const reply = {
      id,
      object: "chat.completion",
      created,
      model,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    };

    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(reply));
    return;
  }

  res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  res.end("not found");
});

server.listen(port, "0.0.0.0", () => {
  console.error(`mock-llm listening on ${port}`);
});
