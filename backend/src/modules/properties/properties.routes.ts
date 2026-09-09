import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as controller from "./properties.controller";
import * as managersController from "./managers.controller";

const router = Router();
router.use(requireAuth);

router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);
router.post("/:id/managers", managersController.assign);
router.delete("/:id/managers/:managerId", managersController.unassign);

export default router;
