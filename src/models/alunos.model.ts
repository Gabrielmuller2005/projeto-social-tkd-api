import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";

export interface Aluno extends RowDataPacket {
  id: number;
  usuario_id: number | null;
  faixa_atual_id: number | null;
  nome_completo: string;
  data_nascimento: string;
  telefone: string | null;
  endereco: string | null;
  ativo: boolean;
}

export async function findAlunoById(id: number): Promise<Aluno | null> {
  const [rows] = await pool.query<Aluno[]>(
    `select *
       from alunos a
      where a.id = ? limit 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function listAlunos(filtro?: { ativo?: boolean }): Promise<Aluno[]> {
  if (filtro?.ativo === undefined) {
    const [rows] = await pool.query<Aluno[]>(
      `select *
         from alunos a
        order by a.nome_completo`
    );
    return rows;
  }

  const [rows] = await pool.query<Aluno[]>(
    `select *
       from alunos a
      where a.ativo = ?
      order by a.nome_completo`,
    [filtro.ativo]
  );
  return rows;
}

export async function updateAlunoCadastro(
  id: number,
  data: { nome_completo?: string; telefone?: string; endereco?: string }
): Promise<void> {
  const campos: string[] = [];
  const valores: unknown[] = [];

  if (data.nome_completo !== undefined) {
    campos.push("a.nome_completo = ?");
    valores.push(data.nome_completo);
  }
  if (data.telefone !== undefined) {
    campos.push("a.telefone = ?");
    valores.push(data.telefone);
  }
  if (data.endereco !== undefined) {
    campos.push("a.endereco = ?");
    valores.push(data.endereco);
  }

  if (campos.length === 0) return;

  valores.push(id);
  await pool.query(
    `update alunos a
        set ${campos.join(", ")}
      where a.id = ?`,
    valores
  );
}

export async function setAlunoAtivo(id: number, ativo: boolean): Promise<void> {
  await pool.query(
    `update alunos a
        set a.ativo = ?
      where a.id = ?`,
    [ativo, id]
  );
}

export async function createAluno(data: {
  usuario_id: number | null;
  nome_completo: string;
  data_nascimento: string;
  telefone: string | null;
  endereco: string | null;
}): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `insert into alunos (usuario_id,
                         nome_completo,
                         data_nascimento,
                         telefone,
                         endereco,
                         ativo)
                 values (?, ?, ?, ?, ?, true)`,
    [data.usuario_id, data.nome_completo, data.data_nascimento, data.telefone, data.endereco]
  );
  return result.insertId;
}
