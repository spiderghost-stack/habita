import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as authController from "./auth.controller";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", requireAuth, authController.me);
router.patch("/me", requireAuth, authController.updateMe);

export default router;
