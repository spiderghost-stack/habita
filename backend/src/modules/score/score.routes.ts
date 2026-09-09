import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as controller from "./score.controller";

const router = Router();
router.use(requireAuth);

router.get("/:propertyId", controller.getScore);

export default router;
