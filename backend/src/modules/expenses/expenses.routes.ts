import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as controller from "./expenses.controller";

const router = Router();
router.use(requireAuth);

router.get("/", controller.list);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
