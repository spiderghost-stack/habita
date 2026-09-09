import crypto from "node:crypto";

export function isCloudinaryConfigured(): boolean {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

/**
 * Signature pour un upload direct depuis le navigateur vers Cloudinary
 * ("signed upload"), sans jamais exposer CLOUDINARY_API_SECRET côté client.
 * Algorithme documenté par Cloudinary : sha1(paramètres triés + secret).
 * https://cloudinary.com/documentation/upload_images#generating_authentication_signatures
 */
export function generateUploadSignature(params: Record<string, string | number>) {
  const secret = process.env.CLOUDINARY_API_SECRET as string;
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(sorted + secret).digest("hex");
}
