import { Router } from "express";
import { healthRouter } from "./health.routes.js";
import { authRouter } from "./auth.routes.js";
import { alunosRouter } from "./alunos.routes.js";
import { turmasRouter } from "./turmas.routes.js";
import { matriculasRouter } from "./matriculas.routes.js";
import { aulasRouter } from "./aulas.routes.js";
import { faixasRouter } from "./faixas.routes.js";

export const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/alunos", alunosRouter);
router.use("/turmas", turmasRouter);
router.use("/matriculas", matriculasRouter);
router.use("/aulas", aulasRouter);
router.use("/faixas", faixasRouter);
