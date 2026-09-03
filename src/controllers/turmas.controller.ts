import type { Request, Response } from "express";
import {
  createTurmaComHorarios,
  findTurmaById,
  findTurmaComHorariosById,
  listTurmasAtivasComHorarios,
  updateTurma,
  replaceHorarios,
} from "../models/turmas.model.js";
import { calcularRankingTurma } from "../models/presencas.model.js";
import { isHoraValida } from "../utils/validacao.js";

interface HorarioInput {
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
}

function isHorarioValido(h: unknown): h is HorarioInput {
  if (typeof h !== "object" || h === null) return false;
  const obj = h as Record<string, unknown>;
  return (
    typeof obj.dia_semana === "number" &&
    obj.dia_semana >= 0 &&
    obj.dia_semana <= 6 &&
    isHoraValida(obj.hora_inicio) &&
    isHoraValida(obj.hora_fim) &&
    obj.hora_inicio < obj.hora_fim
  );
}

function validarHorarios(horarios: unknown): horarios is HorarioInput[] {
  return Array.isArray(horarios) && horarios.length > 0 && horarios.every(isHorarioValido);
}

export async function criarTurma(req: Request, res: Response) {
  const { nome, descricao, horarios } = req.body ?? {};

  if (!nome) {
    res.status(400).json({ message: "Campo obrigatório: nome" });
    return;
  }
  if ((nome as string).length > 100) {
    res.status(400).json({ message: "nome excede o tamanho máximo de 100 caracteres" });
    return;
  }

  if (!validarHorarios(horarios)) {
    res.status(400).json({
      message: "Informe ao menos um horário: [{ dia_semana, hora_inicio, hora_fim }]",
    });
    return;
  }

  const id = await createTurmaComHorarios({
    nome,
    descricao: descricao ?? null,
    horarios,
  });

  const turma = await findTurmaComHorariosById(id);
  res.status(201).json({ turma });
}

export async function listarTurmas(_req: Request, res: Response) {
  const turmas = await listTurmasAtivasComHorarios();
  res.json({ turmas });
}

export async function buscarTurma(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: "id inválido" });
    return;
  }

  const turma = await findTurmaComHorariosById(id);
  if (!turma) {
    res.status(404).json({ message: "Turma não encontrada" });
    return;
  }

  res.json({ turma });
}

export async function atualizarTurma(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: "id inválido" });
    return;
  }

  const turmaExistente = await findTurmaById(id);
  if (!turmaExistente) {
    res.status(404).json({ message: "Turma não encontrada" });
    return;
  }

  const { nome, descricao, ativo, horarios } = req.body ?? {};

  if (
    nome === undefined &&
    descricao === undefined &&
    ativo === undefined &&
    horarios === undefined
  ) {
    res.status(400).json({
      message: "Informe ao menos um campo: nome, descricao, ativo, horarios",
    });
    return;
  }

  if (nome !== undefined && (nome as string).length > 100) {
    res.status(400).json({ message: "nome excede o tamanho máximo de 100 caracteres" });
    return;
  }

  if (horarios !== undefined && !validarHorarios(horarios)) {
    res.status(400).json({
      message: "horarios deve ser uma lista não vazia de { dia_semana, hora_inicio, hora_fim }",
    });
    return;
  }

  if (nome !== undefined || descricao !== undefined || ativo !== undefined) {
    await updateTurma(id, { nome, descricao, ativo });
  }

  if (horarios !== undefined) {
    await replaceHorarios(id, horarios);
  }

  const turma = await findTurmaComHorariosById(id);
  res.json({ turma });
}

export async function rankingTurma(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: "id inválido" });
    return;
  }

  const turma = await findTurmaById(id);
  if (!turma) {
    res.status(404).json({ message: "Turma não encontrada" });
    return;
  }

  const linhas = await calcularRankingTurma(id);
  const ranking = linhas
    .map((linha) => {
      const totalAulas = Number(linha.total_aulas);
      const presencas = Number(linha.presencas);
      return {
        aluno_id: linha.aluno_id,
        aluno_nome: linha.aluno_nome,
        total_aulas: totalAulas,
        presencas,
        percentual: totalAulas > 0 ? Number(((presencas / totalAulas) * 100).toFixed(2)) : 0,
      };
    })
    .sort((a, b) => b.percentual - a.percentual);

  res.json({ ranking });
}
