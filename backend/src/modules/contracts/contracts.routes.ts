import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as controller from "./contracts.controller";

const router = Router();
router.use(requireAuth);

router.get("/", controller.list);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.post("/:id/renew", controller.renew);
router.post("/:id/terminate", controller.terminate);

export default router;
