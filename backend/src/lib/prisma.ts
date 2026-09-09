import { PrismaClient } from "@prisma/client";

// En dev, tsx watch recharge le module à chaque changement : sans cette astuce,
// chaque rechargement ouvrirait une nouvelle connexion Prisma et finirait par
// épuiser le pool de connexions Postgres.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV === "development") {
  global.__prisma = prisma;
}
