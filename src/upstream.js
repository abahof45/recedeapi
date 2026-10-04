const config = require("./config");

function normalizeMessages(body) {
  const raw = body?.messages;
  if (!Array.isArray(raw) || !raw.length) return null;
  return raw
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant" || m.role === "system") &&
        m.content != null
    )
    .map((m) => ({ role: m.role, content: String(m.content) }));
}

async function chatUpstream(messages, clientKey, requestedModel) {
  const key = config.upstreamKey || clientKey;
  if (!key) {
    const err = new Error("No API key configured for upstream.");
    err.status = 500;
    err.type = "server_error";
    throw err;
  }

  const response = await fetch(config.upstreamUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
    },
    body: JSON.stringify({ messages }),
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    const err = new Error("Upstream returned non-JSON.");
    err.status = 502;
    err.type = "upstream_error";
    throw err;
  }

  if (!response.ok) {
    const err = new Error(
      data?.error?.message ||
        data?.message ||
        `Upstream error ${response.status}`
    );
    err.status = response.status;
    err.type = "upstream_error";
    throw err;
  }

  const reply =
    data.reply ??
    data.message ??
    data.content ??
    data?.choices?.[0]?.message?.content ??
    "";

  if (!String(reply).trim()) {
    const err = new Error("Empty reply from upstream.");
    err.status = 502;
    err.type = "upstream_error";
    throw err;
  }

  return {
    reply: String(reply),
    model: requestedModel || data.model || "recede-ultra-4",
    raw: data,
  };
}

module.exports = { normalizeMessages, chatUpstream };
