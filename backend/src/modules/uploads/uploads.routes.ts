import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as controller from "./uploads.controller";

const router = Router();
router.use(requireAuth);

router.get("/signature", controller.getSignature);

export default router;
