import { pool } from "../config/db.js";

export async function linkResponsavelAluno(data: {
  responsavel_id: number;
  aluno_id: number;
  parentesco: string;
  principal: boolean;
}): Promise<void> {
  await pool.query(
    `insert into responsaveis_alunos (responsavel_id, aluno_id, parentesco, principal)
     values (?, ?, ?, ?)`,
    [data.responsavel_id, data.aluno_id, data.parentesco, data.principal]
  );
}
