/**
 * API key store + creator
 * Keys are stored hashed (sha256). Plain key shown only once at creation.
 *
 * File: data/api-keys.json  (created automatically)
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "data");
const STORE_PATH = path.join(DATA_DIR, "api-keys.json");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(
      STORE_PATH,
      JSON.stringify({ keys: [] }, null, 2),
      "utf8"
    );
  }
}

function readStore() {
  ensureStore();
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data.keys)) data.keys = [];
    return data;
  } catch {
    return { keys: [] };
  }
}

function writeStore(data) {
  ensureStore();
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
}

function hashKey(plain) {
  return crypto.createHash("sha256").update(String(plain)).digest("hex");
}

function generatePlainKey() {
  // recede_live_ + 32 random bytes hex
  return "recede_live_" + crypto.randomBytes(24).toString("hex");
}

/**
 * Create a new API key.
 * @param {{ name?: string, owner?: string }} meta
 * @returns {{ id, name, key, prefix, createdAt }}  `key` is shown only once
 */
function createKey(meta = {}) {
  const plain = generatePlainKey();
  const record = {
    id: crypto.randomUUID(),
    name: (meta.name || "default").trim() || "default",
    owner: (meta.owner || "").trim(),
    prefix: plain.slice(0, 16) + "…",
    hash: hashKey(plain),
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    active: true,
  };

  const store = readStore();
  store.keys.push(record);
  writeStore(store);

  return {
    id: record.id,
    name: record.name,
    owner: record.owner,
    prefix: record.prefix,
    createdAt: record.createdAt,
    key: plain, // only returned here
  };
}

function listKeys() {
  return readStore().keys.map((k) => ({
    id: k.id,
    name: k.name,
    owner: k.owner || "",
    prefix: k.prefix,
    createdAt: k.createdAt,
    lastUsedAt: k.lastUsedAt,
    active: k.active !== false,
  }));
}

function revokeKey(id) {
  const store = readStore();
  const row = store.keys.find((k) => k.id === id);
  if (!row) return false;
  row.active = false;
  writeStore(store);
  return true;
}

function deleteKey(id) {
  const store = readStore();
  const before = store.keys.length;
  store.keys = store.keys.filter((k) => k.id !== id);
  if (store.keys.length === before) return false;
  writeStore(store);
  return true;
}

/**
 * Verify a client-provided plain API key against the store.
 * Also allows env RECEDE_VALID_KEYS and RECEDE_API_KEY as bootstrap keys.
 * @returns {{ ok: boolean, keyId?: string, name?: string }}
 */
function verifyKey(plainKey, extraAllowed = []) {
  const plain = String(plainKey || "").trim();
  if (!plain) return { ok: false };

  // Bootstrap / env keys always allowed
  for (const k of extraAllowed) {
    if (k && k === plain) {
      return { ok: true, keyId: "env", name: "env-key" };
    }
  }

  const hash = hashKey(plain);
  const store = readStore();
  const row = store.keys.find((k) => k.hash === hash && k.active !== false);
  if (!row) return { ok: false };

  row.lastUsedAt = new Date().toISOString();
  writeStore(store);

  return { ok: true, keyId: row.id, name: row.name };
}

module.exports = {
  createKey,
  listKeys,
  revokeKey,
  deleteKey,
  verifyKey,
};
