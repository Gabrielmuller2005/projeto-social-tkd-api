import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";

export interface Faixa extends RowDataPacket {
  id: number;
  cor: string;
  gub: number;
  ordem: number;
  ativo: boolean;
}

export async function createFaixa(data: {
  cor: string;
  gub: number;
  ordem: number;
}): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `insert into faixas (cor,
                          gub,
                          ordem,
                          ativo)
                  values (?, ?, ?, true)`,
    [data.cor, data.gub, data.ordem]
  );
  return result.insertId;
}

export async function findFaixaById(id: number): Promise<Faixa | null> {
  const [rows] = await pool.query<Faixa[]>(
    `select *
       from faixas f
      where f.id = ? 
      limit 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function findFaixaAtivaPorOrdem(ordem: number, excluirId?: number): Promise<Faixa | null> {
  const condicoes = ["f.ordem = ?", "f.ativo = true"];
  const valores: unknown[] = [ordem];

  if (excluirId !== undefined) {
    condicoes.push("f.id <> ?");
    valores.push(excluirId);
  }

  const [rows] = await pool.query<Faixa[]>(
    `select *
       from faixas f
      where ${condicoes.join("\n        and ")}
      limit 1`,
    valores
  );
  return rows[0] ?? null;
}

export async function listFaixasAtivas(): Promise<Faixa[]> {
  const [rows] = await pool.query<Faixa[]>(
    `select *
       from faixas f
      where f.ativo = true
      order by f.ordem`
  );
  return rows;
}

export async function updateFaixa(
  id: number,
  data: { cor?: string; gub?: number; ordem?: number; ativo?: boolean }
): Promise<void> {
  const campos: string[] = [];
  const valores: unknown[] = [];

  if (data.cor !== undefined) {
    campos.push("f.cor = ?");
    valores.push(data.cor);
  }
  if (data.gub !== undefined) {
    campos.push("f.gub = ?");
    valores.push(data.gub);
  }
  if (data.ordem !== undefined) {
    campos.push("f.ordem = ?");
    valores.push(data.ordem);
  }
  if (data.ativo !== undefined) {
    campos.push("f.ativo = ?");
    valores.push(data.ativo);
  }

  if (campos.length === 0) return;

  valores.push(id);
  await pool.query(
    `update faixas f
       set ${campos.join(",\n            ")}
      where f.id = ?`,
    valores
  );
}
