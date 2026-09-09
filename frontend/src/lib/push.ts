import { api } from "./api";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPushNotifications() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Les notifications push ne sont pas supportées par ce navigateur.");
    return false;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.warn("VAPID_PUBLIC_KEY manquante, impossible de s'abonner aux notifications.");
    return false;
  }

  try {
    // Si l'utilisateur a bloqué les notifications, on arrête
    if (Notification.permission === "denied") return false;

    // L'enregistrement du service worker
    const registration = await navigator.serviceWorker.register("/sw.js");

    // L'abonnement aux notifications (demande la permission si 'default')
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // Envoi de l'abonnement au backend
    await api.post("/notifications/subscribe", {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.toJSON().keys?.p256dh,
        auth: subscription.toJSON().keys?.auth,
      },
    });

    return true;
  } catch (error) {
    console.error("Erreur lors de l'abonnement aux notifications :", error);
    return false;
  }
}
