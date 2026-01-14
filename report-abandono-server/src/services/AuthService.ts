import bcrypt from "bcryptjs";
import prisma from "../../prisma/client";

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
      numeroContato: data.phone || null,
      endereco: data.address || null,
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
}
