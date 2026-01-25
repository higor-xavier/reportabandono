import { Router } from "express";
import { AdminController } from "../controllers/AdminController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// Todas as rotas de admin requerem autenticação
// TODO: Adicionar middleware para verificar se o usuário é ADMIN
router.use(authMiddleware);

// GET /admin/solicitacoes - Lista todas as solicitações pendentes
router.get("/solicitacoes", AdminController.getSolicitacoes);

// PUT /admin/ongs/:id/aprovar - Aprova uma ONG
router.put("/ongs/:id/aprovar", AdminController.aprovarOng);

// PUT /admin/ongs/:id/reprovar - Reprova uma ONG
router.put("/ongs/:id/reprovar", AdminController.reprovarOng);

// PUT /admin/usuarios/:id/banir - Confirma banimento de usuário
router.put("/usuarios/:id/banir", AdminController.confirmarBanimento);

// PUT /admin/usuarios/:id/reverter - Reverte status de usuário reportado
router.put("/usuarios/:id/reverter", AdminController.reverterStatusUsuario);

// GET /admin/denuncias/:id/negada - Busca detalhes de denúncia negada
router.get("/denuncias/:id/negada", AdminController.getDenunciaNegada);

export default router;
