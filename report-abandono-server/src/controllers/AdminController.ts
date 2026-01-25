import { Request, Response } from "express";
import { AdminService } from "../services/AdminService";

export class AdminController {
  /**
   * Retorna lista unificada de solicitações pendentes
   * GET /admin/solicitacoes
   */
  static async getSolicitacoes(req: Request, res: Response) {
    try {
      const solicitacoes = await AdminService.getSolicitacoes();
      return res.status(200).json(solicitacoes);
    } catch (error: any) {
      console.error("Erro ao buscar solicitações:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
        message: "Ocorreu um erro ao buscar as solicitações.",
      });
    }
  }

  /**
   * Aprova uma ONG
   * PUT /admin/ongs/:id/aprovar
   */
  static async aprovarOng(req: Request, res: Response) {
    try {
      const ongId = parseInt(req.params.id);

      if (isNaN(ongId)) {
        return res.status(400).json({
          error: "ID inválido",
          message: "O ID da ONG deve ser um número válido.",
        });
      }

      const ongAprovada = await AdminService.aprovarOng(ongId);

      return res.status(200).json({
        message: "ONG aprovada com sucesso",
        ong: ongAprovada,
      });
    } catch (error: any) {
      if (error.message === "ONG não encontrada") {
        return res.status(404).json({
          error: "ONG não encontrada",
          message: error.message,
        });
      }

      if (error.message === "Usuário não é uma ONG" || error.message === "ONG já está aprovada") {
        return res.status(400).json({
          error: "Operação inválida",
          message: error.message,
        });
      }

      console.error("Erro ao aprovar ONG:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
        message: "Ocorreu um erro ao aprovar a ONG.",
      });
    }
  }

  /**
   * Reprova uma ONG
   * PUT /admin/ongs/:id/reprovar
   */
  static async reprovarOng(req: Request, res: Response) {
    try {
      const ongId = parseInt(req.params.id);
      const { motivo } = req.body;

      if (isNaN(ongId)) {
        return res.status(400).json({
          error: "ID inválido",
          message: "O ID da ONG deve ser um número válido.",
        });
      }

      if (!motivo || typeof motivo !== "string" || motivo.trim().length === 0) {
        return res.status(400).json({
          error: "Motivo obrigatório",
          message: "O motivo da reprovação é obrigatório.",
        });
      }

      const ongReprovada = await AdminService.reprovarOng(ongId, motivo);

      return res.status(200).json({
        message: "ONG reprovada com sucesso",
        ong: ongReprovada,
      });
    } catch (error: any) {
      if (error.message === "ONG não encontrada") {
        return res.status(404).json({
          error: "ONG não encontrada",
          message: error.message,
        });
      }

      if (error.message === "Usuário não é uma ONG" || error.message.includes("obrigatório")) {
        return res.status(400).json({
          error: "Operação inválida",
          message: error.message,
        });
      }

      console.error("Erro ao reprovar ONG:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
        message: "Ocorreu um erro ao reprovar a ONG.",
      });
    }
  }

  /**
   * Confirma banimento de usuário reportado
   * PUT /admin/usuarios/:id/banir
   */
  static async confirmarBanimento(req: Request, res: Response) {
    try {
      const usuarioId = parseInt(req.params.id);

      if (isNaN(usuarioId)) {
        return res.status(400).json({
          error: "ID inválido",
          message: "O ID do usuário deve ser um número válido.",
        });
      }

      const usuario = await AdminService.confirmarBanimento(usuarioId);

      return res.status(200).json({
        message: "Banimento confirmado",
        usuario,
      });
    } catch (error: any) {
      if (error.message === "Usuário não encontrado") {
        return res.status(404).json({
          error: "Usuário não encontrado",
          message: error.message,
        });
      }

      if (error.message.includes("não é do tipo") || error.message.includes("não está reportado")) {
        return res.status(400).json({
          error: "Operação inválida",
          message: error.message,
        });
      }

      console.error("Erro ao confirmar banimento:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
        message: "Ocorreu um erro ao confirmar o banimento.",
      });
    }
  }

  /**
   * Reverte status de usuário reportado (volta para ativo)
   * PUT /admin/usuarios/:id/reverter
   */
  static async reverterStatusUsuario(req: Request, res: Response) {
    try {
      const usuarioId = parseInt(req.params.id);

      if (isNaN(usuarioId)) {
        return res.status(400).json({
          error: "ID inválido",
          message: "O ID do usuário deve ser um número válido.",
        });
      }

      const usuario = await AdminService.reverterStatusUsuario(usuarioId);

      return res.status(200).json({
        message: "Status do usuário revertido com sucesso",
        usuario,
      });
    } catch (error: any) {
      if (error.message === "Usuário não encontrado") {
        return res.status(404).json({
          error: "Usuário não encontrado",
          message: error.message,
        });
      }

      if (error.message.includes("não é do tipo") || error.message.includes("não está reportado")) {
        return res.status(400).json({
          error: "Operação inválida",
          message: error.message,
        });
      }

      console.error("Erro ao reverter status do usuário:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
        message: "Ocorreu um erro ao reverter o status do usuário.",
      });
    }
  }

  /**
   * Busca detalhes de uma denúncia negada
   * GET /admin/denuncias/:id/negada
   */
  static async getDenunciaNegada(req: Request, res: Response) {
    try {
      const denunciaId = parseInt(req.params.id);

      if (isNaN(denunciaId)) {
        return res.status(400).json({
          error: "ID inválido",
          message: "O ID da denúncia deve ser um número válido.",
        });
      }

      const denuncia = await AdminService.getDenunciaNegada(denunciaId);

      return res.status(200).json(denuncia);
    } catch (error: any) {
      if (error.message === "Denúncia não encontrada") {
        return res.status(404).json({
          error: "Denúncia não encontrada",
          message: error.message,
        });
      }

      if (error.message === "Denúncia não está negada") {
        return res.status(400).json({
          error: "Operação inválida",
          message: error.message,
        });
      }

      console.error("Erro ao buscar denúncia negada:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
        message: "Ocorreu um erro ao buscar a denúncia.",
      });
    }
  }
}
