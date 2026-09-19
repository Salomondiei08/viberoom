export class RequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
/** A timeout keeps every form recoverable when the network stops responding. */
export async function requestJson(url: string, options: RequestInit = {}): Promise<unknown> {
  try {
    const response = await fetch(url, { ...options, cache: "no-store", signal: AbortSignal.timeout(15000) });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new RequestError(data?.error || "Le service est indisponible. Réessaie dans un instant.", response.status);
    if (!data) throw new Error("Réponse inattendue du serveur. Réessaie.");
    return data;
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new Error("Connexion interrompue. Vérifie ta connexion puis réessaie.");
  }
}
