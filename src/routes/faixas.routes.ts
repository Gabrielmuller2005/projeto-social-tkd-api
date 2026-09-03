import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { checkRole } from "../middlewares/checkRole.js";
import { perfil_admin_professor } from "../types/auth.js";
import {
  criarFaixa,
  listarFaixas,
  atualizarFaixa,
} from "../controllers/faixas.controller.js";

export const faixasRouter = Router();

faixasRouter.post("/", verifyToken, checkRole(perfil_admin_professor), asyncHandler(criarFaixa));

faixasRouter.get("/", verifyToken, asyncHandler(listarFaixas));

faixasRouter.patch(
  "/:id",
  verifyToken,
  checkRole(perfil_admin_professor),
  asyncHandler(atualizarFaixa)
);
