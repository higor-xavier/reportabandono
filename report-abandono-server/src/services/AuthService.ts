import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RegisterCommonData {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  cpf: string;
  address?: string;
}

interface RegisterOngData {
  organizationName: string;
  email: string;
  password: string;
  phone?: string;
  cnpj: string;
  address?: string;
}

type RegisterData = RegisterCommonData | RegisterOngData;

export class AuthService {
  /**
   * Registra um novo usuário no sistema
   * @param data - Dados do usuário para registro
   * @param userType - Tipo de usuário: 'COMUM' ou 'ONG'
   * @returns Usuário criado (sem a senha)
   */
  static async register(data: RegisterData, userType: "COMUM" | "ONG") {
    // Validação de campos obrigatórios
    if (!data.email) {
      throw new Error("E-mail é obrigatório");
    }

    if (!data.password) {
      throw new Error("Senha é obrigatória");
    }

    if (userType === "COMUM") {
      const commonData = data as RegisterCommonData;
      if (!commonData.fullName) {
        throw new Error("Nome completo é obrigatório");
      }
      if (!commonData.cpf) {
        throw new Error("CPF é obrigatório");
      }
    } else {
      const ongData = data as RegisterOngData;
      if (!ongData.organizationName) {
        throw new Error("Nome da organização é obrigatório");
      }
      if (!ongData.cnpj) {
        throw new Error("CNPJ é obrigatório");
      }
    }

    // Verificar se o e-mail já existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("E-mail já está em uso");
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Determinar status baseado no tipo de usuário
    // COMUM: status = 0 (Aprovado)
    // ONG: status = 1 (Pendente de Aprovação)
    const status = userType === "COMUM" ? 0 : 1;

    // Preparar dados para inserção
    const userData: {
      email: string;
      senha: string;
      tipoUsuario: string;
      status: number;
      nomeCompleto?: string;
      cpf?: string;
      cnpj?: string;
      numeroContato?: string;
      endereco?: string;
    } = {
      email: data.email,
      senha: hashedPassword,
      tipoUsuario: userType,
      status,
      numeroContato: data.phone || undefined,
      endereco: data.address || undefined,
    };

    if (userType === "COMUM") {
      const commonData = data as RegisterCommonData;
      userData.nomeCompleto = commonData.fullName;
      userData.cpf = commonData.cpf;
    } else {
      const ongData = data as RegisterOngData;
      userData.nomeCompleto = ongData.organizationName;
      userData.cnpj = ongData.cnpj;
    }

    // Criar usuário no banco
    const newUser = await prisma.usuario.create({
      data: userData,
      select: {
        id: true,
        nomeCompleto: true,
        email: true,
        tipoUsuario: true,
        status: true,
        cpf: true,
        cnpj: true,
        endereco: true,
        numeroContato: true,
        criadoEm: true,
      },
    });

    return newUser;
  }

  /**
   * Autentica um usuário e retorna um token JWT
   * @param email - E-mail do usuário
   * @param password - Senha do usuário
   * @returns Token JWT e dados do usuário (sem a senha)
   */
  static async login(email: string, password: string) {
    // Validação de campos obrigatórios
    if (!email) {
      throw new Error("E-mail é obrigatório");
    }

    if (!password) {
      throw new Error("Senha é obrigatória");
    }

    // Buscar usuário pelo e-mail
    const user = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("Credenciais inválidas");
    }

    // Verificar se o usuário tem senha (pode ser null em alguns casos)
    if (!user.senha) {
      throw new Error("Credenciais inválidas");
    }

    // Comparar senha com bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.senha);

    if (!isPasswordValid) {
      throw new Error("Credenciais inválidas");
    }

    // Regra de Negócio: Se o usuário for ONG e o status for 1 (Pendente) ou 2 (Negado), bloquear login
    if (user.tipoUsuario === "ONG" && (user.status === 1 || user.status === 2)) {
      throw new Error("Seu cadastro ainda está em análise");
    }

    // Gerar token JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET não configurado");
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        tipoUsuario: user.tipoUsuario,
      },
      jwtSecret,
      {
        expiresIn: "7d", // Token expira em 7 dias
      }
    );

    // Retornar token e dados do usuário (sem a senha)
    const { senha: _, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword,
    };
  }
}
