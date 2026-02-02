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

  /**
   * Lista denúncias para ONG (atribuídas ou disponíveis)
   * GET /denuncias/ong
   * Requer autenticação (Bearer Token) e tipo ONG
   */
  static async listForOng(req: Request, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: "Não autenticado",
          message: "É necessário estar autenticado para listar denúncias.",
        });
      }

      // Verificar tipo de usuário (pode ser null ou undefined)
      if (!req.userType || req.userType !== "ONG") {
        console.log("Tipo de usuário recebido:", req.userType);
        console.log("UserId:", req.userId);
        return res.status(403).json({
          error: "Acesso negado",
          message: `Apenas ONGs podem acessar esta rota. Tipo de usuário atual: ${req.userType || "não definido"}`,
        });
      }

      const result = await ComplaintService.listForOng(req.userId);

      // Formatar resposta
      const formatComplaint = (denuncia: any) => {
        const ultimoHistorico = denuncia.historicos && denuncia.historicos.length > 0 ? denuncia.historicos[0] : null;
        const statusMap: Record<number, string> = {
          0: "nova",
          1: "em_analise",
          2: "negada",
          3: "concluida",
        };

        return {
          id: denuncia.idDenuncia.toString(),
          protocolo: `PROT-${denuncia.idDenuncia.toString().padStart(6, "0")}`,
          dataInclusao: denuncia.dataRegistro ? denuncia.dataRegistro.toISOString().split("T")[0] : null,
          status: statusMap[denuncia.status] || "nova",
          dataRetorno: ultimoHistorico && ultimoHistorico.dataAlteracao
            ? ultimoHistorico.dataAlteracao.toISOString().split("T")[0]
            : null,
          feedback: ultimoHistorico?.observacao || null,
          descricao: denuncia.descricao || null,
          tipoRegistro: denuncia.tipoRegistro || null,
          localizacao: denuncia.localizacao || null,
          latitude: denuncia.latitude ? Number(denuncia.latitude) : null,
          longitude: denuncia.longitude ? Number(denuncia.longitude) : null,
          fkResponsavelId: denuncia.fkResponsavelId || null,
          usuarioCriador: denuncia.usuarioCriador || null,
          midias: (denuncia.midias || []).map((m: any) => ({
            idMidia: m.idMidia,
            caminhoArquivo: m.caminhoArquivo || null,
            tipoMidia: m.tipoMidia || null,
            dataEnvio: m.dataEnvio ? m.dataEnvio.toISOString() : null,
          })),
        };
      };

      const atribuidas = result.atribuidas.map(formatComplaint);
      const disponiveis = result.disponiveis.map(formatComplaint);

      // Combinar e ordenar por data (mais recentes primeiro)
      const todas = [...atribuidas, ...disponiveis].sort((a, b) => {
        const dateA = a.dataInclusao ? new Date(a.dataInclusao).getTime() : 0;
        const dateB = b.dataInclusao ? new Date(b.dataInclusao).getTime() : 0;
        return dateB - dateA;
      });

      return res.status(200).json({
        denuncias: todas,
      });
    } catch (error: any) {
      console.error("Erro ao listar denúncias para ONG:", error);
      console.error("Stack trace:", error.stack);
      return res.status(500).json({
        error: "Erro interno do servidor",
        message: error.message || "Ocorreu um erro ao listar as denúncias. Tente novamente.",
      });
    }
  }

  /**
   * Abre uma denúncia (status 0 -> 1 e atribui à ONG)
   * PUT /denuncias/:id/abrir
   * Requer autenticação (Bearer Token) e tipo ONG
   */
  static async openComplaint(req: Request, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: "Não autenticado",
          message: "É necessário estar autenticado para abrir denúncias.",
        });
      }

      if (req.userType !== "ONG") {
        return res.status(403).json({
          error: "Acesso negado",
          message: "Apenas ONGs podem abrir denúncias.",
        });
      }

      const idDenuncia = parseInt(req.params.id);

      if (isNaN(idDenuncia)) {
        return res.status(400).json({
          error: "ID inválido",
          message: "O ID da denúncia deve ser um número válido.",
        });
      }

      const denuncia = await ComplaintService.openComplaint(idDenuncia, req.userId);

      return res.status(200).json({
        message: "Denúncia aberta com sucesso",
        denuncia: {
          id: denuncia.idDenuncia,
          protocolo: `PROT-${denuncia.idDenuncia.toString().padStart(6, "0")}`,
          status: denuncia.status,
        },
      });
    } catch (error: any) {
      if (error.message === "Denúncia não encontrada") {
        return res.status(404).json({
          error: "Denúncia não encontrada",
          message: error.message,
        });
      }

      if (error.message.includes("Apenas denúncias")) {
        return res.status(400).json({
          error: "Operação não permitida",
          message: error.message,
        });
      }

      console.error("Erro ao abrir denúncia:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
        message: "Ocorreu um erro ao abrir a denúncia. Tente novamente.",
      });
    }
  }

  /**
   * Conclui uma denúncia (status -> 3 com texto de solução)
   * PUT /denuncias/:id/concluir
   * Requer autenticação (Bearer Token) e tipo ONG
   */
  static async concludeComplaint(req: Request, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: "Não autenticado",
          message: "É necessário estar autenticado para concluir denúncias.",
        });
      }

      if (req.userType !== "ONG") {
        return res.status(403).json({
          error: "Acesso negado",
          message: "Apenas ONGs podem concluir denúncias.",
        });
      }

      const idDenuncia = parseInt(req.params.id);
      const { solucao } = req.body;

      if (isNaN(idDenuncia)) {
        return res.status(400).json({
          error: "ID inválido",
          message: "O ID da denúncia deve ser um número válido.",
        });
      }

      if (!solucao || !solucao.trim()) {
        return res.status(400).json({
          error: "Campo obrigatório",
          message: "O texto de solução é obrigatório.",
        });
      }

      await ComplaintService.concludeComplaint(idDenuncia, req.userId, solucao);

      return res.status(200).json({
        message: "Denúncia concluída com sucesso",
      });
    } catch (error: any) {
      if (error.message === "Denúncia não encontrada" || error.message === "Denúncia não está atribuída a esta ONG") {
        return res.status(404).json({
          error: "Denúncia não encontrada",
          message: error.message,
        });
      }

      if (error.message.includes("Apenas denúncias") || error.message.includes("obrigatório")) {
        return res.status(400).json({
          error: "Operação não permitida",
          message: error.message,
        });
      }

      console.error("Erro ao concluir denúncia:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
        message: "Ocorreu um erro ao concluir a denúncia. Tente novamente.",
      });
    }
  }

  /**
   * Nega uma denúncia (status -> 2 com justificativa)
   * PUT /denuncias/:id/negar
   * Requer autenticação (Bearer Token) e tipo ONG
   */
  static async denyComplaint(req: Request, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: "Não autenticado",
          message: "É necessário estar autenticado para negar denúncias.",
        });
      }

      if (req.userType !== "ONG") {
        return res.status(403).json({
          error: "Acesso negado",
          message: "Apenas ONGs podem negar denúncias.",
        });
      }

      const idDenuncia = parseInt(req.params.id);
      const { justificativa } = req.body;

      if (isNaN(idDenuncia)) {
        return res.status(400).json({
          error: "ID inválido",
          message: "O ID da denúncia deve ser um número válido.",
        });
      }

      if (!justificativa || !justificativa.trim()) {
        return res.status(400).json({
          error: "Campo obrigatório",
          message: "A justificativa é obrigatória.",
        });
      }

      await ComplaintService.denyComplaint(idDenuncia, req.userId, justificativa);

      return res.status(200).json({
        message: "Denúncia negada com sucesso",
      });
    } catch (error: any) {
      if (error.message === "Denúncia não encontrada" || error.message === "Denúncia não está atribuída a esta ONG") {
        return res.status(404).json({
          error: "Denúncia não encontrada",
          message: error.message,
        });
      }

      if (error.message.includes("Apenas denúncias") || error.message.includes("obrigatório")) {
        return res.status(400).json({
          error: "Operação não permitida",
          message: error.message,
        });
      }

      console.error("Erro ao negar denúncia:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
        message: "Ocorreu um erro ao negar a denúncia. Tente novamente.",
      });
    }
  }

  /**
   * Reporta um usuário (muda status do usuário para 2)
   * POST /denuncias/:id/reportar-usuario
   * Requer autenticação (Bearer Token) e tipo ONG
   */
  static async reportUser(req: Request, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: "Não autenticado",
          message: "É necessário estar autenticado para reportar usuários.",
        });
      }

      if (req.userType !== "ONG") {
        return res.status(403).json({
          error: "Acesso negado",
          message: "Apenas ONGs podem reportar usuários.",
        });
      }

      const idDenuncia = parseInt(req.params.id);
      const { motivo } = req.body;

      if (isNaN(idDenuncia)) {
        return res.status(400).json({
          error: "ID inválido",
          message: "O ID da denúncia deve ser um número válido.",
        });
      }

      if (!motivo || !motivo.trim()) {
        return res.status(400).json({
          error: "Campo obrigatório",
          message: "O motivo do reporte é obrigatório.",
        });
      }

      // Buscar a denúncia para obter o ID do usuário criador
      const denuncia = await ComplaintService.findByIdForOng(idDenuncia, req.userId);

      if (!denuncia || !denuncia.fkUsuarioId) {
        return res.status(404).json({
          error: "Denúncia não encontrada",
          message: "A denúncia solicitada não foi encontrada.",
        });
      }

      await ComplaintService.reportUser(denuncia.fkUsuarioId, motivo);

      return res.status(200).json({
        message: "Usuário reportado com sucesso",
      });
    } catch (error: any) {
      if (error.message === "Denúncia não encontrada" || error.message === "Denúncia não está disponível para esta ONG") {
        return res.status(404).json({
          error: "Denúncia não encontrada",
          message: error.message,
        });
      }

      if (error.message.includes("obrigatório") || error.message.includes("Apenas usuários")) {
        return res.status(400).json({
          error: "Operação não permitida",
          message: error.message,
        });
      }

      console.error("Erro ao reportar usuário:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
        message: "Ocorreu um erro ao reportar o usuário. Tente novamente.",
      });
    }
  }

  /**
   * Busca detalhes de uma denúncia para ONG (com mídias e histórico)
   * GET /denuncias/ong/:id
   * Requer autenticação (Bearer Token) e tipo ONG
   */
  static async findByIdForOng(req: Request, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: "Não autenticado",
          message: "É necessário estar autenticado para visualizar denúncias.",
        });
      }

      if (req.userType !== "ONG") {
        return res.status(403).json({
          error: "Acesso negado",
          message: "Apenas ONGs podem acessar esta rota.",
        });
      }

      const idDenuncia = parseInt(req.params.id);

      if (isNaN(idDenuncia)) {
        return res.status(400).json({
          error: "ID inválido",
          message: "O ID da denúncia deve ser um número válido.",
        });
      }

      const denuncia = await ComplaintService.findByIdForOng(idDenuncia, req.userId);

      // Mapear status numérico para string
      const statusMap: Record<number, string> = {
        0: "nova",
        1: "em_analise",
        2: "negada",
        3: "concluida",
      };

      // Formatar resposta completa
      const formattedComplaint = {
        id: denuncia.idDenuncia.toString(),
        protocolo: `PROT-${denuncia.idDenuncia.toString().padStart(6, "0")}`,
        dataInclusao: denuncia.dataRegistro.toISOString().split("T")[0],
        status: statusMap[denuncia.status] || "nova",
        descricao: denuncia.descricao,
        tipoRegistro: denuncia.tipoRegistro,
        localizacao: denuncia.localizacao,
        latitude: denuncia.latitude,
        longitude: denuncia.longitude,
        fkResponsavelId: denuncia.fkResponsavelId,
        usuarioCriador: denuncia.usuarioCriador,
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
      if (error.message === "Denúncia não encontrada" || error.message === "Denúncia não está disponível para esta ONG") {
        return res.status(404).json({
          error: "Denúncia não encontrada",
          message: error.message,
        });
      }

      console.error("Erro ao buscar denúncia:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
        message: "Ocorreu um erro ao buscar a denúncia. Tente novamente.",
      });
    }
  }

  /**
   * Lista denúncias concluídas com coordenadas para o mapa
   * GET /denuncias/concluidas
   * Não requer autenticação (público para visualização do mapa)
   */
  static async getConcluidas(req: Request, res: Response) {
    try {
      const denuncias = await ComplaintService.findConcluidas();

      // Formatar resposta
      const formattedComplaints = denuncias.map((denuncia) => {
        // Converter Decimal para Number
        const lat = denuncia.latitude ? Number(denuncia.latitude) : null;
        const lng = denuncia.longitude ? Number(denuncia.longitude) : null;

        return {
          id: denuncia.idDenuncia.toString(),
          protocolo: `PROT-${denuncia.idDenuncia.toString().padStart(6, "0")}`,
          latitude: lat,
          longitude: lng,
          dataInclusao: denuncia.dataRegistro.toISOString().split("T")[0],
          descricao: denuncia.descricao || null,
        };
      });

      // Filtrar apenas denúncias com coordenadas válidas
      const validComplaints = formattedComplaints.filter(
        (c) => c.latitude !== null && c.longitude !== null && !isNaN(c.latitude) && !isNaN(c.longitude)
      );

      return res.status(200).json({
        denuncias: validComplaints,
      });
    } catch (error: any) {
      console.error("Erro ao buscar denúncias concluídas:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
        message: "Ocorreu um erro ao buscar as denúncias. Tente novamente.",
      });
    }
  }
}
