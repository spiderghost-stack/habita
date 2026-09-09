import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import propertiesRoutes from "../modules/properties/properties.routes";
import unitsRoutes from "../modules/units/units.routes";
import tenantsRoutes from "../modules/tenants/tenants.routes";
import paymentsRoutes from "../modules/payments/payments.routes";
import expensesRoutes from "../modules/expenses/expenses.routes";
import contractsRoutes from "../modules/contracts/contracts.routes";
import tenantPortalRoutes from "../modules/tenant-portal/tenant-portal.routes";
import notificationsRoutes from "../modules/notifications/notifications.routes";
import issuesRoutes from "../modules/issues/issues.routes";
import scoreRoutes from "../modules/score/score.routes";
import reportsRoutes from "../modules/reports/reports.routes";
import uploadsRoutes from "../modules/uploads/uploads.routes";
import adminRoutes from "../modules/admin/admin.routes";
import messagingRoutes from "../modules/messaging/messaging.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/properties", propertiesRoutes);
router.use("/units", unitsRoutes);
router.use("/tenants", tenantsRoutes);
router.use("/payments", paymentsRoutes);
router.use("/expenses", expensesRoutes);
router.use("/contracts", contractsRoutes);
router.use("/tenant-portal", tenantPortalRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/issues", issuesRoutes);
router.use("/score", scoreRoutes);
router.use("/reports", reportsRoutes);
router.use("/uploads", uploadsRoutes);
router.use("/admin", adminRoutes);
router.use("/messaging", messagingRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
