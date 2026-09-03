import type { Request, Response } from "express";
import {
  listAlunos,
  findAlunoById,
  updateAlunoCadastro,
  setAlunoAtivo,
} from "../models/alunos.model.js";
import { podeAcessarAluno } from "../utils/acesso.js";
import { calcularFrequenciaAluno } from "../models/presencas.model.js";

export async function listarAlunos(req: Request, res: Response) {
  const { ativo } = req.query;

  let filtro: { ativo?: boolean } | undefined;
  if (ativo === "true") filtro = { ativo: true };
  else if (ativo === "false") filtro = { ativo: false };

  const alunos = await listAlunos(filtro);
  res.json({ alunos });
}

export async function buscarAluno(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: "id inválido" });
    return;
  }

  const podeAcessar = await podeAcessarAluno(req.user!, id);
  if (!podeAcessar) {
    res.status(403).json({ message: "Acesso negado a este aluno" });
    return;
  }

  const aluno = await findAlunoById(id);
  if (!aluno) {
    res.status(404).json({ message: "Aluno não encontrado" });
    return;
  }

  res.json({ aluno });
}

export async function atualizarAluno(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: "id inválido" });
    return;
  }

  const { nome_completo, telefone, endereco } = req.body ?? {};
  if (nome_completo === undefined && telefone === undefined && endereco === undefined) {
    res.status(400).json({
      message: "Informe ao menos um campo para atualizar: nome_completo, telefone, endereco",
    });
    return;
  }

  const aluno = await findAlunoById(id);
  if (!aluno) {
    res.status(404).json({ message: "Aluno não encontrado" });
    return;
  }

  await updateAlunoCadastro(id, { nome_completo, telefone, endereco });
  const atualizado = await findAlunoById(id);
  res.json({ aluno: atualizado });
}

export async function atualizarStatusAluno(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: "id inválido" });
    return;
  }

  const { ativo } = req.body ?? {};
  if (typeof ativo !== "boolean") {
    res.status(400).json({ message: "Campo obrigatório: ativo (boolean)" });
    return;
  }

  const aluno = await findAlunoById(id);
  if (!aluno) {
    res.status(404).json({ message: "Aluno não encontrado" });
    return;
  }

  await setAlunoAtivo(id, ativo);
  const atualizado = await findAlunoById(id);
  res.json({ aluno: atualizado });
}

export async function buscarFrequenciaAluno(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: "id inválido" });
    return;
  }

  const podeAcessar = await podeAcessarAluno(req.user!, id);
  if (!podeAcessar) {
    res.status(403).json({ message: "Acesso negado a este aluno" });
    return;
  }

  const aluno = await findAlunoById(id);
  if (!aluno) {
    res.status(404).json({ message: "Aluno não encontrado" });
    return;
  }

  const { total_aulas, presencas } = await calcularFrequenciaAluno(id);
  const totalAulas = Number(total_aulas);
  const totalPresencas = Number(presencas);
  const percentual = totalAulas > 0 ? Number(((totalPresencas / totalAulas) * 100).toFixed(2)) : 0;

  res.json({
    frequencia: {
      aluno_id: id,
      total_aulas: totalAulas,
      presencas: totalPresencas,
      percentual,
    },
  });
}
