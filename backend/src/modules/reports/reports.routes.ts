import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as controller from "./reports.controller";

const router = Router();
router.use(requireAuth);

router.get("/monthly", controller.getReport);
router.get("/monthly.csv", controller.downloadCsv);
router.post("/monthly/send", controller.sendByEmail);

export default router;
