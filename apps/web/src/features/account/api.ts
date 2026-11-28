import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  api,
  API_PREFIX,
  type FamilyDelete,
  type Login,
  type Me,
  type Signup,
  type StudentSignup,
} from '@epicademie/shared';
import { ApiError, request } from '../../shared/api/client.ts';
import { useSession } from '../../shared/lib/session.ts';
import { announceSession, dropFamilyData, followSession, meKey } from './sessionCache.ts';

/**
 * Demande la session au serveur et met le cache en accord : famille changée ailleurs, verrou parent
 * expiré, ou session finie (401), qui retire les données de la famille et le profil choisi.
 */
async function fetchMe(qc: QueryClient): Promise<Me> {
  try {
    const me = await request(api.me);
    const previous = qc.getQueryData<Me>(meKey);
    if (previous && previous.family.id !== me.family.id) useSession.setState({ profileId: null });
    followSession(qc, previous, me);
    return me;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      dropFamilyData(qc);
      if (qc.getQueryData(meKey)) {
        useSession.getState().selectProfile(null);
        announceSession('');
      }
    }
    throw err;
  }
}

/** Session de l'appareil : compte connecté (401 si aucun, jamais retenté). */
export const useMe = () =>
  useQuery({ queryKey: meKey, queryFn: ({ client }) => fetchMe(client), retry: false, staleTime: 60_000 });

export const signup = (input: Signup) => request(api.signup, { body: input });
export const verifyEmail = (token: string, password: string) => request(api.verifyEmail, { body: { token, password } });
export const resendVerification = (email: string) => request(api.resendVerification, { body: { email } });
/** Page de départ de « Continuer avec Google » (redirection du navigateur, hors appel JSON). */
export const GOOGLE_START_URL = `${API_PREFIX}/auth/google/start`;
/** Réglages du serveur : bouton Google (si configuré), longueur du mot de passe, plateforme de test. */
export const authOptions = () => request(api.authOptions);
export const useAuthOptions = () =>
  useQuery({ queryKey: ['auth-options'], queryFn: () => authOptions(), retry: false, staleTime: Infinity });
export const login = (input: Login) => request(api.login, { body: input });
export const signupStudent = (input: StudentSignup) => request(api.signupStudent, { body: input });
export const recoverStudent = (code: string) => request(api.recoverStudent, { body: { code } });
export const renewStudentRecovery = () => request(api.renewStudentRecovery);
export const createInvite = () => request(api.createInvite);
export const joinFamily = (code: string) => request(api.joinFamily, { body: { code } });
export const logout = () => request(api.logout);
export const confirmParent = (password: string) => request(api.confirmParent, { body: { password } });
export const unlockParentPin = (pin: string) => request(api.unlockParentPin, { body: { pin } });
export const setParentPin = (password: string, pin: string) => request(api.setParentPin, { body: { password, pin } });
/** Premier code d'un compte sans mot de passe (portail). */
export const chooseParentPin = (pin: string) => request(api.setParentPin, { body: { pin } });
export const exportFamily = () => request(api.exportFamily);
export const deleteFamily = (input: FamilyDelete) => request(api.deleteFamily, { body: input });
export const lockParent = () => request(api.lockParent);
export const forgotPassword = (email: string) => request(api.forgotPassword, { body: { email } });
export const resetPassword = (token: string, password: string) =>
  request(api.resetPassword, { body: { token, password } });

/**
 * Met à jour la session en cache après connexion, inscription, (dé)verrouillage parent ou
 * déconnexion. Le cache dure tant que la page est ouverte : une autre famille (ou aucune) repart sans
 * rien de la précédente.
 */
export function useSetMe() {
  const qc = useQueryClient();
  return (me: Me | null) => {
    if (!me) {
      qc.removeQueries();
      announceSession('');
      return;
    }
    const previous = qc.getQueryData<Me>(meKey);
    if (previous && previous.family.id !== me.family.id) useSession.getState().selectProfile(null);
    followSession(qc, previous, me);
    qc.setQueryData(meKey, me);
  };
}
