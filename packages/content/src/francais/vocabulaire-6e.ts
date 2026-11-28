import { choice, type Option } from '../build.ts';
import type { Rng } from '../rng.ts';
import type { Level, QuestionDraft, Rich, Sens, Skill } from '../types.ts';
import { at, document, pickN } from './outils.ts';
import { associer as associerSansEtapes, ecrire, initiale } from './vocabulaire.ts';
import {
  CHAMPS,
  DECOUPES,
  ENTREES,
  FIGURES,
  MOTS_COMPOSES,
  PHRASES_CONSTRUITES,
  POLYSEMES,
  TERMES,
  faitVocabulaire6e,
  sourcesVocabulaire6e,
  type Champ,
  type Classe,
  type Decoupe,
  type Discipline,
  type Entree,
  type Figure,
  type MotChamp,
  type Reponse,
  type Terme,
} from './vocabulaire-6e.donnees.ts';

/**
 * Chapitre « Vocabulaire » (6e). Programme de français du cycle 3 (BO du 17 avril 2025), vocabulaire, sixième :
 * « Enrichir son vocabulaire dans toutes les disciplines » et « Établir des relations entre les mots ».
 */
const programme = (id: string) =>
  `Programme de français du cycle 3 (BO du 17 avril 2025), vocabulaire — « ${faitVocabulaire6e(id).citation} »`;

const maj = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const remplir = (phrase: string, mot: string) => phrase.replace('{}', mot);
const citer = (mots: readonly string[]) => mots.map((m) => `« ${m} »`).join(', ');

/** Éléments tirés au hasard, jamais deux « confondables » ensemble. */
function distincts<T>(rng: Rng, items: readonly T[], n: number, confondus: (a: T, b: T) => boolean): T[] {
  const choisis: T[] = [];
  for (const x of rng.shuffle(items)) {
    if (choisis.length < n && !choisis.some((y) => confondus(x, y))) choisis.push(x);
  }
  return choisis;
}

const fleches = (paires: readonly (readonly [string, string])[]) => paires.map(([a, b]) => `${a} → ${b}`).join(' ; ');

/** Association guidée : la méthode, puis les paires (en deux bulles à partir de 4 paires). */
function associer(
  rng: Rng,
  prompt: string,
  paires: readonly (readonly [string, string])[],
  hint: string,
  [methode, puis]: readonly [Rich, Rich],
): QuestionDraft {
  const q = associerSansEtapes(rng, prompt, paires, hint, []);
  const fin: Rich[] =
    paires.length > 3
      ? [`Relie d’abord : **${fleches(paires.slice(0, 3))}**.`, `Relie ensuite : **${fleches(paires.slice(3))}**.`]
      : [puis, `Relie ainsi : **${fleches(paires)}**.`];
  return { ...q, steps: [methode, ...fin] };
}

interface Ligne {
  readonly texte: string;
  readonly accepted: readonly string[];
}

/** Document numéroté : une réponse à écrire par ligne. */
function lignesAEcrire(
  q: { prompt: string; titre: string; hint: string; etapes: readonly Rich[] },
  lignes: readonly Ligne[],
): QuestionDraft {
  return {
    prompt: q.prompt,
    figure: document(
      q.titre,
      lignes.map((l) => l.texte),
    ),
    answer: {
      kind: 'cloze',
      parts: [...lignes.map((_, i) => `${i === 0 ? '' : '. '}Ligne ${i + 1} : `), '.'],
      blanks: lignes.map((l) => ({ mode: 'text' as const, accepted: [...l.accepted] })),
    },
    hint: q.hint,
    steps: [...q.etapes, `Écris dans l’ordre : **${lignes.map((l) => l.accepted[0]).join(' ; ')}**.`],
  };
}

// ───────────────────────── 1. Préfixe, radical, suffixe ─────────────────────────

const REPERE_MORCEAUX = 'Repère les morceaux : **préfixe** devant, **radical** au milieu, **suffixe** après.';
const nu = (morceau: string) => morceau.replaceAll('-', '');
const morceaux = (d: Decoupe) => `« ${d.prefixe} », « ${d.radical} », « ${d.suffixe} »`;
const voir = (d: Decoupe) => `Observe « ${d.mot} » : ${morceaux(d)}.`;
const SIMPLES_ET_RADICAL_STABLE = DECOUPES.filter((d) => !d.radicalChange);
const ADJECTIFS = DECOUPES.filter((d) => d.suffixe !== '-ement');

const POURQUOI_MORCEAU = {
  préfixe: 'Ce morceau se place au début du mot : c’est le préfixe.',
  radical: 'Ce morceau porte le sens du mot : c’est le radical.',
  suffixe: 'Ce morceau se place à la fin du mot : c’est le suffixe.',
} as const;

function reperer(rng: Rng): QuestionDraft {
  const d = rng.pick(DECOUPES);
  const cible = rng.pick(['préfixe', 'suffixe'] as const);
  const parts = { préfixe: nu(d.prefixe), radical: d.radical, suffixe: nu(d.suffixe) };
  const { answer, traps } = choice(
    rng,
    parts[cible],
    (['préfixe', 'radical', 'suffixe'] as const)
      .filter((x) => x !== cible)
      .map((x) => ({ label: parts[x], why: POURQUOI_MORCEAU[x] })),
  );
  return {
    prompt: `Choisis le ${cible} du mot « ${d.mot} ».`,
    answer,
    traps,
    hint: cible === 'préfixe' ? 'Regarde ce qui est ajouté au début.' : 'Regarde ce qui est ajouté à la fin.',
    steps: [REPERE_MORCEAUX, voir(d), `Choisis **${parts[cible]}**.`],
  };
}

function choisirRadical(rng: Rng): QuestionDraft {
  const d = rng.pick(DECOUPES);
  const { answer, traps } = choice(rng, d.radical, [
    { label: nu(d.prefixe), why: POURQUOI_MORCEAU.préfixe },
    { label: nu(d.suffixe), why: POURQUOI_MORCEAU.suffixe },
    { label: `${d.radical}${nu(d.suffixe)}`, why: 'Il reste le suffixe : enlève-le aussi.' },
  ]);
  return {
    prompt: `Le mot « ${d.mot} » vient de « ${d.base} ». Choisis son radical.`,
    answer,
    traps,
    hint: 'Enlève ce qui est ajouté au début et à la fin.',
    steps: [REPERE_MORCEAUX, voir(d), `Choisis le radical : **${d.radical}**.`],
  };
}

const DEF_TYPES = 'Compare : un **mot dérivé** a un ajout, un **mot composé** réunit plusieurs mots.';

/** Distinguer dérivé et composé : une bonne réponse d'une sorte, trois mots de l'autre. */
function classerMots(rng: Rng): QuestionDraft {
  const demande = rng.pick(['dérivé', 'composé'] as const);
  const derives = DECOUPES.map((d) => d.mot);
  const composes = MOTS_COMPOSES.map((m) => m.mot);
  const [justes, autres] = demande === 'dérivé' ? [derives, composes] : [composes, derives];
  const bon = rng.pick(justes);
  const pourquoi =
    demande === 'dérivé'
      ? 'C’est un mot composé : il réunit plusieurs mots.'
      : 'C’est un mot dérivé : des morceaux sont ajoutés à un radical.';
  const { answer, traps } = choice(
    rng,
    bon,
    pickN(rng, autres, 3).map((label) => ({ label, why: pourquoi })),
  );
  return {
    prompt: `Choisis le mot ${demande}.`,
    answer,
    traps,
    hint: 'Pour chaque mot, essaie de le couper en morceaux.',
    steps: [DEF_TYPES, 'Coupe chaque mot : cherche un préfixe, un suffixe ou plusieurs mots.', `Choisis **${bon}**.`],
  };
}

function ecrireRadical(d: Decoupe): QuestionDraft {
  return ecrire(
    [d.radical, `${d.radical}-`],
    [
      [d.base, `« ${d.base} » est un mot entier. Garde seulement le radical.`],
      [`${nu(d.prefixe)}${d.radical}`, 'Il reste le préfixe : enlève-le aussi.'],
      [nu(d.prefixe), POURQUOI_MORCEAU.préfixe],
      [nu(d.suffixe), POURQUOI_MORCEAU.suffixe],
      [`${d.radical}${nu(d.suffixe)}`, 'Il reste le suffixe : enlève-le aussi.'],
      [d.mot, 'Tu as recopié le mot entier. Coupe-le en morceaux.'],
    ],
    {
      prompt: `Le mot « ${d.mot} » vient de « ${d.base} ». Écris seulement son radical.`,
      hint: 'Enlève ce qui est ajouté au début et à la fin.',
      steps: [REPERE_MORCEAUX, voir(d), `Écris le radical : **${d.radical}**.`],
    },
  );
}

function construire(d: Decoupe): QuestionDraft {
  const nom = d.suffixe === '-ement';
  const pieges: (readonly [string, string])[] = [
    [d.base, 'Tu as recopié le mot de départ. Construis un nouveau mot.'],
    [`${d.radical}${nu(d.suffixe)}`, 'Il manque le préfixe au début.'],
  ];
  if (!nom) {
    for (const p of ['in', 'im', 'il']) {
      if (p !== nu(d.prefixe))
        pieges.push([
          `${p}${d.radical}${nu(d.suffixe)}`,
          `Devant « ${d.radical} », le préfixe s’écrit « ${d.prefixe} ».`,
        ]);
    }
  }
  return ecrire([d.mot], pieges, {
    prompt: nom
      ? `Sur le verbe « ${d.base} », écris le nom qui désigne ${d.sens}.`
      : `Sur le verbe « ${d.base} », écris un adjectif au singulier qui veut dire « ${d.sens} ».`,
    hint: nom ? 'Garde le début du verbe et change la fin.' : 'Ajoute un morceau devant et un morceau après.',
    steps: [
      REPERE_MORCEAUX,
      `Ajoute les morceaux dans l’ordre : ${morceaux(d)}.`,
      `Écris le nouveau mot : **${d.mot}**.`,
    ],
  });
}

function decouperEnTrois(d: Decoupe): QuestionDraft {
  return {
    prompt: `Découpe le mot « ${d.mot} » : écris son préfixe, son radical et son suffixe.`,
    answer: {
      kind: 'cloze',
      parts: ['Préfixe : ', ' ; radical : ', ' ; suffixe : ', '.'],
      blanks: [d.prefixe, d.radical, d.suffixe].map((m) => ({
        mode: 'text' as const,
        accepted: [...new Set([nu(m), m, `${nu(m)}-`])].filter((x) => m !== d.suffixe || x !== `${nu(m)}-`),
      })),
    },
    hint: 'Trouve d’abord le mot d’où il vient.',
    steps: [
      REPERE_MORCEAUX,
      `Compare avec « ${d.base} » pour trouver le radical.`,
      `Écris les trois morceaux : **${morceaux(d)}**.`,
    ],
  };
}

function morceauxDraft(rng: Rng, level: Level): QuestionDraft {
  switch (level) {
    case 1:
      return reperer(rng);
    case 2:
      return rng.int(0, 1) === 0 ? choisirRadical(rng) : classerMots(rng);
    case 3:
      return ecrireRadical(rng.pick(SIMPLES_ET_RADICAL_STABLE));
    case 4:
      return rng.int(0, 1) === 0 ? construire(rng.pick(DECOUPES)) : decouperEnTrois(rng.pick(ADJECTIFS));
    default: {
      const choisies = pickN(rng, PHRASES_CONSTRUITES, 4);
      return lignesAEcrire(
        {
          prompt:
            'Complète chaque ligne. Forme sur le verbe entre parenthèses un adjectif qui veut dire « qu’on ne peut pas… », puis accorde-le.',
          titre: 'L’atelier des mots',
          hint: 'Ajoute un préfixe et un suffixe, puis regarde le nom à accorder.',
          etapes: [
            REPERE_MORCEAUX,
            'Ajoute devant le radical « in- », « im- » ou « il- », puis un suffixe.',
            'Vérifie l’accord de chaque adjectif avec son nom.',
          ],
        },
        choisies.map((p) => ({ texte: remplir(p.phrase, `… (${p.base})`), accepted: [p.mot] })),
      );
    }
  }
}

// ───────────────────────── 2. Synonymes et antonymes ─────────────────────────

type Relation = 'synonyme' | 'antonyme';
interface Cas {
  readonly entree: Entree;
  readonly relation: Relation;
  readonly reponse: Reponse;
}
const CAS: readonly Cas[] = ENTREES.flatMap((entree) =>
  (['synonyme', 'antonyme'] as const).flatMap((relation) => {
    const reponse = entree[relation];
    return reponse ? [{ entree, relation, reponse }] : [];
  }),
);
const COURANTS = CAS.filter((c) => !c.entree.rare);
const RARES = CAS.filter((c) => c.entree.rare);

const DEF_RELATION: Record<Relation, string> = {
  synonyme: 'Cherche un **synonyme** : un mot de sens voisin.',
  antonyme: 'Cherche un **antonyme** : un mot de sens contraire.',
};
const DEF_CLASSE = 'Garde la même **classe grammaticale** que le mot de départ.';
const deLaClasse = (c: Classe) => (c === 'adjectif' || c === 'adverbe' ? `de l’${c}` : `du ${c}`);
const principale = (c: Cas) => c.reponse.mots[0];
/** Début du mot attendu, assez long pour écarter les autres réponses citées de même longueur. */
function debut(c: Cas): string {
  const mot = principale(c);
  const rivaux = c.reponse.mots.filter((m) => m !== mot && m.length === mot.length);
  let n = 1;
  while (rivaux.some((m) => m.startsWith(mot.slice(0, n)))) n++;
  return mot.slice(0, n);
}
const conclure = (verbe: 'Choisis' | 'Écris', c: Cas) =>
  `${verbe} **${principale(c)}** : c’est un ${c.relation} ${deLaClasse(c.entree.classe)} « ${c.entree.mot} ».`;
const HORS_SUJET: Record<Classe, readonly string[]> = {
  nom: ['fenêtre', 'nuage', 'cahier'],
  verbe: ['éternuer', 'repeindre', 'tousser'],
  adjectif: ['carré', 'violet', 'salé'],
  adverbe: ['dehors', 'ici', 'ensemble'],
};
const autreRelation = (c: Cas): Cas | undefined => CAS.find((x) => x.entree === c.entree && x !== c);

function propositions(rng: Rng, c: Cas, n: 2 | 3): Option[] {
  const [autre, classe] = c.entree.autre;
  const oppose = autreRelation(c);
  const liste: Option[] = [];
  if (n === 3) liste.push({ label: autre, why: `« ${autre} » est un ${classe} : la classe grammaticale change.` });
  if (oppose)
    liste.push({
      label: principale(oppose),
      why: `« ${principale(oppose)} » est un ${oppose.relation} : on demande un ${c.relation}.`,
    });
  for (const label of rng.shuffle(HORS_SUJET[c.entree.classe]))
    liste.push({ label, why: `« ${label} » n’a pas de lien de sens avec « ${c.entree.mot} ».` });
  return liste.slice(0, n);
}

function choisirRelation(rng: Rng, n: 2 | 3): QuestionDraft {
  const c = rng.pick(n === 2 ? COURANTS : CAS);
  const { answer, traps } = choice(rng, principale(c), propositions(rng, c, n));
  return {
    prompt: `Choisis un ${c.relation} ${deLaClasse(c.entree.classe)} « ${c.entree.mot} ».`,
    answer,
    traps,
    hint: 'Garde la même classe, puis vérifie le sens.',
    steps: [DEF_RELATION[c.relation], DEF_CLASSE, conclure('Choisis', c)],
  };
}

const memeMot = (a: Cas, b: Cas) => a.entree === b.entree || principale(a) === principale(b);

function associerRelations(rng: Rng, n: 3 | 5): QuestionDraft {
  const relation = rng.pick(['synonyme', 'antonyme'] as const);
  const choisis = distincts(
    rng,
    CAS.filter((c) => c.relation === relation),
    n,
    memeMot,
  );
  return associer(
    rng,
    `Associe chaque mot (${choisis.map((c) => c.entree.mot).join(', ')}) à son ${relation}.`,
    choisis.map((c) => [c.entree.mot, principale(c)]),
    'Les deux mots d’une paire ont la même classe.',
    [DEF_RELATION[relation], 'Associe d’abord les paires sûres, puis vérifie la classe des autres.'],
  );
}

function piegesRelation(c: Cas): (readonly [string, string])[] {
  const [autre, classe] = c.entree.autre;
  const oppose = autreRelation(c);
  return [
    [c.entree.mot, 'Tu as recopié le mot de départ.'],
    [autre, `« ${autre} » est un ${classe}. Il faut un ${c.entree.classe}.`],
    ...(oppose?.reponse.mots.map((m) => [m, `C’est un ${oppose.relation} : on demande un ${c.relation}.`] as const) ??
      []),
  ];
}

function ecrireRelation(c: Cas): QuestionDraft {
  return ecrire(c.reponse.mots, piegesRelation(c), {
    prompt: `Écris un ${c.relation} ${deLaClasse(c.entree.classe)} « ${c.entree.mot} ». Il commence par « ${debut(c)} » et compte ${principale(c).length} lettres.`,
    hint: 'Essaie ton mot dans une phrase avec la même classe.',
    steps: [DEF_RELATION[c.relation], DEF_CLASSE, conclure('Écris', c)],
  });
}

function relationsDraft(rng: Rng, level: Level): QuestionDraft {
  switch (level) {
    case 1:
      return choisirRelation(rng, 2);
    case 2:
      return rng.int(0, 1) === 0 ? choisirRelation(rng, 3) : associerRelations(rng, 3);
    case 3:
      return ecrireRelation(rng.pick(COURANTS));
    case 4:
      return rng.int(0, 1) === 0 ? ecrireRelation(rng.pick(RARES)) : associerRelations(rng, 5);
    default: {
      const synonymes = distincts(
        rng,
        CAS.filter((c) => c.relation === 'synonyme'),
        2,
        memeMot,
      );
      const antonymes = distincts(
        rng,
        CAS.filter((c) => c.relation === 'antonyme' && !synonymes.some((s) => memeMot(s, c))),
        2,
        memeMot,
      );
      const choisis = rng.shuffle([...synonymes, ...antonymes]);
      return lignesAEcrire(
        {
          prompt: 'Lis chaque ligne. Écris le synonyme ou l’antonyme demandé, dans la même classe grammaticale.',
          titre: 'Les mots en relation',
          hint: 'Lis bien : synonyme ou antonyme ? Le début du mot t’aide.',
          etapes: [
            'Repère la demande : **synonyme** (sens voisin) ou **antonyme** (sens contraire).',
            DEF_CLASSE,
            'Vérifie le début du mot et le nombre de lettres.',
          ],
        },
        choisis.map((c) => ({
          texte: `${remplir(c.entree.phrase, `« ${c.entree.mot} »`)} ${maj(c.relation)} : ${debut(c)}… (${principale(c).length} lettres)`,
          accepted: c.reponse.mots,
        })),
      );
    }
  }
}

// ───────────────────────── 3. Sens propre et sens figuré ─────────────────────────

const DEF_FIGURE = 'Compare : au **sens propre**, le mot désigne la chose réelle. Au **sens figuré**, il fait image.';
const voisins = (a: Figure, b: Figure) => a === b || (a.voisins !== undefined && a.voisins === b.voisins);
/** Verbe (forme conjuguée dans la phrase) : ses sens ne se mélangent pas avec ceux des noms. */
const estVerbe = (f: Figure) => f.forme !== f.mot;
const enGuillemets = (f: Figure, phrase: string) => remplir(phrase, `« ${f.forme} »`);
const enClair = (f: Figure, phrase: string) => remplir(phrase, f.forme);
const expliquer = (f: Figure) =>
  `Compare avec le sens propre : « ${f.sensPropre} ». Ici, retiens : « ${f.sensFigure} ».`;
const auPropre = (f: Figure) => `Vérifie le sens propre : « ${f.sensPropre} ».`;

function choisirPhrase(rng: Rng): QuestionDraft {
  const demande = rng.pick(['figuré', 'propre'] as const);
  const [bon, a, b] = distincts(rng, FIGURES, 3, voisins) as [Figure, Figure, Figure];
  const phraseDe = (f: Figure, sens: 'figuré' | 'propre') => enGuillemets(f, sens === 'figuré' ? f.figure : f.propre);
  const autreSens = demande === 'figuré' ? 'propre' : 'figuré';
  const { answer, traps } = choice(
    rng,
    phraseDe(bon, demande),
    [a, b].map((f) => ({
      label: phraseDe(f, autreSens),
      why: `Dans cette phrase, « ${f.forme} » est au sens ${autreSens}.`,
    })),
  );
  return {
    prompt: `Choisis la phrase où le mot entre guillemets est au sens ${demande}.`,
    answer,
    traps,
    hint: 'Demande-toi pour chaque phrase : est-ce vrai mot à mot ?',
    steps: [
      DEF_FIGURE,
      demande === 'figuré' ? expliquer(bon) : auPropre(bon),
      `Choisis la phrase : **${phraseDe(bon, demande)}**`,
    ],
  };
}

function choisirSens(rng: Rng): QuestionDraft {
  const f = rng.pick(FIGURES);
  const figure = rng.int(0, 1) === 0;
  const lire = (x: Figure) => (figure ? x.sensFigure : x.sensPropre);
  const bon = lire(f);
  const piege = figure ? f.sensPropre : f.sensFigure;
  const { answer, traps } = choice(rng, bon, [
    { label: piege, why: `C’est le sens ${figure ? 'propre' : 'figuré'} du mot, pas celui de cette phrase.` },
    ...distincts(
      rng,
      FIGURES.filter((x) => !voisins(x, f) && estVerbe(x) === estVerbe(f)),
      2,
      voisins,
    ).map((x) => ({ label: lire(x), why: `Ce sens est celui de « ${x.mot} ».` })),
  ]);
  return {
    prompt: `Choisis le sens de « ${f.forme} » dans cette phrase : ${enClair(f, figure ? f.figure : f.propre)}`,
    answer,
    traps,
    hint: 'Demande-toi : est-ce vrai mot à mot ?',
    steps: [DEF_FIGURE, figure ? expliquer(f) : auPropre(f), `Choisis : **${bon}**.`],
  };
}

function memeMotDeuxPhrases(f: Figure): QuestionDraft {
  return {
    ...ecrire([f.forme], [], {
      prompt: `Écris le mot qui complète les deux phrases. ${initiale(f.forme)}`,
      hint: 'Une phrase est au sens propre, l’autre au sens figuré.',
      steps: [
        DEF_FIGURE,
        `Essaie ton mot dans les deux phrases. Pense au sens « ${f.sensPropre} ».`,
        `Écris le mot : **${f.forme}**.`,
      ],
    }),
    figure: document('Un mot, deux sens', [remplir(f.propre, '…'), remplir(f.figure, '…')]),
  };
}

/** Comme au niveau 3 (initiale et nombre de lettres), avec une phrase figurée plus longue. */
function completerImage(f: Figure): QuestionDraft {
  const pieges: (readonly [string, string])[] = estVerbe(f)
    ? [[f.mot, 'Tu as écrit l’infinitif. La phrase demande le verbe conjugué.']]
    : [];
  return {
    ...ecrire([f.forme], pieges, {
      prompt: `Écris le mot qui complète la phrase courte et la phrase longue. ${initiale(f.forme)}`,
      hint: 'Une phrase est au sens propre, l’autre au sens figuré.',
      steps: [DEF_FIGURE, 'Essaie ton mot dans les deux phrases.', `Écris le mot : **${f.forme}**.`],
    }),
    figure: document('Un mot, deux sens', [remplir(f.propre, '…'), remplir(f.contexte, '…')]),
  };
}

function figureDraft(rng: Rng, level: Level): QuestionDraft {
  switch (level) {
    case 1:
      return choisirPhrase(rng);
    case 2:
      return choisirSens(rng);
    case 3:
      return memeMotDeuxPhrases(rng.pick(FIGURES));
    case 4:
      return completerImage(rng.pick(FIGURES));
    default:
      return lignesAEcrire(
        {
          prompt: 'Lis chaque ligne. Écris le seul mot employé au sens figuré.',
          titre: 'La chasse aux images',
          hint: 'Sur chaque ligne, un mot n’est pas vrai mot à mot.',
          etapes: [
            DEF_FIGURE,
            'Essaie chaque nom et chaque verbe : est-ce vrai mot à mot ?',
            'Garde pour chaque ligne le mot qui fait image.',
          ],
        },
        pickN(rng, FIGURES, 4).map((f) => ({ texte: enClair(f, f.contexte), accepted: [f.forme] })),
      );
  }
}

// ───────────────────────── 4. Champ lexical ─────────────────────────

const DEF_CHAMP = 'Cherche le thème : un **champ lexical** réunit les mots liés à ce thème.';
interface Element {
  readonly champ: Champ;
  readonly item: MotChamp;
}
const ELEMENTS: readonly Element[] = CHAMPS.flatMap((champ) => champ.mots.map((item) => ({ champ, item })));
const lien = ({ champ, item }: Element) => `« ${item.mot} » (${item.glose}) évoque ${champ.theme}.`;
/** Thèmes trop proches pour s'opposer dans une même question (le brouillard en mer, un refrain joyeux). */
const THEMES_VOISINS: readonly (readonly string[])[] = [
  ['mer', 'météo'],
  ['musique', 'joie'],
];
const themesVoisins = (a: Champ, b: Champ) =>
  a === b || THEMES_VOISINS.some((v) => v.includes(a.nom) && v.includes(b.nom));
/** « de la mer », « du temps qu’il fait ». */
const deTheme = (c: Champ) => (c.theme.startsWith('le ') ? `du ${c.theme.slice(3)}` : `de ${c.theme}`);
const elementsDe = (rng: Rng, champ: Champ, n: number): Element[] =>
  pickN(rng, champ.mots, n).map((item) => ({ champ, item }));
const unParChamp = (rng: Rng, champs: readonly Champ[]): Element[] =>
  champs.map((champ) => ({ champ, item: rng.pick(champ.mots) }));

function motDuChamp(rng: Rng): QuestionDraft {
  const champ = rng.pick(CHAMPS);
  const ailleurs = pickN(
    rng,
    CHAMPS.filter((x) => !themesVoisins(x, champ)),
    2,
  );
  const [bon, ...autres] = unParChamp(rng, [champ, ...ailleurs]) as [Element, Element, Element];
  const { answer, traps } = choice(
    rng,
    bon.item.mot,
    autres.map((e) => ({ label: e.item.mot, why: lien(e) })),
  );
  return {
    prompt: `Choisis le mot du champ lexical ${deTheme(bon.champ)}.`,
    answer,
    traps,
    hint: 'Pour chaque mot, demande-toi de quoi il parle.',
    steps: [DEF_CHAMP, `Retiens : « ${bon.item.mot} » veut dire ${bon.item.glose}.`, `Choisis **${bon.item.mot}**.`],
  };
}

function trois(rng: Rng): { champ: Champ; membres: Element[]; intrus: Element } {
  const champ = rng.pick(CHAMPS);
  const autre = rng.pick(CHAMPS.filter((x) => !themesVoisins(x, champ)));
  return { champ, membres: elementsDe(rng, champ, 3), intrus: at(elementsDe(rng, autre, 1), 0) };
}

function choisirIntrus(rng: Rng): QuestionDraft {
  const { champ, membres, intrus } = trois(rng);
  const { answer, traps } = choice(
    rng,
    intrus.item.mot,
    membres.map((e) => ({ label: e.item.mot, why: `${lien(e)} Ce n’est pas l’intrus.` })),
  );
  return {
    prompt: `Choisis l’intrus du champ lexical ${deTheme(champ)}.`,
    answer,
    traps,
    hint: 'Trois mots parlent du thème. Lequel parle d’autre chose ?',
    steps: [DEF_CHAMP, `Regarde l’intrus : ${lien(intrus)}`, `Choisis **${intrus.item.mot}**.`],
  };
}

function associerThemes(rng: Rng, n: 3 | 5): QuestionDraft {
  const choisis = unParChamp(rng, pickN(rng, CHAMPS, n));
  return associer(
    rng,
    `Associe chaque mot (${choisis.map((e) => e.item.mot).join(', ')}) à son thème.`,
    choisis.map((e) => [e.item.mot, e.champ.theme]),
    'Commence par le mot que tu connais le mieux.',
    [DEF_CHAMP, `Retiens : « ${at(choisis, 0).item.mot} » veut dire ${at(choisis, 0).item.glose}.`],
  );
}

/** Nommer le thème : 4 mots au niveau 3, 3 mots (moins d'indices) au niveau 4. */
function nommerTheme(rng: Rng, n: 3 | 4): QuestionDraft {
  const champ = rng.pick(CHAMPS);
  const mots = pickN(rng, champ.mots, n).map((m) => m.mot);
  return ecrire(
    champ.accepte,
    mots.map((m) => [m, `« ${m} » est un mot de la liste. Cherche leur thème.`] as const),
    {
      prompt: `Écris le thème commun aux mots ${citer(mots)}.`,
      hint: 'Complète : « tous ces mots parlent de… ».',
      steps: [DEF_CHAMP, 'Cherche ce que tous les mots évoquent.', `Écris le thème : **${champ.nom}**.`],
    },
  );
}

function champDraft(rng: Rng, level: Level): QuestionDraft {
  switch (level) {
    case 1:
      return motDuChamp(rng);
    case 2:
      return rng.int(0, 1) === 0 ? choisirIntrus(rng) : associerThemes(rng, 3);
    case 3:
      return nommerTheme(rng, 4);
    case 4:
      return rng.int(0, 1) === 0 ? nommerTheme(rng, 3) : associerThemes(rng, 5);
    default:
      return lignesAEcrire(
        {
          prompt: 'Lis chaque ligne. Écris le mot de la phrase qui appartient au champ lexical indiqué.',
          titre: 'La pêche aux mots',
          hint: 'Un seul mot de la phrase est lié au thème.',
          etapes: [DEF_CHAMP, 'Lis le thème au début de la ligne.', 'Compare chaque mot de la phrase avec ce thème.'],
        },
        pickN(rng, ELEMENTS, ELEMENTS.length)
          .filter((e, i, tous) => tous.findIndex((x) => x.champ === e.champ) === i)
          .slice(0, 4)
          .map((e) => ({
            texte: `Thème « ${e.champ.theme} » : ${remplir(e.item.phrase, e.item.forme)}`,
            accepted: [e.item.forme],
          })),
      );
  }
}

// ───────────────────────── 5. Mots des disciplines ─────────────────────────

const CADRES: Record<Discipline, string> = {
  maths: 'En maths',
  géographie: 'En géographie',
  histoire: 'En histoire',
  sciences: 'En sciences',
  français: 'En français',
};
const DEF_DISCIPLINE = 'Repère la **discipline** : chaque matière donne un sens précis à ses mots.';
const sensDans = (t: Terme) => `${CADRES[t.discipline]}, « ${t.mot} » désigne ${t.definition}.`;
const retenir = (t: Terme) => `Retiens : ${sensDans(t).replace(/^En/, 'en')}`;
const TERMES_COURANTS = TERMES.filter((t) => !t.rare);
const TERMES_RARES = TERMES.filter((t) => t.rare);
const voisinsDe = (rng: Rng, t: Terme, n: number) =>
  pickN(
    rng,
    TERMES.filter((x) => x.discipline === t.discipline && x !== t),
    n,
  );

function choisirDefinition(rng: Rng): QuestionDraft {
  const t = rng.pick(TERMES_COURANTS);
  const { answer, traps } = choice(
    rng,
    t.definition,
    voisinsDe(rng, t, 2).map((x) => ({ label: x.definition, why: `Ce sens est celui de « ${x.mot} ».` })),
  );
  return {
    prompt: `${CADRES[t.discipline]}, choisis le sens du mot « ${t.mot} ».`,
    answer,
    traps,
    hint: 'Pense au dernier cours où tu as lu ce mot.',
    steps: [DEF_DISCIPLINE, retenir(t), `Choisis : **${t.definition}**.`],
  };
}

function choisirTerme(rng: Rng): QuestionDraft {
  const t = rng.pick(TERMES);
  const { answer, traps } = choice(
    rng,
    t.mot,
    voisinsDe(rng, t, 3).map((x) => ({ label: x.mot, why: sensDans(x) })),
  );
  return {
    prompt: `${CADRES[t.discipline]}, choisis le mot qui désigne ${t.definition}.`,
    answer,
    traps,
    hint: 'Élimine les mots dont tu connais déjà le sens.',
    steps: [DEF_DISCIPLINE, retenir(t), `Choisis **${t.mot}**.`],
  };
}

function choisirSensDiscipline(rng: Rng): QuestionDraft {
  const p = rng.pick(POLYSEMES);
  const i = rng.int(0, 1);
  const bon = at(p.sens, i);
  const autre = at(p.sens, 1 - i);
  const ailleurs = pickN(
    rng,
    POLYSEMES.filter((x) => x !== p),
    2,
  ).map((x) => ({ label: rng.pick(x.sens).definition, why: `Ce sens est celui de « ${x.mot} ».` }));
  const { answer, traps } = choice(rng, bon.definition, [
    { label: autre.definition, why: `C’est le sens ${autre.cadre.toLowerCase()}, pas ici.` },
    ...ailleurs,
  ]);
  return {
    prompt: `${bon.cadre} : « ${bon.phrase} » Choisis le sens du mot « ${p.mot} ».`,
    answer,
    traps,
    hint: 'Regarde la matière avant de répondre.',
    steps: [
      DEF_DISCIPLINE,
      `Compare : ${autre.cadre.toLowerCase()}, « ${p.mot} » a un autre sens.`,
      `Choisis : **${bon.definition}**.`,
    ],
  };
}

function ecrireTerme(rng: Rng, t: Terme): QuestionDraft {
  return ecrire(
    [t.mot],
    voisinsDe(rng, t, 2).map((x) => [x.mot, sensDans(x)] as const),
    {
      prompt: `${CADRES[t.discipline]}, écris le mot qui désigne ${t.definition}. ${initiale(t.mot)}`,
      hint: 'Cherche dans les mots de cette matière.',
      steps: [DEF_DISCIPLINE, 'Relis le sens demandé, puis vérifie les lettres.', `Écris **${t.mot}**.`],
    },
  );
}

const aTrou = (t: Terme) => remplir(t.phrase, `${t.mot.charAt(0)}… (${t.mot.length} lettres)`);

function completerTerme(rng: Rng, t: Terme): QuestionDraft {
  return ecrire(
    [t.mot],
    voisinsDe(rng, t, 2).map((x) => [x.mot, sensDans(x)] as const),
    {
      prompt: `${CADRES[t.discipline]}, écris le mot qui manque : « ${aTrou(t)} »`,
      hint: 'Lis toute la phrase, puis pense à la matière.',
      steps: [DEF_DISCIPLINE, `Cherche le mot qui désigne ${t.definition}.`, `Écris **${t.mot}**.`],
    },
  );
}

function associerTermes(rng: Rng): QuestionDraft {
  const choisis = pickN(rng, TERMES, 5);
  return associer(
    rng,
    `Associe chaque mot (${choisis.map((t) => t.mot).join(', ')}) à son sens.`,
    choisis.map((t) => [t.mot, t.definition]),
    'Place d’abord les mots que tu connais.',
    [DEF_DISCIPLINE, 'Pense à la matière de chaque mot, puis relie.'],
  );
}

function disciplineDraft(rng: Rng, level: Level): QuestionDraft {
  switch (level) {
    case 1:
      return choisirDefinition(rng);
    case 2:
      return rng.int(0, 1) === 0 ? choisirTerme(rng) : choisirSensDiscipline(rng);
    case 3:
      return ecrireTerme(rng, rng.pick(TERMES_COURANTS));
    case 4:
      return rng.int(0, 1) === 0 ? completerTerme(rng, rng.pick(TERMES_RARES)) : associerTermes(rng);
    default: {
      const choisis = rng
        .shuffle(TERMES)
        .filter((t, i, tous) => tous.findIndex((x) => x.discipline === t.discipline) === i)
        .slice(0, 4);
      return lignesAEcrire(
        {
          prompt: 'Lis chaque ligne. Écris le mot précis qui manque.',
          titre: 'Une phrase par matière',
          hint: 'La matière et la première lettre te guident.',
          etapes: [
            DEF_DISCIPLINE,
            'Lis la matière au début de la ligne.',
            'Vérifie la première lettre et le nombre de lettres.',
          ],
        },
        choisis.map((t) => ({ texte: `${maj(t.discipline)} : ${aTrou(t)}`, accepted: [t.mot] })),
      );
    }
  }
}

// ───────────────────────── Notions du chapitre ─────────────────────────

const sens = (type: Sens['type'], text: string, factId: string): Sens => {
  const { source, citation } = faitVocabulaire6e(factId);
  return { type, text, source, citation };
};

interface Notion {
  readonly id: string;
  readonly title: string;
  readonly memo: readonly string[];
  readonly factId: string;
  readonly faits: readonly string[];
  readonly sens: readonly Sens[];
  readonly generate: Skill['generate'];
}

const skill = (n: Notion): Skill => ({
  id: n.id,
  title: n.title,
  levels: 5,
  version: 1,
  lesson: { memo: n.memo, source: programme(n.factId), sources: sourcesVocabulaire6e([n.factId, ...n.faits]) },
  sens: n.sens,
  generate: n.generate,
});

export const F6_VOCABULAIRE: readonly Skill[] = [
  skill({
    id: 'f6-prefixe-radical-suffixe',
    title: 'Préfixe, radical, suffixe',
    memo: [
      'Un **préfixe** se place devant le **radical**, un **suffixe** se place après.',
      'Découpe « décollage » : « dé- », « coll », « -age ».',
      'Un **mot simple** n’a rien d’ajouté, un **mot composé** réunit plusieurs mots.',
    ],
    factId: 'v6-prog-morphologie',
    faits: [
      'v6-prog-types',
      'v6-memo-decollage',
      'v6-def-prefixe',
      'v6-def-radical',
      'v6-def-suffixe',
      'v6-def-compose',
      'v6-def-derive',
      'v6-def-simple',
      'v6-sens-prefixe',
      ...DECOUPES.map((d) => d.faitId),
      ...MOTS_COMPOSES.map((m) => m.faitId),
    ],
    sens: [
      sens(
        'usage',
        'Découper un mot en morceaux t’aide à l’analyser et à en créer de nouveaux.',
        'v6-prog-morphologie',
      ),
      sens(
        'savais-tu',
        '« Préfixe » vient d’un mot latin composé des mots « devant » et « planter ».',
        'v6-sens-prefixe',
      ),
    ],
    generate: morceauxDraft,
  }),
  skill({
    id: 'f6-synonymes-antonymes',
    title: 'Synonymes et antonymes de même classe',
    memo: [
      'Un **synonyme** a un sens voisin, un **antonyme** un sens contraire.',
      'Garde la même **classe grammaticale** : « finir » donne « terminer », jamais « la fin ».',
    ],
    factId: 'v6-prog-synonymes',
    faits: ['v6-def-synonyme', 'v6-def-antonyme', 'v6-sens-antonyme', ...CAS.map((c) => c.reponse.faitId)],
    sens: [
      sens(
        'histoire',
        'Au XIXe siècle, le mot « antonyme » a été formé sur le radical de « synonyme ».',
        'v6-sens-antonyme',
      ),
    ],
    generate: relationsDraft,
  }),
  skill({
    id: 'f6-sens-propre-figure',
    title: 'Sens propre et sens figuré',
    memo: [
      'Au **sens propre**, un mot désigne la chose réelle : « une pierre lourde ».',
      'Au **sens figuré**, il fait image : « un silence lourd ».',
      'Pour trancher, demande-toi : est-ce vrai mot à mot ?',
    ],
    factId: 'v6-prog-polysemie',
    faits: [
      'v6-def-propre',
      'v6-def-figure',
      'v6-sens-propre',
      ...FIGURES.flatMap((f) => [f.faitPropre, f.faitFigure]),
    ],
    sens: [
      sens(
        'savais-tu',
        '« Propre » vient d’un mot latin qui voulait dire « qui appartient en propre ».',
        'v6-sens-propre',
      ),
    ],
    generate: figureDraft,
  }),
  skill({
    id: 'f6-champ-lexical',
    title: 'Le champ lexical',
    memo: [
      'Un **champ lexical** réunit les mots liés à un même thème.',
      'École : « cartable » (nom), « réviser » (verbe), « studieux » (adjectif).',
      'Une **famille de mots** partage un radical, pas forcément un champ lexical.',
    ],
    factId: 'v6-prog-reseaux',
    faits: ['v6-def-champ', 'v6-sens-lexical', ...ELEMENTS.map((e) => e.item.faitId)],
    sens: [sens('histoire', 'L’expression « champ lexical » est relevée dans un écrit de 1962.', 'v6-sens-lexical')],
    generate: champDraft,
  }),
  skill({
    id: 'f6-mots-disciplines',
    title: 'Les mots des disciplines',
    memo: [
      'Chaque **discipline** a des mots précis : apprends leur sens exact.',
      'Un même mot peut changer de sens : « une figure » en maths ou en français.',
      'Lis toute la phrase pour repérer la matière.',
    ],
    factId: 'v6-prog-univers',
    faits: [
      'v6-prog-polysemie',
      'v6-prog-outil',
      ...TERMES.map((t) => t.faitId),
      ...POLYSEMES.flatMap((p) => p.sens.map((s) => s.faitId)),
    ],
    sens: [
      sens(
        'usage',
        'Au cycle 3, ton outil récapitulatif donne une place essentielle au vocabulaire des matières.',
        'v6-prog-outil',
      ),
    ],
    generate: disciplineDraft,
  }),
];
