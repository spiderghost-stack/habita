import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as controller from "./issues.controller";

const router = Router();
router.use(requireAuth);

router.get("/", controller.list);
router.patch("/:id", controller.update);

export default router;
