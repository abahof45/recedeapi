const express = require("express");
const { readClientKey, isKeyAllowed } = require("./auth");
const { normalizeMessages, chatUpstream } = require("./upstream");

const router = express.Router();

function apiInfo(_req, res) {
  res.json({
    name: "RecedeAI Chat Completions API",
    version: "v1",
    endpoints: [
      "POST /chat/v1/completions",
      "POST /chat/v1/completions/api",
    ],
    auth: "Header x-api-key or Authorization: Bearer <key>",
    body: {
      messages: [{ role: "user", content: "Hello RecedeAI" }],
      model: "recede-ultra-4",
    },
    docs: "https://recede-ai.web.app/developer",
  });
}

async function completions(req, res) {
  const clientKey = readClientKey(req);
  if (!clientKey) {
    return res.status(401).json({
      error: {
        message:
          "Missing API key. Send header x-api-key or Authorization: Bearer.",
        type: "auth_error",
      },
    });
  }

  if (!isKeyAllowed(clientKey)) {
    return res.status(401).json({
      error: { message: "Invalid API key.", type: "auth_error" },
    });
  }

  const messages = normalizeMessages(req.body || {});
  if (!messages) {
    return res.status(400).json({
      error: {
        message: "Body must include messages: [{ role, content }].",
        type: "invalid_request",
      },
    });
  }

  try {
    const result = await chatUpstream(
      messages,
      clientKey,
      req.body?.model
    );

    return res.json({
      object: "chat.completion",
      model: result.model,
      reply: result.reply,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: result.reply },
          finish_reason: "stop",
        },
      ],
    });
  } catch (err) {
    console.error("[completions]", err);
    return res.status(err.status || 500).json({
      error: {
        message: err.message || "Internal server error",
        type: err.type || "server_error",
      },
    });
  }
}

router.get("/chat/v1/completions", apiInfo);
router.get("/chat/v1/completions/api", apiInfo);
router.post("/chat/v1/completions", completions);
router.post("/chat/v1/completions/api", completions);

module.exports = router;
