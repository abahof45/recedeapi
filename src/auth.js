const config = require("./config");

function readClientKey(req) {
  const x = req.headers["x-api-key"] || req.headers["x-recede-key"];
  if (x) return String(x).trim();
  const auth = req.headers.authorization || "";
  const m = String(auth).match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : "";
}

function isKeyAllowed(clientKey) {
  if (!config.validKeys.length) return true;
  return config.validKeys.includes(clientKey);
}

module.exports = { readClientKey, isKeyAllowed };
