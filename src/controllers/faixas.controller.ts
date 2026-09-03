import type { Request, Response } from "express";
import {
  createFaixa,
  findFaixaById,
  findFaixaAtivaPorOrdem,
  listFaixasAtivas,
  updateFaixa,
} from "../models/faixas.model.js";

export async function criarFaixa(req: Request, res: Response) {
  const { cor, gub, ordem } = req.body ?? {};

  if (!cor || gub === undefined || ordem === undefined) {
    res.status(400).json({ message: "Campos obrigatórios: cor, gub, ordem" });
    return;
  }

  const conflito = await findFaixaAtivaPorOrdem(Number(ordem));
  if (conflito) {
    res.status(409).json({ message: `Já existe uma faixa ativa com ordem ${ordem}` });
    return;
  }

  const id = await createFaixa({ cor, gub: Number(gub), ordem: Number(ordem) });
  const faixa = await findFaixaById(id);
  res.status(201).json({ faixa });
}

export async function listarFaixas(_req: Request, res: Response) {
  const faixas = await listFaixasAtivas();
  res.json({ faixas });
}

export async function atualizarFaixa(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: "id inválido" });
    return;
  }

  const faixaExistente = await findFaixaById(id);
  if (!faixaExistente) {
    res.status(404).json({ message: "Faixa não encontrada" });
    return;
  }

  const { cor, gub, ordem, ativo } = req.body ?? {};
  if (cor === undefined && gub === undefined && ordem === undefined && ativo === undefined) {
    res.status(400).json({ message: "Informe ao menos um campo: cor, gub, ordem, ativo" });
    return;
  }

  if (ordem !== undefined) {
    const conflito = await findFaixaAtivaPorOrdem(Number(ordem), id);
    if (conflito) {
      res.status(409).json({ message: `Já existe uma faixa ativa com ordem ${ordem}` });
      return;
    }
  }

  await updateFaixa(id, {
    cor,
    gub: gub !== undefined ? Number(gub) : undefined,
    ordem: ordem !== undefined ? Number(ordem) : undefined,
    ativo,
  });

  const faixa = await findFaixaById(id);
  res.json({ faixa });
}
