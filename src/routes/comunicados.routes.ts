import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { checkRole } from "../middlewares/checkRole.js";
import { perfil_admin_professor } from "../types/auth.js";
import {
  criarComunicado,
  listarComunicados,
  buscarComunicado,
  atualizarComunicado,
  excluirComunicado,
  visualizarComunicado,
} from "../controllers/comunicados.controller.js";

export const comunicadosRouter = Router();

comunicadosRouter.post(
  "/",
  verifyToken,
  checkRole(perfil_admin_professor),
  asyncHandler(criarComunicado)
);

comunicadosRouter.get("/", verifyToken, asyncHandler(listarComunicados));

comunicadosRouter.get("/:id", verifyToken, asyncHandler(buscarComunicado));

comunicadosRouter.patch(
  "/:id",
  verifyToken,
  checkRole(perfil_admin_professor),
  asyncHandler(atualizarComunicado)
);

comunicadosRouter.delete(
  "/:id",
  verifyToken,
  checkRole(perfil_admin_professor),
  asyncHandler(excluirComunicado)
);

comunicadosRouter.post("/:id/visualizar", verifyToken, asyncHandler(visualizarComunicado));
