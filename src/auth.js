const config = require("./config");
const { verifyKey } = require("./keys");

/**
 * Accept BOTH:
 *   x-api-key: <key>
 *   Authorization: Bearer <key>
 */
function readClientKey(req) {
  const headers = req.headers || {};

  const fromHeader =
    headers["x-api-key"] ||
    headers["x-recede-key"] ||
    headers["x-api_key"];

  if (fromHeader && String(fromHeader).trim()) {
    return String(fromHeader).trim();
  }

  const auth = headers.authorization || headers.Authorization || "";
  const m = String(auth).match(/^Bearer\s+(.+)$/i);
  if (m && m[1].trim()) return m[1].trim();

  if (req.body?.api_key && String(req.body.api_key).trim()) {
    return String(req.body.api_key).trim();
  }

  return "";
}

/**
 * Env bootstrap keys: RECEDE_API_KEY + RECEDE_VALID_KEYS list
 */
function envAllowedKeys() {
  const list = [...config.validKeys];
  if (config.upstreamKey) list.push(config.upstreamKey);
  if (config.adminSecret) list.push(config.adminSecret);
  return list.filter(Boolean);
}

/**
 * Server-side verification — only issued (or env) keys may proceed.
 */
function verifyClientKey(plainKey) {
  return verifyKey(plainKey, envAllowedKeys());
}

function resolveUpstreamKey(clientKey) {
  return config.upstreamKey || clientKey || "";
}

/** Admin routes: x-admin-key or Bearer matching ADMIN_SECRET */
function readAdminSecret(req) {
  const h = req.headers || {};
  if (h["x-admin-key"]) return String(h["x-admin-key"]).trim();
  const auth = h.authorization || "";
  const m = String(auth).match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : "";
}

function requireAdmin(req, res, next) {
  const secret = config.adminSecret;
  if (!secret) {
    return res.status(503).json({
      error: {
        message: "Admin API disabled. Set ADMIN_SECRET in environment.",
        type: "server_error",
      },
    });
  }
  const provided = readAdminSecret(req);
  if (!provided || provided !== secret) {
    return res.status(401).json({
      error: { message: "Invalid admin credentials.", type: "auth_error" },
    });
  }
  next();
}

module.exports = {
  readClientKey,
  verifyClientKey,
  resolveUpstreamKey,
  requireAdmin,
};
