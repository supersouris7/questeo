/**
 * Portail de connexion placé devant la plateforme (recette) : la personne qu'il a authentifiée entre
 * directement dans son compte, sans écran de connexion.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { ApiError } from '../../shared/api/client.ts';
import { ScreenSkeleton } from '../../shared/ui/Skeleton.tsx';
import { useAuthOptions, useMe } from './api.ts';
import { claimPortalLogin, PORTAL_LOGIN_URL } from './portalLogin.ts';

/** Écran de connexion : remplacé par le départ vers le portail s'il est annoncé et sans session. */
export function PortalSignIn({ children }: { readonly children: ReactNode }) {
  const { data, isPending } = useAuthOptions();
  if (isPending) return <ScreenSkeleton />;
  return data?.portalLogin ? <NoSession>{children}</NoSession> : children;
}

function NoSession({ children }: { readonly children: ReactNode }) {
  const { error, isPending } = useMe();
  if (isPending) return <ScreenSkeleton />;
  return error instanceof ApiError && error.status === 401 ? <Leave>{children}</Leave> : children;
}

/** Après une tentative récente (échec), l'écran de connexion normal s'affiche. */
function Leave({ children }: { readonly children: ReactNode }) {
  const [leaving] = useState(claimPortalLogin);
  useEffect(() => {
    if (leaving) window.location.assign(PORTAL_LOGIN_URL);
  }, [leaving]);
  return leaving ? <ScreenSkeleton /> : children;
}
