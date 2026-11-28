import type { Chapter } from '../types.ts';
import { ENGLISH_GRAMMAR_CHAPTERS } from './grammaire.ts';
import { ENGLISH_PRESENT_5E_CHAPTER } from './present-5e.ts';
import { ENGLISH_PAST_5E_CHAPTER } from './preterit.ts';
import { ENGLISH_PRESENT_SIMPLE_CHAPTER } from './present-simple.ts';
import { ENGLISH_PRESENTATION_CHAPTER } from './presentation.ts';
import { ENGLISH_BE_CHAPTERS } from './be.ts';
import { ENGLISH_BE_HAVE_CHAPTER } from './be-have.ts';
import { ENGLISH_MODALS_CHAPTER } from './modaux-imperatif.ts';
import { ENGLISH_BE_ING_CHAPTER } from './be-ing.ts';
import { ENGLISH_NOUN_PHRASE_6E_CHAPTER } from './groupe-nominal-6e.ts';
import { ENGLISH_TIME_CHAPTER } from './temps.ts';
import { ENGLISH_FAMILY_CHAPTER } from './famille.ts';
import { ENGLISH_TASTES_CHAPTER } from './gouts.ts';
import { ENGLISH_LISTENING_CHAPTER } from './ecoute.ts';
import { ENGLISH_NOUN_GROUP_CHAPTER } from './groupe-nominal.ts';
import { ENGLISH_LISTENING_CM2_CHAPTER } from './ecoute-cm2.ts';
import { ENGLISH_PLACES_CHAPTER } from './se-situer.ts';
import { ENGLISH_DAY_CHAPTER } from './journee.ts';
import { ENGLISH_SCHOOL_CHAPTER } from './ecole.ts';
import { ENGLISH_QUESTIONS_CHAPTER } from './poser-questions.ts';
import { ENGLISH_PRONOUNS_CHAPTER } from './pronoms.ts';
import { ENGLISH_WORDS_6E_CHAPTER } from './reperes-mots.ts';
import { ENGLISH_LISTENING_6E_CHAPTER } from './ecoute-6e.ts';
import { ENGLISH_VOCABULARY_6E_CHAPTER } from './vocabulaire-6e.ts';
import { ENGLISH_FUTURE_CHAPTER } from './futur.ts';
import { ENGLISH_ADVICE_CHAPTER } from './modaux-souhait.ts';
import { ENGLISH_LISTENING_5E_CHAPTER } from './ecoute-5e.ts';
import { ENGLISH_VOCABULARY_5E_CHAPTER } from './vocabulaire-5e.ts';

export const ANGLAIS_CHAPTERS: readonly Chapter[] = [
  ENGLISH_PRESENT_SIMPLE_CHAPTER,
  ENGLISH_BE_HAVE_CHAPTER,
  ENGLISH_MODALS_CHAPTER,
  ENGLISH_BE_ING_CHAPTER,
  ENGLISH_NOUN_PHRASE_6E_CHAPTER,
  ENGLISH_PRONOUNS_CHAPTER,
  ENGLISH_WORDS_6E_CHAPTER,
  ENGLISH_LISTENING_6E_CHAPTER,
  ENGLISH_VOCABULARY_6E_CHAPTER,
  ENGLISH_PRESENTATION_CHAPTER,
  ...ENGLISH_BE_CHAPTERS,
  ENGLISH_TIME_CHAPTER,
  ENGLISH_FAMILY_CHAPTER,
  ENGLISH_TASTES_CHAPTER,
  ENGLISH_LISTENING_CHAPTER,
  ENGLISH_NOUN_GROUP_CHAPTER,
  ENGLISH_PLACES_CHAPTER,
  ENGLISH_DAY_CHAPTER,
  ENGLISH_SCHOOL_CHAPTER,
  ENGLISH_QUESTIONS_CHAPTER,
  ENGLISH_LISTENING_CM2_CHAPTER,
  ENGLISH_PRESENT_5E_CHAPTER,
  ENGLISH_PAST_5E_CHAPTER,
  ENGLISH_FUTURE_CHAPTER,
  ENGLISH_ADVICE_CHAPTER,
  ENGLISH_LISTENING_5E_CHAPTER,
  ENGLISH_VOCABULARY_5E_CHAPTER,
  ...ENGLISH_GRAMMAR_CHAPTERS.filter((c) => ['4e', '3e'].includes(c.grade)),
];
