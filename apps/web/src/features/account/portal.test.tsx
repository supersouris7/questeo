import { screen, waitFor, within } from '@testing-library/react';
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

  it('refus du portail : message clair, sans nouveau départ', async () => {
    renderApp('/connexion?erreur=portail-compte', portal);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Un compte existe déjà avec cette adresse : connecte-toi avec ton mot de passe.',
    );
    expect(assign).not.toHaveBeenCalled();
  });

  it('1re connexion : le code parent est demandé avant la création du profil, sans mot de passe', async () => {
    const { user } = renderApp('/profils/nouveau', { ...portal, loggedIn: true, noPassword: true });
    const code = await screen.findByLabelText('Code parent (4 chiffres)');
    expect(screen.queryByLabelText(/mot de passe/i)).not.toBeInTheDocument();
    const save = screen.getByRole('button', { name: 'Enregistrer le code' });
    await user.type(code, '4821');
    await user.type(screen.getByLabelText('Répétez le code'), '4822');
    await user.click(save);
    expect(await screen.findByRole('alert')).toHaveTextContent('Les deux codes sont différents.');
    await user.clear(screen.getByLabelText('Répétez le code'));
    await user.type(screen.getByLabelText('Répétez le code'), '4821');
    await user.click(save);
    await waitFor(() => expect(screen.queryByLabelText('Répétez le code')).not.toBeInTheDocument());
    expect(await screen.findByLabelText('Date de naissance')).toBeInTheDocument();
  });

  it('1re connexion, Espace parent refermé : repasser par le portail', async () => {
    renderApp('/', { ...portal, loggedIn: true, noPassword: true, parent: false });
    expect(await screen.findByRole('link', { name: 'Me reconnecter' })).toHaveAttribute('href', PORTAL_LOGIN_URL);
    expect(screen.queryByLabelText('Code parent (4 chiffres)')).not.toBeInTheDocument();
  });

  it('« Se déconnecter » exige le code parent, puis mène à la déconnexion du portail, sans retour', async () => {
    const portalLogoutUrl = 'https://portail.test/logout';
    const options = { ...portal, loggedIn: true, noPassword: true, pin: '4821', portalLogoutUrl };
    const { user } = renderApp('/parametres', options);
    await user.click(await screen.findByRole('button', { name: 'Se déconnecter' }));
    const dialog = await screen.findByRole('dialog', { name: 'Espace parent' });
    expect(assign).not.toHaveBeenCalled();
    expect(within(dialog).queryByRole('button', { name: /mot de passe/ })).not.toBeInTheDocument();
    for (const digit of '4821') await user.click(within(dialog).getByRole('button', { name: digit }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith(portalLogoutUrl));
    expect(await login()).toBeInTheDocument();
    expect(assign).not.toHaveBeenCalledWith(PORTAL_LOGIN_URL);
  });
});
