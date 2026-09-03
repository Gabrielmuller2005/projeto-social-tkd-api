import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { checkRole } from "../middlewares/checkRole.js";
import { perfil_admin_professor } from "../types/auth.js";
import {
  listarAlunos,
  buscarAluno,
  atualizarAluno,
  atualizarStatusAluno,
  buscarFrequenciaAluno,
  registrarGraduacaoAluno,
  listarHistoricoFaixas,
  buscarAulasFaixaAtual,
} from "../controllers/alunos.controller.js";

export const alunosRouter = Router();

alunosRouter.get("/", verifyToken, checkRole(perfil_admin_professor), asyncHandler(listarAlunos));

alunosRouter.get("/:id", verifyToken, asyncHandler(buscarAluno));

alunosRouter.patch(
  "/:id",
  verifyToken,
  checkRole(perfil_admin_professor),
  asyncHandler(atualizarAluno)
);

alunosRouter.patch(
  "/:id/status",
  verifyToken,
  checkRole(perfil_admin_professor),
  asyncHandler(atualizarStatusAluno)
);

alunosRouter.get("/:id/frequencia", verifyToken, asyncHandler(buscarFrequenciaAluno));

alunosRouter.post(
  "/:id/graduacao",
  verifyToken,
  checkRole(perfil_admin_professor),
  asyncHandler(registrarGraduacaoAluno)
);

alunosRouter.get("/:id/historico-faixas", verifyToken, asyncHandler(listarHistoricoFaixas));

alunosRouter.get("/:id/faixa-atual/aulas", verifyToken, asyncHandler(buscarAulasFaixaAtual));
