import type { NextFunction, Request, Response } from "express";
import type { Perfil } from "../types/auth.js";

export function checkRole(...perfis: Perfil[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: "Token de autenticação ausente" });
      return;
    }
    if (!perfis.includes(req.user.perfil)) {
      res.status(403).json({ message: "Acesso negado para este perfil" });
      return;
    }
    next();
  };
}
