import type { RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";

export async function isResponsavelDoAluno(responsavelId: number, alunoId: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `select 1
       from responsaveis_alunos ra
      where ra.responsavel_id = ? 
        and ra.aluno_id = ? 
      limit 1`,
    [responsavelId, alunoId]
  );
  return rows.length > 0;
}

export async function linkResponsavelAluno(data: {
  responsavel_id: number;
  aluno_id: number;
  parentesco: string;
  principal: boolean;
}): Promise<void> {
  await pool.query(
    `insert into responsaveis_alunos (responsavel_id,
                                      aluno_id,
                                      parentesco,
                                      principal)
                              values (?, ?, ?, ?)`,
    [data.responsavel_id, data.aluno_id, data.parentesco, data.principal]
  );
}
