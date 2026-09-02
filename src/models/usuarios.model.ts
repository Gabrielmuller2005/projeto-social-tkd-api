import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";
import type { Perfil } from "../types/auth.js";

export interface Usuario extends RowDataPacket {
  id: number;
  nome_completo: string;
  telefone: string;
  senha_hash: string;
  data_nascimento: string;
  endereco: string;
  perfil: Perfil;
  ativo: boolean;
}

export type UsuarioSemSenha = Omit<Usuario, "senha_hash">;

export async function findUsuarioByTelefone(telefone: string): Promise<Usuario | null> {
  const [rows] = await pool.query<Usuario[]>(
    "select * from usuarios where telefone = ? limit 1",
    [telefone]
  );
  return rows[0] ?? null;
}

export async function findUsuarioById(id: number): Promise<Usuario | null> {
  const [rows] = await pool.query<Usuario[]>("select * from usuarios where id = ? limit 1", [id]);
  return rows[0] ?? null;
}

export async function createUsuario(data: {
  nome_completo: string;
  telefone: string;
  senha_hash: string;
  data_nascimento: string;
  endereco: string;
  perfil: Perfil;
}): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `insert into usuarios (nome_completo, telefone, senha_hash, data_nascimento, endereco, perfil, ativo)
     values (?, ?, ?, ?, ?, ?, true)`,
    [data.nome_completo, data.telefone, data.senha_hash, data.data_nascimento, data.endereco, data.perfil]
  );
  return result.insertId;
}

export function toPublicUsuario(usuario: Usuario): UsuarioSemSenha {
  const { senha_hash: _senha_hash, ...rest } = usuario;
  return rest;
}
