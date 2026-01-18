import { Request, Response } from "express";
import { ComplaintService } from "../services/ComplaintService";

export class ComplaintController {
  /**
   * Cria uma nova denúncia com mídias
   * POST /denuncias
   * Requer autenticação (Bearer Token)
   */
  static async create(req: Request, res: Response) {
    try {
      // Validar se o usuário está autenticado (deve estar no req.userId após passar pelo authMiddleware)
      if (!req.userId) {
        return res.status(401).json({
          error: "Não autenticado",
          message: "É necessário estar autenticado para criar uma denúncia.",
        });
      }

      // Obter dados do corpo da requisição (multipart/form-data)
      const { descricao, tipoRegistro, localizacao, latitude, longitude } = req.body;

      // Validações básicas
      if (!descricao || !descricao.trim()) {
        return res.status(400).json({
          error: "Campo obrigatório",
          message: "A descrição é obrigatória.",
        });
      }

      if (!tipoRegistro) {
        return res.status(400).json({
          error: "Campo obrigatório",
          message: "O tipo de registro é obrigatório.",
        });
      }

      if (!localizacao || !localizacao.trim()) {
        return res.status(400).json({
          error: "Campo obrigatório",
          message: "A localização é obrigatória.",
        });
      }

      // Validar coordenadas
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({
          error: "Coordenadas inválidas",
          message: "As coordenadas de latitude e longitude são obrigatórias e devem ser números válidos.",
        });
      }

      // Validar se há arquivos (opcional, mas recomendado)
      const files = req.files as Express.Multer.File[];
      const mediaFiles = files && Array.isArray(files) ? files : [];

      // Chamar o service para criar a denúncia
      const result = await ComplaintService.create({
        descricao: descricao.trim(),
        tipoRegistro: tipoRegistro,
        localizacao: localizacao.trim(),
        latitude: lat,
        longitude: lng,
        fkUsuarioId: req.userId,
        mediaFiles: mediaFiles,
      });

      // Retornar sucesso (201 Created)
      return res.status(201).json({
        message: "Denúncia registrada com sucesso",
        denuncia: {
          idDenuncia: result.denuncia.idDenuncia,
          protocolo: `PROT-${result.denuncia.idDenuncia.toString().padStart(6, "0")}`, // Gerar protocolo
          descricao: result.denuncia.descricao,
          tipoRegistro: result.denuncia.tipoRegistro,
          status: result.denuncia.status,
          dataRegistro: result.denuncia.dataRegistro,
          localizacao: result.denuncia.localizacao,
          latitude: result.denuncia.latitude,
          longitude: result.denuncia.longitude,
        },
        midias: result.midias.map((m) => ({
          idMidia: m.idMidia,
          tipoMidia: m.tipoMidia,
          dataEnvio: m.dataEnvio,
        })),
      });
    } catch (error: any) {
      // Erro interno do servidor
      console.error("Erro ao criar denúncia:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
        message: "Ocorreu um erro ao processar a denúncia. Tente novamente.",
      });
    }
  }
}
