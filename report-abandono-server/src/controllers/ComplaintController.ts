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

  /**
   * Lista todas as denúncias do usuário logado
   * GET /denuncias/me
   * Requer autenticação (Bearer Token)
   */
  static async listMyComplaints(req: Request, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: "Não autenticado",
          message: "É necessário estar autenticado para listar denúncias.",
        });
      }

      const denuncias = await ComplaintService.findByUserId(req.userId);

      // Formatar resposta
      const formattedComplaints = denuncias.map((denuncia) => {
        const ultimoHistorico = denuncia.historicos[0] || null;

        return {
          id: denuncia.idDenuncia.toString(),
          protocolo: `PROT-${denuncia.idDenuncia.toString().padStart(6, "0")}`,
          dataInclusao: denuncia.dataRegistro.toISOString().split("T")[0],
          status: denuncia.status, // 0, 1, 2, 3
          dataRetorno: ultimoHistorico
            ? ultimoHistorico.dataAlteracao.toISOString().split("T")[0]
            : null,
          feedback: ultimoHistorico?.observacao || null,
          descricao: denuncia.descricao,
          tipoRegistro: denuncia.tipoRegistro,
          localizacao: denuncia.localizacao,
          latitude: denuncia.latitude,
          longitude: denuncia.longitude,
          midias: denuncia.midias.map((m) => ({
            idMidia: m.idMidia,
            caminhoArquivo: m.caminhoArquivo,
            tipoMidia: m.tipoMidia,
            dataEnvio: m.dataEnvio.toISOString(),
          })),
          historicos: denuncia.historicos.map((h) => ({
            idHistorico: h.idHistorico,
            statusAnterior: h.statusAnterior,
            statusNovo: h.statusNovo,
            dataAlteracao: h.dataAlteracao.toISOString(),
            observacao: h.observacao,
          })),
        };
      });

      return res.status(200).json({
        denuncias: formattedComplaints,
      });
    } catch (error: any) {
      console.error("Erro ao listar denúncias:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
        message: "Ocorreu um erro ao listar as denúncias. Tente novamente.",
      });
    }
  }

  /**
   * Deleta uma denúncia
   * DELETE /denuncias/:id
   * Requer autenticação (Bearer Token)
   * Apenas se status = 0 (Encaminhada)
   */
  static async delete(req: Request, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: "Não autenticado",
          message: "É necessário estar autenticado para excluir denúncias.",
        });
      }

      const idDenuncia = parseInt(req.params.id);

      if (isNaN(idDenuncia)) {
        return res.status(400).json({
          error: "ID inválido",
          message: "O ID da denúncia deve ser um número válido.",
        });
      }

      await ComplaintService.delete(idDenuncia, req.userId);

      return res.status(200).json({
        message: "Denúncia excluída com sucesso",
      });
    } catch (error: any) {
      if (error.message === "Denúncia não encontrada") {
        return res.status(404).json({
          error: "Denúncia não encontrada",
          message: error.message,
        });
      }

      if (error.message.includes("Apenas denúncias com status")) {
        return res.status(400).json({
          error: "Operação não permitida",
          message: error.message,
        });
      }

      console.error("Erro ao excluir denúncia:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
        message: "Ocorreu um erro ao excluir a denúncia. Tente novamente.",
      });
    }
  }

  /**
   * Contesta uma denúncia
   * POST /denuncias/:id/contestar
   * Requer autenticação (Bearer Token)
   * Apenas se status = 2 (Concluída)
   */
  static async contest(req: Request, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: "Não autenticado",
          message: "É necessário estar autenticado para contestar denúncias.",
        });
      }

      const idDenuncia = parseInt(req.params.id);

      if (isNaN(idDenuncia)) {
        return res.status(400).json({
          error: "ID inválido",
          message: "O ID da denúncia deve ser um número válido.",
        });
      }

      const { justificativa } = req.body;

      if (!justificativa || !justificativa.trim()) {
        return res.status(400).json({
          error: "Campo obrigatório",
          message: "A justificativa é obrigatória.",
        });
      }

      await ComplaintService.contest(idDenuncia, req.userId, justificativa.trim());

      return res.status(200).json({
        message: "Denúncia contestada com sucesso",
      });
    } catch (error: any) {
      if (error.message === "Denúncia não encontrada") {
        return res.status(404).json({
          error: "Denúncia não encontrada",
          message: error.message,
        });
      }

      if (error.message.includes("Apenas denúncias com status")) {
        return res.status(400).json({
          error: "Operação não permitida",
          message: error.message,
        });
      }

      console.error("Erro ao contestar denúncia:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
        message: "Ocorreu um erro ao contestar a denúncia. Tente novamente.",
      });
    }
  }

  /**
   * Busca uma denúncia completa por ID (para PDF)
   * GET /denuncias/:id
   * Requer autenticação (Bearer Token)
   */
  static async findById(req: Request, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: "Não autenticado",
          message: "É necessário estar autenticado para visualizar denúncias.",
        });
      }

      const idDenuncia = parseInt(req.params.id);

      if (isNaN(idDenuncia)) {
        return res.status(400).json({
          error: "ID inválido",
          message: "O ID da denúncia deve ser um número válido.",
        });
      }

      const denuncia = await ComplaintService.findByIdAndUserId(idDenuncia, req.userId);

      if (!denuncia) {
        return res.status(404).json({
          error: "Denúncia não encontrada",
          message: "A denúncia solicitada não foi encontrada.",
        });
      }

      // Formatar resposta completa
      const formattedComplaint = {
        id: denuncia.idDenuncia.toString(),
        protocolo: `PROT-${denuncia.idDenuncia.toString().padStart(6, "0")}`,
        dataInclusao: denuncia.dataRegistro.toISOString().split("T")[0],
        status: denuncia.status,
        descricao: denuncia.descricao,
        tipoRegistro: denuncia.tipoRegistro,
        localizacao: denuncia.localizacao,
        latitude: denuncia.latitude,
        longitude: denuncia.longitude,
        midias: denuncia.midias.map((m) => ({
          idMidia: m.idMidia,
          caminhoArquivo: m.caminhoArquivo,
          tipoMidia: m.tipoMidia,
          dataEnvio: m.dataEnvio.toISOString(),
        })),
        historicos: denuncia.historicos.map((h) => ({
          idHistorico: h.idHistorico,
          statusAnterior: h.statusAnterior,
          statusNovo: h.statusNovo,
          dataAlteracao: h.dataAlteracao.toISOString(),
          observacao: h.observacao,
        })),
      };

      return res.status(200).json({
        denuncia: formattedComplaint,
      });
    } catch (error: any) {
      console.error("Erro ao buscar denúncia:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
        message: "Ocorreu um erro ao buscar a denúncia. Tente novamente.",
      });
    }
  }
}
