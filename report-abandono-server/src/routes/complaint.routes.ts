import { Router } from "express";
import { ComplaintController } from "../controllers/ComplaintController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { uploadMiddleware } from "../middlewares/uploadMiddleware";

const router = Router();

/**
 * POST /denuncias
 * Cria uma nova denúncia com mídias
 * Requer autenticação (Bearer Token)
 * Aceita multipart/form-data com arquivos
 */
router.post(
  "/",
  authMiddleware, // Middleware de autenticação
  uploadMiddleware.array("mediaFiles", 10), // Middleware de upload (máximo 10 arquivos)
  ComplaintController.create
);

/**
 * GET /denuncias/me
 * Lista todas as denúncias do usuário logado
 * Requer autenticação (Bearer Token)
 */
router.get("/me", authMiddleware, ComplaintController.listMyComplaints);

/**
 * GET /denuncias/:id
 * Busca uma denúncia completa por ID (para PDF)
 * Requer autenticação (Bearer Token)
 */
router.get("/:id", authMiddleware, ComplaintController.findById);

/**
 * DELETE /denuncias/:id
 * Deleta uma denúncia (apenas se status = 0)
 * Requer autenticação (Bearer Token)
 */
router.delete("/:id", authMiddleware, ComplaintController.delete);

/**
 * POST /denuncias/:id/contestar
 * Contesta uma denúncia (altera status para 3)
 * Requer autenticação (Bearer Token)
 */
router.post("/:id/contestar", authMiddleware, ComplaintController.contest);

export default router;
