import prisma from "../../prisma/client";

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
   * Contesta uma denúncia (altera status para 3 - Negada)
   * Insere registro no histórico com a justificativa
   */
  static async contest(idDenuncia: number, userId: number, justificativa: string) {
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

    // Verificar se o status permite contestação (apenas status 2 - Concluída)
    if (denuncia.status !== 2) {
      throw new Error("Apenas denúncias com status 'Concluída' podem ser contestadas");
    }

    // Usar transação para atualizar status e criar histórico
    const result = await prisma.$transaction(async (tx) => {
      // 1. Atualizar status para 3 (Negada)
      const denunciaAtualizada = await tx.denuncia.update({
        where: {
          idDenuncia: idDenuncia,
        },
        data: {
          status: 3, // Negada
        },
      });

      // 2. Criar registro no histórico
      await tx.historicoDenuncia.create({
        data: {
          statusAnterior: 2, // Concluída
          statusNovo: 3, // Negada
          observacao: justificativa,
          fkDenunciaIdDenuncia: idDenuncia,
          dataAlteracao: new Date(),
        },
      });

      return denunciaAtualizada;
    });

    return result;
  }
}
