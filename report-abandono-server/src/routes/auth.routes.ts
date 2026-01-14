import { Router } from "express";
import { AuthController } from "../controllers/AuthController";

const router = Router();

// Rota de registro
router.post("/register", AuthController.register);

export default router;
