require("dotenv").config();

module.exports = {
  port: Number(process.env.PORT) || 3000,
  upstreamUrl:
    process.env.RECEDE_UPSTREAM_URL ||
    "https://recedeaigo.lovable.app/api/public/v1/chat",
  /** Server key for upstream Recede chat */
  upstreamKey: (process.env.RECEDE_API_KEY || "").trim(),
  /** Extra allow-list (comma-separated plain keys) */
  validKeys: (process.env.RECEDE_VALID_KEYS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  /** Protects /admin/keys creator */
  adminSecret: (process.env.ADMIN_SECRET || "").trim(),
};
