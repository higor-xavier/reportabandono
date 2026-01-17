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

  /**
   * Autentica um usuário e retorna um token JWT
   * POST /auth/login
   */
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Validação básica
      if (!email || !password) {
        return res.status(400).json({
          error: "Dados inválidos",
          message: "E-mail e senha são obrigatórios",
        });
      }

      // Chamar o service
      const result = await AuthService.login(email, password);

      // Retornar sucesso (200 OK) com token e dados do usuário
      return res.status(200).json({
        message: "Login realizado com sucesso",
        token: result.token,
        user: result.user,
      });
    } catch (error: any) {
      // Credenciais inválidas
      if (error.message === "Credenciais inválidas") {
        return res.status(401).json({
          error: "Credenciais inválidas",
          message: "O e-mail ou senha informados estão incorretos.",
        });
      }

      // Cadastro em análise (ONG pendente/negada)
      if (error.message === "Seu cadastro ainda está em análise") {
        return res.status(403).json({
          error: "Cadastro em análise",
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
      console.error("Erro ao fazer login:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
        message: "Ocorreu um erro ao processar o login. Tente novamente.",
      });
    }
  }
}
