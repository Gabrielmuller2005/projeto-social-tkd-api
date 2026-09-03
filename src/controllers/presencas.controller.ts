import type { Request, Response } from "express";
import { findAulaById, marcarAulaRealizada } from "../models/aulas.model.js";
import { upsertPresencas, listPresencasByAula } from "../models/presencas.model.js";
import { isAlunoMatriculadoAtivoNaTurma } from "../models/matriculas.model.js";

interface RegistroPresenca {
  aluno_id: number;
  presente: boolean;
}

function isRegistroValido(r: unknown): r is RegistroPresenca {
  if (typeof r !== "object" || r === null) return false;
  const obj = r as Record<string, unknown>;
  return typeof obj.aluno_id === "number" && typeof obj.presente === "boolean";
}

export async function registrarPresencas(req: Request, res: Response) {
  const aulaId = Number(req.params.id);
  if (Number.isNaN(aulaId)) {
    res.status(400).json({ message: "id inválido" });
    return;
  }

  const aula = await findAulaById(aulaId);
  if (!aula) {
    res.status(404).json({ message: "Aula não encontrada" });
    return;
  }
  if (aula.status === "CANCELADA") {
    res.status(409).json({ message: "Não é possível registrar presença em aula cancelada" });
    return;
  }

  const registros = req.body;
  if (!Array.isArray(registros) || registros.length === 0 || !registros.every(isRegistroValido)) {
    res.status(400).json({
      message: "Envie um array não vazio: [{ aluno_id: number, presente: boolean }]",
    });
    return;
  }

  for (const registro of registros) {
    const matriculado = await isAlunoMatriculadoAtivoNaTurma(registro.aluno_id, aula.turma_id);
    if (!matriculado) {
      res.status(409).json({
        message: `Aluno ${registro.aluno_id} não está matriculado e ativo nesta turma`,
      });
      return;
    }
  }

  await upsertPresencas(aulaId, registros, req.user!.id);

  if (aula.status === "PREVISTA") {
    await marcarAulaRealizada(aulaId);
  }

  const aulaAtualizada = await findAulaById(aulaId);
  const presencas = await listPresencasByAula(aulaId);
  res.status(201).json({ aula: aulaAtualizada, presencas });
}

export async function listarPresencasDaAula(req: Request, res: Response) {
  const aulaId = Number(req.params.id);
  if (Number.isNaN(aulaId)) {
    res.status(400).json({ message: "id inválido" });
    return;
  }

  const aula = await findAulaById(aulaId);
  if (!aula) {
    res.status(404).json({ message: "Aula não encontrada" });
    return;
  }

  const presencas = await listPresencasByAula(aulaId);
  res.json({ presencas });
}
