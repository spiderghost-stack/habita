import { prisma } from "./prisma";
import { ApiError } from "../middleware/errorHandler";

/**
 * Vérifie qu'une propriété existe et que l'utilisateur courant a le droit d'y
 * accéder. Un ADMIN voit tout ; un OWNER ne voit que ses propres biens ; un
 * MANAGER voit les biens qui lui ont été explicitement assignés (table
 * PropertyManager), quel que soit leur propriétaire — c'est le cas d'usage
 * central de la section 19 du cahier des charges.
 */
export async function assertPropertyAccess(propertyId: string, user: { userId: string; role: string }) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) {
    throw new ApiError(404, "Propriété introuvable.");
  }

  if (user.role === "ADMIN") return property;
  if (user.role === "OWNER" && property.ownerId === user.userId) return property;

  if (user.role === "MANAGER") {
    const assignment = await prisma.propertyManager.findUnique({
      where: { propertyId_managerId: { propertyId, managerId: user.userId } },
    });
    if (assignment) return property;
  }

  throw new ApiError(403, "Vous n'avez pas accès à cette propriété.");
}

/**
 * Filtre Prisma `where` pour lister les propriétés visibles par l'utilisateur
 * courant. Pour un gestionnaire, on ne peut pas exprimer "assigné via la
 * table de liaison" avec un simple champ scalaire comme pour `ownerId` — le
 * filtre passe par la relation `managers`.
 */
export function ownerFilter(user: { userId: string; role: string }) {
  if (user.role === "ADMIN") return {};
  if (user.role === "MANAGER") return { managers: { some: { managerId: user.userId } } };
  return { ownerId: user.userId };
}

/** Un gestionnaire ne modifie que les unités/locataires/paiements d'une
 * propriété, jamais la fiche de la propriété elle-même (nom, adresse,
 * suppression) — celle-ci reste sous le contrôle exclusif de son
 * propriétaire (ou d'un admin). */
export function assertPropertyOwnerOrAdmin(property: { ownerId: string }, user: { userId: string; role: string }) {
  if (user.role === "ADMIN") return;
  if (user.role === "OWNER" && property.ownerId === user.userId) return;
  throw new ApiError(403, "Seul le propriétaire de ce bien peut effectuer cette action.");
}
