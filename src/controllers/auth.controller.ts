import type { Request, Response } from "express";
import { calcularIdade } from "../utils/age.js";
import { converterDataBrParaIso } from "../utils/validacao.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";
import {
  createUsuario,
  findUsuarioByTelefone,
  findUsuarioById,
  toPublicUsuario,
} from "../models/usuarios.model.js";
import { createAluno } from "../models/alunos.model.js";
import {
  linkResponsavelAluno,
  findAlunoDuplicadoDoResponsavel,
} from "../models/responsaveisAlunos.model.js";
import { perfil_admin_professor, type Perfil } from "../types/auth.js";

const idade_maioridade = 18;

async function criarUsuarioComPerfil(perfil: Perfil, body: Record<string, unknown>, res: Response) {
  const { nome_completo, telefone, senha, data_nascimento, endereco } = body;

  if (!nome_completo || !telefone || !senha || !data_nascimento || !endereco) {
    res.status(400).json({
      message: "Campos obrigatórios: nome_completo, telefone, senha, data_nascimento, endereco",
    });
    return null;
  }

  const dataNascimentoIso = converterDataBrParaIso(data_nascimento);
  if (!dataNascimentoIso) {
    res.status(400).json({ message: "data_nascimento inválida. Use o formato DD/MM/AAAA" });
    return null;
  }
  if ((nome_completo as string).length > 150) {
    res.status(400).json({ message: "nome_completo excede o tamanho máximo de 150 caracteres" });
    return null;
  }
  if ((telefone as string).length > 20) {
    res.status(400).json({ message: "telefone excede o tamanho máximo de 20 caracteres" });
    return null;
  }
  if ((endereco as string).length > 255) {
    res.status(400).json({ message: "endereco excede o tamanho máximo de 255 caracteres" });
    return null;
  }

  const existente = await findUsuarioByTelefone(telefone as string);
  if (existente) {
    res.status(409).json({ message: "Telefone já cadastrado" });
    return null;
  }

  const senha_hash = await hashPassword(senha as string);
  const id = await createUsuario({
    nome_completo: nome_completo as string,
    telefone: telefone as string,
    senha_hash,
    data_nascimento: dataNascimentoIso,
    endereco: endereco as string,
    perfil,
  });

  return findUsuarioById(id);
}

export async function registerResponsavel(req: Request, res: Response) {
  const usuario = await criarUsuarioComPerfil("RESPONSAVEL", req.body ?? {}, res);
  if (!usuario) return;
  res.status(201).json({ user: toPublicUsuario(usuario) });
}

export async function registerAdminProfessor(req: Request, res: Response) {
  const usuario = await criarUsuarioComPerfil(perfil_admin_professor, req.body ?? {}, res);
  if (!usuario) return;
  res.status(201).json({ user: toPublicUsuario(usuario) });
}

export async function registerAluno(req: Request, res: Response) {
  const { nome_completo, data_nascimento, telefone, endereco, senha, parentesco, principal } =
    req.body ?? {};

  if (!nome_completo || !data_nascimento) {
    res.status(400).json({ message: "Campos obrigatórios: nome_completo, data_nascimento" });
    return;
  }
  const dataNascimentoIso = converterDataBrParaIso(data_nascimento);
  if (!dataNascimentoIso) {
    res.status(400).json({ message: "data_nascimento inválida. Use o formato DD/MM/AAAA" });
    return;
  }
  if ((nome_completo as string).length > 150) {
    res.status(400).json({ message: "nome_completo excede o tamanho máximo de 150 caracteres" });
    return;
  }

  const idade = calcularIdade(dataNascimentoIso);

  if (idade < idade_maioridade) {
    if (!req.user || req.user.perfil !== "RESPONSAVEL") {
      res.status(401).json({
        message: "Cadastro de aluno menor de idade exige responsável autenticado",
      });
      return;
    }

    if (!parentesco) {
      res.status(400).json({ message: "Campo obrigatório: parentesco" });
      return;
    }

    const responsavel = await findUsuarioById(req.user.id);
    if (!responsavel) {
      res.status(401).json({ message: "Responsável não encontrado" });
      return;
    }

    const duplicado = await findAlunoDuplicadoDoResponsavel(
      req.user.id,
      nome_completo as string,
      dataNascimentoIso
    );
    if (duplicado) {
      res.status(409).json({
        message: "Já existe um aluno com esse nome e data de nascimento vinculado a você",
      });
      return;
    }

    const telefoneAluno = (telefone as string | undefined) ?? responsavel.telefone;
    const enderecoAluno = (endereco as string | undefined) ?? responsavel.endereco;

    const alunoId = await createAluno({
      usuario_id: null,
      nome_completo: nome_completo as string,
      data_nascimento: dataNascimentoIso,
      telefone: telefoneAluno,
      endereco: enderecoAluno,
    });

    await linkResponsavelAluno({
      responsavel_id: req.user.id,
      aluno_id: alunoId,
      parentesco: parentesco as string,
      principal: typeof principal === "boolean" ? principal : true,
    });

    res.status(201).json({
      aluno: {
        id: alunoId,
        nome_completo,
        data_nascimento: dataNascimentoIso,
        telefone: telefoneAluno,
        endereco: enderecoAluno,
      },
    });
    return;
  }

  // maior de idade: cadastra sem responsável
  if (!telefone || !senha || !endereco) {
    res.status(400).json({
      message:
        "Campos obrigatórios para maior de idade: nome_completo, telefone, senha, data_nascimento, endereco",
    });
    return;
  }
  if ((telefone as string).length > 20) {
    res.status(400).json({ message: "telefone excede o tamanho máximo de 20 caracteres" });
    return;
  }
  if ((endereco as string).length > 255) {
    res.status(400).json({ message: "endereco excede o tamanho máximo de 255 caracteres" });
    return;
  }

  const existente = await findUsuarioByTelefone(telefone as string);
  if (existente) {
    res.status(409).json({ message: "Telefone já cadastrado" });
    return;
  }

  const senha_hash = await hashPassword(senha as string);
  const usuarioId = await createUsuario({
    nome_completo: nome_completo as string,
    telefone: telefone as string,
    senha_hash,
    data_nascimento: dataNascimentoIso,
    endereco: endereco as string,
    perfil: "ALUNO",
  });

  await createAluno({
    usuario_id: usuarioId,
    nome_completo: nome_completo as string,
    data_nascimento: dataNascimentoIso,
    telefone: telefone as string,
    endereco: endereco as string,
  });

  const usuario = await findUsuarioById(usuarioId);
  res.status(201).json({ user: toPublicUsuario(usuario!) });
}

export async function login(req: Request, res: Response) {
  const { telefone, senha } = req.body ?? {};

  if (!telefone || !senha) {
    res.status(400).json({ message: "Campos obrigatórios: telefone, senha" });
    return;
  }

  const usuario = await findUsuarioByTelefone(telefone as string);
  if (!usuario || !usuario.ativo) {
    res.status(401).json({ message: "Telefone ou senha inválidos" });
    return;
  }

  const senhaValida = await comparePassword(senha as string, usuario.senha_hash);
  if (!senhaValida) {
    res.status(401).json({ message: "Telefone ou senha inválidos" });
    return;
  }

  const token = signToken({ id: usuario.id, perfil: usuario.perfil });
  res.json({ token, user: toPublicUsuario(usuario) });
}

export async function me(req: Request, res: Response) {
  const usuario = await findUsuarioById(req.user!.id);
  if (!usuario) {
    res.status(401).json({ message: "Usuário não encontrado" });
    return;
  }
  res.json({ user: toPublicUsuario(usuario) });
}
