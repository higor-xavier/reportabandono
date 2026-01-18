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
          status: 0, // Pendente
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
}
