import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '../../testing/renderApp.tsx';
import { PORTAL_ATTEMPT_KEY, PORTAL_LOGIN_URL } from './portalLogin.ts';

vi.mock('socket.io-client', async () => (await import('../../testing/fakeSocket.ts')).socketModule);

/** Connexion directe par le portail placé devant la plateforme (recette). */
const portal = { recette: true, portalLogin: true, loggedIn: false } as const;
const assign = vi.fn();
const login = () => screen.findByRole('heading', { name: 'Connexion' });

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  assign.mockClear();
  const { href, origin } = window.location;
  vi.stubGlobal('location', { href, origin, assign });
});
afterEach(() => vi.unstubAllGlobals());

describe('portail de connexion', () => {
  it('sans session : départ direct vers le portail, sans écran de connexion', async () => {
    renderApp('/hub', portal);
    await waitFor(() => expect(assign).toHaveBeenCalledWith(PORTAL_LOGIN_URL));
    expect(screen.queryByRole('heading', { name: 'Connexion' })).not.toBeInTheDocument();
  });

  it('anti-boucle : tentative de moins de 60 s, écran de connexion normal ; plus ancienne, on repart', async () => {
    sessionStorage.setItem(PORTAL_ATTEMPT_KEY, String(Date.now() - 30_000));
    const view = renderApp('/', portal);
    expect(await login()).toBeInTheDocument();
    expect(assign).not.toHaveBeenCalled();
    view.unmount();
    sessionStorage.setItem(PORTAL_ATTEMPT_KEY, String(Date.now() - 61_000));
    renderApp('/', portal);
    await waitFor(() => expect(assign).toHaveBeenCalledTimes(1));
  });

  it('sans portail annoncé, ou déjà connecté : aucun départ', async () => {
    const view = renderApp('/', { recette: true, loggedIn: false });
    expect(await login()).toBeInTheDocument();
    view.unmount();
    renderApp('/connexion', { ...portal, loggedIn: true });
    expect(await login()).toBeInTheDocument();
    expect(assign).not.toHaveBeenCalled();
  });

  it('compte sans secret parent : « Se déconnecter » mène à la déconnexion du portail, sans retour automatique', async () => {
    const portalLogoutUrl = 'https://portail.test/logout';
    const { user } = renderApp('/parametres', { ...portal, loggedIn: true, freeSignOut: true, portalLogoutUrl });
    await user.click(await screen.findByRole('button', { name: 'Se déconnecter' }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith(portalLogoutUrl));
    expect(screen.queryByRole('dialog', { name: 'Espace parent' })).not.toBeInTheDocument();
    expect(await login()).toBeInTheDocument();
    expect(assign).not.toHaveBeenCalledWith(PORTAL_LOGIN_URL);
  });
});
