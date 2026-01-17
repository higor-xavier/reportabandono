import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Estender a interface Request do Express para incluir userId e userType
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userType?: string;
    }
  }
}

/**
 * Middleware de autenticação que verifica o Bearer Token no header
 * Se válido, adiciona userId e userType na requisição
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Obter o token do header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Token não fornecido",
        message: "É necessário fornecer um token de autenticação.",
      });
    }

    // Verificar se o header está no formato "Bearer <token>"
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        error: "Token inválido",
        message: "O token deve estar no formato 'Bearer <token>'.",
      });
    }

    const token = parts[1];

    // Verificar e decodificar o token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET não configurado");
      return res.status(500).json({
        error: "Erro interno do servidor",
        message: "Configuração de autenticação inválida.",
      });
    }

    // Decodificar o token
    const decoded = jwt.verify(token, jwtSecret) as {
      id: number;
      email: string;
      tipoUsuario: string;
    };

    // Adicionar informações do usuário na requisição
    req.userId = decoded.id;
    req.userType = decoded.tipoUsuario;

    // Continuar para o próximo middleware/controller
    next();
  } catch (error: any) {
    // Token inválido ou expirado
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Token inválido",
        message: "O token fornecido é inválido.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expirado",
        message: "O token fornecido expirou. Faça login novamente.",
      });
    }

    // Outros erros
    console.error("Erro no middleware de autenticação:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      message: "Ocorreu um erro ao processar a autenticação.",
    });
  }
}
