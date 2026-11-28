/** Départ automatique vers le portail de connexion et son anti-boucle. */
import { API_PREFIX } from '@epicademie/shared';
import { safeStorage } from '../../shared/lib/storage.ts';

export const PORTAL_LOGIN_URL = `${API_PREFIX}/auth/portail`;
/** Dernier départ automatique de cet onglet (anti-boucle). */
export const PORTAL_ATTEMPT_KEY = 'epicademie.portail';
const RETRY_MS = 60_000;
/** Déconnexion en cours : les autres onglets ne doivent pas rouvrir une session entre-temps. */
const LEAVING_KEY = 'epicademie.portail.sortie';
const LEAVING_MS = 10_000;

const recent = (value: string | null, ms: number) => Date.now() - Number(value ?? 0) < ms;

/** Vrai si l'on peut partir seul vers le portail ; sans stockage de session, jamais (boucle possible). */
export function claimPortalLogin(): boolean {
  try {
    if (recent(safeStorage.get(LEAVING_KEY), LEAVING_MS)) return false;
    if (recent(sessionStorage.getItem(PORTAL_ATTEMPT_KEY), RETRY_MS)) return false;
    sessionStorage.setItem(PORTAL_ATTEMPT_KEY, String(Date.now()));
    return true;
  } catch {
    return false;
  }
}

/** À appeler avant de se déconnecter : suspend le départ automatique dans tous les onglets. */
export function holdPortalLogin(): void {
  safeStorage.set(LEAVING_KEY, String(Date.now()));
}
