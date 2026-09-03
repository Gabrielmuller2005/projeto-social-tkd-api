import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";

export type ComunicadoTipo = "AVISO" | "MATERIAL" | "CANCELAMENTO";

export interface Comunicado extends RowDataPacket {
  id: number;
  professor_id: number;
  titulo: string;
  conteudo: string;
  tipo: ComunicadoTipo;
  arquivo_url: string | null;
  publicado_em: string;
  ativo: boolean;
}

export interface ComunicadoComVisualizacao extends Comunicado {
  visualizado: number;
  visualizado_em: string | null;
}

export async function createComunicado(data: {
  professor_id: number;
  titulo: string;
  conteudo: string;
  tipo: ComunicadoTipo;
  arquivo_url: string | null;
}): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `insert into comunicados (professor_id,
                              titulo,
                              conteudo,
                              tipo,
                              arquivo_url,
                              ativo)
                      values (?, ?, ?, ?, ?, true)`,
    [data.professor_id, data.titulo, data.conteudo, data.tipo, data.arquivo_url]
  );
  return result.insertId;
}

export async function findComunicadoById(id: number): Promise<Comunicado | null> {
  const [rows] = await pool.query<Comunicado[]>(
    `select *
       from comunicados c
      where c.id = ?
      limit 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function listComunicadosAtivos(usuarioId: number): Promise<ComunicadoComVisualizacao[]> {
  const [rows] = await pool.query<ComunicadoComVisualizacao[]>(
    `select c.*,
            case when cv.usuario_id is not null then true else false end as visualizado,
            cv.visualizado_em
       from comunicados c
       left join comunicados_visualizacoes cv
              on cv.comunicado_id = c.id
             and cv.usuario_id    = ?
      where c.ativo = true
      order by c.publicado_em desc`,
    [usuarioId]
  );
  return rows;
}

export async function findComunicadoAtivoComVisualizacao(
  id: number,
  usuarioId: number
): Promise<ComunicadoComVisualizacao | null> {
  const [rows] = await pool.query<ComunicadoComVisualizacao[]>(
    `select c.*,
            case when cv.usuario_id is not null then true else false end as visualizado,
            cv.visualizado_em
       from comunicados c
       left join comunicados_visualizacoes cv
              on cv.comunicado_id = c.id
             and cv.usuario_id    = ?
      where c.id = ?
      limit 1`,
    [usuarioId, id]
  );
  return rows[0] ?? null;
}

export async function updateComunicado(
  id: number,
  data: { titulo?: string; conteudo?: string; tipo?: ComunicadoTipo; arquivo_url?: string | null }
): Promise<void> {
  const campos: string[] = [];
  const valores: unknown[] = [];

  if (data.titulo !== undefined) {
    campos.push("c.titulo = ?");
    valores.push(data.titulo);
  }
  if (data.conteudo !== undefined) {
    campos.push("c.conteudo = ?");
    valores.push(data.conteudo);
  }
  if (data.tipo !== undefined) {
    campos.push("c.tipo = ?");
    valores.push(data.tipo);
  }
  if (data.arquivo_url !== undefined) {
    campos.push("c.arquivo_url = ?");
    valores.push(data.arquivo_url);
  }

  if (campos.length === 0) return;

  valores.push(id);
  await pool.query(
    `update comunicados c
       set ${campos.join(",\n            ")}
      where c.id = ?`,
    valores
  );
}

export async function setComunicadoAtivo(id: number, ativo: boolean): Promise<void> {
  await pool.query(
    `update comunicados c
       set c.ativo = ?
      where c.id = ?`,
    [ativo, id]
  );
}

export async function upsertVisualizacao(comunicadoId: number, usuarioId: number): Promise<void> {
  await pool.query(
    `insert into comunicados_visualizacoes (comunicado_id,
                                            usuario_id,
                                            visualizado_em)
                                    values (?, ?, current_timestamp())
        on duplicate key update visualizado_em = current_timestamp()`,
    [comunicadoId, usuarioId]
  );
}
