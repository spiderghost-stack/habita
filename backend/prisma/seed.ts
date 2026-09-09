import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const owner = await prisma.user.upsert({
    where: { email: "demo@habita.app" },
    update: {},
    create: {
      name: "Roesnay Propriétaire",
      email: "demo@habita.app",
      passwordHash,
      role: "OWNER",
      plan: "BUSINESS", // plan le plus large pour que toutes les fonctionnalités soient testables sur le compte de démo
      phone: "+229 90 00 00 00",
    },
  });

  const property = await prisma.property.create({
    data: {
      ownerId: owner.id,
      name: "Villa Agontikon",
      address: "Cotonou",
      description: "Villa à 3 unités près du carrefour Agontikon",
      potentialIncome: 450000,
    },
  });

  const unitA = await prisma.unit.create({
    data: { propertyId: property.id, identifier: "Appartement A", type: "Appartement", rentAmount: 150000, status: "OCCUPIED", occupiedSince: new Date() },
  });
  await prisma.unit.create({
    data: { propertyId: property.id, identifier: "Appartement B", type: "Appartement", rentAmount: 150000, status: "OCCUPIED", occupiedSince: new Date() },
  });
  await prisma.unit.create({
    data: { propertyId: property.id, identifier: "Appartement C", type: "Appartement", rentAmount: 150000, status: "AVAILABLE" },
  });

  const tenant = await prisma.tenant.create({
    data: {
      propertyId: property.id,
      unitId: unitA.id,
      firstName: "Jean",
      lastName: "Dupont",
      phone: "+229 91 11 11 11",
      rentAmount: 150000,
      dueDay: 5,
    },
  });

  const period = new Date().toISOString().slice(0, 7);
  await prisma.payment.create({
    data: {
      tenantId: tenant.id,
      propertyId: property.id,
      amount: 150000,
      period,
      method: "MOBILE_MONEY",
      receiptNumber: `HBT-${new Date().getFullYear()}-SEED01`,
      recordedById: owner.id,
    },
  });

  await prisma.expense.create({
    data: {
      propertyId: property.id,
      label: "Réparation plomberie",
      amount: 25000,
      category: "Entretien",
      recordedById: owner.id,
    },
  });

  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);
  await prisma.contract.create({
    data: {
      propertyId: property.id,
      tenantId: tenant.id,
      startDate,
      endDate,
      rentAmount: 150000,
      deposit: 300000,
      conditions: "Contrat renouvelable par tacite reconduction, préavis de 2 mois.",
      recordedById: owner.id,
    },
  });

  const tenantUser = await prisma.user.upsert({
    where: { email: "jean.dupont@habita.app" },
    update: {},
    create: {
      name: "Jean Dupont",
      email: "jean.dupont@habita.app",
      passwordHash,
      role: "TENANT",
    },
  });
  await prisma.tenant.update({ where: { id: tenant.id }, data: { userId: tenantUser.id, email: "jean.dupont@habita.app" } });

  const managerUser = await prisma.user.upsert({
    where: { email: "gestionnaire@habita.app" },
    update: {},
    create: {
      name: "Aïcha Gestionnaire",
      email: "gestionnaire@habita.app",
      passwordHash,
      role: "MANAGER",
    },
  });
  await prisma.propertyManager.upsert({
    where: { propertyId_managerId: { propertyId: property.id, managerId: managerUser.id } },
    update: {},
    create: { propertyId: property.id, managerId: managerUser.id },
  });

  await prisma.issue.create({
    data: {
      propertyId: property.id,
      tenantId: tenant.id,
      category: "Plomberie",
      description: "La fuite d'eau dans la cuisine est importante.",
      status: "OPEN",
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@habita.app" },
    update: {},
    create: {
      name: "Admin HaBiTa",
      email: "admin@habita.app",
      passwordHash,
      role: "ADMIN",
    },
  });

  const conversation = await prisma.conversation.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: { tenantId: tenant.id },
  });
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: tenantUser.id,
      senderRole: "TENANT",
      body: "Bonjour, à quelle heure puis-je passer récupérer mon reçu de paiement ?",
    },
  });
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: owner.id,
      senderRole: "OWNER",
      body: "Bonjour Jean, vous pouvez le télécharger directement depuis votre espace, section Historique des paiements.",
    },
  });

  console.log("Seed terminé.");
  console.log("Connexion propriétaire démo : demo@habita.app / password123");
  console.log("Connexion locataire démo : jean.dupont@habita.app / password123");
  console.log("Connexion gestionnaire démo : gestionnaire@habita.app / password123");
  console.log("Connexion admin démo : admin@habita.app / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
