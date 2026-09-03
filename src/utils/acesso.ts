import type { JwtPayload } from "../types/auth.js";
import { perfil_admin_professor } from "../types/auth.js";
import { findAlunoById } from "../models/alunos.model.js";
import { isResponsavelDoAluno } from "../models/responsaveisAlunos.model.js";

export async function podeAcessarAluno(user: JwtPayload, alunoId: number): Promise<boolean> {
  if (user.perfil === perfil_admin_professor) {
    return true;
  }

  if (user.perfil === "ALUNO") {
    const aluno = await findAlunoById(alunoId);
    return aluno?.usuario_id === user.id;
  }

  if (user.perfil === "RESPONSAVEL") {
    return isResponsavelDoAluno(user.id, alunoId);
  }

  return false;
}
