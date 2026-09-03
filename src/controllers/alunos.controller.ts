import type { Request, Response } from "express";
import {
  listAlunos,
  findAlunoById,
  updateAlunoCadastro,
  setAlunoAtivo,
} from "../models/alunos.model.js";
import { podeAcessarAluno } from "../utils/acesso.js";
import { calcularFrequenciaAluno } from "../models/presencas.model.js";
import { findFaixaById } from "../models/faixas.model.js";
import {
  registrarGraduacao,
  listHistoricoByAluno,
  findDataGraduacaoFaixaAtual,
} from "../models/historicoFaixas.model.js";

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

export async function registrarGraduacaoAluno(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: "id inválido" });
    return;
  }

  const { faixa_id, data_graduacao, observacao } = req.body ?? {};
  if (!faixa_id || !data_graduacao) {
    res.status(400).json({ message: "Campos obrigatórios: faixa_id, data_graduacao" });
    return;
  }

  const aluno = await findAlunoById(id);
  if (!aluno) {
    res.status(404).json({ message: "Aluno não encontrado" });
    return;
  }

  const faixa = await findFaixaById(Number(faixa_id));
  if (!faixa) {
    res.status(404).json({ message: "Faixa não encontrada" });
    return;
  }
  if (!faixa.ativo) {
    res.status(409).json({ message: "Faixa inativa não pode ser usada em graduação" });
    return;
  }

  if (aluno.faixa_atual_id === Number(faixa_id)) {
    res.status(409).json({ message: "Aluno já está nessa faixa" });
    return;
  }

  await registrarGraduacao({
    aluno_id: id,
    faixa_id: Number(faixa_id),
    data_graduacao,
    observacao: observacao ?? null,
    registrado_por: req.user!.id,
  });

  const alunoAtualizado = await findAlunoById(id);
  const historico = await listHistoricoByAluno(id);
  res.status(201).json({ aluno: alunoAtualizado, historico });
}

export async function listarHistoricoFaixas(req: Request, res: Response) {
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

  const historico = await listHistoricoByAluno(id);
  res.json({ historico });
}

export async function buscarAulasFaixaAtual(req: Request, res: Response) {
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

  if (aluno.faixa_atual_id === null) {
    res.json({
      faixa_atual_aulas: {
        aluno_id: id,
        faixa_atual_id: null,
        data_graduacao: null,
        total_aulas: 0,
        presencas: 0,
        percentual: 0,
      },
    });
    return;
  }

  const dataGraduacao = await findDataGraduacaoFaixaAtual(id, aluno.faixa_atual_id);
  const { total_aulas, presencas } = await calcularFrequenciaAluno(id, dataGraduacao ?? undefined);
  const totalAulas = Number(total_aulas);
  const totalPresencas = Number(presencas);
  const percentual = totalAulas > 0 ? Number(((totalPresencas / totalAulas) * 100).toFixed(2)) : 0;

  res.json({
    faixa_atual_aulas: {
      aluno_id: id,
      faixa_atual_id: aluno.faixa_atual_id,
      data_graduacao: dataGraduacao,
      total_aulas: totalAulas,
      presencas: totalPresencas,
      percentual,
    },
  });
}
