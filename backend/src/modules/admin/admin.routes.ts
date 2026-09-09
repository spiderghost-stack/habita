import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as controller from "./admin.controller";

const router = Router();
router.use(requireAuth, requireRole("ADMIN"));

router.get("/users", controller.listUsers);
router.patch("/users/:id", controller.updateUser);

export default router;
