import useSWR, { SWRConfiguration, SWRResponse } from 'swr';
import { api } from './api';

/**
 * Hook personnalisé pour interroger l'API avec SWR.
 * @param path Le chemin de l'API (ex: '/messages') ou null pour mettre en pause la requête
 * @param options Les options SWR optionnelles
 */
export function useApi<T>(
  path: string | null,
  options?: SWRConfiguration<T>
): SWRResponse<T, any> {
  // Le fetcher utilise notre fonction api.get existante qui gère déjà l'authentification et les erreurs
  const fetcher = (url: string) => api.get<T>(url);

  return useSWR<T>(path, fetcher, {
    // Options par défaut pour SWR
    revalidateOnFocus: true, // Re-fetch quand l'utilisateur revient sur l'onglet
    errorRetryCount: 3,      // Nombre d'essais en cas d'erreur
    ...options,
  });
}
