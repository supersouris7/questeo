import type { Chapter } from '../types.ts';
import { FCM1_ACCORDS } from './accords.ts';
import { FCM1_COMPLEMENTS } from './complements.ts';
import { FCM1_GROUPE_NOMINAL } from './groupe-nominal.ts';
import { FCM1_LECTURE } from './lecture.ts';
import { FCM2_LECTURE } from './lecture-cm2.ts';
import { FCM2_CULTURE } from './culture-cm2.ts';
import { FCM1_NATURE } from './nature.ts';
import { FCM1_ORTHOGRAPHE_MOTS } from './orthographe-mots.ts';
import { FCM1_PHRASES } from './phrases.ts';
import { FCM1_PRESENT } from './present.ts';
import { FCM1_TEMPS } from './temps.ts';
import { FCM2_NATURE } from './nature-cm2.ts';
import { FCM1_VERBE_SUJET } from './verbe-sujet.ts';
import { FCM1_VOCABULAIRE } from './vocabulaire.ts';
import { FCM2_GROUPE_NOMINAL } from './groupe-nominal-cm2.ts';
import { FCM2_PHRASE_SIMPLE } from './phrase-simple.ts';
import { FCM2_PHRASE_COMPLEXE } from './phrase-complexe.ts';
import { FCM2_ACCORDS } from './accords-cm2.ts';
import { FCM2_PASSE_SIMPLE } from './passe-simple.ts';
import { FCM2_TEMPS_COMPOSES } from './temps-composes.ts';
import { FCM2_VOCABULAIRE } from './vocabulaire-cm2.ts';
import { FCM2_ORTHOGRAPHE_MOTS } from './orthographe-mots-cm2.ts';
import { F6_PHRASE_SIMPLE } from './phrase-simple-6e.ts';
import { F6_PRONOMS_GN } from './pronoms-gn-6e.ts';
import { F6_PHRASE_COMPLEXE } from './phrase-complexe-6e.ts';
import { F6_CONJUGAISON } from './conjugaison-6e.ts';
import { F6_ACCORDS } from './accords-6e.ts';
import { F6_VOCABULAIRE } from './vocabulaire-6e.ts';

/** Français : chapitres publiés (ADR 0034). Le lot de contenu ajoute ses chapitres ici, sans toucher à catalog.ts. */
export const FRANCAIS_CHAPTERS: readonly Chapter[] = [
  {
    id: 'fcm1-phrases',
    subject: 'francais',
    grade: 'cm1',
    domain: 'grammaire',
    title: 'Types et formes de phrases',
    skills: FCM1_PHRASES,
  },
  {
    id: 'fcm1-verbe-sujet',
    subject: 'francais',
    grade: 'cm1',
    domain: 'grammaire',
    title: 'Le verbe et le sujet',
    skills: FCM1_VERBE_SUJET,
  },
  {
    id: 'fcm1-complements',
    subject: 'francais',
    grade: 'cm1',
    domain: 'grammaire',
    title: 'Les compléments',
    skills: FCM1_COMPLEMENTS,
  },
  {
    id: 'fcm1-nature-mots',
    subject: 'francais',
    grade: 'cm1',
    domain: 'grammaire',
    title: 'Nature des mots',
    skills: FCM1_NATURE,
  },
  {
    id: 'fcm1-groupe-nominal',
    subject: 'francais',
    grade: 'cm1',
    domain: 'grammaire',
    title: 'Le groupe nominal',
    skills: FCM1_GROUPE_NOMINAL,
  },
  {
    id: 'fcm1-accords',
    subject: 'francais',
    grade: 'cm1',
    domain: 'grammaire',
    title: 'Les accords',
    skills: FCM1_ACCORDS,
  },
  {
    id: 'fcm1-present',
    subject: 'francais',
    grade: 'cm1',
    domain: 'conjugaison',
    title: 'Conjuguer au présent',
    skills: FCM1_PRESENT,
  },
  {
    id: 'fcm1-temps',
    subject: 'francais',
    grade: 'cm1',
    domain: 'conjugaison',
    title: 'Imparfait, futur et passé composé',
    skills: FCM1_TEMPS,
  },
  {
    id: 'fcm1-vocabulaire',
    subject: 'francais',
    grade: 'cm1',
    domain: 'vocabulaire',
    title: 'Vocabulaire',
    skills: FCM1_VOCABULAIRE,
  },
  {
    id: 'fcm1-orthographe-mots',
    subject: 'francais',
    grade: 'cm1',
    domain: 'orthographe',
    title: 'Orthographe des mots',
    skills: FCM1_ORTHOGRAPHE_MOTS,
  },
  {
    id: 'fcm1-lecture',
    subject: 'francais',
    grade: 'cm1',
    domain: 'lecture',
    title: 'Lire et comprendre',
    skills: FCM1_LECTURE,
  },
  {
    id: 'fcm2-phrase-simple',
    subject: 'francais',
    grade: 'cm2',
    domain: 'grammaire',
    title: 'Analyser la phrase simple',
    skills: FCM2_PHRASE_SIMPLE,
  },
  {
    id: 'fcm2-nature-mots',
    subject: 'francais',
    grade: 'cm2',
    domain: 'grammaire',
    title: 'Nature des mots',
    skills: FCM2_NATURE,
  },
  {
    id: 'fcm2-groupe-nominal',
    subject: 'francais',
    grade: 'cm2',
    domain: 'grammaire',
    title: 'Le groupe nominal enrichi',
    skills: FCM2_GROUPE_NOMINAL,
  },
  {
    id: 'fcm2-phrase-complexe',
    subject: 'francais',
    grade: 'cm2',
    domain: 'grammaire',
    title: 'Phrase simple et phrase complexe',
    skills: FCM2_PHRASE_COMPLEXE,
  },
  {
    id: 'fcm2-accords',
    subject: 'francais',
    grade: 'cm2',
    domain: 'orthographe',
    title: 'Les accords',
    skills: FCM2_ACCORDS,
  },
  {
    id: 'fcm2-passe-simple',
    subject: 'francais',
    grade: 'cm2',
    domain: 'conjugaison',
    title: 'Le passé simple',
    skills: FCM2_PASSE_SIMPLE,
  },
  {
    id: 'fcm2-temps-composes',
    subject: 'francais',
    grade: 'cm2',
    domain: 'conjugaison',
    title: 'Les temps composés',
    skills: FCM2_TEMPS_COMPOSES,
  },
  {
    id: 'fcm2-vocabulaire',
    subject: 'francais',
    grade: 'cm2',
    domain: 'vocabulaire',
    title: 'Vocabulaire',
    skills: FCM2_VOCABULAIRE,
  },
  {
    id: 'fcm2-orthographe-mots',
    subject: 'francais',
    grade: 'cm2',
    domain: 'orthographe',
    title: 'Orthographe des mots',
    skills: FCM2_ORTHOGRAPHE_MOTS,
  },
  {
    id: 'fcm2-lecture',
    subject: 'francais',
    grade: 'cm2',
    domain: 'lecture',
    title: 'Lire et comprendre',
    skills: FCM2_LECTURE,
  },
  {
    id: 'fcm2-culture-litteraire',
    subject: 'francais',
    grade: 'cm2',
    domain: 'litterature',
    title: 'Culture littéraire',
    skills: FCM2_CULTURE,
  },
  {
    id: 'f6-phrase-simple',
    subject: 'francais',
    grade: '6e',
    domain: 'grammaire',
    title: 'La phrase simple',
    skills: F6_PHRASE_SIMPLE,
  },
  {
    id: 'f6-pronoms-gn',
    subject: 'francais',
    grade: '6e',
    domain: 'grammaire',
    title: 'Pronoms et groupe nominal',
    skills: F6_PRONOMS_GN,
  },
  {
    id: 'f6-phrase-complexe',
    subject: 'francais',
    grade: '6e',
    domain: 'grammaire',
    title: 'La phrase complexe',
    skills: F6_PHRASE_COMPLEXE,
  },
  {
    id: 'f6-conjugaison',
    subject: 'francais',
    grade: '6e',
    domain: 'conjugaison',
    title: 'Conjugaison',
    skills: F6_CONJUGAISON,
  },
  {
    id: 'f6-accords',
    subject: 'francais',
    grade: '6e',
    domain: 'orthographe',
    title: 'Les accords',
    skills: F6_ACCORDS,
  },
  {
    id: 'f6-vocabulaire',
    subject: 'francais',
    grade: '6e',
    domain: 'vocabulaire',
    title: 'Vocabulaire',
    skills: F6_VOCABULAIRE,
  },
];
