const express = require("express");
const { requireAdmin } = require("./auth");
const { createKey, listKeys, revokeKey, deleteKey } = require("./keys");

const router = express.Router();

// All admin routes require ADMIN_SECRET
router.use(requireAdmin);

/**
 * Create API key
 * POST /admin/keys
 * Headers: x-admin-key: <ADMIN_SECRET>
 * Body: { "name": "my-app", "owner": "email@optional.com" }
 *
 * Response includes `key` ONCE — store it; it cannot be recovered later.
 */
router.post("/keys", (req, res) => {
  const name = req.body?.name || "default";
  const owner = req.body?.owner || "";
  const created = createKey({ name, owner });
  res.status(201).json({
    ok: true,
    message: "API key created. Copy `key` now — it will not be shown again.",
    ...created,
  });
});

/** List keys (prefix only, never full secret) */
router.get("/keys", (_req, res) => {
  res.json({ ok: true, keys: listKeys() });
});

/** Revoke (soft disable) */
router.post("/keys/:id/revoke", (req, res) => {
  const ok = revokeKey(req.params.id);
  if (!ok) {
    return res.status(404).json({
      error: { message: "Key not found", type: "invalid_request" },
    });
  }
  res.json({ ok: true, message: "Key revoked." });
});

/** Hard delete */
router.delete("/keys/:id", (req, res) => {
  const ok = deleteKey(req.params.id);
  if (!ok) {
    return res.status(404).json({
      error: { message: "Key not found", type: "invalid_request" },
    });
  }
  res.json({ ok: true, message: "Key deleted." });
});

module.exports = router;
