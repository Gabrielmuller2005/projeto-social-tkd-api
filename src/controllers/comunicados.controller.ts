import type { Request, Response } from "express";
import {
  createComunicado,
  findComunicadoById,
  findComunicadoAtivoComVisualizacao,
  listComunicadosAtivos,
  updateComunicado,
  setComunicadoAtivo,
  upsertVisualizacao,
  type ComunicadoTipo,
} from "../models/comunicados.model.js";

const tipos_validos: ComunicadoTipo[] = ["AVISO", "MATERIAL", "CANCELAMENTO"];

export async function criarComunicado(req: Request, res: Response) {
  const { titulo, conteudo, tipo, arquivo_url } = req.body ?? {};

  if (!titulo || !conteudo || !tipo) {
    res.status(400).json({ message: "Campos obrigatórios: titulo, conteudo, tipo" });
    return;
  }
  if (!tipos_validos.includes(tipo)) {
    res.status(400).json({ message: `tipo inválido. Use um de: ${tipos_validos.join(", ")}` });
    return;
  }

  const id = await createComunicado({
    professor_id: req.user!.id,
    titulo,
    conteudo,
    tipo,
    arquivo_url: arquivo_url ?? null,
  });

  const comunicado = await findComunicadoById(id);
  res.status(201).json({ comunicado });
}

export async function listarComunicados(req: Request, res: Response) {
  const comunicados = await listComunicadosAtivos(req.user!.id);
  res.json({ comunicados });
}

export async function buscarComunicado(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: "id inválido" });
    return;
  }

  const comunicado = await findComunicadoAtivoComVisualizacao(id, req.user!.id);
  if (!comunicado) {
    res.status(404).json({ message: "Comunicado não encontrado" });
    return;
  }

  res.json({ comunicado });
}

export async function atualizarComunicado(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: "id inválido" });
    return;
  }

  const comunicadoExistente = await findComunicadoById(id);
  if (!comunicadoExistente) {
    res.status(404).json({ message: "Comunicado não encontrado" });
    return;
  }

  const { titulo, conteudo, tipo, arquivo_url } = req.body ?? {};
  if (titulo === undefined && conteudo === undefined && tipo === undefined && arquivo_url === undefined) {
    res.status(400).json({ message: "Informe ao menos um campo: titulo, conteudo, tipo, arquivo_url" });
    return;
  }
  if (tipo !== undefined && !tipos_validos.includes(tipo)) {
    res.status(400).json({ message: `tipo inválido. Use um de: ${tipos_validos.join(", ")}` });
    return;
  }

  await updateComunicado(id, { titulo, conteudo, tipo, arquivo_url });
  const comunicado = await findComunicadoById(id);
  res.json({ comunicado });
}

export async function excluirComunicado(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: "id inválido" });
    return;
  }

  const comunicado = await findComunicadoById(id);
  if (!comunicado) {
    res.status(404).json({ message: "Comunicado não encontrado" });
    return;
  }

  await setComunicadoAtivo(id, false);
  res.status(204).send();
}

export async function visualizarComunicado(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: "id inválido" });
    return;
  }

  const comunicado = await findComunicadoById(id);
  if (!comunicado || !comunicado.ativo) {
    res.status(404).json({ message: "Comunicado não encontrado" });
    return;
  }

  await upsertVisualizacao(id, req.user!.id);
  res.status(204).send();
}
