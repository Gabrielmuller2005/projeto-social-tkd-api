import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { checkRole } from "../middlewares/checkRole.js";
import { perfil_admin_professor } from "../types/auth.js";
import {
  criarMatricula,
  listarMatriculas,
  encerrarMatriculaController,
} from "../controllers/matriculas.controller.js";

export const matriculasRouter = Router();

matriculasRouter.post(
  "/",
  verifyToken,
  checkRole(perfil_admin_professor),
  asyncHandler(criarMatricula)
);

matriculasRouter.get("/", verifyToken, asyncHandler(listarMatriculas));

matriculasRouter.patch(
  "/:id/encerrar",
  verifyToken,
  checkRole(perfil_admin_professor),
  asyncHandler(encerrarMatriculaController)
);
