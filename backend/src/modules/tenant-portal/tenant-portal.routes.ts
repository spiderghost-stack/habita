import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as controller from "./tenant-portal.controller";

const router = Router();
router.use(requireAuth, requireRole("TENANT"));

router.get("/me", controller.me);
router.get("/payments", controller.payments);
router.get("/issues", controller.listIssues);
router.post("/issues", controller.createIssue);
router.get("/messages", controller.getMessages);
router.post("/messages", controller.sendMessage);

export default router;
