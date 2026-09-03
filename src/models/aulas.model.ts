import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";

export type AulaStatus = "PREVISTA" | "REALIZADA" | "CANCELADA";

export interface Aula extends RowDataPacket {
  id: number;
  turma_id: number;
  data_aula: string;
  hora_inicio: string;
  hora_fim: string;
  status: AulaStatus;
  motivo_cancelamento: string | null;
  finalizada_em: string | null;
}

export async function createAula(data: {
  turma_id: number;
  data_aula: string;
  hora_inicio: string;
  hora_fim: string;
}): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `insert into aulas (turma_id,
                        data_aula,
                        hora_inicio,
                        hora_fim,
                        status)
                values (?, ?, ?, ?, 'PREVISTA')`,
    [data.turma_id, data.data_aula, data.hora_inicio, data.hora_fim]
  );
  return result.insertId;
}

export async function findAulaById(id: number): Promise<Aula | null> {
  const [rows] = await pool.query<Aula[]>(
    `select *
       from aulas au
      where au.id = ? 
      limit 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function listAulasByTurma(
  turmaId: number,
  filtro: { dataInicio?: string; dataFim?: string }
): Promise<Aula[]> {
  const condicoes: string[] = ["au.turma_id = ?"];
  const valores: unknown[] = [turmaId];

  if (filtro.dataInicio !== undefined) {
    condicoes.push("au.data_aula >= ?");
    valores.push(filtro.dataInicio);
  }
  if (filtro.dataFim !== undefined) {
    condicoes.push("au.data_aula <= ?");
    valores.push(filtro.dataFim);
  }

  const [rows] = await pool.query<Aula[]>(
    `select *
       from aulas au
      where ${condicoes.join("\n        and ")}
      order by au.data_aula, 
               au.hora_inicio`,
    valores
  );
  return rows;
}

export async function cancelarAula(id: number, motivo: string): Promise<void> {
  await pool.query(
    `update aulas au
       set au.status = 'CANCELADA',
           au.motivo_cancelamento = ?
      where au.id = ?`,
    [motivo, id]
  );
}

export async function marcarAulaRealizada(id: number): Promise<void> {
  await pool.query(
    `update aulas au
       set au.status = 'REALIZADA',
           au.finalizada_em = current_timestamp()
      where au.id = ?`,
    [id]
  );
}
