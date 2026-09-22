import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD || "password123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "spiderghost612@gmail.com" },
    update: { passwordHash },
    create: {
      name: "Admin HaBiTa",
      email: "spiderghost612@gmail.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Seed terminé. Base de données initialisée pour la production.");
  console.log("Connexion admin : spiderghost612@gmail.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
