import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";

export interface Turma extends RowDataPacket {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

export interface HorarioTurma extends RowDataPacket {
  id: number;
  turma_id: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
}

export interface TurmaComHorarios extends Turma {
  horarios: HorarioTurma[];
}

interface HorarioInput {
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
}

export async function createTurmaComHorarios(data: {
  nome: string;
  descricao: string | null;
  horarios: HorarioInput[];
}): Promise<number> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query<ResultSetHeader>(
      `insert into turmas (nome, 
                           descricao, 
                           ativo) 
                   values (?, ?, true)`,
      [data.nome, data.descricao]
    );
    const turmaId = result.insertId;

    for (const horario of data.horarios) {
      await conn.query(
        `insert into horarios_turma (turma_id, 
                                     dia_semana, 
                                     hora_inicio, 
                                     hora_fim) values (?, ?, ?, ?)`,
        [turmaId, horario.dia_semana, horario.hora_inicio, horario.hora_fim]
      );
    }

    await conn.commit();
    return turmaId;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function findTurmaById(id: number): Promise<Turma | null> {
  const [rows] = await pool.query<Turma[]>(`select * 
                                              from turmas t 
                                             where t.id = ? limit 1`, [id]);
  return rows[0] ?? null;
}

export async function listHorariosByTurmaId(turmaId: number): Promise<HorarioTurma[]> {
  const [rows] = await pool.query<HorarioTurma[]>(
    `select * 
       from horarios_turma ht 
      where ht.turma_id = ? 
      order by ht.dia_semana, 
               ht.hora_inicio`,
    [turmaId]
  );
  return rows;
}

export async function findTurmaComHorariosById(id: number): Promise<TurmaComHorarios | null> {
  const turma = await findTurmaById(id);
  if (!turma) return null;

  const horarios = await listHorariosByTurmaId(id);
  return { ...turma, horarios };
}

export async function listTurmasAtivasComHorarios(): Promise<TurmaComHorarios[]> {
  const [turmas] = await pool.query<Turma[]>(
    `select * 
       from turmas t 
      where t.ativo = true 
      order by t.nome`
  );
  if (turmas.length === 0) return [];

  const ids = turmas.map((t) => t.id);
  const placeholders = ids.map(() => "?").join(", ");
  const [horarios] = await pool.query<HorarioTurma[]>(
    `select * 
       from horarios_turma ht 
      where ht.turma_id in (${placeholders}) 
      order by ht.dia_semana, 
               ht.hora_inicio`,
    ids
  );

  return turmas.map((turma) => ({
    ...turma,
    horarios: horarios.filter((h) => h.turma_id === turma.id),
  }));
}

export async function updateTurma(
  id: number,
  data: { nome?: string; descricao?: string; ativo?: boolean }
): Promise<void> {
  const campos: string[] = [];
  const valores: unknown[] = [];

  if (data.nome !== undefined) {
    campos.push("t.nome = ?");
    valores.push(data.nome);
  }
  if (data.descricao !== undefined) {
    campos.push("t.descricao = ?");
    valores.push(data.descricao);
  }
  if (data.ativo !== undefined) {
    campos.push("t.ativo = ?");
    valores.push(data.ativo);
  }

  if (campos.length === 0) return;

  valores.push(id);
  await pool.query(`update turmas t 
                      set ${campos.join(", ")} 
                     where t.id = ?`, valores);
}

export async function replaceHorarios(turmaId: number, horarios: HorarioInput[]): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(`delete 
                        from horarios_turma ht 
                       where ht.turma_id = ?`, [turmaId]);

    for (const horario of horarios) {
      await conn.query(
        `insert into horarios_turma (turma_id, 
                                     dia_semana, 
                                     hora_inicio, 
                                     hora_fim) 
                             values (?, ?, ?, ?)`,
        [turmaId, horario.dia_semana, horario.hora_inicio, horario.hora_fim]
      );
    }

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
