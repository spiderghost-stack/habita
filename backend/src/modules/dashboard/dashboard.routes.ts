import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as controller from "./dashboard.controller";

const router = Router();
router.use(requireAuth);

router.get("/summary", controller.summary);

export default router;
