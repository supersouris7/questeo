import { z } from 'zod';
import { GRADES } from './grades.ts';
import { AvatarConfigSchema, ProfileNameSchema } from './profile.ts';

/**
 * Comptes familiaux : un compte parent (e-mail + mot de passe) par famille, des profils enfants
 * rattachés à la famille. Voir docs/adr/0012-comptes-familiaux.md.
 */

/**
 * Rôles d'un compte de jeu : parent (famille). L'administration n'est pas un rôle de compte :
 * elle relève d'un « opérateur » authentifié par le frontal (docs/adr/0033-…).
 */
export const ACCOUNT_ROLES = ['parent'] as const;
export type AccountRole = (typeof ACCOUNT_ROLES)[number];

export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'Adresse trop longue')
  .pipe(z.email({ message: 'Adresse e-mail invalide' }));

/** Longueur minimale recommandée (ANSSI : 12 caractères pour un mot de passe seul). */
export const PASSWORD_MIN = 12;
/** Plancher absolu du schéma ; la longueur exigée (PASSWORD_MIN_LENGTH, 12 par défaut) est contrôlée par le serveur. */
export const PASSWORD_FLOOR = 6;
export const PasswordSchema = z
  .string()
  .min(PASSWORD_FLOOR, `Au moins ${PASSWORD_FLOOR} caractères`)
  .max(200, '200 caractères maximum');

export const SignupSchema = z.object({ email: EmailSchema, password: PasswordSchema });
export type Signup = z.infer<typeof SignupSchema>;

/** Connexion : pas de règle de longueur (un ancien mot de passe court doit pouvoir se tester). */
export const LoginSchema = z.object({ email: EmailSchema, password: z.string().min(1).max(200) });
export type Login = z.infer<typeof LoginSchema>;

export const PasswordConfirmSchema = z.object({ password: z.string().min(1).max(200) });
/** Code PIN de l'Espace parent : 4 chiffres. */
export const ParentPinSchema = z.string().regex(/^\d{4}$/, 'Le code PIN a 4 chiffres.');
/** `password` n'est omis que pour le premier code d'un compte sans mot de passe (`Me.needsPin`). */
export const ParentPinSetSchema = z.object({ password: z.string().min(1).max(200).optional(), pin: ParentPinSchema });
export const ParentPinUnlockSchema = z.object({ pin: ParentPinSchema });
/** Mot à saisir pour confirmer la suppression du compte famille. */
export const DELETE_CONFIRMATION = 'SUPPRIMER';
/** Suppression du compte famille : mot de confirmation + mot de passe OU code PIN parent (un seul). */
export const FamilyDeleteSchema = z
  .object({
    confirmation: z.literal(DELETE_CONFIRMATION),
    password: z.string().min(1).max(200).optional(),
    pin: ParentPinSchema.optional(),
  })
  .refine((v) => (v.password === undefined) !== (v.pin === undefined), {
    message: 'Donne le mot de passe ou le code PIN (un seul).',
  });
export type FamilyDelete = z.infer<typeof FamilyDeleteSchema>;

/** Export des données de la famille (droit d'accès et portabilité) : lignes de chaque table concernée. */
export const FamilyExportSchema = z.object({
  exportedAt: z.string(),
  account: z.array(z.record(z.string(), z.unknown())),
  profiles: z.array(z.record(z.string(), z.unknown())),
  progression: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
  subscriptions: z.array(z.record(z.string(), z.unknown())),
});
export type FamilyExport = z.infer<typeof FamilyExportSchema>;

/**
 * Inscription. Production : `verification_required` (lien envoyé par e-mail, aucune session).
 * Plateforme de test (recette) : `active`, le compte est déjà ouvert et connecté (`me`).
 */
export const SignupResultSchema = z.object({
  status: z.enum(['verification_required', 'active']),
  email: z.string(),
  me: z.lazy(() => MeSchema).optional(),
});
export type SignupResult = z.infer<typeof SignupResultSchema>;
export const EmailResendSchema = z.object({ email: EmailSchema });
export const EmailResendResultSchema = z.object({});
/** Validation de l'adresse : le lien seul ne suffit pas, le mot de passe du compte est exigé. */
export const EmailVerifySchema = z.object({ token: z.string().min(20).max(200), password: z.string().min(1).max(200) });
export type EmailVerify = z.infer<typeof EmailVerifySchema>;
/** Modes d'ouverture de compte proposés par ce serveur (bouton Google masqué si non configuré). */
export const AuthOptionsSchema = z.object({
  google: z.boolean(),
  /** Longueur minimale d'un mot de passe (12 en production, 8 sur la plateforme de test). */
  passwordMinLength: z.number().int(),
  /** Plateforme de test : pas d'e-mail, parcours élève autonome masqué, « mot de passe oublié » = consigne. */
  recette: z.boolean(),
  /** Déconnexion du portail placé devant la plateforme, à enchaîner après celle de l'appareil. */
  portalLogoutUrl: z.url().optional(),
  /** Le portail ouvre lui-même la session (`GET /auth/portail`) : pas d'écran de connexion. */
  portalLogin: z.boolean().optional(),
});

export const PasswordForgotSchema = z.object({ email: EmailSchema });
export const PasswordResetSchema = z.object({ token: z.string().min(20).max(200), password: PasswordSchema });

/** Session courante : le compte, sa famille, et si les actions « parent » sont déverrouillées. */
export const MeSchema = z.object({
  /** `email` est nul pour un compte élève autonome (moins de 15 ans : aucune donnée personnelle). */
  account: z.object({ id: z.uuid(), email: z.string().nullable(), role: z.enum(ACCOUNT_ROLES) }),
  /** `autonomous` : famille d'un élève de moins de 15 ans, sans parent rattaché. */
  family: z.object({ id: z.uuid(), autonomous: z.boolean() }),
  /** Mot de passe confirmé récemment : actions réservées au parent permises (voir `parentUntil`). */
  parent: z.boolean(),
  /** Fin du déverrouillage parent (ISO), ou null. */
  parentUntil: z.string().nullable(),
  /** Un code PIN parent est choisi (sinon : mot de passe du compte). */
  hasPin: z.boolean(),
  /** Compte du portail sans mot de passe ni code PIN : le code est à choisir avant de continuer. */
  needsPin: z.boolean().optional(),
  /** Compte du portail sans mot de passe : seul le code PIN ouvre l'Espace parent. */
  noPassword: z.boolean().optional(),
});
export type Me = z.infer<typeof MeSchema>;

/**
 * Élève de moins de 15 ans (RGPD art. 8, loi française) : compte sans donnée personnelle
 * (pseudo + avatar + classe). L'âge sert à orienter l'inscription et n'est pas conservé.
 */
export const STUDENT_AUTONOMOUS_MAX_AGE = 14;
export const StudentSignupSchema = z.object({
  name: ProfileNameSchema,
  avatar: AvatarConfigSchema,
  grade: z.enum(GRADES),
  age: z.number().int().min(3).max(STUDENT_AUTONOMOUS_MAX_AGE, 'À partir de 15 ans, crée un compte avec ton e-mail.'),
});
export type StudentSignup = z.infer<typeof StudentSignupSchema>;

/** Code de récupération (montré une seule fois) : 16 caractères, avec ou sans tirets. */
export const RecoveryCodeSchema = z.string().trim().min(8).max(40);
export const StudentRecoverSchema = z.object({ code: RecoveryCodeSchema });
export const StudentSignupResultSchema = z.object({ me: MeSchema, recoveryCode: z.string() });
export type StudentSignupResult = z.infer<typeof StudentSignupResultSchema>;
export const RecoveryCodeResultSchema = z.object({ recoveryCode: z.string() });

/** Invitation : code court à durée limitée et à usage unique, saisi par un parent. */
export const InviteResultSchema = z.object({ code: z.string(), expiresAt: z.string() });
export type InviteResult = z.infer<typeof InviteResultSchema>;
export const FamilyJoinSchema = z.object({ code: z.string().trim().min(4).max(20) });
export const FamilyJoinResultSchema = z.object({ joined: z.array(z.string()) });
export type FamilyJoinResult = z.infer<typeof FamilyJoinResultSchema>;
