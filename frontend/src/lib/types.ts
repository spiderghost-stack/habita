export interface PropertyManagerAssignment {
  id: string;
  managerId: string;
  manager: { id: string; name: string; email: string };
}

export interface Property {
  id: string;
  name: string;
  address: string;
  description?: string | null;
  potentialIncome?: string | null;
  status: "ACTIVE" | "ARCHIVED";
  units?: Unit[];
  tenants?: Tenant[];
  _count?: { units: number; tenants: number };
  owner?: { name: string };
  managers?: PropertyManagerAssignment[];
}

export interface Unit {
  id: string;
  propertyId: string;
  identifier: string;
  type?: string | null;
  rentAmount: string;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
}

export interface Tenant {
  id: string;
  propertyId: string;
  unitId?: string | null;
  unit?: Unit | null;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  rentAmount: string;
  dueDay: number;
  status: "UP_TO_DATE" | "DUE_SOON" | "LATE";
  payments?: Payment[];
  userId?: string | null;
}

export interface Payment {
  id: string;
  tenantId: string;
  propertyId: string;
  amount: string;
  period: string;
  paymentDate: string;
  method: "CASH" | "BANK_TRANSFER" | "MOBILE_MONEY" | "CHECK" | "OTHER";
  comment?: string | null;
  receiptNumber: string;
}

export interface Issue {
  id: string;
  propertyId: string;
  property?: { name: string };
  tenantId: string;
  tenant?: Tenant;
  category: string;
  description: string;
  photoUrl?: string | null;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  response?: string | null;
  assignedProvider?: string | null;
  createdAt: string;
}

export interface Contract {
  id: string;
  propertyId: string;
  property?: { name: string };
  tenantId: string;
  tenant?: Tenant;
  startDate: string;
  endDate: string;
  rentAmount: string;
  deposit?: string | null;
  conditions?: string | null;
  documentsNote?: string | null;
  status: "ACTIVE" | "TERMINATED" | "EXPIRED";
  daysUntilExpiry?: number;
  expiringSoon?: boolean;
}

export type Plan = "FREE" | "STARTER" | "PRO" | "BUSINESS";

export interface ConversationSummary {
  tenantId: string;
  tenantName: string;
  propertyName: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: "OWNER" | "MANAGER" | "ADMIN" | "TENANT";
  body: string;
  readAt?: string | null;
  createdAt: string;
  sender?: { name: string; role: string };
}

export interface PropertyReportRow {
  propertyId: string;
  propertyName: string;
  rentExpected: number;
  rentCollected: number;
  rentOutstanding: number;
  totalExpenses: number;
  netIncome: number;
  occupancyRate: number;
  newTenants: number;
}

export interface MonthlyReport {
  period: string;
  properties: PropertyReportRow[];
  totals: Omit<PropertyReportRow, "propertyId" | "propertyName">;
}

export interface ManagementScore {
  score: number;
  breakdown: Record<string, number>;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MANAGER" | "ADMIN" | "TENANT";
  plan: Plan;
  createdAt: string;
  _count: { properties: number };
}

export interface Expense {
  id: string;
  propertyId: string;
  property?: { name: string };
  label: string;
  amount: string;
  category?: string | null;
  expenseDate: string;
  comment?: string | null;
}

export interface DashboardSummary {
  period: string;
  properties: number;
  units: number;
  tenants: number;
  occupancyRate: number;
  rentExpected: number;
  rentCollected: number;
  rentOutstanding: number;
  totalExpenses: number;
  netIncome: number;
  lateCount: number;
  lateTenants: Array<{ id: string; name: string; unit: string | null; rentAmount: number; dueDay: number }>;
}
