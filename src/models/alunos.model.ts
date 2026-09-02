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

export async function createAluno(data: {
  usuario_id: number | null;
  nome_completo: string;
  data_nascimento: string;
  telefone: string | null;
  endereco: string | null;
}): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `insert into alunos (usuario_id, nome_completo, data_nascimento, telefone, endereco, ativo)
     values (?, ?, ?, ?, ?, true)`,
    [data.usuario_id, data.nome_completo, data.data_nascimento, data.telefone, data.endereco]
  );
  return result.insertId;
}
