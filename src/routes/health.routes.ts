import { Router } from "express";
import { pool } from "../config/db.js";

export const healthRouter = Router();

healthRouter.get("/test-db", async (_req, res) => {
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
