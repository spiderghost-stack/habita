import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: string;
  role: "OWNER" | "MANAGER" | "ADMIN";
}

const SECRET = process.env.JWT_SECRET as string;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!SECRET) {
  // On échoue tôt et bruyamment plutôt que de signer des tokens avec "undefined".
  throw new Error("JWT_SECRET manquant dans les variables d'environnement");
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
