import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";

export interface HistoricoFaixa extends RowDataPacket {
  id: number;
  aluno_id: number;
  faixa_id: number;
  data_graduacao: string;
  observacao: string | null;
  registrado_por: number;
  criado_em: string;
}

export interface HistoricoFaixaComDetalhes extends HistoricoFaixa {
  faixa_cor: string;
  faixa_gub: number;
}

export async function registrarGraduacao(data: {
  aluno_id: number;
  faixa_id: number;
  data_graduacao: string;
  observacao: string | null;
  registrado_por: number;
}): Promise<number> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query<ResultSetHeader>(
      `insert into historico_faixas (aluno_id,
                                     faixa_id,
                                     data_graduacao,
                                     observacao,
                                     registrado_por)
                             values (?, ?, ?, ?, ?)`,
      [data.aluno_id, data.faixa_id, data.data_graduacao, data.observacao, data.registrado_por]
    );

    await conn.query(
      `update alunos a
          set a.faixa_atual_id = ?
        where a.id = ?`,
      [data.faixa_id, data.aluno_id]
    );

    await conn.commit();
    return result.insertId;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function listHistoricoByAluno(alunoId: number): Promise<HistoricoFaixaComDetalhes[]> {
  const [rows] = await pool.query<HistoricoFaixaComDetalhes[]>(
    `select hf.*,
            f.cor as faixa_cor,
            f.gub as faixa_gub
       from historico_faixas hf
       join faixas f
         on f.id = hf.faixa_id
      where hf.aluno_id = ?
      order by hf.data_graduacao desc`,
    [alunoId]
  );
  return rows;
}

export async function findDataGraduacaoFaixaAtual(
  alunoId: number,
  faixaId: number
): Promise<string | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `select hf.data_graduacao
       from historico_faixas hf
      where hf.aluno_id = ?
        and hf.faixa_id = ?
      order by hf.data_graduacao desc
      limit 1`,
    [alunoId, faixaId]
  );
  return (rows[0]?.data_graduacao as string | undefined) ?? null;
}
