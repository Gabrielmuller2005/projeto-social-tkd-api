import type { Request, Response } from "express";
import {
  createAula,
  findAulaById,
  listAulasByTurma,
  cancelarAula,
} from "../models/aulas.model.js";
import { findTurmaById } from "../models/turmas.model.js";
import { converterDataBrParaIso, isHoraValida } from "../utils/validacao.js";

export async function criarAula(req: Request, res: Response) {
  const { turma_id, data_aula, hora_inicio, hora_fim } = req.body ?? {};

  if (!turma_id || !data_aula || !hora_inicio || !hora_fim) {
    res.status(400).json({
      message: "Campos obrigatórios: turma_id, data_aula, hora_inicio, hora_fim",
    });
    return;
  }
  const dataAulaIso = converterDataBrParaIso(data_aula);
  if (!dataAulaIso) {
    res.status(400).json({ message: "data_aula inválida. Use o formato DD/MM/AAAA" });
    return;
  }
  if (!isHoraValida(hora_inicio) || !isHoraValida(hora_fim) || hora_inicio >= hora_fim) {
    res.status(400).json({
      message: "hora_inicio/hora_fim inválidos. Use o formato HH:MM, com hora_inicio < hora_fim",
    });
    return;
  }

  const turma = await findTurmaById(Number(turma_id));
  if (!turma) {
    res.status(404).json({ message: "Turma não encontrada" });
    return;
  }
  if (!turma.ativo) {
    res.status(409).json({ message: "Turma inativa não pode receber novas aulas" });
    return;
  }

  const id = await createAula({
    turma_id: Number(turma_id),
    data_aula: dataAulaIso,
    hora_inicio,
    hora_fim,
  });

  const aula = await findAulaById(id);
  res.status(201).json({ aula });
}

export async function listarAulas(req: Request, res: Response) {
  const { turma_id, data_inicio, data_fim } = req.query;

  if (turma_id === undefined) {
    res.status(400).json({ message: "Informe turma_id" });
    return;
  }

  const turmaId = Number(turma_id);
  if (Number.isNaN(turmaId)) {
    res.status(400).json({ message: "turma_id inválido" });
    return;
  }

  let dataInicioIso: string | undefined;
  if (typeof data_inicio === "string") {
    const convertido = converterDataBrParaIso(data_inicio);
    if (!convertido) {
      res.status(400).json({ message: "data_inicio inválida. Use o formato DD/MM/AAAA" });
      return;
    }
    dataInicioIso = convertido;
  }

  let dataFimIso: string | undefined;
  if (typeof data_fim === "string") {
    const convertido = converterDataBrParaIso(data_fim);
    if (!convertido) {
      res.status(400).json({ message: "data_fim inválida. Use o formato DD/MM/AAAA" });
      return;
    }
    dataFimIso = convertido;
  }

  const aulas = await listAulasByTurma(turmaId, { dataInicio: dataInicioIso, dataFim: dataFimIso });
  res.json({ aulas });
}

export async function buscarAula(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: "id inválido" });
    return;
  }

  const aula = await findAulaById(id);
  if (!aula) {
    res.status(404).json({ message: "Aula não encontrada" });
    return;
  }

  res.json({ aula });
}

export async function cancelarAulaController(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: "id inválido" });
    return;
  }

  const { motivo_cancelamento } = req.body ?? {};
  if (!motivo_cancelamento) {
    res.status(400).json({ message: "Campo obrigatório: motivo_cancelamento" });
    return;
  }

  const aula = await findAulaById(id);
  if (!aula) {
    res.status(404).json({ message: "Aula não encontrada" });
    return;
  }
  if (aula.status === "REALIZADA") {
    res.status(409).json({ message: "Não é possível cancelar uma aula já realizada" });
    return;
  }
  if (aula.status === "CANCELADA") {
    res.status(409).json({ message: "Aula já está cancelada" });
    return;
  }

  await cancelarAula(id, motivo_cancelamento);
  const atualizada = await findAulaById(id);
  res.json({ aula: atualizada });
}
