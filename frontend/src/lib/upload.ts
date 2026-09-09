import { api, ApiError } from "./api";

interface SignatureResponse {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
}

/**
 * Upload direct navigateur → Cloudinary. Demande d'abord une signature au
 * backend (qui seul connaît CLOUDINARY_API_SECRET), puis envoie le fichier
 * directement à Cloudinary — le fichier ne transite jamais par le serveur
 * HaBiTa. Si Cloudinary n'est pas configuré côté serveur, l'appel à
 * /uploads/signature échoue avec un message clair (voir MANUAL_STEPS.md).
 */
export async function uploadImage(file: File): Promise<string> {
  const sig = await api.get<SignatureResponse>("/uploads/signature");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sig.apiKey);
  formData.append("timestamp", String(sig.timestamp));
  formData.append("signature", sig.signature);
  formData.append("folder", sig.folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new ApiError(res.status, "Échec de l'envoi du fichier vers Cloudinary.");
  }

  const data = await res.json();
  return data.secure_url as string;
}
