import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as controller from "./notifications.controller";
import * as pushController from "./push.controller";

const router = Router();

// Route non authentifiée par JWT (protégée par CRON_SECRET) : doit être
// déclarée avant le router.use(requireAuth) ci-dessous.
router.post("/run-global", controller.runGlobal);

router.use(requireAuth);
router.post("/run-mine", controller.runForCurrentUser);
router.post("/subscribe", pushController.subscribe);
router.post("/unsubscribe", pushController.unsubscribe);

export default router;
