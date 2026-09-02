import bcrypt from "bcrypt";

const salt_rounds = 10;

export function hashPassword(senha: string): Promise<string> {
  return bcrypt.hash(senha, salt_rounds);
}

export function comparePassword(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}
