import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as controller from "./messaging.controller";

const router = Router();
router.use(requireAuth);

router.get("/conversations", controller.listConversations);
router.get("/conversations/:tenantId/messages", controller.getMessages);
router.post("/conversations/:tenantId/messages", controller.sendMessage);

export default router;
