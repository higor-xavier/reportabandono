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

export default router;
