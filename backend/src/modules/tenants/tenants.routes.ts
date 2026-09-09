import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as controller from "./tenants.controller";

const router = Router();
router.use(requireAuth);

router.get("/", controller.listByProperty);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.post("/:id/move-out", controller.moveOut);
router.post("/:id/portal-access", controller.createPortalAccess);

export default router;
