import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";

export class AuthController {
  /**
   * Registra um novo usuário
   * POST /auth/register
   */
  static async register(req: Request, res: Response) {
    try {
      const { userType, ...data } = req.body;

      // Validação básica
      if (!userType || (userType !== "COMUM" && userType !== "ONG")) {
        return res.status(400).json({
          error: "Tipo de usuário inválido",
          message: "O tipo de usuário deve ser 'COMUM' ou 'ONG'",
        });
      }

      // Chamar o service
      const newUser = await AuthService.register(data, userType);

      // Retornar sucesso (201 Created)
      return res.status(201).json({
        message: "Usuário registrado com sucesso",
        user: newUser,
      });
    } catch (error: any) {
      // E-mail duplicado
      if (error.message === "E-mail já está em uso") {
        return res.status(409).json({
          error: "E-mail já cadastrado",
          message: error.message,
        });
      }

      // Erros de validação
      if (
        error.message.includes("obrigatório") ||
        error.message.includes("obrigatória")
      ) {
        return res.status(400).json({
          error: "Dados inválidos",
          message: error.message,
        });
      }

      // Erro interno do servidor
      console.error("Erro ao registrar usuário:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
        message: "Ocorreu um erro ao processar o cadastro. Tente novamente.",
      });
    }
  }
}
