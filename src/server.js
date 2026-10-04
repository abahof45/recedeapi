const express = require("express");
const cors = require("cors");
const config = require("./config");
const routes = require("./routes");

const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "RecedeAI API",
    try: [
      "GET  /chat/v1/completions",
      "POST /chat/v1/completions",
      "POST /chat/v1/completions/api",
    ],
  });
});

app.use(routes);

app.use((_req, res) => {
  res.status(404).json({
    error: { message: "Not found", type: "invalid_request" },
  });
});

app.listen(config.port, () => {
  console.log(`RecedeAI API listening on :${config.port}`);
});
