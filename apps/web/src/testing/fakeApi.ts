import { battlePools, check, generate, type Level } from '@epicademie/content';
import {
  answerBattle,
  applyItem,
  badgeProgress,
  battleXp,
  createBattle,
  itemRefusal,
  askHint,
  hintRefusal,
  levelFromXp,
  type BattleDice,
  type BattleState,
} from '@epicademie/engine';
import {
  API_PREFIX,
  api,
  type AdminRole,
  type AnyEndpoint,
  type BattleView,
  type BossOverview,
  type Inventory,
  type Journey,
  type LearningReport,
  type ParentWeek,
  type ItemId,
  type Profile,
  type SkillProgress,
  STARTING_HEROES,
} from '@epicademie/shared';

/**
 * Faux serveur pour les tests du front : répond aux appels `fetch` de l'API v1 à partir d'un
 * état en mémoire, avec les VRAIES règles du jeu (correction par @epicademie/content, combat par
 * @epicademie/engine). Chaque réponse est validée par le schéma du contrat : le faux serveur ne
 * peut pas dériver de l'API réelle sans que les tests échouent.
 *
 * Usage : `const server = createFakeApi(); vi.stubGlobal('fetch', server.fetch);`
 */

type Input = { readonly params: Record<string, string>; readonly body: unknown };
type Handler = (input: Input) => unknown;
type Reply = { readonly status: number; readonly body?: unknown };

/** Réponse d'erreur au format du contrat. */
export class FakeError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const EMPTY_INVENTORY: Inventory = { bouclier: 0, soin: 0, indice: 0 };

export function makeProfile(over: Partial<Profile> = {}): Profile {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Léa',
    avatar: { style: 'portrait', seed: '07' },
    gender: 'fille',
    birthDate: '2014-03-09',
    hero: 'lina',
    grade: '5e',
    xp: 120,
    coins: 40,
    rubies: 3,
    soundOn: false,
    musicOn: false,
    createdAt: '2026-11-01T10:00:00.000Z',
    ...over,
  };
}

interface Battle {
  readonly profileId: string;
  readonly chapterId: string;
  state: BattleState;
  finished: boolean;
}

export interface FakeApiOptions {
  /** Code PIN parent déjà choisi (null : aucun). */
  readonly pin?: string | null;
  /** Déconnexion du portail placé devant la plateforme. */
  readonly portalLogoutUrl?: string;
  /** Le portail annonce la connexion directe. */
  readonly portalLogin?: boolean;
  /** Compte sans mot de passe (portail) ; sans `pin`, le code parent reste à choisir. */
  readonly noPassword?: boolean;
  readonly profiles?: readonly Profile[];
  readonly skills?: readonly SkillProgress[];
  readonly inventory?: Inventory;
  /** Toutes les réponses aux combats sont jugées justes (true) ou fausses (false) ; absent : vraie correction. */
  readonly battleAnswers?: boolean;
  /** Appareil connecté au compte familial (par défaut : oui). */
  readonly loggedIn?: boolean;
  /** Le serveur propose « Continuer avec Google ». */
  readonly google?: boolean;
  /** Plateforme de test (recette) : compte actif dès l'inscription, aucun e-mail. */
  readonly recette?: boolean;
  /** Longueur minimale du mot de passe annoncée par le serveur (défaut : 12 ; 8 en recette). */
  readonly passwordMinLength?: number;
  /** Actions parent déverrouillées (par défaut : oui). */
  readonly parent?: boolean;
  /** Notions désactivées (en maintenance). */
  readonly disabled?: readonly string[];
  /** Chapitres déjà validés par l'Épreuve du chapitre. */
  readonly trophies?: readonly string[];
  /** Résultat d'épreuve renvoyé en fin de partie d'une Épreuve du chapitre. */
  readonly epreuve?: { readonly passed: boolean; readonly weakestSkillId: string | null };
  /** La requête vient de l'opérateur de la page de pilotage (sinon l'administration répond 403). */
  readonly admin?: boolean;
  /** Rôle de cette personne (défaut : propriétaire, opérateur historique). */
  readonly adminRole?: AdminRole;
  /** Connexion par fournisseur d'identité configurée. */
  readonly adminSso?: boolean;
  /** Rapport de suivi renvoyé pour chaque profil (par défaut : vide). */
  readonly learning?: LearningReport;
  readonly journey?: Journey;
  /** Semaine vue par le parent, par profil (par défaut : aucune séance). */
  readonly parentWeeks?: Readonly<Record<string, ParentWeek>>;
  /** Abonnement familial en cours (par défaut : oui, tous les chapitres jouables). */
  readonly premium?: boolean;
}

export const emptyParentWeek = (): ParentWeek => ({
  ...emptyJourney(),
  feelings: { week: { pasEncore: 0, unPeu: 0, oui: 0 }, before: { pasEncore: 0, unPeu: 0, oui: 0 }, trend: null },
  advice: 'proposer',
});

/** Rapport de suivi vide (nouveau joueur). */
export const emptyJourney = (): Journey => ({
  today: '2026-11-20',
  gains: [],
  effort: { series: 0, days: 0, reworked: [], pauseDays: null },
});

export const emptyLearning = (): LearningReport => ({
  day: '2026-11-20',
  tally: { answered: 0, autonomous: 0, helped: 0, hints: 0, collective: 0 },
  lastActivity: null,
  subjects: [],
  chapters: [],
  skills: [],
  toRework: [],
  dueReviews: [],
  weeks: [],
});

/** Mot de passe du compte du faux serveur. */
/** Adresse qui a déjà un compte (inscription refusée en recette). */
export const TAKEN_EMAIL = 'deja@famille.test';
export const FAKE_PASSWORD = 'mot de passe parent';
/** Jeton du lien de validation d'e-mail du faux serveur, et adresse dont l'e-mail n'est pas encore validé. */
export const FAKE_VERIFICATION_TOKEN = 'jeton-de-validation-0123456789abcdefghij';
export const UNVERIFIED_EMAIL = 'attente@famille.test';

/** Point d'accès du contrat correspondant à la requête, avec ses paramètres de chemin. */
function route(
  method: string,
  path: string,
): { name: keyof typeof api; endpoint: AnyEndpoint; params: Record<string, string> } | null {
  for (const [name, endpoint] of Object.entries(api) as [keyof typeof api, AnyEndpoint][]) {
    if (endpoint.method !== method) continue;
    const keys: string[] = [];
    const pattern = endpoint.path.replace(/:(\w+)/g, (_, key: string) => {
      keys.push(key);
      return '([^/]+)';
    });
    const m = new RegExp(`^${pattern}$`).exec(path);
    if (m) return { name, endpoint, params: Object.fromEntries(keys.map((k, i) => [k, m[i + 1] ?? ''])) };
  }
  return null;
}

/** Vue d'un combat envoyée au client (comme le vrai serveur). */
const view = (id: string, b: Battle, inventory: Inventory): BattleView => ({
  id,
  chapterId: b.chapterId,
  status: b.state.status,
  hearts: b.state.hearts,
  maxHearts: b.state.maxHearts,
  bossLives: b.state.bossLives,
  mobsDefeated: b.state.mobsDefeated,
  turn: b.state.turn,
  shield: b.state.shield,
  hintShown: b.state.hintShown,
  weakAttack: b.state.weakAttack,
  itemsUsed: b.state.itemsUsed,
  equipped: b.state.equipped,
  question: b.state.question,
  inventory,
});

/** Code de récupération renvoyé par le faux serveur à l'inscription d'un élève. */
export const STUDENT_CODE = 'ABCD-EFGH-JKMN-PQRS';

/** Compte familial du faux serveur : session de l'appareil et verrou parent. */
function authHandlers(options: FakeApiOptions) {
  const session = {
    loggedIn: options.loggedIn ?? true,
    parent: options.parent ?? true,
    /** Nul pour un élève autonome (aucun parent à solliciter). */
    email: 'parent@famille.test' as string | null,
    pin: options.pin ?? null,
  };
  const me = () => {
    if (!session.loggedIn) throw new FakeError(401, 'UNAUTHORIZED', 'Connecte-toi pour continuer.');
    return {
      account: {
        id: '22222222-2222-4222-8222-222222222222',
        email: session.email,
        role: 'parent',
      },
      family: { id: '33333333-3333-4333-8333-333333333333', autonomous: false },
      parent: session.parent,
      parentUntil: session.parent ? '2099-01-01T00:00:00.000Z' : null,
      hasPin: session.pin !== null,
      ...(options.noPassword ? { noPassword: true } : {}),
      ...(options.noPassword && session.pin === null ? { needsPin: true } : {}),
    };
  };
  const requireParent = () => {
    if (!session.parent) throw new FakeError(403, 'FORBIDDEN', 'Action réservée au parent.');
  };
  const credentials = (body: unknown) => body as { email: string; password: string };

  const handlers: Partial<Record<keyof typeof api, Handler>> = {
    // Production : compte non vérifié, aucune session (le lien reçu par e-mail ouvre `verifyEmail`).
    // Recette : compte actif et connecté.
    signup: ({ body }) => {
      if (!options.recette) return { status: 'verification_required', email: credentials(body).email };
      if (credentials(body).email === TAKEN_EMAIL) {
        throw new FakeError(409, 'CONFLICT', 'Cette adresse a déjà un compte : connectez-vous.');
      }
      Object.assign(session, { loggedIn: true, parent: true, email: credentials(body).email });
      return { status: 'active', email: credentials(body).email, me: me() };
    },
    verifyEmail: ({ body }) => {
      if ((body as { token: string }).token !== FAKE_VERIFICATION_TOKEN) {
        throw new FakeError(410, 'GONE', 'Ce lien a déjà été utilisé : connecte-toi avec ton mot de passe.');
      }
      if ((body as { password: string }).password !== FAKE_PASSWORD) {
        throw new FakeError(401, 'UNAUTHORIZED', 'Ce n’est pas le mot de passe choisi à l’inscription.');
      }
      Object.assign(session, { loggedIn: true, parent: true });
      return me();
    },
    resendVerification: () => ({}),
    authOptions: () => ({
      google: options.google ?? false,
      recette: options.recette ?? false,
      passwordMinLength: options.passwordMinLength ?? (options.recette ? 8 : 12),
      ...(options.portalLogoutUrl ? { portalLogoutUrl: options.portalLogoutUrl } : {}),
      ...(options.portalLogin ? { portalLogin: true } : {}),
    }),
    signupStudent: ({ body }) => {
      const b = body as { name: string; avatar: unknown; grade: string };
      Object.assign(session, { loggedIn: true, parent: false, email: null });
      return {
        me: { ...me(), family: { id: '33333333-3333-4333-8333-333333333333', autonomous: true } },
        recoveryCode: STUDENT_CODE,
        name: b.name,
      };
    },
    login: ({ body }) => {
      if (credentials(body).email === UNVERIFIED_EMAIL && credentials(body).password === FAKE_PASSWORD) {
        throw new FakeError(403, 'EMAIL_NOT_VERIFIED', 'Ton adresse e-mail n’est pas encore validée.');
      }
      if (credentials(body).password !== FAKE_PASSWORD) {
        throw new FakeError(401, 'UNAUTHORIZED', 'E-mail ou mot de passe incorrect.');
      }
      Object.assign(session, { loggedIn: true, parent: true, email: credentials(body).email });
      return me();
    },
    logout: () => {
      if (session.loggedIn && session.email !== null) requireParent();
      session.loggedIn = false;
      return null;
    },
    me,
    exportFamily: () => ({
      exportedAt: '2026-11-20T10:00:00.000Z',
      account: [{ email: session.email, role: 'parent' }],
      profiles: (options.profiles ?? []).map((p) => ({ ...p })),
      progression: { skillStates: [] },
      subscriptions: [],
    }),
    deleteFamily: ({ body }) => {
      const b = body as { password?: string; pin?: string };
      if (b.password !== undefined && b.password !== FAKE_PASSWORD) {
        throw new FakeError(401, 'UNAUTHORIZED', 'Mot de passe incorrect.');
      }
      if (b.pin !== undefined && b.pin !== session.pin) throw new FakeError(401, 'UNAUTHORIZED', 'Code PIN incorrect.');
      session.loggedIn = false;
      return null;
    },
    setParentPin: ({ body }) => {
      const b = body as { password?: string; pin: string };
      if (options.noPassword && session.pin === null) requireParent();
      else if (b.password !== FAKE_PASSWORD) throw new FakeError(401, 'UNAUTHORIZED', 'Mot de passe incorrect.');
      session.pin = b.pin;
      return me();
    },
    unlockParentPin: ({ body }) => {
      if ((body as { pin: string }).pin !== session.pin)
        throw new FakeError(401, 'UNAUTHORIZED', 'Code PIN incorrect.');
      session.parent = true;
      return me();
    },
    lockParent: () => {
      session.parent = false;
      return me();
    },
    confirmParent: ({ body }) => {
      if ((body as { password: string }).password !== FAKE_PASSWORD) {
        throw new FakeError(401, 'UNAUTHORIZED', 'Mot de passe incorrect.');
      }
      session.parent = true;
      return me();
    },
    forgotPassword: () => null,
    resetPassword: () => null,
  };
  return { session, requireParent, handlers };
}

/** Administration du faux serveur : signalements reçus et quelques notions. */
function adminHandlers(
  reports: Record<string, unknown>[],
  disabled: Set<string>,
  { admin: operator = false, adminRole = 'proprietaire', adminSso = false }: FakeApiOptions,
): Partial<Record<keyof typeof api, Handler>> {
  const skill = (skillId: string) => ({
    skillId,
    title: skillId === 'm5-tables' ? 'Tables de multiplication' : skillId,
    chapterId: 'm5-calcul',
    subject: 'maths',
    grade: '5e',
    boss: false,
    version: 1,
    source: 'Programme de mathématiques',
    state: disabled.has(skillId) ? 'desactivee' : 'validee-auto',
    disabled: disabled.has(skillId),
    reviewedVersion: null,
    openReports: reports.filter((r) => r.skillId === skillId && r.status === 'nouveau').length,
    autoIssues: [],
  });
  const operatorOnly = () => {
    if (!operator)
      throw new FakeError(403, 'FORBIDDEN', 'Administration accessible uniquement depuis la page de pilotage.');
  };
  const accountRow = (i: number) => ({
    id: `aaaaaaaa-aaaa-4aaa-8aaa-${String(i).padStart(12, '0')}`,
    familyId: `bbbbbbbb-bbbb-4bbb-8bbb-${String(i).padStart(12, '0')}`,
    email: `parent${i}@famille.test`,
    type: 'famille',
    emailVerified: true,
    createdAt: '2026-11-01T10:00:00.000Z',
    lastActivityAt: '2026-11-20T10:00:00.000Z',
    profileCount: 1,
    profileNames: [`Enfant ${i}`],
  });
  return {
    adminSession: () => {
      operatorOnly();
      return { operator: 'Marie Dupont', role: adminRole, via: adminSso ? 'sso' : 'operateur' };
    },
    adminAuthConfig: () => ({ sso: adminSso }),
    adminLogout: () => ({ redirect: adminSso ? 'https://sso.test/logout?rd=admin' : null }),
    adminAccounts: ({ body }) => {
      operatorOnly();
      const b = body as { q: string; page: number };
      const all = Array.from({ length: 30 }, (_, i) => accountRow(i + 1)).filter(
        (r) =>
          !b.q ||
          r.email.includes(b.q.toLowerCase()) ||
          r.profileNames.some((n) => n.toLowerCase().includes(b.q.toLowerCase())),
      );
      const items = all.slice(b.page * 25, b.page * 25 + 25);
      return { items, page: b.page, pageSize: 25, total: all.length, hasMore: (b.page + 1) * 25 < all.length };
    },
    adminAccount: ({ params }) => {
      operatorOnly();
      const row = accountRow(Number((params.id ?? '').slice(-2)));
      return {
        account: {
          id: row.id,
          familyId: row.familyId,
          email: row.email,
          type: 'famille',
          createdAt: row.createdAt,
          lastLoginAt: '2026-11-20T09:00:00.000Z',
          lastActivityAt: row.lastActivityAt,
          emailVerifiedAt: row.createdAt,
          methods: ['mot-de-passe'],
          hasPin: true,
        },
        profiles: [
          {
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
            name: row.profileNames[0],
            hero: 'alex',
            grade: '6e',
            xp: 120,
            coins: 45,
            rubies: 2,
            createdAt: row.createdAt,
            lastActivityAt: row.lastActivityAt,
            games: 7,
            answers: 80,
            correctAnswers: 60,
            skillsStudied: 6,
            skillsMastered: 2,
            heroesOwned: 1,
            bossWins: 1,
            items: [{ item: 'bouclier', count: 2 }],
          },
        ],
        recentGames: [
          {
            profileName: row.profileNames[0],
            mode: 'entrainement',
            subject: 'maths',
            chapterId: 'm5-calcul',
            startedAt: '2026-11-20T10:00:00.000Z',
            answered: 10,
            correct: 8,
          },
        ],
        reports: [],
        pending: { invitation: false, passwordReset: false, emailVerification: false },
        subscriptions: [],
      };
    },
    adminResetPassword: () => {
      operatorOnly();
      return { password: 'Temp0raireXy7', sessionsClosed: 2 };
    },
    adminAudit: () => {
      operatorOnly();
      return {
        items: [
          {
            id: 'compte-1',
            at: '2026-11-24T08:00:00.000Z',
            operator: 'Marie Dupont',
            action: 'consultation',
            accountId: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
            accountLabel: 'p…@famille.test',
            accountExists: true,
          },
        ],
        page: 0,
        hasMore: false,
      };
    },
    adminReports: ({ params }) => reports.filter((r) => r.status === params.status),
    adminUpdateReport: ({ params, body }) => {
      const r = reports.find((x) => x.id === params.id);
      if (!r) throw new FakeError(404, 'NOT_FOUND', 'Signalement introuvable');
      Object.assign(r, body);
      return r;
    },
    adminContent: () => ['m5-tables', 'm5-priorites'].map(skill),
    adminTrends: () => ({
      day: '2026-11-20',
      accountsByDay: Array.from({ length: 30 }, (_, i) => ({
        day: `2026-11-${String(i + 1).padStart(2, '0')}`,
        count: i === 29 ? 3 : 0,
      })),
      activeSubscriptionsByDay: Array.from({ length: 30 }, (_, i) => ({
        day: `2026-11-${String(i + 1).padStart(2, '0')}`,
        count: i < 20 ? 4 : 5,
      })),
      activeByOffer: [{ offer: 'famille-annee', count: 5 }],
      revenueCents: 12495,
      paymentProviders: ['simulateur'],
    }),
    adminStats: () => ({
      day: '2026-11-20',
      families: 12,
      profiles: 19,
      activeProfiles7d: 8,
      finishedSeries7d: 64,
      answers7d: 300,
      autonomousRate7d: 0.72,
      answersBySubject7d: [{ subject: 'maths', answers: 300 }],
      bossWins: 21,
      premiumFamilies: 5,
      payments: [{ status: 'payee', count: 5, amountCents: 12495 }],
      openReports: reports.filter((r) => r.status === 'nouveau' || r.status === 'en-cours').length,
      reportCounts: Object.fromEntries(
        ['nouveau', 'en-cours', 'resolu', 'rejete'].map((s) => [s, reports.filter((r) => r.status === s).length]),
      ),
    }),
    adminAnomalies: () => [
      {
        rule: 'reponses-eclair',
        profileId: '00000000-0000-4000-8000-000000000042',
        detail: '18 réponses sur 20 en moins de 1.5 s (7 jours)',
        at: null,
      },
    ],
    adminErrors: () => [
      {
        source: 'client',
        message: 'Cannot read properties of undefined',
        route: '/hub',
        count: 3,
        firstAt: '2026-11-20T08:00:00.000Z',
        lastAt: '2026-11-20T09:00:00.000Z',
      },
    ],
    adminUpdateContent: ({ params, body }) => {
      const id = params.skillId ?? '';
      if ((body as { disabled?: boolean }).disabled === true) disabled.add(id);
      if ((body as { disabled?: boolean }).disabled === false) disabled.delete(id);
      return skill(id);
    },
    adminContentHistory: () => [],
  };
}

/** Abonnement du faux serveur : simulateur de paiement, historique. */
function billingHandlers(premium: boolean, uuid: () => string): Partial<Record<keyof typeof api, Handler>> {
  const state = { premium, history: [] as Record<string, unknown>[] };
  const status = () => ({
    premium: state.premium,
    until: state.premium ? '2027-08-31' : null,
    priceCents: 2499,
    currency: 'eur',
    wouldEnd: '2027-08-31',
    available: true,
    simulated: true,
    history: state.history,
  });
  return {
    billing: status,
    checkout: () => {
      const id = uuid();
      state.history.unshift({
        id,
        offer: 'famille-annee',
        status: 'en-attente',
        amountCents: 2499,
        currency: 'eur',
        periodEnd: '2027-08-31',
        createdAt: '2026-11-20T10:00:00.000Z',
        paidAt: null,
      });
      return { url: `/parent/abonnement/simulateur?paiement=${id}` };
    },
    simulatePayment: ({ params, body }) => {
      const sub = state.history.find((h) => h.id === params.id);
      if (!sub) throw new FakeError(404, 'NOT_FOUND', 'Paiement introuvable');
      const ok = (body as { outcome: string }).outcome === 'succes';
      Object.assign(sub, ok ? { status: 'payee', paidAt: '2026-11-20T10:01:00.000Z' } : { status: 'echouee' });
      if (ok) state.premium = true;
      return status();
    },
  };
}

/** Combats du faux serveur : vraies règles du moteur, dés déterministes. */
function battleHandlers(ctx: {
  readonly battles: Map<string, Battle>;
  readonly overview: { inventory: Inventory; equipped: readonly ItemId[] };
  readonly dice: BattleDice;
  readonly profile: (id: string | undefined) => Profile;
  readonly battleOf: (id: string | undefined) => Battle;
  readonly uuid: () => string;
  readonly battleAnswers: boolean | undefined;
}): Partial<Record<keyof typeof api, Handler>> {
  const { battles, overview, dice, profile, battleOf, uuid } = ctx;
  const options = { battleAnswers: ctx.battleAnswers };
  return {
    startBattle: ({ body }) => {
      const { profileId, chapterId } = body as { profileId: string; chapterId: string };
      profile(profileId);
      const pools = battlePools(chapterId);
      if (!pools) throw new FakeError(400, 'BAD_REQUEST', 'Ce chapitre n’a pas encore de boss');
      const id = uuid();
      const b: Battle = {
        profileId,
        chapterId,
        state: createBattle(pools, dice, [], overview.equipped),
        finished: false,
      };
      battles.set(id, b);
      return view(id, b, overview.inventory);
    },
    answerBattle: ({ params, body }) => {
      const b = battleOf(params.id);
      const q = b.state.question;
      if (!q || b.state.status !== 'fighting') throw new FakeError(409, 'CONFLICT', 'Combat terminé');
      const result = check(
        generate(q.skillId, q.level, q.seed),
        (body as { response: Parameters<typeof check>[1] }).response,
      );
      if (result.invalid)
        return { correct: false, invalid: true, outcome: null, battle: view(params.id ?? '', b, overview.inventory) };
      const correct = options.battleAnswers ?? result.correct;
      const pools = battlePools(b.chapterId);
      if (!pools) throw new Error('réserves introuvables');
      const next = answerBattle(b.state, pools, correct, dice);
      b.state = next.state;
      return { correct, invalid: false, outcome: next.outcome, battle: view(params.id ?? '', b, overview.inventory) };
    },
    battleHint: ({ params }) => {
      const b = battleOf(params.id);
      const refusal = hintRefusal(b.state);
      if (refusal) throw new FakeError(409, 'CONFLICT', refusal);
      b.state = askHint(b.state);
      return view(params.id ?? '', b, overview.inventory);
    },
    useBattleItem: ({ params, body }) => {
      const b = battleOf(params.id);
      const item = (body as { item: ItemId }).item;
      const refusal = itemRefusal(b.state, item);
      if (refusal) throw new FakeError(409, 'CONFLICT', refusal);
      overview.inventory = { ...overview.inventory, [item]: overview.inventory[item] - 1 };
      b.state = applyItem(b.state, item);
      return view(params.id ?? '', b, overview.inventory);
    },
    finishBattle: ({ params }) => {
      const b = battleOf(params.id);
      if (b.finished) throw new FakeError(409, 'CONFLICT', 'Combat déjà terminé');
      b.finished = true;
      const won = b.state.status === 'won';
      const xp = profile(b.profileId).xp;
      const gained = battleXp(b.state);
      return {
        won,
        firstWin: won,
        xpGained: gained,
        coinsGained: Math.floor(gained / 10),
        hearts: b.state.hearts,
        medal: won ? 'or' : null,
        newBest: won,
        chest: won ? { rarity: 'epique', items: { soin: 1 }, coins: 40, rubies: 1, hero: null } : null,
        weakSkill: won ? null : (b.state.misses[0] ?? null),
        skills: [],
        levelBefore: levelFromXp(xp).level,
        levelAfter: levelFromXp(xp + gained).level,
      };
    },
  };
}

export function createFakeApi(options: FakeApiOptions = {}) {
  const profiles = new Map((options.profiles ?? [makeProfile()]).map((p) => [p.id, p]));
  const sessions = new Map<string, { answered: number; correct: number }>();
  const battles = new Map<string, Battle>();
  const overview: { -readonly [K in keyof BossOverview]: BossOverview[K] } = {
    records: [],
    inventory: options.inventory ?? EMPTY_INVENTORY,
    equipped: [],
  };
  /** Signalements reçus. */
  const reports: Record<string, unknown>[] = [];
  /** Réponses « Je me sens capable ? » reçues. */
  const feelings: number[] = [];
  const disabledSet = new Set(options.disabled ?? []);
  /** Appels reçus (méthode + chemin), pour vérifier ce que l'écran a envoyé. */
  const calls: { method: string; path: string; body: unknown }[] = [];
  let ids = 0;
  const uuid = () => `00000000-0000-4000-8000-${String(++ids).padStart(12, '0')}`;
  // Dés déterministes : mobs dans l'ordre, graines croissantes.
  let seed = 0;
  const dice: BattleDice = { random: () => 0, seed: () => ++seed };

  const profile = (id: string | undefined) => {
    const p = id ? profiles.get(id) : undefined;
    if (!p) throw new FakeError(404, 'NOT_FOUND', 'Profil introuvable');
    return p;
  };
  const battleOf = (id: string | undefined) => {
    const b = id ? battles.get(id) : undefined;
    if (!b) throw new FakeError(404, 'NOT_FOUND', 'Combat introuvable');
    return b;
  };

  const { session, requireParent, handlers: auth } = authHandlers(options);
  const handlers: Partial<Record<keyof typeof api, Handler>> = {
    ...auth,
    network: () => ({ publicUrl: 'http://epicademie.test' }),
    presence: () => ({ online: [] }),
    listProfiles: () => [...profiles.values()],
    getProfile: ({ params }) => profile(params.id),
    createProfile: ({ body }) => {
      requireParent();
      const p = makeProfile({ ...(body as Partial<Profile>), id: uuid(), xp: 0, coins: 0, rubies: 0 });
      profiles.set(p.id, p);
      return p;
    },
    updateProfile: ({ params, body }) => {
      const p = { ...profile(params.id), ...(body as Partial<Profile>) };
      profiles.set(p.id, p);
      return p;
    },
    deleteProfile: ({ params }) => {
      requireParent();
      profiles.delete(profile(params.id).id);
      return null;
    },
    listSkills: () => options.skills ?? [],
    startSession: () => {
      const id = uuid();
      sessions.set(id, { answered: 0, correct: 0 });
      return { id };
    },
    answerSession: ({ params, body }) => {
      const a = body as { skillId: string; level: Level; seed: number; response: Parameters<typeof check>[1] };
      const result = check(generate(a.skillId, a.level, a.seed), a.response);
      const s = sessions.get(params.id ?? '');
      // Seule la 1re réponse compte au score (le second essai est « avec aide »).
      if (s && !result.invalid && (body as { attempt?: number }).attempt !== 2) {
        s.answered++;
        if (result.correct) s.correct++;
      }
      return { correct: result.correct, invalid: result.invalid === true, xp: result.correct ? 10 : 0 };
    },
    chapterTrophies: () =>
      (options.trophies ?? []).map((chapterId) => ({ chapterId, obtainedAt: '2026-11-20T10:00:00.000Z' })),
    markConfused: () => null,
    finishSession: ({ params }) => {
      const s = sessions.get(params.id ?? '') ?? { answered: 0, correct: 0 };
      return {
        regular: s,
        variants: { answered: 0, correct: 0 },
        scoreOn20: s.answered ? Math.round((20 * s.correct) / s.answered) : 0,
        xpGained: s.correct * 10,
        coinsGained: s.correct,
        perfect: s.answered > 0 && s.correct === s.answered,
        levelBefore: 1,
        levelAfter: 1,
        skills: [],
        chest: null,
        ...(options.epreuve && {
          epreuve: {
            chapterId: 'm5-calcul',
            passed: options.epreuve.passed,
            rewarded: options.epreuve.passed,
            alreadyValidated: false,
            weakestSkillId: options.epreuve.weakestSkillId,
          },
        }),
      };
    },
    bossOverview: () => overview,
    setEquipment: ({ body }) => {
      overview.equipped = (body as { items: ItemId[] }).items;
      return overview;
    },
    buy: ({ body }) => {
      const item = (body as { item: ItemId | 'rubis' }).item;
      if (item !== 'rubis') overview.inventory = { ...overview.inventory, [item]: overview.inventory[item] + 1 };
      return { coins: 10, rubies: 1, inventory: overview.inventory };
    },
    ...battleHandlers({ battles, overview, dice, profile, battleOf, uuid, battleAnswers: options.battleAnswers }),
    reportClientError: () => null,
    reportGeneral: ({ body }) => {
      const id = uuid();
      reports.push({
        ...(body as object),
        id,
        kind: 'general',
        skillId: null,
        level: null,
        seed: null,
        skillVersion: null,
        comment: (body as { comment?: string }).comment ?? null,
        status: 'nouveau',
        adminNote: null,
        createdAt: '2026-11-20T10:00:00.000Z',
        resolvedAt: null,
      });
      return { id };
    },
    reportQuestion: ({ body }) => {
      const id = uuid();
      reports.push({
        ...(body as object),
        id,
        kind: 'question',
        screen: null,
        appVersion: null,
        skillVersion: 1,
        comment: (body as { comment?: string }).comment ?? null,
        status: 'nouveau',
        adminNote: null,
        createdAt: '2026-11-20T10:00:00.000Z',
        resolvedAt: null,
      });
      return { id };
    },
    disabledContent: () => ({ skills: [...disabledSet] }),
    learningReport: () => options.learning ?? emptyLearning(),
    journey: () => options.journey ?? emptyJourney(),
    parentWeek: ({ params }) => options.parentWeeks?.[params.id ?? ''] ?? emptyParentWeek(),
    rateSession: ({ body }) => {
      feelings.push((body as { feeling: number }).feeling);
      return null;
    },
    ...billingHandlers(options.premium ?? true, uuid),
    ownedHeroes: () => ({ heroes: [...STARTING_HEROES] }),
    ...friendHandlers(),
    badges: () => badgeProgress({ boss: 2, parfait: 3, perseverance: 0, chapitres: 0, consolidees: 0, coffres: 1 }),
    ...adminHandlers(reports, disabledSet, options),
  };

  function reply(method: string, url: string, body: unknown): Reply {
    const path = new URL(url, 'http://localhost').pathname;
    if (!path.startsWith(API_PREFIX)) return { status: 404, body: { code: 'NOT_FOUND', error: 'Hors API' } };
    const apiPath = path.slice(API_PREFIX.length);
    calls.push({ method, path: apiPath, body });
    const match = route(method, apiPath);
    const handler = match && handlers[match.name];
    // Comme le vrai serveur : sans session, seules les routes publiques répondent (l'administration dépend de l'opérateur, pas d'une session).
    if (match && match.endpoint.access !== 'public' && match.endpoint.access !== 'admin' && !session.loggedIn) {
      return { status: 401, body: { code: 'UNAUTHORIZED', error: 'Connecte-toi pour continuer.' } };
    }
    if (!match || !handler)
      return { status: 404, body: { code: 'NOT_FOUND', error: `Pas de faux ${method} ${apiPath}` } };
    try {
      const out = handler({ params: match.params, body });
      if (match.endpoint.status === 204) return { status: 204 };
      // Le faux serveur respecte le contrat, comme le vrai.
      return { status: match.endpoint.status, body: match.endpoint.response?.parse(out) };
    } catch (err) {
      if (err instanceof FakeError) return { status: err.status, body: { code: err.code, error: err.message } };
      throw err;
    }
  }

  /** Remplaçant de `fetch` : réponses synchrones, sans réseau. */
  const fakeFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method ?? 'GET';
    const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined;
    // Sons du jeu : fichiers absents des tests.
    if (url.startsWith('/sounds/')) return new Response(new ArrayBuffer(0));
    const r = reply(method, url, body);
    return new Response(r.body === undefined ? null : JSON.stringify(r.body), {
      status: r.status,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  return {
    fetch: fakeFetch,
    calls,
    reports,
    feelings,
    profiles,
    battles,
    overview,
    /** Remplace un point d'accès (erreur simulée, réponse particulière). */
    override(name: keyof typeof api, handler: Handler) {
      handlers[name] = handler;
    },
  };
}

export type FakeApi = ReturnType<typeof createFakeApi>;

/** Amis : un copain de l'autre famille, Tom (code TOM234), qui accepte et dont le parent valide. */
function friendHandlers(): Partial<Record<keyof typeof api, Handler>> {
  const tom = { id: '99999999-9999-4999-8999-999999999999', name: 'Tom', hero: 'alex' as const };
  let status: 'none' | 'envoyee' | 'parents' | 'active' = 'none';
  let myParentOk = false;
  const friends = () =>
    status === 'none' ? [] : [{ ...tom, avatar: { style: 'portrait' as const, seed: '07' }, status, myParentOk }];
  const view = () => ({ code: 'LEA7K2', friends: friends() });
  return {
    friends: view,
    requestFriend: ({ body }) => {
      if ((body as { code: string }).code !== 'TOM234')
        throw new FakeError(404, 'NOT_FOUND', 'Aucun joueur avec ce code.');
      status = 'envoyee';
      return view();
    },
    removeFriend: () => {
      status = 'none';
      return view();
    },
    familyFriends: () => friends().map((f) => ({ ...f, profileId: makeProfile().id, profileName: 'Léa' })),
    approveFriend: () => {
      myParentOk = true;
      status = 'active';
      return friends().map((f) => ({ ...f, profileId: makeProfile().id, profileName: 'Léa' }));
    },
    /** Raccourci de test : Tom a accepté. */
    acceptFriend: () => {
      status = 'parents';
      return view();
    },
  };
}
