import { Request, Response } from "express";
import { ApiError } from "../../middleware/errorHandler";
import { generateUploadSignature, isCloudinaryConfigured } from "../../lib/cloudinary";

export async function getSignature(req: Request, res: Response) {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(
      503,
      "L'upload de fichiers n'est pas configuré sur ce serveur (Cloudinary absent). Voir MANUAL_STEPS.md."
    );
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "habita";
  const signature = generateUploadSignature({ folder, timestamp });

  res.json({
    signature,
    timestamp,
    folder,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  });
}
