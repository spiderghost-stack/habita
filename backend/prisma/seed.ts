import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

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

  console.log("Seed terminé. Base de données initialisée pour la production.");
  console.log("Connexion admin : admin@habita.app / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
