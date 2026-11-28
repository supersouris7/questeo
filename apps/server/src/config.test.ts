import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig } from './config.ts';

const PROD = { NODE_ENV: 'production', BREVO_API_KEY: 'xkeysib-test-0000', MAIL_FROM: 'noreply@exemple.fr' };

describe('configuration', () => {
  it('valeurs par défaut de développement : base embarquée sur disque, documentation active', () => {
    const c = loadConfig({});
    expect(c.env).toBe('development');
    expect(c.port).toBe(3000);
    expect(c.databaseUrl).toMatch(/^pglite:\/\/.*data\/pglite$/);
    expect(c.apiDocs).toBe(true);
    expect(c.webDir).toBeNull();
    expect(c.corsOrigins).toBeNull();
  });

  it('production : base obligatoire, front servi, documentation coupée', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(ConfigError);
    const c = loadConfig({ ...PROD, DATABASE_URL: 'postgres://u:p@h/db' });
    expect(c.webDir).toMatch(/web\/dist$/);
    expect(c.apiDocs).toBe(false);
  });

  it('ignore les variables vides et découpe les listes', () => {
    const c = loadConfig({ METRICS_TOKEN: '', PUBLIC_URL: '  ', CORS_ORIGINS: 'https://a.fr, https://b.fr' });
    expect(c.metricsToken).toBeNull();
    expect(c.publicUrl).toBeNull();
    expect(c.corsOrigins).toEqual(['https://a.fr', 'https://b.fr']);
  });

  it('refuse une valeur invalide avec un message clair', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(/PORT/);
    expect(() => loadConfig({ METRICS_TOKEN: 'court' })).toThrow(/METRICS_TOKEN/);
  });

  it('e-mails : production sans clé Brevo refusée, recette (APP_ENV) en simulation', () => {
    const base = { NODE_ENV: 'production', DATABASE_URL: 'postgres://u:p@h/db' };
    expect(() => loadConfig(base)).toThrow(/BREVO_API_KEY/);
    expect(() => loadConfig({ ...base, BREVO_API_KEY: 'xkeysib-test-0000' })).toThrow(/MAIL_FROM/);
    expect(() => loadConfig({ ...base, APP_ENV: 'production' })).toThrow(/BREVO_API_KEY/);
    // Casse et espaces sans effet : « Production » reste la production.
    expect(() => loadConfig({ ...base, APP_ENV: ' Production ' })).toThrow(/BREVO_API_KEY/);
    const recette = loadConfig({ ...base, APP_ENV: 'recette' });
    expect(recette.mail).toMatchObject({ production: false, brevoApiKey: null });
    expect(loadConfig({ ...base, ...PROD }).mail).toMatchObject({ production: true, brevoApiKey: 'xkeysib-test-0000' });
    expect(loadConfig({}).mail.production).toBe(false);
  });

  it('plateforme de test et longueur du mot de passe : 12 par défaut, 8 en recette, réglable', () => {
    const base = { NODE_ENV: 'production', DATABASE_URL: 'postgres://u:p@h/db' };
    expect(loadConfig({ ...base, ...PROD })).toMatchObject({ recette: false, passwordMinLength: 12 });
    expect(loadConfig({ ...base, APP_ENV: 'recette' })).toMatchObject({ recette: true, passwordMinLength: 8 });
    expect(loadConfig({ ...base, APP_ENV: 'recette', PASSWORD_MIN_LENGTH: '10' }).passwordMinLength).toBe(10);
    expect(loadConfig({ ...base, ...PROD, PASSWORD_MIN_LENGTH: '8' }).passwordMinLength).toBe(8);
    expect(() => loadConfig({ PASSWORD_MIN_LENGTH: '2' })).toThrow(/PASSWORD_MIN_LENGTH/);
    // Portail de connexion devant la plateforme : facultatif, en HTTPS.
    expect(loadConfig({ ...base, ...PROD, PORTAL_LOGOUT_URL: '' }).portalLogoutUrl).toBeNull();
    const portal = 'https://portail.test/logout';
    expect(loadConfig({ ...base, ...PROD, PORTAL_LOGOUT_URL: portal }).portalLogoutUrl).toBe(portal);
    expect(() => loadConfig({ ...base, ...PROD, PORTAL_LOGOUT_URL: 'http://portail.test' })).toThrow(
      /PORTAL_LOGOUT_URL/,
    );
  });

  it('connexion par le portail : désactivée par défaut, recette derrière un proxy seulement', () => {
    const base = { NODE_ENV: 'production', DATABASE_URL: 'postgres://u:p@h/db' };
    const recette = { ...base, APP_ENV: 'recette', TRUST_PROXY: '1' };
    expect(loadConfig(recette).portalLogin).toBe(false);
    expect(loadConfig({ ...recette, PORTAL_LOGIN: '' }).portalLogin).toBe(false);
    expect(loadConfig({ ...recette, PORTAL_LOGIN: 'true' }).portalLogin).toBe(true);
    // Production (explicite ou par défaut), développement ou sans proxy : démarrage refusé.
    for (const env of [
      { ...base, ...PROD, TRUST_PROXY: '1' },
      { ...base, ...PROD, TRUST_PROXY: '1', APP_ENV: 'production' },
      { TRUST_PROXY: '1' },
      { ...recette, TRUST_PROXY: '0' },
    ]) {
      expect(() => loadConfig({ ...env, PORTAL_LOGIN: 'true' })).toThrow(/PORTAL_LOGIN/);
    }
  });

  it('Google : actif seulement avec identifiant ET secret ; retour par défaut sous PUBLIC_URL', () => {
    expect(loadConfig({ GOOGLE_CLIENT_ID: 'id-google' }).google).toBeNull();
    const g = loadConfig({
      GOOGLE_CLIENT_ID: 'id-google',
      GOOGLE_CLIENT_SECRET: 'secret-google',
      PUBLIC_URL: 'https://a.fr/',
    });
    expect(g.google).toEqual({
      clientId: 'id-google',
      clientSecret: 'secret-google',
      redirectUri: 'https://a.fr/api/v1/auth/google/callback',
    });
  });
});
