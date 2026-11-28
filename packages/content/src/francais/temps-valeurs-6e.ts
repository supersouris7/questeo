import { choice } from '../build.ts';
import type { Rng } from '../rng.ts';
import type { ClozeBlank, Level, QuestionDraft, Rich, Sens, Skill } from '../types.ts';
import { at, document, pickN, textTraps } from './outils.ts';
import { imparfait, passeSimple } from './passe-simple.donnees.ts';
import { forme } from './present.donnees.ts';
import { conjugue, passeCompose, participeAccorde } from './temps.donnees.ts';
import {
  ACCORDEES,
  CONTES,
  DECALEES,
  DOUBLES,
  ENONCES_DISCOURS,
  ENONCES_RECIT,
  MESSAGES,
  PAIRES,
  PRESENTS_DATES,
  PRESENTS_ENONCIATION,
  PRESENTS_NARRATION,
  PRESENTS_VERITE,
  RECITS_PRESENT,
  SCENES,
  TROUS,
  VALEURS,
  VERS_MESSAGE,
  VERS_RECIT,
  faitValeursTemps,
  sourcesValeursTemps,
  tempsDuRole,
  type Ensemble,
  type Epoque,
  type Passage,
  type PhrasePresent,
  type PhraseTemps,
  type Role,
  type TempsEnsemble,
  type TempsRecit,
  type TempsVerbal,
  type Trou,
  type Valeur,
} from './temps-valeurs-6e.donnees.ts';

/**
 * Chapitre « Valeurs des temps » (6e). Programme de français du cycle 3 (BO du 17 avril 2025), sixième : « Initier à
 * la notion de valeurs des temps […] des temps du discours, puis des temps du récit. »
 */
const programme = (id: string) =>
  `Programme de français du cycle 3 (BO du 17 avril 2025), 6e — « ${faitValeursTemps(id).citation} »`;

type Piege = readonly [string, string];

function qcm(
  rng: Rng,
  prompt: string,
  [bon, ...pieges]: readonly [string, ...Piege[]],
  hint: Rich,
  steps: readonly Rich[],
): QuestionDraft {
  const { answer, traps } = choice(
    rng,
    bon,
    pieges.map(([label, why]) => ({ label, why })),
  );
  return { prompt, answer, traps, hint, steps: [...steps, `Choisis : **${bon.replace(/\s*[.!?]$/, '')}**.`] };
}

function saisie(
  prompt: string,
  accepted: readonly string[],
  pieges: readonly Piege[],
  hint: Rich,
  steps: readonly Rich[],
): QuestionDraft {
  return {
    prompt,
    answer: { kind: 'text', accepted: [...accepted] },
    traps: textTraps(accepted, pieges),
    hint,
    steps: [...steps, `Écris : **${at(accepted, 0)}**.`],
  };
}

const liste = (options: readonly string[], juste: string): ClozeBlank => ({
  mode: 'list',
  options: [...options],
  correct: options.indexOf(juste),
});
const ecrit = (accepted: readonly string[]): ClozeBlank => ({ mode: 'text', accepted: [...accepted] });
const gras = (mots: readonly string[]) => mots.map((m) => `**${m}**`).join(' ; ');
const sansAccent = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '');
/** Les écritures données, puis les mêmes sans accent (la notion ne porte pas sur eux). */
const ecritures = (...list: readonly string[]): string[] => [...new Set([...list, ...list.map(sansAccent)])];

const capitale = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

// ───────────────────────── 1. Temps chronologique et temps verbal ─────────────────────────

const EPOQUES: readonly Epoque[] = ['passé', 'présent', 'futur'];
const TEMPS_VERBAUX: readonly TempsVerbal[] = ['présent', 'imparfait', 'futur', 'passé composé'];

export const ECRITURES_EPOQUE: Record<Epoque, readonly string[]> = {
  passé: ecritures('passé', 'le passé', 'dans le passé', 'au passé'),
  présent: ecritures('présent', 'le présent', 'dans le présent', 'au présent'),
  futur: ecritures('futur', 'le futur', 'dans le futur', 'au futur', 'avenir', 'l’avenir', 'à l’avenir'),
};
export const ECRITURES_TEMPS: Record<TempsVerbal, readonly string[]> = {
  présent: ecritures('présent', 'le présent', 'au présent', 'présent de l’indicatif'),
  imparfait: ecritures('imparfait', 'l’imparfait', 'à l’imparfait', 'imparfait de l’indicatif'),
  futur: ecritures(
    'futur',
    'le futur',
    'au futur',
    'futur simple',
    'le futur simple',
    'au futur simple',
    'futur de l’indicatif',
    'futur simple de l’indicatif',
  ),
  'passé composé': ecritures(
    'passé composé',
    'le passé composé',
    'au passé composé',
    'passé composé de l’indicatif',
    'passé-composé',
  ),
};

const INDICE_FORME: Record<TempsVerbal, string> = {
  présent: 'Vérifie : un seul mot, sans terminaison d’imparfait ni de futur.',
  imparfait: 'Repère la marque « -ai- » ou « -i- » avant la fin du verbe.',
  futur: 'Repère le « r » du futur, juste avant la terminaison.',
  'passé composé': 'Compte deux mots : être ou avoir, puis le participe passé.',
};
const FORME_FAUSSE: Record<TempsVerbal, string> = {
  présent: 'Au présent, le verbe tient en un mot, sans terminaison d’imparfait ni de futur.',
  imparfait: 'L’imparfait se reconnaît à la marque « -ai- » ou « -i- » avant la fin.',
  futur: 'Le futur montre un « r » juste avant des terminaisons comme -ai, -a, -ons.',
  'passé composé': 'Le passé composé s’écrit en deux mots : être ou avoir, puis le participe passé.',
};
const EPOQUE_FAUSSE: Record<Epoque, string> = {
  passé: 'Le passé, c’est avant le moment où l’on parle.',
  présent: 'Le présent chronologique, c’est le moment où l’on parle.',
  futur: 'Le futur, c’est après le moment où l’on parle.',
};

function chronologieDraft(rng: Rng, level: Level): QuestionDraft {
  const reperer = (x: PhraseTemps) => `Cherche les mots qui situent l’action : « ${x.repere} ».`;
  switch (level) {
    case 1: {
      const x = rng.pick(ACCORDEES);
      return qcm(
        rng,
        `Choisis l’époque dont parle cette phrase : « ${x.phrase} »`,
        [`Le ${x.epoque}`, ...EPOQUES.filter((e) => e !== x.epoque).map((e) => [`Le ${e}`, EPOQUE_FAUSSE[e]] as const)],
        'Cherche les mots qui disent quand cela arrive.',
        [reperer(x), 'Demande-toi : est-ce avant, pendant ou après le moment où l’on parle ?'],
      );
    }
    case 2: {
      const x = rng.pick(ACCORDEES);
      return qcm(
        rng,
        `Choisis le temps verbal de « ${x.verbe} » dans la phrase : « ${x.phrase} »`,
        [
          capitale(x.temps),
          ...TEMPS_VERBAUX.filter((t) => t !== x.temps).map((t) => [capitale(t), FORME_FAUSSE[t]] as const),
        ],
        'Regarde la forme du verbe : sa fin et le nombre de mots.',
        [`Regarde seulement la forme « ${x.verbe} ».`, INDICE_FORME[x.temps]],
      );
    }
    case 3:
    case 4: {
      const x = rng.pick(rng.pick([DECALEES, DECALEES, ACCORDEES]));
      const aide = level === 3;
      return {
        prompt: `${aide ? 'Choisis' : 'Écris'} le temps verbal de « ${x.verbe} », puis l’époque de l’action : « ${x.phrase} »`,
        answer: {
          kind: 'cloze',
          parts: ['Temps verbal : ', ' ; époque : ', '.'],
          blanks: aide
            ? [liste(TEMPS_VERBAUX, x.temps), liste(EPOQUES, x.epoque)]
            : [ecrit(ECRITURES_TEMPS[x.temps]), ecrit(ECRITURES_EPOQUE[x.epoque])],
        },
        traps: [],
        hint: aide
          ? 'Regarde d’abord la forme du verbe, puis les mots qui indiquent le moment.'
          : 'La forme du verbe et le moment de l’action ne vont pas toujours ensemble.',
        steps: [
          `Regarde la forme « ${x.verbe} ». ${INDICE_FORME[x.temps]}`,
          reperer(x),
          `Retiens les deux réponses : ${gras([x.temps, x.epoque])}.`,
        ],
      };
    }
    default: {
      const message = rng.pick(MESSAGES);
      const phrases = rng.shuffle(message.phrases);
      return {
        prompt: 'Lis le message. Pour chaque phrase, écris le temps verbal du verbe indiqué, puis l’époque.',
        figure: document(
          message.titre,
          phrases.map((x) => `${x.phrase} (verbe : ${x.verbe})`),
        ),
        answer: {
          kind: 'cloze',
          parts: [
            'Phrase 1, temps verbal : ',
            ' ; époque : ',
            '. Phrase 2, temps verbal : ',
            ' ; époque : ',
            '. Phrase 3, temps verbal : ',
            ' ; époque : ',
            '.',
          ],
          blanks: phrases.flatMap((x) => [ecrit(ECRITURES_TEMPS[x.temps]), ecrit(ECRITURES_EPOQUE[x.epoque])]),
        },
        traps: [],
        hint: 'Traite une phrase à la fois : la forme du verbe, puis le moment.',
        steps: [
          'Lis chaque phrase seule et observe la forme du verbe.',
          `Repère les mots du temps : ${phrases.map((x) => `« ${x.repere} »`).join(' ; ')}.`,
          `Retiens les temps verbaux : ${gras(phrases.map((x) => x.temps))}.`,
          `Retiens les époques : ${gras(phrases.map((x) => x.epoque))}.`,
        ],
      };
    }
  }
}

// ───────────────────────── 2. Valeurs du présent ─────────────────────────

const NOM_VALEUR: Record<Valeur, string> = {
  énonciation: 'présent d’énonciation',
  'vérité générale': 'présent de vérité générale',
  narration: 'présent de narration',
};
const SENS_VALEUR: Record<Valeur, string> = {
  énonciation: 'le fait a lieu quand on parle',
  'vérité générale': 'c’est vrai en tout temps',
  narration: 'il raconte un fait passé',
};
const POURQUOI_PAS: Record<Valeur, string> = {
  énonciation: 'Le présent d’énonciation montre un fait qui a lieu au moment où l’on parle.',
  'vérité générale': 'Le présent de vérité générale énonce une idée vraie en tout temps.',
  narration: 'Le présent de narration remplace un temps du passé dans un récit.',
};
const OBSERVE_VALEUR: Record<Valeur, string> = {
  énonciation: 'Observe : quelqu’un parle de ce qui se passe sous ses yeux ou maintenant.',
  'vérité générale': 'Observe : la phrase vaut pour tout le monde, hier comme demain.',
  narration: 'Observe : on raconte un fait passé, daté ou placé dans une histoire.',
};
const QUESTION_VALEUR = 'Demande-toi : quand ce fait a-t-il lieu ?';
const INDICE_VALEUR = 'Demande-toi quand le fait a lieu, par rapport au moment où l’on parle.';

export const ECRITURES_VALEUR: Record<Valeur, readonly string[]> = {
  énonciation: ecritures(
    'énonciation',
    'présent d’énonciation',
    'd’énonciation',
    'l’énonciation',
    'le présent d’énonciation',
    'présent de l’énonciation',
    'de l’énonciation',
  ),
  'vérité générale': ecritures(
    'vérité générale',
    'présent de vérité générale',
    'de vérité générale',
    'une vérité générale',
    'le présent de vérité générale',
    'présent gnomique',
    'présent atemporel',
  ),
  narration: ecritures(
    'narration',
    'présent de narration',
    'de narration',
    'la narration',
    'le présent de narration',
    'présent narratif',
    'narratif',
    'présent historique',
    'historique',
  ),
};

const PRESENTS: readonly PhrasePresent[] = [...PRESENTS_ENONCIATION, ...PRESENTS_VERITE, ...PRESENTS_NARRATION];
/** Niveau 4 : verbes qu’on retrouve avec une autre valeur, et récits datés. */
export const PRESENTS_PIEGES: readonly PhrasePresent[] = [
  ...PRESENTS.filter((x) => PRESENTS.some((y) => y.verbe === x.verbe && y.valeur !== x.valeur)),
  ...PRESENTS_DATES,
];

const libelle = (v: Valeur) => `${capitale(NOM_VALEUR[v])} : ${SENS_VALEUR[v]}`;
const deValeur: Record<Valeur, readonly PhrasePresent[]> = {
  énonciation: PRESENTS_ENONCIATION,
  'vérité générale': PRESENTS_VERITE,
  narration: PRESENTS_NARRATION,
};

function presentDraft(rng: Rng, level: Level): QuestionDraft {
  switch (level) {
    case 1: {
      const x = rng.pick(deValeur[rng.pick(VALEURS)]);
      return qcm(
        rng,
        `Choisis la valeur du présent « ${x.verbe} » : « ${x.phrase} »`,
        [
          libelle(x.valeur),
          ...VALEURS.filter((v) => v !== x.valeur).map((v) => [libelle(v), POURQUOI_PAS[v]] as const),
        ],
        INDICE_VALEUR,
        [QUESTION_VALEUR, OBSERVE_VALEUR[x.valeur]],
      );
    }
    case 2: {
      const valeur = rng.pick(VALEURS);
      const bonne = rng.pick(deValeur[valeur]);
      const autres = VALEURS.filter((v) => v !== valeur).map((v) => {
        const x = rng.pick(deValeur[v]);
        return [x.phrase, `Ici, c’est un ${NOM_VALEUR[v]} : ${SENS_VALEUR[v]}.`] as const;
      });
      const passe = rng.pick(PAIRES);
      return qcm(
        rng,
        `Choisis la phrase qui contient un ${NOM_VALEUR[valeur]}.`,
        [
          bonne.phrase,
          ...autres,
          [`${passe.decor} ${passe.evenement}`, 'Aucun verbe n’est au présent dans ces phrases.'],
        ],
        INDICE_VALEUR,
        [
          'Écarte les phrases dont aucun verbe n’est au présent.',
          OBSERVE_VALEUR[valeur],
          `Repère le verbe « ${bonne.verbe} » dans la bonne phrase.`,
        ],
      );
    }
    case 3: {
      const choisies = pickN(rng, PRESENTS, 3);
      return {
        prompt: 'Lis les trois phrases, puis choisis la valeur de chaque présent indiqué.',
        figure: document(
          'Trois présents',
          choisies.map((x) => `${x.phrase} (verbe : ${x.verbe})`),
        ),
        answer: {
          kind: 'cloze',
          parts: ['Phrase 1 : ', '. Phrase 2 : ', '. Phrase 3 : ', '.'],
          blanks: choisies.map((x) => liste(VALEURS, x.valeur)),
        },
        traps: [],
        hint: 'Une même valeur peut revenir deux fois : juge chaque phrase seule.',
        steps: [
          'Lis chaque phrase seule et repère son verbe.',
          'Demande-toi pour chacune : maintenant, en tout temps, ou dans un récit passé ?',
          `Retiens les valeurs : ${gras(choisies.map((x) => x.valeur))}.`,
        ],
      };
    }
    case 4: {
      const x = rng.pick(PRESENTS_PIEGES);
      return saisie(
        `Écris la valeur du présent « ${x.verbe} » : « ${x.phrase} »`,
        ECRITURES_VALEUR[x.valeur],
        VALEURS.filter((v) => v !== x.valeur).flatMap((v) =>
          [v, NOM_VALEUR[v]].map((t) => [t, POURQUOI_PAS[v]] as const),
        ),
        'Ne juge pas le verbe seul : lis toute la phrase.',
        [QUESTION_VALEUR, OBSERVE_VALEUR[x.valeur]],
      );
    }
    default: {
      const recit = rng.pick(RECITS_PRESENT);
      return {
        prompt: `Lis le texte « ${recit.titre} », puis écris la valeur de chaque présent suivi d’une lettre.`,
        figure: document(recit.titre, recit.lignes),
        answer: {
          kind: 'cloze',
          parts: ['Verbe (A) : ', '. Verbe (B) : ', '. Verbe (C) : ', '.'],
          blanks: recit.verbes.map(([, , valeur]) => ecrit(ECRITURES_VALEUR[valeur])),
        },
        traps: [],
        hint: 'Regarde les guillemets, puis demande-toi qui parle et à quel moment.',
        steps: [
          'Repère les paroles entre guillemets et le texte qui raconte.',
          'Cherche les proverbes : ils valent en tout temps.',
          'Demande-toi si le verbe raconte le passé ou montre le moment des paroles.',
          `Retiens les valeurs : ${gras(recit.verbes.map(([, , v]) => v))}.`,
        ],
      };
    }
  }
}

// ───────────────────────── 3. Imparfait et passé simple ─────────────────────────

const OBSERVE_ROLE: Record<Role, string> = {
  décor: 'Observe : le verbe décrit un état qui dure.',
  habitude: 'Observe : le fait se répète, c’est une habitude.',
  événement: 'Observe : le fait survient et fait avancer l’histoire.',
};
const AUTRE_TEMPS: Record<TempsRecit, string> = {
  imparfait: 'L’imparfait montre ce qui dure ou se répète, pas un événement qui survient.',
  'passé simple': 'Le passé simple montre un événement vu en entier, pas ce qui dure ou se répète.',
};

const formeRecit = (t: TempsRecit, x: Pick<Trou, 'verbe' | 'personne'>): string =>
  t === 'imparfait' ? imparfait(x.verbe, x.personne) : passeSimple(x.verbe, x.personne);

const phraseTrou = (x: Trou) => `${x.repere} ${x.sujet} ___ ${x.suite}.`;

function piegesRecit(x: Trou): Piege[] {
  const juste = tempsDuRole(x.role);
  const autre: TempsRecit = juste === 'imparfait' ? 'passé simple' : 'imparfait';
  return [
    [formeRecit(autre, x), AUTRE_TEMPS[autre]],
    [forme(x.verbe, x.personne), 'C’est le présent : ce récit est au passé.'],
    [conjugue('futur', x.verbe, x.personne), 'C’est le futur : ce récit est au passé.'],
  ];
}

function recitDraft(rng: Rng, level: Level): QuestionDraft {
  switch (level) {
    case 1: {
      const x = rng.pick(PAIRES);
      const decor = rng.int(0, 1) === 0;
      const verbe = decor ? x.verbeDecor : x.verbeEvenement;
      const roles = {
        dure: 'Il montre le décor ou une action en cours',
        survient: 'Il raconte un événement qui survient',
        avenir: 'Il annonce ce qui arrivera plus tard',
      };
      const bon = decor ? roles.dure : roles.survient;
      return qcm(
        rng,
        `Lis ce récit : « ${x.decor} ${x.evenement} » Choisis ce que fait le verbe « ${verbe} ».`,
        [
          bon,
          decor
            ? [roles.survient, 'L’événement soudain est raconté par l’autre verbe, au passé simple.']
            : [roles.dure, 'Ce verbe ne dure pas : il survient d’un coup.'],
          [roles.avenir, 'Les deux verbes sont à des temps du passé.'],
        ],
        'Demande-toi si le fait dure déjà ou s’il arrive d’un coup.',
        [
          `Lis la phrase qui contient « ${verbe} ».`,
          decor ? 'Observe : ce que dit ce verbe dure déjà quand l’événement arrive.' : OBSERVE_ROLE.événement,
        ],
      );
    }
    case 2: {
      const x = rng.pick(TROUS);
      const juste = tempsDuRole(x.role);
      return qcm(
        rng,
        `Complète ce récit au passé avec le verbe « ${x.verbe} » : « ${phraseTrou(x)} »`,
        [formeRecit(juste, x), ...piegesRecit(x)],
        'Les premiers mots disent si le fait dure, se répète ou survient.',
        [`Lis les premiers mots : « ${x.repere.replace(/,$/, '')} ».`, OBSERVE_ROLE[x.role]],
      );
    }
    case 3: {
      const x = rng.pick(TROUS);
      const juste = tempsDuRole(x.role);
      return saisie(
        `Écris « ${x.verbe} » à l’imparfait ou au passé simple : « ${phraseTrou(x)} »`,
        [formeRecit(juste, x)],
        piegesRecit(x),
        'Les premiers mots disent si le fait dure, se répète ou survient.',
        [
          `Lis les premiers mots : « ${x.repere.replace(/,$/, '')} ».`,
          OBSERVE_ROLE[x.role],
          `Mets « ${x.verbe} » ${juste === 'imparfait' ? 'à l’imparfait' : 'au passé simple'}, avec le sujet « ${x.sujet} ».`,
        ],
      );
    }
    case 4: {
      const x = rng.pick(DOUBLES);
      const cours = imparfait(x.cours.verbe, x.cours.personne);
      const survient = passeSimple(x.survient.verbe, x.survient.personne);
      return {
        prompt: `Écris « ${x.cours.verbe} » et « ${x.survient.verbe} » à l’imparfait ou au passé simple.`,
        answer: {
          kind: 'cloze',
          parts: [
            `${x.cours.sujet} `,
            ` ${x.cours.suite} quand, soudain, ${x.survient.sujet} `,
            ` ${x.survient.suite}.`,
          ],
          blanks: [ecrit([cours]), ecrit([survient])],
        },
        traps: [],
        hint: 'Un verbe plante la situation, l’autre fait avancer l’histoire.',
        steps: [
          `Lis « quand, soudain » : « ${x.survient.verbe} » dit un fait qui survient. Mets-le au passé simple.`,
          `Observe « ${x.cours.verbe} » : l’action dure déjà. Mets-le à l’imparfait.`,
          `Retiens les deux formes : ${gras([cours, survient])}.`,
        ],
      };
    }
    default: {
      const conte = rng.pick(CONTES);
      const parts = conte.trous.reduce<string[]>(
        (acc, x, i) => {
          acc.push(`${acc.pop() ?? ''}${i === 0 ? '' : ' '}${x.repere} ${x.sujet} `);
          acc.push(` (${x.verbe}) ${x.suite}.`);
          return acc;
        },
        [''],
      );
      const formes = conte.trous.map((x) => formeRecit(tempsDuRole(x.role), x));
      return {
        prompt: `Lis le conte « ${conte.titre} » et écris chaque verbe à l’imparfait ou au passé simple.`,
        answer: { kind: 'cloze', parts, blanks: formes.map((f) => ecrit([f])) },
        traps: [],
        hint: 'Pour chaque phrase, lis les premiers mots, puis vérifie l’accord avec le sujet.',
        steps: [
          'Repère les mots placés avant chaque sujet.',
          'Mets à l’imparfait ce qui décrit ou se répète.',
          'Mets au passé simple ce qui survient et fait avancer l’histoire.',
          `Retiens les formes : ${gras(formes)}.`,
        ],
      };
    }
  }
}

// ───────────────────────── 4. Discours et récit ─────────────────────────

const ENSEMBLES: readonly Ensemble[] = ['discours', 'récit'];
const autreEnsemble = (e: Ensemble): Ensemble => (e === 'discours' ? 'récit' : 'discours');
const POURQUOI_ENSEMBLE: Record<Ensemble, string> = {
  discours: 'Le discours est lié au moment où quelqu’un parle : je, tu, hier, demain, ici.',
  récit: 'Le récit raconte sans lien avec le moment où l’on parle, souvent au passé simple.',
};
const OBSERVE_ENSEMBLE: Record<Ensemble, string> = {
  discours: 'Demande-toi qui parle : la phrase est liée à ce moment.',
  récit: 'Observe : rien ne relie la phrase au moment où l’on parle.',
};
const QUEL_TEMPS: Record<TempsEnsemble, string> = {
  présent: 'au présent',
  'passé composé': 'au passé composé',
  futur: 'au futur',
  'passé simple': 'au passé simple',
};
const ECRITURES_ENSEMBLE: Record<Ensemble, readonly string[]> = {
  discours: ecritures('discours', 'le discours', 'du discours'),
  récit: ecritures('récit', 'le récit', 'du récit'),
};
const etiquette = (e: Ensemble, t: TempsEnsemble) => `${capitale(e)}, verbe ${QUEL_TEMPS[t]}`;

const messageDe = (x: Passage) => passeCompose(x.verbe, { texte: x.sujet, personne: x.personne, genre: x.genre });

/** Erreurs typiques quand on passe d’un temps à l’autre. */
function piegesPassage(x: Passage, vers: 'passé composé' | 'passé simple'): Piege[] {
  const autre: Piege =
    vers === 'passé composé'
      ? [passeSimple(x.verbe, x.personne), 'C’est le passé simple, un temps du récit : le message est du discours.']
      : [messageDe(x), 'C’est le passé composé : dans ce récit, on attend le passé simple.'];
  return [
    autre,
    [imparfait(x.verbe, x.personne), 'C’est l’imparfait : l’action est ici vue en entier.'],
    [forme(x.verbe, x.personne), 'C’est le présent : l’action est passée.'],
    ...(vers === 'passé composé'
      ? [
          [
            participeAccorde(x.verbe, { texte: x.sujet, personne: x.personne, genre: x.genre }),
            'Il manque l’auxiliaire.',
          ] as const,
        ]
      : []),
  ];
}

function discoursDraft(rng: Rng, level: Level): QuestionDraft {
  switch (level) {
    case 1: {
      const e = rng.pick(ENSEMBLES);
      const [oui, non] = e === 'discours' ? [ENONCES_DISCOURS, ENONCES_RECIT] : [ENONCES_RECIT, ENONCES_DISCOURS];
      const bon = rng.pick(oui);
      return qcm(
        rng,
        `Choisis la phrase qui appartient au ${e}.`,
        [bon.phrase, ...pickN(rng, non, 2).map((x) => [x.phrase, POURQUOI_ENSEMBLE[autreEnsemble(e)]] as const)],
        'Cherche si quelqu’un parle à quelqu’un, au moment où il parle.',
        ['Compare les trois phrases : qui parle, et quand ?', OBSERVE_ENSEMBLE[e]],
      );
    }
    case 2: {
      const x = rng.pick(rng.pick([ENONCES_DISCOURS, ENONCES_RECIT]));
      const faux: TempsEnsemble = x.ensemble === 'discours' ? 'passé simple' : 'passé composé';
      const autre = autreEnsemble(x.ensemble);
      return qcm(
        rng,
        `Choisis la bonne description de cette phrase : « ${x.phrase} »`,
        [
          etiquette(x.ensemble, x.temps),
          [etiquette(autre, x.temps), POURQUOI_ENSEMBLE[autre]],
          [etiquette(x.ensemble, faux), `Regarde la forme de « ${x.verbe} » : elle est ${QUEL_TEMPS[x.temps]}.`],
          [etiquette(autre, faux), `${POURQUOI_ENSEMBLE[autre]} Regarde aussi la forme du verbe.`],
        ],
        'Regarde qui parle, puis la forme du verbe.',
        [OBSERVE_ENSEMBLE[x.ensemble], `Observe ensuite la forme de « ${x.verbe} ».`],
      );
    }
    case 3: {
      const x = rng.pick(VERS_MESSAGE);
      const bon = messageDe(x);
      return saisie(
        `Écris le verbe au passé composé pour ce message. Récit : « Ce jour-là, ${x.sujet} ${passeSimple(x.verbe, x.personne)} ${x.suite}. » Message : « Hier, ${x.sujet} ___ ${x.suite}. »`,
        [bon],
        piegesPassage(x, 'passé composé'),
        'Dans un message sur hier, le verbe s’écrit en deux mots.',
        [
          'Repère le message : il parle d’hier à quelqu’un.',
          'Mets l’auxiliaire au présent, puis ajoute le participe passé.',
        ],
      );
    }
    case 4: {
      const x = rng.pick(VERS_RECIT);
      const bon = passeSimple(x.verbe, x.personne);
      return saisie(
        `Écris le verbe au temps du récit qui montre l’action en entier. Message : « Hier, ${x.sujet} ${messageDe(x)} ${x.suite}. » Récit : « Ce jour-là, ${x.sujet} ___ ${x.suite}. »`,
        [bon],
        piegesPassage(x, 'passé simple'),
        'Dans un récit, une action passée vue en entier s’écrit en un seul mot.',
        [
          'Repère le récit : il commence par « Ce jour-là ».',
          `Retrouve l’infinitif « ${x.verbe} » derrière le verbe du message.`,
          'Mets ce verbe au passé simple.',
        ],
      );
    }
    default: {
      const s = rng.pick(SCENES);
      const pc = messageDe(s.message);
      const ps = passeSimple(s.narration.verbe, s.narration.personne);
      return {
        prompt:
          'Lis la scène. Écris discours ou récit pour chaque lettre. Puis complète les paroles au passé composé et le récit au passé simple.',
        figure: document(s.titre, s.lignes),
        answer: {
          kind: 'cloze',
          parts: [
            'Verbe (A) : ',
            '. Verbe (B) : ',
            '. Verbe (C) : ',
            `. Paroles : « ${s.message.avant}${s.message.sujet} `,
            ` (${s.message.verbe}) ${s.message.suite}. » Récit : ${s.narration.avant}${s.narration.sujet} `,
            ` (${s.narration.verbe}) ${s.narration.suite}.`,
          ],
          blanks: [...s.verbes.map(([, , e]) => ecrit(ECRITURES_ENSEMBLE[e])), ecrit([pc]), ecrit([ps])],
        },
        traps: [],
        hint: 'Les guillemets montrent les paroles ; le reste est raconté.',
        steps: [
          'Repère les guillemets : les paroles sont du discours.',
          'Observe le texte sans guillemets : le narrateur raconte, c’est du récit.',
          `Retiens pour (A), (B), (C) : ${gras(s.verbes.map(([, , e]) => e))}.`,
          `Écris les deux formes : ${gras([pc, ps])}.`,
        ],
      };
    }
  }
}

// ───────────────────────── Notions ─────────────────────────

const sens = (type: Sens['type'], text: string, factId: string): Sens => {
  const f = faitValeursTemps(factId);
  return { type, text, source: f.source, citation: f.citation };
};

interface Notion {
  readonly id: string;
  readonly title: string;
  readonly memo: Skill['lesson']['memo'];
  readonly factId: string;
  readonly faits: readonly string[];
  readonly verbes?: Parameters<typeof sourcesValeursTemps>[1];
  readonly sens: readonly Sens[];
  readonly generate: Skill['generate'];
}

const skill = (n: Notion): Skill => ({
  id: n.id,
  title: n.title,
  levels: 5,
  version: 1,
  lesson: {
    memo: n.memo,
    source: programme(n.factId),
    sources: [...new Set([...sourcesValeursTemps([n.factId, ...n.faits], n.verbes), ...n.sens.map((s) => s.source)])],
  },
  sens: n.sens,
  generate: n.generate,
});

export const F6_VALEURS_TEMPS: readonly Skill[] = [
  skill({
    id: 'f6-temps-chronologique-verbal',
    title: 'Temps chronologique et temps verbal',
    memo: [
      'Le **temps chronologique**, c’est l’époque : passé, présent ou futur.',
      'Le **temps verbal**, c’est la forme du verbe, comme l’imparfait ou le passé composé.',
      'Les deux peuvent différer : « Ce soir, je rentre tard » parle du futur, au présent.',
    ],
    factId: 'vt-distinction',
    faits: [
      'vt-epoques',
      'vt-temps-verbe',
      'vt-conventionnel',
      'vt-futur-proche',
      'vt-marques',
      'vt-composition',
      'vt-present-narration',
      'vt-present-epoque',
    ],
    sens: [
      sens(
        'usage',
        'Dire « J’arrive dans un instant », c’est parler de la suite avec un verbe au présent.',
        'vt-futur-proche',
      ),
      sens('savais-tu', 'En grammaire, le mot « temps » cache plusieurs idées qu’il faut distinguer.', 'vt-ambigu'),
    ],
    generate: chronologieDraft,
  }),
  skill({
    id: 'f6-valeurs-present',
    title: 'Les valeurs du présent',
    memo: [
      'Le **présent d’énonciation** montre un fait qui a lieu quand on parle : « Je t’écoute. »',
      'Le **présent de vérité générale** dit une idée vraie en tout temps : « La Terre tourne. »',
      'Le **présent de narration** raconte le passé : « Il faisait nuit quand, soudain, un chien aboie ! »',
    ],
    factId: 'vt-initier',
    faits: [
      'vt-valeurs',
      'vt-present-enonciation',
      'vt-present-verite',
      'vt-present-narration',
      'vt-verite-proverbes',
      'vt-enonciation',
    ],
    sens: [
      sens(
        'usage',
        'Dans un récit, passer au présent peut rendre une scène passée plus vivante.',
        'vt-present-narration',
      ),
      sens(
        'savais-tu',
        'Les proverbes aiment le présent : « Pierre qui roule n’amasse pas mousse. »',
        'vt-verite-proverbes',
      ),
    ],
    generate: presentDraft,
  }),
  skill({
    id: 'f6-imparfait-passe-simple',
    title: 'Imparfait et passé simple dans le récit',
    memo: [
      'Dans un récit, l’**imparfait** montre le décor, une habitude ou une action en cours.',
      'Le **passé simple** montre un événement vu en entier, qui fait avancer l’histoire.',
      'Exemple : « Il neigeait quand un renard apparut. »',
    ],
    factId: 'vt-initier',
    faits: ['vt-imparfait-inacheve', 'vt-imparfait-roles', 'vt-ps-totalite', 'vt-ps-evenement', 'vt-recit-temps'],
    verbes: [...new Set([...TROUS, ...CONTES.flatMap((c) => c.trous)].map((t) => t.verbe))].concat(
      DOUBLES.flatMap((d) => [d.cours.verbe, d.survient.verbe]),
    ),
    sens: [
      sens(
        'histoire',
        'Passé simple, passé composé, passé antérieur : le latin n’avait pour eux qu’un temps, le parfait.',
        'vt-latin',
      ),
      sens(
        'usage',
        'Pour décrire un état ou dire ce qui se répète, au passé, l’imparfait est ton outil.',
        'vt-imparfait-roles',
      ),
    ],
    generate: recitDraft,
  }),
  skill({
    id: 'f6-discours-recit',
    title: 'Temps du discours et temps du récit',
    memo: [
      'Le **discours** est lié au moment où l’on parle : présent, passé composé, futur.',
      'Le **récit** est coupé de ce moment : on y trouve surtout le passé simple et l’imparfait.',
      'Compare : « Hier, j’ai couru » et « Ce jour-là, il courut ».',
    ],
    factId: 'vt-initier',
    faits: [
      'vt-discours',
      'vt-recit-coupe',
      'vt-recit-temps',
      'vt-pc',
      'vt-pc-lien',
      'vt-futur',
      'vt-present-epoque',
      'vt-ps-historique',
    ],
    verbes: [
      ...new Set(
        [...VERS_MESSAGE, ...VERS_RECIT, ...SCENES.flatMap((s) => [s.message, s.narration])].map((x) => x.verbe),
      ),
    ],
    sens: [
      sens('histoire', 'On doit à Émile Benveniste la distinction entre le récit et le discours.', 'vt-benveniste'),
      sens('savais-tu', 'Le passé simple porte parfois un autre nom : le passé historique.', 'vt-ps-historique'),
    ],
    generate: discoursDraft,
  }),
];
