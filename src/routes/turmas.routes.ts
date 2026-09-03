import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { checkRole } from "../middlewares/checkRole.js";
import { perfil_admin_professor } from "../types/auth.js";
import {
  criarTurma,
  listarTurmas,
  buscarTurma,
  atualizarTurma,
} from "../controllers/turmas.controller.js";

export const turmasRouter = Router();

turmasRouter.post("/", verifyToken, checkRole(perfil_admin_professor), asyncHandler(criarTurma));

turmasRouter.get("/", verifyToken, asyncHandler(listarTurmas));

turmasRouter.get("/:id", verifyToken, asyncHandler(buscarTurma));

turmasRouter.patch(
  "/:id",
  verifyToken,
  checkRole(perfil_admin_professor),
  asyncHandler(atualizarTurma)
);
