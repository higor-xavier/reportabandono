import { Router } from "express";
import { AuthController } from "../controllers/AuthController";

const router = Router();

// Rota de registro
router.post("/register", AuthController.register);

// Rota de login
router.post("/login", AuthController.login);

export default router;
