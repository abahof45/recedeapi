const express = require("express");
const cors = require("cors");
const config = require("./config");
const routes = require("./routes");
const adminRoutes = require("./adminRoutes");

const app = express();

app.use(cors({ origin: true }));
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
