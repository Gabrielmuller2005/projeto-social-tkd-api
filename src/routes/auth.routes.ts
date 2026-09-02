import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { optionalAuth } from "../middlewares/optionalAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import {
  registerResponsavel,
  registerAluno,
  registerAdminProfessor,
  login,
  me,
} from "../controllers/auth.controller.js";
import { perfil_admin_professor } from "../types/auth.js";

export const authRouter = Router();

authRouter.post("/register/responsavel", asyncHandler(registerResponsavel));

authRouter.post("/register/aluno", optionalAuth, asyncHandler(registerAluno));

authRouter.post(
  "/register/admin-professor",
  verifyToken,
  checkRole(perfil_admin_professor),
  asyncHandler(registerAdminProfessor)
);

authRouter.post("/login", asyncHandler(login));

authRouter.get("/me", verifyToken, asyncHandler(me));
