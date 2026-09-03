import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { checkRole } from "../middlewares/checkRole.js";
import { perfil_admin_professor } from "../types/auth.js";
import {
  criarAula,
  listarAulas,
  buscarAula,
  cancelarAulaController,
} from "../controllers/aulas.controller.js";
import {
  registrarPresencas,
  listarPresencasDaAula,
} from "../controllers/presencas.controller.js";

export const aulasRouter = Router();

aulasRouter.post("/", verifyToken, checkRole(perfil_admin_professor), asyncHandler(criarAula));

aulasRouter.get("/", verifyToken, asyncHandler(listarAulas));

aulasRouter.get("/:id", verifyToken, asyncHandler(buscarAula));

aulasRouter.patch(
  "/:id/cancelar",
  verifyToken,
  checkRole(perfil_admin_professor),
  asyncHandler(cancelarAulaController)
);

aulasRouter.post(
  "/:id/presencas",
  verifyToken,
  checkRole(perfil_admin_professor),
  asyncHandler(registrarPresencas)
);

aulasRouter.get(
  "/:id/presencas",
  verifyToken,
  checkRole(perfil_admin_professor),
  asyncHandler(listarPresencasDaAula)
);
