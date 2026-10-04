require("dotenv").config();

module.exports = {
  port: Number(process.env.PORT) || 3000,
  upstreamUrl:
    process.env.RECEDE_UPSTREAM_URL ||
    "https://recedeaigo.lovable.app/api/public/v1/chat",
  upstreamKey: (process.env.RECEDE_API_KEY || "").trim(),
  validKeys: (process.env.RECEDE_VALID_KEYS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};
