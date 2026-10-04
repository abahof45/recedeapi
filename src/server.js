const express = require("express");
const cors = require("cors");
const config = require("./config");
const routes = require("./routes");
const adminRoutes = require("./adminRoutes");

const app = express();

/**
 * Allow browser calls from recede-ai.web.app (and localhost)
 * Must allow custom headers or the browser shows "Failed to fetch"
 */
app.use(
  cors({
    origin: true, // reflect request origin
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-api-key",
      "x-admin-key",
      "x-recede-key",
    ],
    exposedHeaders: ["Content-Type"],
    credentials: false,
    maxAge: 86400,
  })
);

app.options("*", cors()); // preflight

app.use(express.json({ limit: "10mb" }));

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "RecedeAI API",
    try: [
      "POST /admin/keys          (create API key — needs ADMIN_SECRET)",
      "GET  /chat/v1/verify      (verify client key)",
      "POST /chat/v1/completions (chat)",
    ],
  });
});

app.use(routes);
app.use("/admin", adminRoutes);

app.use((_req, res) => {
  res.status(404).json({
    error: { message: "Not found", type: "invalid_request" },
  });
});

app.listen(config.port, () => {
  console.log(`RecedeAI API listening on :${config.port}`);
});
