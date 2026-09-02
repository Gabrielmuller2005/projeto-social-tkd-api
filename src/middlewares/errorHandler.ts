import type { NextFunction, Request, Response } from "express";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  res.status(500).json({
    status: "error",
    message: "Erro interno do servidor",
    detail: err instanceof Error ? err.message : String(err),
  });
}
