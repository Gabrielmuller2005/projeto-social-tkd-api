import type { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../utils/jwt.js";

/**
 * Usado em rotas que atendem tanto público anônimo quanto autenticado
 * (ex: registro de aluno, que exige responsável logado só no caso de menor de idade).
 * Se não vier token, segue sem req.user. Se vier um token inválido, rejeita.
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next();
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
