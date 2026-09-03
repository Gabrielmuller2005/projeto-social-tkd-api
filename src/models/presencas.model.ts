import type { RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";

export interface Presenca extends RowDataPacket {
  aula_id: number;
  aluno_id: number;
  presente: boolean;
  registrado_por: number;
  registrado_em: string;
}

export interface PresencaComAluno extends Presenca {
  aluno_nome: string;
}

interface FrequenciaRow extends RowDataPacket {
  total_aulas: number;
  presencas: number;
}

export interface RankingRow extends FrequenciaRow {
  aluno_id: number;
  aluno_nome: string;
}

export async function upsertPresencas(
  aulaId: number,
  registros: { aluno_id: number; presente: boolean }[],
  registradoPor: number
): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const registro of registros) {
      await conn.query(
        `insert into presencas (aula_id,
                                aluno_id,
                                presente,
                                registrado_por)
                        values (?, ?, ?, ?)
          on duplicate key update presente       = values(presente),
                                  registrado_por = values(registrado_por),
                                  registrado_em  = current_timestamp()`,
        [aulaId, registro.aluno_id, registro.presente, registradoPor]
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

export async function listPresencasByAula(aulaId: number): Promise<PresencaComAluno[]> {
  const [rows] = await pool.query<PresencaComAluno[]>(
    `select p.*,
            a.nome_completo as aluno_nome
       from presencas p
       join alunos a
         on a.id = p.aluno_id
      where p.aula_id = ?
      order by a.nome_completo`,
    [aulaId]
  );
  return rows;
}

export async function calcularFrequenciaAluno(alunoId: number, desde?: string): Promise<FrequenciaRow> {
  const filtroDesde = desde !== undefined ? "\n        and au.data_aula >= ?" : "";
  const valores = desde !== undefined ? [desde, alunoId] : [alunoId];

  const [rows] = await pool.query<FrequenciaRow[]>(
    `select count(distinct au.id) as total_aulas,
            count(distinct case when p.presente = true then au.id end) as presencas
       from matriculas m
       join aulas au
         on au.turma_id  = m.turma_id
        and au.status    = 'REALIZADA'
        and au.data_aula >= m.data_inicio
        and (m.data_fim is null or au.data_aula <= m.data_fim)${filtroDesde}
       left join presencas p
         on p.aula_id  = au.id
        and p.aluno_id = m.aluno_id
      where m.aluno_id = ?`,
    valores
  );
  return rows[0];
}

export async function calcularRankingTurma(turmaId: number): Promise<RankingRow[]> {
  const [rows] = await pool.query<RankingRow[]>(
    `select m.aluno_id,
            a.nome_completo as aluno_nome,
            count(distinct au.id) as total_aulas,
            count(distinct case when p.presente = true then au.id end) as presencas
       from matriculas m
       join alunos a
         on a.id = m.aluno_id
       join aulas au
         on au.turma_id  = m.turma_id
        and au.status    = 'REALIZADA'
        and au.data_aula >= m.data_inicio
        and (m.data_fim is null or au.data_aula <= m.data_fim)
       left join presencas p
         on p.aula_id  = au.id
        and p.aluno_id = m.aluno_id
      where m.turma_id = ?
      group by m.aluno_id, 
               a.nome_completo`,
    [turmaId]
  );
  return rows;
}
