import { Router } from "express";
import { UsuarioController } from "../controllers/UsuarioController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

/**
 * GET /users/me
 * Busca dados do usuário logado
 * Requer autenticação (Bearer Token)
 */
router.get("/me", authMiddleware, UsuarioController.findMe);

/**
 * PUT /users/me
 * Atualiza dados do usuário logado (nome, telefone, endereço)
 * Requer autenticação (Bearer Token)
 */
router.put("/me", authMiddleware, UsuarioController.update);

/**
 * DELETE /users/me
 * Exclui ou desativa o usuário logado
 * Requer autenticação (Bearer Token)
 * Se tiver denúncias: Soft Delete (status = 2)
 * Se não tiver: Hard Delete
 */
router.delete("/me", authMiddleware, UsuarioController.delete);

export default router;
