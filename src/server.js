const express = require("express");
const config = require("./config");
const routes = require("./routes");
const adminRoutes = require("./adminRoutes");

const app = express();

/**
 * CORS MUST be first — browser preflight (OPTIONS) from recede-ai.web.app
 * needs Access-Control-Allow-Origin on EVERY response, including errors.
 */
function corsMiddleware(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key, x-admin-key, x-recede-key"
  );
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  next();
}

app.use(corsMiddleware);
app.use(express.json({ limit: "10mb" }));

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "RecedeAI API",
    cors: "enabled",
    time: new Date().toISOString(),
  });
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    admin_configured: Boolean(config.adminSecret),
    upstream_configured: Boolean(config.upstreamKey),
  });
});

app.use(routes);
app.use("/admin", adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    error: { message: err?.message || "Server error", type: "server_error" },
  });
});

app.use((_req, res) => {
  res.status(404).json({
    error: { message: "Not found", type: "invalid_request" },
  });
});

const port = config.port;
app.listen(port, "0.0.0.0", () => {
  console.log(`RecedeAI API on 0.0.0.0:${port} (CORS *)`);
});
