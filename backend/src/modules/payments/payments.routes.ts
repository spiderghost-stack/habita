import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as controller from "./payments.controller";

const router = Router();
router.use(requireAuth);

router.post("/", controller.create);
router.get("/", controller.listRecent);
router.get("/tenant/:tenantId", controller.listByTenant);
router.get("/:id/receipt.pdf", controller.downloadReceiptPdf);
router.get("/:id", controller.getReceipt);

export default router;
