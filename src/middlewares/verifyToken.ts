import type { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../utils/jwt.js";

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token de autenticação ausente" });
    return;
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    req.user = verifyJwt(token);
    next();
  } catch {
    res.status(401).json({ message: "Token de autenticação inválido ou expirado" });
  }
}
