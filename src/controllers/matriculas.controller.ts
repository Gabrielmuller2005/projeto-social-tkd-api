import type { Request, Response } from "express";
import {
  createMatricula,
  findMatriculaById,
  findMatriculaByAlunoETurma,
  listMatriculasByAlunoId,
  listMatriculasAtivasByTurmaId,
  encerrarMatricula,
} from "../models/matriculas.model.js";
import { findAlunoById } from "../models/alunos.model.js";
import { findTurmaById } from "../models/turmas.model.js";
import { podeAcessarAluno } from "../utils/acesso.js";
import { perfil_admin_professor } from "../types/auth.js";
import { converterDataBrParaIso } from "../utils/validacao.js";

export async function criarMatricula(req: Request, res: Response) {
  const { aluno_id, turma_id, data_inicio } = req.body ?? {};

  if (!aluno_id || !turma_id || !data_inicio) {
    res.status(400).json({ message: "Campos obrigatórios: aluno_id, turma_id, data_inicio" });
    return;
  }
  const dataInicioIso = converterDataBrParaIso(data_inicio);
  if (!dataInicioIso) {
    res.status(400).json({ message: "data_inicio inválida. Use o formato DD/MM/AAAA" });
    return;
  }

  const aluno = await findAlunoById(Number(aluno_id));
  if (!aluno) {
    res.status(404).json({ message: "Aluno não encontrado" });
    return;
  }
  if (!aluno.ativo) {
    res.status(409).json({ message: "Aluno inativo não pode ser matriculado" });
    return;
  }

  const turma = await findTurmaById(Number(turma_id));
  if (!turma) {
    res.status(404).json({ message: "Turma não encontrada" });
    return;
  }
  if (!turma.ativo) {
    res.status(409).json({ message: "Turma inativa não pode receber novas matrículas" });
    return;
  }

  const matriculaExistente = await findMatriculaByAlunoETurma(Number(aluno_id), Number(turma_id));
  if (matriculaExistente) {
    res.status(409).json({
      message: matriculaExistente.ativa
        ? "Aluno já está matriculado nesta turma"
        : "Aluno já teve uma matrícula nesta turma (encerrada) — o banco não permite uma segunda matrícula para o mesmo par aluno/turma",
    });
    return;
  }

  const id = await createMatricula({
    aluno_id: Number(aluno_id),
    turma_id: Number(turma_id),
    data_inicio: dataInicioIso,
  });

  const matricula = await findMatriculaById(id);
  res.status(201).json({ matricula });
}

export async function listarMatriculas(req: Request, res: Response) {
  const { aluno_id, turma_id } = req.query;

  if (aluno_id !== undefined && turma_id !== undefined) {
    res.status(400).json({ message: "Informe apenas um filtro: aluno_id ou turma_id" });
    return;
  }

  if (aluno_id !== undefined) {
    const id = Number(aluno_id);
    if (Number.isNaN(id)) {
      res.status(400).json({ message: "aluno_id inválido" });
      return;
    }

    const podeAcessar = await podeAcessarAluno(req.user!, id);
    if (!podeAcessar) {
      res.status(403).json({ message: "Acesso negado a este aluno" });
      return;
    }

    const matriculas = await listMatriculasByAlunoId(id);
    res.json({ matriculas });
    return;
  }

  if (turma_id !== undefined) {
    if (req.user!.perfil !== perfil_admin_professor) {
      res.status(403).json({ message: "Acesso negado para este perfil" });
      return;
    }

    const id = Number(turma_id);
    if (Number.isNaN(id)) {
      res.status(400).json({ message: "turma_id inválido" });
      return;
    }

    const matriculas = await listMatriculasAtivasByTurmaId(id);
    res.json({ matriculas });
    return;
  }

  res.status(400).json({ message: "Informe um filtro: aluno_id ou turma_id" });
}

export async function encerrarMatriculaController(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: "id inválido" });
    return;
  }

  const matricula = await findMatriculaById(id);
  if (!matricula) {
    res.status(404).json({ message: "Matrícula não encontrada" });
    return;
  }

  if (!matricula.ativa) {
    res.status(409).json({ message: "Matrícula já está encerrada" });
    return;
  }

  const hoje = new Date().toISOString().slice(0, 10);
  await encerrarMatricula(id, hoje);

  const atualizada = await findMatriculaById(id);
  res.json({ matricula: atualizada });
}
