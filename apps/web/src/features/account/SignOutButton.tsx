/** Bouton « Se déconnecter » de l'appareil, réservé au parent (code PIN ou mot de passe). */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useSession } from '../../shared/lib/session.ts';
import { GameButton } from '../../shared/ui/game/GameButton.tsx';
import { useToast } from '../../shared/ui/Toast.tsx';
import { authOptions, lockParent, logout, useSetMe } from './api.ts';
import { useParentGate } from './parentGate.ts';
import { holdPortalLogin } from './portalLogin.ts';

/**
 * Le code est redemandé à chaque fois : l'Espace parent est d'abord reverrouillé, puis le serveur
 * refuse la déconnexion tant qu'il n'est pas rouvert. Les progrès restent sur le serveur. Si un
 * portail de connexion protège la plateforme, on en sort aussi.
 */
export function SignOutButton() {
  const navigate = useNavigate();
  const withParent = useParentGate();
  const setMe = useSetMe();
  const selectProfile = useSession((s) => s.selectProfile);
  const [toast, showToast] = useToast(3000);
  const [busy, setBusy] = useState(false);

  const leave = async () => {
    holdPortalLogin();
    await logout();
    const portal = (await authOptions().catch(() => null))?.portalLogoutUrl;
    selectProfile(null);
    setMe(null);
    if (portal) window.location.assign(portal);
    else void navigate('/bienvenue');
  };
  const signOut = async () => {
    setBusy(true);
    try {
      setMe(await lockParent());
      await withParent(leave);
    } catch {
      showToast('Déconnexion impossible : vérifie la connexion.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <GameButton
        variant="surface"
        size="sm"
        aria-label="Se déconnecter"
        title="Se déconnecter"
        disabled={busy}
        onClick={() => void signOut()}
      >
        {/* Porte ouverte et flèche sortante. */}
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="hidden sm:inline">Se déconnecter</span>
      </GameButton>
      {toast}
    </>
  );
}
