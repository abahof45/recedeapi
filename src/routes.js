const express = require("express");
const config = require("./config");
const { readClientKey, verifyClientKey } = require("./auth");
const { normalizeMessages, chatUpstream } = require("./upstream");

const router = express.Router();

function apiInfo(_req, res) {
  res.json({
    name: "RecedeAI Chat Completions API",
    version: "v1",
    endpoints: {
      chat: [
        "POST /chat/v1/completions",
        "POST /chat/v1/completions/api",
      ],
      verify: ["GET /chat/v1/verify", "POST /chat/v1/verify"],
      admin: [
        "POST /admin/keys",
        "GET /admin/keys",
        "POST /admin/keys/:id/revoke",
        "DELETE /admin/keys/:id",
      ],
    },
    auth: {
      client: ["x-api-key: <issued-key>", "Authorization: Bearer <issued-key>"],
      admin: ["x-admin-key: <ADMIN_SECRET>"],
    },
    docs: "https://recede-ai.web.app/developer",
  });
}

/**
 * Verify client API key on the server (no model call).
 */
function verify(req, res) {
  const clientKey = readClientKey(req);

  if (!clientKey) {
    return res.status(401).json({
      ok: false,
      error: {
        message:
          "Missing API key. Send x-api-key OR Authorization: Bearer <key>.",
        type: "auth_error",
      },
    });
  }

  const result = verifyClientKey(clientKey);
  if (!result.ok) {
    return res.status(401).json({
      ok: false,
      error: {
        message: "Invalid or revoked API key.",
        type: "auth_error",
      },
    });
  }

  const usedHeader = req.headers["x-api-key"]
    ? "x-api-key"
    : req.headers.authorization
      ? "Authorization: Bearer"
      : "body.api_key";

  return res.json({
    ok: true,
    message: "API key verified by server.",
    auth_method: usedHeader,
    key_id: result.keyId,
    key_name: result.name,
    upstream_configured: Boolean(config.upstreamKey),
  });
}

async function completions(req, res) {
  const clientKey = readClientKey(req);

  if (!clientKey) {
    return res.status(401).json({
      error: {
        message:
          "Missing API key. Send x-api-key OR Authorization: Bearer <key>.",
        type: "auth_error",
      },
    });
  }

  const result = verifyClientKey(clientKey);
  if (!result.ok) {
    return res.status(401).json({
      error: {
        message: "Invalid or revoked API key. Create one via POST /admin/keys.",
        type: "auth_error",
      },
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
    const out = await chatUpstream(messages, clientKey, req.body?.model);
    return res.json({
      object: "chat.completion",
      model: out.model,
      reply: out.reply,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: out.reply },
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
router.get("/chat/v1/verify", verify);
router.post("/chat/v1/verify", verify);

module.exports = router;
