import express from "express";
import { env } from "./config/env.js";
import { pool } from "./config/db.js";

const app = express();

app.get("/test-db", async (_req, res) => {
  try {
    const [rows] = await pool.query("select 1 as result");
    res.json({ status: "ok", db: rows });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Falha ao conectar ao banco de dados",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

app.listen(env.port, () => {
  console.log(`Servidor rodando na porta ${env.port}`);
});
