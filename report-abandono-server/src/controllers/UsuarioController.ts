import { Request, Response } from "express";
import { UsuarioService } from "../services/UsuarioService";

export class UsuarioController {
  /**
   * Atualiza os dados do usuário logado
   * PUT /users/me
   * Requer autenticação (Bearer Token)
   */
  static async update(req: Request, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: "Não autenticado",
          message: "É necessário estar autenticado para atualizar o perfil.",
        });
      }

      const { nomeCompleto, numeroContato, endereco } = req.body;

      // Validar se pelo menos um campo foi fornecido
      if (nomeCompleto === undefined && numeroContato === undefined && endereco === undefined) {
        return res.status(400).json({
          error: "Dados inválidos",
          message: "É necessário fornecer pelo menos um campo para atualizar.",
        });
      }

      // Atualizar usuário
      const usuarioAtualizado = await UsuarioService.update(req.userId, {
        nomeCompleto,
        numeroContato,
        endereco,
      });

      return res.status(200).json({
        message: "Perfil atualizado com sucesso",
        user: usuarioAtualizado,
      });
    } catch (error: any) {
      if (error.message === "Usuário não encontrado") {
        return res.status(404).json({
          error: "Usuário não encontrado",
          message: error.message,
        });
      }

      if (error.message.includes("inativo")) {
        return res.status(400).json({
          error: "Operação não permitida",
          message: error.message,
        });
      }

      console.error("Erro ao atualizar perfil:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
        message: "Ocorreu um erro ao atualizar o perfil. Tente novamente.",
      });
    }
  }

  /**
   * Exclui ou desativa o usuário logado
   * DELETE /users/me
   * Requer autenticação (Bearer Token)
   * Se tiver denúncias: Soft Delete (status = 2)
   * Se não tiver: Hard Delete
   */
  static async delete(req: Request, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: "Não autenticado",
          message: "É necessário estar autenticado para excluir a conta.",
        });
      }

      // Excluir ou desativar usuário
      const result = await UsuarioService.delete(req.userId);

      return res.status(200).json({
        message: result.message,
        deleted: result.deleted,
        denunciasCount: result.denunciasCount,
      });
    } catch (error: any) {
      if (error.message === "Usuário não encontrado") {
        return res.status(404).json({
          error: "Usuário não encontrado",
          message: error.message,
        });
      }

      console.error("Erro ao excluir conta:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
        message: "Ocorreu um erro ao excluir a conta. Tente novamente.",
      });
    }
  }

  /**
   * Busca dados do usuário logado
   * GET /users/me
   * Requer autenticação (Bearer Token)
   */
  static async findMe(req: Request, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: "Não autenticado",
          message: "É necessário estar autenticado para visualizar o perfil.",
        });
      }

      const usuario = await UsuarioService.findById(req.userId);

      return res.status(200).json({
        user: usuario,
      });
    } catch (error: any) {
      if (error.message === "Usuário não encontrado") {
        return res.status(404).json({
          error: "Usuário não encontrado",
          message: error.message,
        });
      }

      console.error("Erro ao buscar perfil:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
        message: "Ocorreu um erro ao buscar o perfil. Tente novamente.",
      });
    }
  }
}
