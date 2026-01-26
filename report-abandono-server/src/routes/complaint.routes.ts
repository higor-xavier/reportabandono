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
 * IMPORTANTE: Deve vir antes de /:id para evitar conflito de rotas
 */
router.get("/me", authMiddleware, ComplaintController.listMyComplaints);

/**
 * GET /denuncias/ong
 * Lista denúncias para ONG (atribuídas ou disponíveis)
 * Requer autenticação (Bearer Token) e tipo ONG
 * IMPORTANTE: Deve vir antes de /:id para evitar conflito de rotas
 */
router.get("/ong", authMiddleware, ComplaintController.listForOng);

/**
 * GET /denuncias/ong/:id
 * Busca detalhes de uma denúncia para ONG
 * Requer autenticação (Bearer Token) e tipo ONG
 * IMPORTANTE: Deve vir antes de /:id para evitar conflito de rotas
 */
router.get("/ong/:id", authMiddleware, ComplaintController.findByIdForOng);

/**
 * GET /denuncias/concluidas
 * Lista denúncias concluídas com coordenadas para o mapa
 * Não requer autenticação (público para visualização)
 * IMPORTANTE: Deve vir antes de /:id para evitar conflito de rotas
 */
router.get("/concluidas", ComplaintController.getConcluidas);

/**
 * GET /denuncias/:id
 * Busca uma denúncia completa por ID (para PDF)
 * Requer autenticação (Bearer Token)
 * IMPORTANTE: Rotas com parâmetros dinâmicos devem vir DEPOIS das rotas específicas
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
 * Contesta uma denúncia (altera status de 3 - Concluída para 2 - Negada)
 * Requer autenticação (Bearer Token)
 */
router.post("/:id/contestar", authMiddleware, ComplaintController.contest);

/**
 * PUT /denuncias/:id/abrir
 * Abre uma denúncia (status 0 -> 1 e atribui à ONG)
 * Requer autenticação (Bearer Token) e tipo ONG
 */
router.put("/:id/abrir", authMiddleware, ComplaintController.openComplaint);

/**
 * PUT /denuncias/:id/concluir
 * Conclui uma denúncia (status -> 3 com texto de solução)
 * Requer autenticação (Bearer Token) e tipo ONG
 */
router.put("/:id/concluir", authMiddleware, ComplaintController.concludeComplaint);

/**
 * PUT /denuncias/:id/negar
 * Nega uma denúncia (status -> 2 com justificativa)
 * Requer autenticação (Bearer Token) e tipo ONG
 */
router.put("/:id/negar", authMiddleware, ComplaintController.denyComplaint);

/**
 * POST /denuncias/:id/reportar-usuario
 * Reporta um usuário (muda status do usuário para 2)
 * Requer autenticação (Bearer Token) e tipo ONG
 */
router.post("/:id/reportar-usuario", authMiddleware, ComplaintController.reportUser);

export default router;
