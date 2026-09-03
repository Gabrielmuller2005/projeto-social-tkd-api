import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";

export type ObservacaoTipo = "TECNICA" | "COMPORTAMENTO" | "GERAL";

export interface ObservacaoAluno extends RowDataPacket {
  id: number;
  aluno_id: number;
  professor_id: number;
  tipo: ObservacaoTipo;
  observacao: string;
  criado_em: string;
}

export interface TimelineItem extends RowDataPacket {
  origem: "observacao" | "comunicado";
  id: number;
  tipo: string;
  titulo: string | null;
  conteudo: string;
  data: string;
}

export async function createObservacao(data: {
  aluno_id: number;
  professor_id: number;
  tipo: ObservacaoTipo;
  observacao: string;
}): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `insert into observacoes_aluno (aluno_id,
                                    professor_id,
                                    tipo,
                                    observacao)
                            values (?, ?, ?, ?)`,
    [data.aluno_id, data.professor_id, data.tipo, data.observacao]
  );
  return result.insertId;
}

export async function listObservacoesByAluno(alunoId: number): Promise<ObservacaoAluno[]> {
  const [rows] = await pool.query<ObservacaoAluno[]>(
    `select *
       from observacoes_aluno oa
      where oa.aluno_id = ?
      order by oa.criado_em desc,
               oa.id desc`,
    [alunoId]
  );
  return rows;
}

export async function listTimelineByAluno(alunoId: number): Promise<TimelineItem[]> {
  const [rows] = await pool.query<TimelineItem[]>(
    `select 'observacao' as origem,
            oa.id,
            oa.tipo,
            null as titulo,
            oa.observacao as conteudo,
            oa.criado_em as data
       from observacoes_aluno oa
      where oa.aluno_id = ?
      union all
     select 'comunicado' as origem,
            c.id,
            c.tipo,
            c.titulo,
            c.conteudo,
            c.publicado_em as data
       from comunicados c
      where c.ativo = true
      order by data desc`,
    [alunoId]
  );
  return rows;
}
