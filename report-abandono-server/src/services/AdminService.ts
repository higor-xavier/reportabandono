import prisma from "../../prisma/client";
import nodemailer from "nodemailer";

// Configurar transporter do nodemailer
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true para 465, false para outras portas
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export class AdminService {
  /**
   * Busca todas as solicitações pendentes para o administrador
   * Retorna: ONGs Pendentes, Usuários Reportados, Denúncias Negadas
   */
  static async getSolicitacoes() {
    // 1. ONGs Pendentes: tipo_usuario = 'ONG' e status = 1
    const ongsPendentes = await prisma.usuario.findMany({
      where: {
        tipoUsuario: "ONG",
        status: 1, // Pendente
      },
      select: {
        id: true,
        nomeCompleto: true,
        email: true,
        cnpj: true,
        numeroContato: true,
        endereco: true,
        criadoEm: true,
        status: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    // 2. Usuários Reportados: tipo_usuario = 'COMUM' e status = 2 (Banido)
    const usuariosReportados = await prisma.usuario.findMany({
      where: {
        tipoUsuario: "COMUM",
        status: 2, // Banido/Reportado
      },
      select: {
        id: true,
        nomeCompleto: true,
        email: true,
        cpf: true,
        numeroContato: true,
        endereco: true,
        criadoEm: true,
        status: true,
        denunciasCriadas: {
          select: {
            idDenuncia: true,
            descricao: true,
            dataRegistro: true,
            status: true,
            historicos: {
              orderBy: {
                dataAlteracao: "desc",
              },
              take: 5, // Últimos 5 históricos
            },
          },
          orderBy: {
            dataRegistro: "desc",
          },
        },
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    // 3. Denúncias Negadas: status = 2
    const denunciasNegadas = await prisma.denuncia.findMany({
      where: {
        status: 2, // Negada
      },
      select: {
        idDenuncia: true,
        descricao: true,
        tipoRegistro: true,
        dataRegistro: true,
        localizacao: true,
        status: true,
        usuarioCriador: {
          select: {
            id: true,
            nomeCompleto: true,
            email: true,
          },
        },
        historicos: {
          where: {
            statusNovo: 2, // Histórico da negativa
          },
          orderBy: {
            dataAlteracao: "desc",
          },
          take: 1, // Pegar o histórico da negativa
        },
      },
      orderBy: {
        dataRegistro: "desc",
      },
    });

    // Formatar dados para retorno unificado
    const solicitacoes = [
      // ONGs Pendentes
      ...ongsPendentes.map((ong) => ({
        id: `ong_${ong.id}`,
        tipo: "ONG_PENDENTE" as const,
        protocolo: `ONG-${ong.id.toString().padStart(6, "0")}`,
        dataInclusao: ong.criadoEm.toISOString().split("T")[0],
        status: "nova" as const,
        dataRetorno: null,
        feedback: null,
        dados: {
          id: ong.id,
          nomeCompleto: ong.nomeCompleto,
          email: ong.email,
          cnpj: ong.cnpj,
          numeroContato: ong.numeroContato,
          endereco: ong.endereco,
          criadoEm: ong.criadoEm,
        },
      })),
      // Usuários Reportados
      ...usuariosReportados.map((usuario) => ({
        id: `user_${usuario.id}`,
        tipo: "USUARIO_REPORTADO" as const,
        protocolo: `USR-${usuario.id.toString().padStart(6, "0")}`,
        dataInclusao: usuario.criadoEm.toISOString().split("T")[0],
        status: "em_analise" as const,
        dataRetorno: null,
        feedback: null,
        dados: {
          id: usuario.id,
          nomeCompleto: usuario.nomeCompleto,
          email: usuario.email,
          cpf: usuario.cpf,
          numeroContato: usuario.numeroContato,
          endereco: usuario.endereco,
          criadoEm: usuario.criadoEm,
          denuncias: usuario.denunciasCriadas,
        },
      })),
      // Denúncias Negadas
      ...denunciasNegadas.map((denuncia) => ({
        id: `den_${denuncia.idDenuncia}`,
        tipo: "DENUNCIA_NEGADA" as const,
        protocolo: `DEN-${denuncia.idDenuncia.toString().padStart(6, "0")}`,
        dataInclusao: denuncia.dataRegistro.toISOString().split("T")[0],
        status: "negada" as const,
        dataRetorno: denuncia.historicos[0]?.dataAlteracao.toISOString().split("T")[0] || null,
        feedback: denuncia.historicos[0]?.observacao || null,
        dados: {
          idDenuncia: denuncia.idDenuncia,
          descricao: denuncia.descricao,
          tipoRegistro: denuncia.tipoRegistro,
          dataRegistro: denuncia.dataRegistro,
          localizacao: denuncia.localizacao,
          usuarioCriador: denuncia.usuarioCriador,
          historico: denuncia.historicos[0] || null,
        },
      })),
    ];

    return solicitacoes;
  }

  /**
   * Aprova uma ONG (muda status para 0 - Aprovado)
   * Envia e-mail de aprovação
   */
  static async aprovarOng(ongId: number) {
    // Buscar a ONG
    const ong = await prisma.usuario.findUnique({
      where: { id: ongId },
    });

    if (!ong) {
      throw new Error("ONG não encontrada");
    }

    if (ong.tipoUsuario !== "ONG") {
      throw new Error("Usuário não é uma ONG");
    }

    if (ong.status === 0) {
      throw new Error("ONG já está aprovada");
    }

    // Atualizar status para 0 (Aprovado)
    const ongAtualizada = await prisma.usuario.update({
      where: { id: ongId },
      data: { status: 0 },
      select: {
        id: true,
        nomeCompleto: true,
        email: true,
        status: true,
      },
    });

    // Enviar e-mail de aprovação
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: ong.email,
        subject: "Cadastro Aprovado - ReportAbandono",
        html: `
          <h2>Parabéns! Seu cadastro foi aprovado</h2>
          <p>Olá, ${ong.nomeCompleto || "ONG"},</p>
          <p>Seu cadastro como ONG no sistema ReportAbandono foi <strong>aprovado</strong>!</p>
          <p>Agora você pode fazer login e começar a gerenciar denúncias de abandono de animais.</p>
          <p>Acesse o sistema e comece a fazer a diferença!</p>
          <br>
          <p>Atenciosamente,<br>Equipe ReportAbandono</p>
        `,
      });
    } catch (emailError) {
      console.error("Erro ao enviar e-mail de aprovação:", emailError);
      // Não falhar a operação se o e-mail falhar
    }

    return ongAtualizada;
  }

  /**
   * Reprova uma ONG (muda status para 2 - Negado)
   * Envia e-mail com justificativa
   */
  static async reprovarOng(ongId: number, motivo: string) {
    if (!motivo || motivo.trim().length === 0) {
      throw new Error("Motivo da reprovação é obrigatório");
    }

    // Buscar a ONG
    const ong = await prisma.usuario.findUnique({
      where: { id: ongId },
    });

    if (!ong) {
      throw new Error("ONG não encontrada");
    }

    if (ong.tipoUsuario !== "ONG") {
      throw new Error("Usuário não é uma ONG");
    }

    // Atualizar status para 2 (Negado)
    const ongAtualizada = await prisma.usuario.update({
      where: { id: ongId },
      data: { status: 2 },
      select: {
        id: true,
        nomeCompleto: true,
        email: true,
        status: true,
      },
    });

    // Enviar e-mail de reprovação com motivo
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: ong.email,
        subject: "Cadastro Não Aprovado - ReportAbandono",
        html: `
          <h2>Informação sobre seu cadastro</h2>
          <p>Olá, ${ong.nomeCompleto || "ONG"},</p>
          <p>Infelizmente, seu cadastro como ONG no sistema ReportAbandono <strong>não foi aprovado</strong>.</p>
          <h3>Motivo:</h3>
          <p>${motivo.replace(/\n/g, "<br>")}</p>
          <p>Se você acredita que houve um engano ou deseja mais informações, entre em contato conosco.</p>
          <br>
          <p>Atenciosamente,<br>Equipe ReportAbandono</p>
        `,
      });
    } catch (emailError) {
      console.error("Erro ao enviar e-mail de reprovação:", emailError);
      // Não falhar a operação se o e-mail falhar
    }

    return ongAtualizada;
  }

  /**
   * Confirma o banimento de um usuário (mantém status = 2)
   */
  static async confirmarBanimento(usuarioId: number) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    if (usuario.tipoUsuario !== "COMUM") {
      throw new Error("Usuário não é do tipo COMUM");
    }

    if (usuario.status !== 2) {
      throw new Error("Usuário não está reportado/banido");
    }

    // Usuário já está com status 2, apenas retornar confirmação
    return {
      id: usuario.id,
      nomeCompleto: usuario.nomeCompleto,
      email: usuario.email,
      status: usuario.status,
    };
  }

  /**
   * Reverte o status de um usuário reportado (volta para status = 0 - Aprovado)
   */
  static async reverterStatusUsuario(usuarioId: number) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    if (usuario.tipoUsuario !== "COMUM") {
      throw new Error("Usuário não é do tipo COMUM");
    }

    if (usuario.status !== 2) {
      throw new Error("Usuário não está reportado/banido");
    }

    // Atualizar status para 0 (Aprovado)
    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: usuarioId },
      data: { status: 0 },
      select: {
        id: true,
        nomeCompleto: true,
        email: true,
        status: true,
      },
    });

    return usuarioAtualizado;
  }

  /**
   * Busca detalhes de uma denúncia negada com histórico
   */
  static async getDenunciaNegada(denunciaId: number) {
    const denuncia = await prisma.denuncia.findUnique({
      where: { idDenuncia: denunciaId },
      include: {
        usuarioCriador: {
          select: {
            id: true,
            nomeCompleto: true,
            email: true,
          },
        },
        historicos: {
          where: {
            statusNovo: 2, // Histórico da negativa
          },
          orderBy: {
            dataAlteracao: "desc",
          },
        },
      },
    });

    if (!denuncia) {
      throw new Error("Denúncia não encontrada");
    }

    if (denuncia.status !== 2) {
      throw new Error("Denúncia não está negada");
    }

    return denuncia;
  }
}
