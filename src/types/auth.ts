export type Perfil = "PROFESSOR" | "RESPONSAVEL" | "ALUNO";

/**
 * O ENUM `perfil` no banco não tem um valor separado para admin — regra de
 * negócio 001 trata admin e professor como o mesmo tipo de usuário, então
 * ambos usam o valor 'PROFESSOR' no banco. Essa constante existe só para
 * deixar essa intenção clara em vez de espalhar o literal 'PROFESSOR'.
 */
export const perfil_admin_professor: Perfil = "PROFESSOR";

export interface JwtPayload {
  id: number;
  perfil: Perfil;
}
