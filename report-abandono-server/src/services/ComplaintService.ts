import prisma from "../lib/prisma";

interface CreateComplaintData {
  descricao: string;
  tipoRegistro: string;
  localizacao: string;
  latitude: number;
  longitude: number;
  fkUsuarioId: number;
  mediaFiles: Express.Multer.File[];
}

export class ComplaintService {
  /**
   * Cria uma nova denúncia com mídias associadas
   * Usa transação do Prisma para garantir integridade
   */
  static async create(data: CreateComplaintData) {
    // Usar transação para garantir que denúncia e mídias sejam criadas juntas
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar a denúncia
      const denuncia = await tx.denuncia.create({
        data: {
          descricao: data.descricao,
          tipoRegistro: data.tipoRegistro,
          status: 0, // Pendente (Encaminhada)
          localizacao: data.localizacao,
          latitude: data.latitude,
          longitude: data.longitude,
          fkUsuarioId: data.fkUsuarioId,
          dataRegistro: new Date(), // Momento atual
        },
      });

      // 2. Criar registros de mídia vinculados à denúncia
      const midias = await Promise.all(
        data.mediaFiles.map((file) => {
          // Determinar tipo de mídia baseado no mimetype
          const isImage = file.mimetype.startsWith("image/");
          const tipoMidia = isImage ? "Foto" : "Video";

          // Salvar apenas o nome do arquivo (a pasta uploads é fixa)
          const fileName = file.filename;

          return tx.midia.create({
            data: {
              caminhoArquivo: fileName, // Nome do arquivo salvo
              tipoMidia: tipoMidia,
              fkDenunciaIdDenuncia: denuncia.idDenuncia,
              dataEnvio: new Date(),
            },
          });
        })
      );

      return {
        denuncia,
        midias,
      };
    });

    return result;
  }

  /**
   * Lista todas as denúncias do usuário logado
   * Inclui último histórico e mídias
   */
  static async findByUserId(userId: number) {
    const denuncias = await prisma.denuncia.findMany({
      where: {
        fkUsuarioId: userId,
      },
      include: {
        midias: {
          orderBy: {
            dataEnvio: "asc",
          },
        },
        historicos: {
          orderBy: {
            dataAlteracao: "desc",
          },
          take: 1, // Pegar apenas o último histórico
        },
      },
      orderBy: {
        dataRegistro: "desc",
      },
    });

    return denuncias;
  }

  /**
   * Busca uma denúncia por ID e usuário (para garantir que é do usuário)
   */
  static async findByIdAndUserId(idDenuncia: number, userId: number) {
    const denuncia = await prisma.denuncia.findFirst({
      where: {
        idDenuncia: idDenuncia,
        fkUsuarioId: userId,
      },
      include: {
        midias: {
          orderBy: {
            dataEnvio: "asc",
          },
        },
        historicos: {
          orderBy: {
            dataAlteracao: "asc",
          },
        },
      },
    });

    return denuncia;
  }

  /**
   * Deleta uma denúncia (apenas se status = 0)
   */
  static async delete(idDenuncia: number, userId: number) {
    // Verificar se a denúncia existe e pertence ao usuário
    const denuncia = await prisma.denuncia.findFirst({
      where: {
        idDenuncia: idDenuncia,
        fkUsuarioId: userId,
      },
    });

    if (!denuncia) {
      throw new Error("Denúncia não encontrada");
    }

    // Verificar se o status permite exclusão (apenas status 0 - Encaminhada)
    if (denuncia.status !== 0) {
      throw new Error("Apenas denúncias com status 'Encaminhada' podem ser excluídas");
    }

    // Deletar a denúncia (cascade vai deletar mídias e histórico)
    await prisma.denuncia.delete({
      where: {
        idDenuncia: idDenuncia,
      },
    });

    return true;
  }

  /**
   * Lista denúncias para ONG (atribuídas ou disponíveis na região)
   * Retorna denúncias com status 0 (Pendente) sem responsável OU atribuídas à ONG
   */
  static async listForOng(ongId: number) {
    // Buscar ONG para obter coordenadas
    const ong = await prisma.usuario.findUnique({
      where: { id: ongId },
      select: {
        latitude: true,
        longitude: true,
      },
    });

    // Buscar denúncias atribuídas à ONG
    const denunciasAtribuidas = await prisma.denuncia.findMany({
      where: {
        fkResponsavelId: ongId,
      },
      include: {
        usuarioCriador: {
          select: {
            id: true,
            nomeCompleto: true,
            email: true,
          },
        },
        midias: {
          orderBy: {
            dataEnvio: "asc",
          },
        },
        historicos: {
          orderBy: {
            dataAlteracao: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        dataRegistro: "desc",
      },
    });

    // Buscar denúncias disponíveis (status 0 sem responsável)
    // Se a ONG tiver coordenadas, podemos filtrar por região (raio de 50km por exemplo)
    const denunciasDisponiveis = await prisma.denuncia.findMany({
      where: {
        status: 0, // Pendente
        fkResponsavelId: null, // Sem responsável
      },
      include: {
        usuarioCriador: {
          select: {
            id: true,
            nomeCompleto: true,
            email: true,
          },
        },
        midias: {
          orderBy: {
            dataEnvio: "asc",
          },
        },
        historicos: {
          orderBy: {
            dataAlteracao: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        dataRegistro: "desc",
      },
    });

    // Combinar e retornar
    return {
      atribuidas: denunciasAtribuidas,
      disponiveis: denunciasDisponiveis,
    };
  }

  /**
   * Abre uma denúncia (status 0 -> 1 e atribui à ONG)
   * Se a denúncia não tiver responsável, atribui à ONG
   */
  static async openComplaint(idDenuncia: number, ongId: number) {
    const denuncia = await prisma.denuncia.findUnique({
      where: { idDenuncia },
    });

    if (!denuncia) {
      throw new Error("Denúncia não encontrada");
    }

    // Se status não for 0 (Pendente), não pode abrir
    if (denuncia.status !== 0) {
      throw new Error("Apenas denúncias com status 'Pendente' podem ser abertas");
    }

    // Usar transação para atualizar status e criar histórico
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar status para 1 (Em Análise) e atribuir à ONG
      const denunciaAtualizada = await tx.denuncia.update({
        where: { idDenuncia },
        data: {
          status: 1, // Em Análise
          fkResponsavelId: ongId, // Atribuir à ONG
        },
        include: {
          usuarioCriador: {
            select: {
              id: true,
              nomeCompleto: true,
              email: true,
            },
          },
          midias: {
            orderBy: {
              dataEnvio: "asc",
            },
          },
          historicos: {
            orderBy: {
              dataAlteracao: "desc",
            },
          },
        },
      });

      // Criar registro no histórico
      await tx.historicoDenuncia.create({
        data: {
          statusAnterior: 0, // Pendente
          statusNovo: 1, // Em Análise
          observacao: "Denúncia aberta pela ONG",
          fkDenunciaIdDenuncia: idDenuncia,
          dataAlteracao: new Date(),
        },
      });

      return denunciaAtualizada;
    });

    return result;
  }

  /**
   * Conclui uma denúncia (status -> 3 com texto de solução)
   */
  static async concludeComplaint(
    idDenuncia: number,
    ongId: number,
    solucao: string
  ) {
    if (!solucao || !solucao.trim()) {
      throw new Error("Texto de solução é obrigatório");
    }

    const denuncia = await prisma.denuncia.findUnique({
      where: { idDenuncia },
    });

    if (!denuncia) {
      throw new Error("Denúncia não encontrada");
    }

    // Verificar se a denúncia está atribuída à ONG
    if (denuncia.fkResponsavelId !== ongId) {
      throw new Error("Denúncia não está atribuída a esta ONG");
    }

    // Verificar se o status permite conclusão (apenas status 1 - Em Análise)
    if (denuncia.status !== 1) {
      throw new Error("Apenas denúncias com status 'Em Análise' podem ser concluídas");
    }

    // Usar transação para atualizar status e criar histórico
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar status para 3 (Concluída)
      const denunciaAtualizada = await tx.denuncia.update({
        where: { idDenuncia },
        data: {
          status: 3, // Concluída
        },
      });

      // Criar registro no histórico com a solução
      await tx.historicoDenuncia.create({
        data: {
          statusAnterior: 1, // Em Análise
          statusNovo: 3, // Concluída
          observacao: solucao.trim(),
          fkDenunciaIdDenuncia: idDenuncia,
          dataAlteracao: new Date(),
        },
      });

      return denunciaAtualizada;
    });

    return result;
  }

  /**
   * Nega uma denúncia (status -> 2 com justificativa)
   */
  static async denyComplaint(
    idDenuncia: number,
    ongId: number,
    justificativa: string
  ) {
    if (!justificativa || !justificativa.trim()) {
      throw new Error("Justificativa é obrigatória");
    }

    const denuncia = await prisma.denuncia.findUnique({
      where: { idDenuncia },
    });

    if (!denuncia) {
      throw new Error("Denúncia não encontrada");
    }

    // Verificar se a denúncia está atribuída à ONG
    if (denuncia.fkResponsavelId !== ongId) {
      throw new Error("Denúncia não está atribuída a esta ONG");
    }

    // Verificar se o status permite negação (apenas status 1 - Em Análise)
    if (denuncia.status !== 1) {
      throw new Error("Apenas denúncias com status 'Em Análise' podem ser negadas");
    }

    // Usar transação para atualizar status e criar histórico
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar status para 2 (Negada)
      const denunciaAtualizada = await tx.denuncia.update({
        where: { idDenuncia },
        data: {
          status: 2, // Negada
        },
      });

      // Criar registro no histórico com a justificativa
      await tx.historicoDenuncia.create({
        data: {
          statusAnterior: 1, // Em Análise
          statusNovo: 2, // Negada
          observacao: justificativa.trim(),
          fkDenunciaIdDenuncia: idDenuncia,
          dataAlteracao: new Date(),
        },
      });

      return denunciaAtualizada;
    });

    return result;
  }

  /**
   * Reporta um usuário (muda status do usuário para 2 - Banido)
   */
  static async reportUser(usuarioId: number, motivo: string) {
    if (!motivo || !motivo.trim()) {
      throw new Error("Motivo do reporte é obrigatório");
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    if (usuario.tipoUsuario !== "COMUM") {
      throw new Error("Apenas usuários do tipo COMUM podem ser reportados");
    }

    // Atualizar status do usuário para 2 (Banido)
    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        status: 2, // Banido
      },
    });

    return usuarioAtualizado;
  }

  /**
   * Busca detalhes de uma denúncia para ONG (com mídias e histórico)
   */
  static async findByIdForOng(idDenuncia: number, ongId: number) {
    const denuncia = await prisma.denuncia.findUnique({
      where: { idDenuncia },
      include: {
        usuarioCriador: {
          select: {
            id: true,
            nomeCompleto: true,
            email: true,
            cpf: true,
            numeroContato: true,
          },
        },
        midias: {
          orderBy: {
            dataEnvio: "asc",
          },
        },
        historicos: {
          orderBy: {
            dataAlteracao: "asc",
          },
        },
      },
    });

    if (!denuncia) {
      throw new Error("Denúncia não encontrada");
    }

    // Verificar se a denúncia está atribuída à ONG ou está disponível (sem responsável)
    if (denuncia.fkResponsavelId !== null && denuncia.fkResponsavelId !== ongId) {
      throw new Error("Denúncia não está disponível para esta ONG");
    }

    return denuncia;
  }

  /**
   * Lista denúncias concluídas (status = 3) com coordenadas para o mapa
   * Retorna apenas denúncias que possuem latitude e longitude válidos
   */
  static async findConcluidas() {
    const denuncias = await prisma.denuncia.findMany({
      where: {
        status: 3, // Concluída
        latitude: {
          not: null,
        },
        longitude: {
          not: null,
        },
      },
      select: {
        idDenuncia: true,
        descricao: true,
        dataRegistro: true,
        latitude: true,
        longitude: true,
      },
      orderBy: {
        dataRegistro: "desc",
      },
    });

    return denuncias;
  }
}
