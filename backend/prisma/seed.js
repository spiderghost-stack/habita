"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const adminPassword = process.env.ADMIN_PASSWORD || "password123";
    const passwordHash = await bcryptjs_1.default.hash(adminPassword, 10);
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
