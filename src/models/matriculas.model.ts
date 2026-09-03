import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";

export interface Matricula extends RowDataPacket {
  id: number;
  turma_id: number;
  aluno_id: number;
  data_inicio: string;
  data_fim: string | null;
  ativa: boolean;
}

export interface MatriculaComAluno extends Matricula {
  aluno_nome: string;
}

export async function createMatricula(data: {
  turma_id: number;
  aluno_id: number;
  data_inicio: string;
}): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `insert into matriculas (turma_id, 
                             aluno_id, 
                             data_inicio, 
                             ativa) 
                     values (?, ?, ?, true)`,
    [data.turma_id, data.aluno_id, data.data_inicio]
  );
  return result.insertId;
}

export async function findMatriculaByAlunoETurma(
  alunoId: number,
  turmaId: number
): Promise<Matricula | null> {
  const [rows] = await pool.query<Matricula[]>(
    `select *
       from matriculas m
      where m.aluno_id = ?
        and m.turma_id = ?
      limit 1`,
    [alunoId, turmaId]
  );
  return rows[0] ?? null;
}

export async function findMatriculaById(id: number): Promise<Matricula | null> {
  const [rows] = await pool.query<Matricula[]>(
    `select * 
       from matriculas m 
      where m.id = ? limit 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function listMatriculasByAlunoId(alunoId: number): Promise<Matricula[]> {
  const [rows] = await pool.query<Matricula[]>(
    `select * 
       from matriculas m 
      where m.aluno_id = ? 
      order by m.data_inicio desc`,
    [alunoId]
  );
  return rows;
}

export async function listMatriculasAtivasByTurmaId(turmaId: number): Promise<MatriculaComAluno[]> {
  const [rows] = await pool.query<MatriculaComAluno[]>(
    `select m.*,
            a.nome_completo as aluno_nome
       from matriculas m
       join alunos a on a.id = m.aluno_id
      where m.turma_id = ?
        and m.ativa = true
        and a.ativo = true
      order by a.nome_completo`,
    [turmaId]
  );
  return rows;
}

export async function isAlunoMatriculadoAtivoNaTurma(
  alunoId: number,
  turmaId: number
): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `select 1
       from matriculas m
       join alunos a
         on a.id = m.aluno_id
      where m.aluno_id = ?
        and m.turma_id = ?
        and m.ativa = true
        and a.ativo = true
      limit 1`,
    [alunoId, turmaId]
  );
  return rows.length > 0;
}

export async function encerrarMatricula(id: number, dataFim: string): Promise<void> {
  await pool.query(`update matriculas m
                      set m.ativa = false, 
                          m.data_fim = ? 
                     where m.id = ?`, [
    dataFim,
    id,
  ]);
}
