import { choice, num, traps as numTraps } from '../build.ts';
import { r } from '../rational.ts';
import type { Rng } from '../rng.ts';
import type { Level, QuestionDraft, Sens, Skill } from '../types.ts';
import {
  ADVERBES_DES_LIGNES,
  CATEGORIES,
  CONJONCTIONS,
  DEMONSTRATIFS,
  FONCTIONS_NOMS,
  FORMES_POSSESSIF,
  GROUPES,
  LIGNES_ADVERBES,
  LIGNES_ARTICLES,
  LIGNES_CONJ,
  LIGNES_DETERMINANTS,
  MOTS_NON_CONJ,
  NATURES_NOMS,
  NATURES_PHRASE,
  NOMS_DEMONSTRATIFS,
  NOMS_VERBES,
  OBJETS,
  OBJETS_PHRASES,
  PAIRES,
  PHRASES_ADVERBES,
  PHRASES_CONJ,
  PHRASES_NATURES,
  PHRASES_PRONOMS,
  PLURIELS,
  POSSESSEURS,
  POSSESSIFS,
  ROLES,
  ROLES_COURTS,
  SENS_NATURE,
  SUJETS_GN,
  articleDe,
  faitNature,
  phraseObjet,
  phrasePronom,
  possessif,
  sourcesDe,
  type Groupe,
  type Nature,
  type Objet,
  type ObjetPhrase,
  type Possesseur,
  type PronomObjet,
} from './nature.donnees.ts';
import { appariement, at, avecOuSansPoint, document, pickN, textTraps } from './outils.ts';

/**
 * Chapitre « Nature des mots » (CM1). Programme de français du cycle 3 (BO du 17 avril 2025),
 * enseignement de la langue : « Identifier les mots, un groupe de mots selon leur nature ».
 */
const programme = (id: string) =>
  `Programme de français du cycle 3 (BO du 17 avril 2025), CM1 — « ${faitNature(id).citation} »`;

/** Trois lignes dont une au moins compte pour la question. */
function troisLignes<T>(rng: Rng, lignes: readonly T[], compte: (l: T) => number): T[] {
  const bonne = rng.pick(lignes.filter((l) => compte(l) > 0));
  return rng.shuffle([
    bonne,
    ...pickN(
      rng,
      lignes.filter((l) => l !== bonne),
      2,
    ),
  ]);
}

const total = <T>(lignes: readonly T[], compte: (l: T) => number) => lignes.reduce((n, l) => n + compte(l), 0);

/** Les mots d'une liste trouvés dans les lignes, cités dans l'ordre de lecture (« l’ » garde son apostrophe). */
const releves = (lignes: readonly { readonly texte: string }[], liste: readonly string[]): string =>
  lignes
    .flatMap((l) => l.texte.match(/\p{L}+’?/gu) ?? [])
    .filter((m) => liste.includes(m.toLowerCase().replace('’', '')))
    .map((m) => `« ${m} »`)
    .join(', ');

/** Les deux dernières bulles d'une question « combien ? » : les mots trouvés, puis le compte. */
const bullesCompte = (trouves: string, k: number): readonly [string, string] => [
  `Vérifie ta liste : ${trouves}.`,
  `Compte ces mots, puis écris **${k}**.`,
];

// ───────────────────────── 1. Nature ou fonction ─────────────────────────

const NATURE = 'une nature';
const FONCTION = 'une fonction';
const DEF_NATURE = 'La nature, c’est la sorte de mot : nom, verbe, adjectif, déterminant, pronom…';
const DEF_FONCTION = 'La fonction, c’est le rôle dans la phrase : sujet, complément…';

const SUJET_OK = ['sujet', 'le sujet', 'sujet du verbe', 'le sujet du verbe', 'groupe sujet', 'le groupe sujet'];
const OBJET_OK = [
  'complément d’objet',
  'complément d’objet direct',
  'COD',
  'complement d’objet',
  'complement d’objet direct',
].flatMap((x) => [x, `un ${x}`, `le ${x}`]);
const GN_OK = ['groupe nominal', 'un groupe nominal', 'GN', 'un GN'];

const WHY_SUJET = 'Le sujet dit qui fait l’action. Ce groupe ne fait pas l’action ici.';
const WHY_OBJET = 'Un complément d’objet suit le verbe et le complète. Ici, le groupe fait l’action.';
const WHY_GN = 'Le groupe nominal, c’est la nature du groupe. La question demande sa fonction : son rôle.';

const WHY_NATURE: Record<Nature, string> = {
  nom: 'Un nom désigne une personne, un animal ou une chose.',
  verbe: 'Un verbe dit ce qu’on fait. Il change avec le sujet et le temps.',
  adjectif: 'Un adjectif dit comment est le nom.',
  déterminant: 'Un déterminant est un petit mot qui accompagne le nom.',
  pronom: 'Un pronom désigne une personne ou remplace un nom.',
};

function natureFonctionDraft(rng: Rng, level: Level): QuestionDraft {
  switch (level) {
    case 1: {
      const estNature = rng.int(0, 1) === 0;
      const mot = rng.pick<string>(estNature ? NATURES_NOMS : FONCTIONS_NOMS);
      const bon = estNature ? NATURE : FONCTION;
      const { answer, traps } = choice(rng, bon, [
        { label: estNature ? FONCTION : NATURE, why: estNature ? DEF_NATURE : DEF_FONCTION },
        { label: 'un temps du verbe', why: `Les temps sont le présent ou le futur. « ${mot} » n’est pas un temps.` },
      ]);
      return {
        prompt: `Choisis : le mot « ${mot} » sert à nommer…`,
        answer,
        traps,
        hint: 'Demande-toi : est-ce la sorte du mot, ou son rôle dans la phrase ?',
        steps: [
          'Pense à la nature : c’est la sorte de mot.',
          'Pense à la fonction : c’est son rôle dans la phrase.',
          `« ${mot} » dit ${estNature ? 'une sorte de mot' : 'un rôle'} : choisis **${bon}**.`,
        ],
      };
    }
    case 2: {
      const phrase = rng.pick(PHRASES_NATURES);
      const [mot, nature] = rng.pick(phrase);
      const { answer, traps } = choice(
        rng,
        nature,
        pickN(
          rng,
          NATURES_PHRASE.filter((n) => n !== nature),
          3,
        ).map((n) => ({ label: n, why: `${WHY_NATURE[n]} Ce n’est pas le cas de « ${mot} ».` })),
      );
      return {
        prompt: `Choisis la nature du mot « ${mot} » dans « ${phrase.map(([m]) => m).join(' ')}. »`,
        answer,
        traps,
        hint: 'Demande-toi ce que fait ce mot : nommer, agir, décrire, accompagner un nom ou remplacer ?',
        steps: [
          `Regarde le mot « ${mot} » : cherche sa sorte.`,
          `Retiens ceci : ${WHY_NATURE[nature]}`,
          `Choisis **${nature}** pour « ${mot} ».`,
        ],
      };
    }
    case 3: {
      const g = rng.pick(GROUPES);
      const estSujet = rng.int(0, 1) === 0;
      const accepted = estSujet ? SUJET_OK : OBJET_OK;
      return {
        prompt: `Écris la fonction du groupe « ${g.gn} » dans : « ${estSujet ? g.sujet : g.objet} »`,
        answer: { kind: 'text', accepted },
        traps: textTraps(accepted, [
          estSujet ? ['complément d’objet', WHY_OBJET] : ['sujet', WHY_SUJET],
          ['groupe nominal', WHY_GN],
          [
            'complément circonstanciel',
            'Un complément circonstanciel peut se déplacer et se supprimer. Pas ce groupe.',
          ],
        ]),
        hint: 'Cherche le verbe. Ce groupe fait-il l’action, ou complète-t-il le verbe ?',
        steps: [
          'Trouve le verbe de la phrase.',
          estSujet
            ? `Pose la question « qui fait l’action ? » : tu trouves « ${g.gn} ».`
            : `Regarde « ${g.gn} » : ce groupe suit le verbe et le complète.`,
          `Écris **${estSujet ? 'sujet' : 'complément d’objet'}**.`,
        ],
      };
    }
    case 4: {
      const phrase = rng.pick(PHRASES_NATURES);
      const mots = rng.shuffle(phrase);
      const { right, pairs } = appariement(
        rng,
        mots.map(([, n]) => n),
      );
      const texte = `${phrase.map(([m]) => m).join(' ')}.`;
      return {
        prompt: `Associe chaque mot à sa nature : « ${texte} »`,
        answer: { kind: 'match', left: mots.map(([m]) => m), right, pairs },
        hint: 'Commence par le verbe, puis cherche le nom et les mots qui l’accompagnent.',
        steps: [
          'Cherche d’abord le verbe : il dit ce qu’on fait.',
          'Trouve ensuite le nom. Repère les mots qui l’accompagnent.',
          'Regarde le mot qui désigne une personne : c’est le pronom.',
          `Associe ainsi : **${phrase.map(([m, n]) => `${m} = ${n}`).join(', ')}**.`,
        ],
      };
    }
    default: {
      const g: Groupe = rng.pick(GROUPES);
      const sujetDAbord = rng.int(0, 1) === 0;
      const lignes = sujetDAbord ? [g.sujet, g.objet] : [g.objet, g.sujet];
      const roles = sujetDAbord ? [SUJET_OK, OBJET_OK] : [OBJET_OK, SUJET_OK];
      return {
        prompt: `Lis les deux lignes. Pour « ${g.gn} », écris sa fonction sur chaque ligne, puis sa nature.`,
        figure: document('Deux phrases', lignes),
        answer: {
          kind: 'cloze',
          parts: ['Ligne 1, fonction : ', '. Ligne 2, fonction : ', '. Nature du groupe : ', '.'],
          blanks: [...roles, GN_OK].map((accepted) => ({ mode: 'text' as const, accepted })),
        },
        hint: 'La fonction peut changer d’une ligne à l’autre. La nature dit quelle sorte de groupe c’est.',
        steps: [
          'Cherche le verbe de chaque ligne.',
          `Demande-toi : « ${g.gn} » fait-il l’action, ou complète-t-il le verbe ?`,
          'Regarde le groupe : il a un déterminant et un nom.',
          `Écris **${sujetDAbord ? 'sujet' : 'complément d’objet'}**, **${sujetDAbord ? 'complément d’objet' : 'sujet'}**, puis **groupe nominal**.`,
        ],
      };
    }
  }
}

// ───────────────────────── 2. Articles définis et indéfinis ─────────────────────────

const DEFINI = 'un article défini';
const INDEFINI = 'un article indéfini';
const LISTE_DEF = 'Les articles définis sont « le, la, l’, les ».';
const LISTE_INDEF = 'Les articles indéfinis sont « un, une, des ».';
const liste = (defini: boolean) => (defini ? LISTE_DEF : LISTE_INDEF);
const motsListe = (defini: boolean) => (defini ? '« le, la, l’, les »' : '« un, une, des »');
const maj = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function articlesDraft(rng: Rng, level: Level): QuestionDraft {
  const defini = rng.int(0, 1) === 0;
  const type = defini ? DEFINI : INDEFINI;
  switch (level) {
    case 1: {
      const n = rng.pick(NOMS_VERBES);
      const art = maj(articleDe(n, defini));
      const { answer, traps } = choice(rng, type, [
        { label: defini ? INDEFINI : DEFINI, why: liste(!defini) + ` « ${art} » n’en fait pas partie.` },
        { label: 'un verbe', why: `Le verbe est « ${n.verbe} ». « ${art} » accompagne le nom.` },
      ]);
      return {
        prompt: `Choisis la bonne réponse. Dans « ${art} ${n.nom} ${n.verbe}. », le mot « ${art} » est…`,
        answer,
        traps,
        hint: 'Regarde ce petit mot devant le nom. Désigne-t-il une chose précise, ou une parmi d’autres ?',
        steps: [
          'Lis les articles définis : « le, la, l’, les ».',
          'Lis les articles indéfinis : « un, une, des ».',
          `Cherche « ${art} » dans ces listes, puis choisis **${type}**.`,
        ],
      };
    }
    case 2: {
      const tirage = pickN(rng, NOMS_VERBES, 4);
      const premier = at(tirage, 0);
      const phrase = (n: (typeof NOMS_VERBES)[number], d: boolean) => `${maj(articleDe(n, d))} ${n.nom} ${n.verbe}.`;
      const { answer, traps } = choice(
        rng,
        phrase(premier, defini),
        tirage.slice(1).map((n) => ({
          label: phrase(n, !defini),
          why: `« ${maj(articleDe(n, !defini))} » est ${defini ? INDEFINI : DEFINI}.`,
        })),
      );
      return {
        prompt: `Choisis la phrase qui contient ${type}.`,
        answer,
        traps,
        hint: 'Lis le premier mot de chaque phrase et compare avec ta liste d’articles.',
        steps: [
          `Retiens la liste : ${motsListe(defini)}.`,
          'Lis le petit mot devant chaque nom.',
          `Choisis **${phrase(premier, defini)}**`,
        ],
      };
    }
    case 3: {
      const n = rng.pick(NOMS_VERBES);
      const bon = articleDe(n, defini);
      const accepted = [bon];
      const autreGenre = articleDe({ ...n, genre: n.genre === 'm' ? 'f' : 'm' }, defini);
      return {
        prompt: `Complète avec ${type} : « … ${n.nom} ${n.verbe}. »`,
        answer: { kind: 'text', accepted },
        traps: textTraps(accepted, [
          [articleDe(n, !defini), `C’est ${defini ? INDEFINI : DEFINI}. La consigne demande ${type}.`],
          [autreGenre, `Regarde le genre de « ${n.nom} » : il est ${n.genre === 'm' ? 'masculin' : 'féminin'}.`],
          [
            articleDe({ ...n, pluriel: !n.pluriel }, defini),
            'Regarde le nombre : le nom est-il au singulier ou au pluriel ?',
          ],
        ]),
        hint: 'Regarde le nom : masculin ou féminin ? un seul ou plusieurs ?',
        steps: [
          `Retiens la liste : ${motsListe(defini)}.`,
          `Regarde « ${n.nom} » : ${n.genre === 'm' ? 'masculin' : 'féminin'}, ${n.pluriel ? 'au pluriel' : 'au singulier'}.`,
          `Écris **${bon}**.`,
        ],
      };
    }
    case 4: {
      const p = rng.pick(PAIRES);
      const [depart, bon] = defini ? [p.indefini, p.defini] : [p.defini, p.indefini];
      const nom = p.defini.replace(/^(l’|le |la |les )/, '');
      const faux = defini ? [`le ${nom}`, `la ${nom}`, `les ${nom}`] : [`un ${nom}`, `une ${nom}`, `des ${nom}`];
      return {
        prompt: `Écris le groupe « ${depart} » avec ${type}.`,
        answer: { kind: 'text', accepted: [bon] },
        traps: textTraps(
          [bon],
          [
            [depart, `Tu as recopié le groupe. Il faut changer l’article : ${liste(defini)}`],
            ...faux.map(
              (t) =>
                [
                  t,
                  defini
                    ? 'Vérifie le genre et le nombre. Devant une voyelle ou un h muet, « le » et « la » deviennent « l’ ».'
                    : 'Vérifie le genre et le nombre du nom : « un », « une » ou « des ».',
                ] as const,
            ),
          ],
        ),
        hint: defini
          ? 'Attention à la première lettre du nom : elle peut changer la forme de l’article.'
          : 'Trouve le genre du nom, puis regarde s’il y en a un ou plusieurs.',
        steps: [
          `Retiens la liste : ${motsListe(defini)}.`,
          `Garde le nom « ${nom} ». Change seulement le petit mot devant.`,
          bon.startsWith('l’')
            ? 'Regarde la première lettre : voyelle ou h muet, prends « l’ ».'
            : 'Regarde le genre du nom, puis compte : un seul ou plusieurs ?',
          `Écris **${bon}**.`,
        ],
      };
    }
    default: {
      const compte = (l: (typeof LIGNES_ARTICLES)[number]) => (defini ? l.definis : l.indefinis);
      const lignes = troisLignes(rng, LIGNES_ARTICLES, compte);
      const k = total(lignes, compte);
      const autres = total(lignes, (l) => (defini ? l.indefinis : l.definis));
      return {
        prompt: `Lis ce texte. Combien d’articles ${defini ? 'définis' : 'indéfinis'} contient-il ?`,
        figure: document(
          'Quelques phrases',
          lignes.map((l) => l.texte),
        ),
        answer: num(k),
        traps: numTraps(r(k), [
          [autres, `Tu as compté les articles ${defini ? 'indéfinis' : 'définis'}. Relis la question.`],
          [k + autres, 'Tu as compté tous les articles. Garde seulement la sorte demandée.'],
          [k + 1, 'Tu en as un de trop : recompte. Les mots « mon », « ce » ou « notre » ne sont pas des articles.'],
        ]),
        hint: 'Relève ligne par ligne les petits mots devant les noms.',
        steps: [
          `Cherche ces mots, ligne par ligne : ${motsListe(defini)}.`,
          ...bullesCompte(releves(lignes, defini ? ['le', 'la', 'l', 'les'] : ['un', 'une', 'des']), k),
        ],
      };
    }
  }
}

// ───────────────────────── 3. Déterminants possessifs et démonstratifs ─────────────────────────

const POSS = 'un déterminant possessif';
const DEM = 'un déterminant démonstratif';
const DEF_POSS = 'Le déterminant possessif dit à qui c’est : mon, ton, son, notre, votre, leur…';
const DEF_DEM = 'Le déterminant démonstratif montre : ce, cet, cette, ces.';
const defDet = (poss: boolean) => (poss ? DEF_POSS : DEF_DEM);
const NOMS_SIMPLES: Record<string, string> = {
  mon: 'sac',
  ma: 'table',
  mes: 'jouets',
  ton: 'sac',
  ta: 'table',
  tes: 'jouets',
  son: 'sac',
  sa: 'table',
  ses: 'jouets',
  notre: 'sac',
  nos: 'jouets',
  votre: 'sac',
  vos: 'jouets',
  leur: 'sac',
  leurs: 'jouets',
  ce: 'sac',
  cet: 'avion',
  cette: 'table',
  ces: 'jouets',
};

/** Genre et nombre de l’objet, et la règle de la voyelle quand « mon, ton, son » remplacent « ma, ta, sa ». */
function accordPossessif(p: Possesseur, o: Objet) {
  const [masculin, feminin] = FORMES_POSSESSIF[p];
  const det = possessif(p, o);
  const devantVoyelle = !o.pluriel && o.genre === 'f' && det === masculin && masculin !== feminin;
  return {
    genre: `${o.genre === 'm' ? 'masculin' : 'féminin'} ${o.pluriel ? 'pluriel' : 'singulier'}`,
    regle: devantVoyelle ? ' Devant une voyelle, on écrit « mon, ton, son » même au féminin.' : '',
    conseil: devantVoyelle
      ? 'Vérifie la première lettre : devant une voyelle, écris « mon, ton, son ».'
      : `Choisis le bon mot parmi « ${[...new Set(FORMES_POSSESSIF[p])].join(', ')} ».`,
  };
}

function determinantsDraft(rng: Rng, level: Level): QuestionDraft {
  const poss = rng.int(0, 1) === 0;
  const type = poss ? POSS : DEM;
  switch (level) {
    case 1: {
      const det = rng.pick(poss ? POSSESSIFS : DEMONSTRATIFS);
      const nom = NOMS_SIMPLES[det] ?? 'sac';
      const { answer, traps } = choice(rng, type, [
        { label: poss ? DEM : POSS, why: `${defDet(!poss)} « ${det} » ${poss ? 'dit à qui c’est' : 'montre'}.` },
        { label: 'un article', why: `Les articles sont « le, la, l’, les, un, une, des ». Pas « ${det} ».` },
      ]);
      return {
        prompt: `Choisis la bonne réponse. Dans « ${det} ${nom} », le mot « ${det} » est…`,
        answer,
        traps,
        hint: 'Ce mot sert-il à montrer, ou à dire à qui c’est ?',
        steps: [
          `Regarde le mot « ${det} », devant le nom.`,
          'Demande-toi : dit-il à qui c’est, ou montre-t-il ?',
          `Choisis **${type}** : « ${det} » ${poss ? 'dit à qui c’est' : 'montre'}.`,
        ],
      };
    }
    case 2: {
      const nom = rng.pick(['sac', 'vélo', 'jeu', 'livre', 'ballon', 'chapeau']);
      const monPoss = rng.pick(['mon', 'ton', 'son']);
      const groupes = {
        poss: `${monPoss} ${nom}`,
        dem: `ce ${nom}`,
        def: `le ${nom}`,
        indef: `un ${nom}`,
      };
      const bon = poss ? groupes.poss : groupes.dem;
      const { answer, traps } = choice(rng, bon, [
        {
          label: poss ? groupes.dem : groupes.poss,
          why: `Ici, le petit mot ${poss ? 'montre' : 'dit à qui c’est'} : il est ${poss ? 'démonstratif' : 'possessif'}.`,
        },
        { label: groupes.def, why: '« le » est un article défini.' },
        { label: groupes.indef, why: '« un » est un article indéfini.' },
      ]);
      return {
        prompt: `Choisis le groupe qui commence par ${type}.`,
        answer,
        traps,
        hint: 'Lis le premier mot de chaque groupe : montre-t-il, ou dit-il à qui c’est ?',
        steps: [
          'Lis le petit mot devant chaque nom.',
          poss ? 'Cherche le mot qui dit à qui c’est.' : 'Cherche le mot qui montre.',
          `Choisis **${bon}**.`,
        ],
      };
    }
    case 3: {
      const x = rng.pick(NOMS_DEMONSTRATIFS);
      const accepted = [x.det];
      return {
        prompt: `Complète avec « ce », « cet », « cette » ou « ces » : « Regarde … ${x.nom}. »`,
        answer: { kind: 'text', accepted },
        traps: textTraps(
          accepted,
          DEMONSTRATIFS.map((d) => [d, `Ici, ${x.pourquoi} : « ${d} » ne convient pas.`] as const),
        ),
        hint: 'Regarde le nom : combien ? masculin ou féminin ? quelle première lettre ?',
        steps: [
          `Regarde le nom « ${x.nom} », après le trou.`,
          `Retiens ceci : ${x.pourquoi}.`,
          `Écris **${x.det}** : on lit « ${x.det} ${x.nom} ».`,
        ],
      };
    }
    case 4: {
      const p = rng.pick(POSSESSEURS);
      const o = rng.pick(OBJETS);
      const det = possessif(p, o);
      const bon = `${det} ${o.nom}`;
      const formes = [...new Set(FORMES_POSSESSIF[p])];
      const { genre, regle, conseil } = accordPossessif(p, o);
      const autre = FORMES_POSSESSIF[p === 'moi' ? 'toi' : 'moi'][o.pluriel ? 2 : 0];
      return {
        prompt: `Remplace « ${o.groupe} qui ${o.pluriel ? 'sont' : 'est'} à ${p} » par un groupe avec un déterminant possessif.`,
        answer: { kind: 'text', accepted: [bon] },
        traps: textTraps(
          [bon],
          [
            ...formes.map(
              (d) => [`${d} ${o.nom}`, `Vérifie le genre et le nombre : « ${o.nom} » est ${genre}.${regle}`] as const,
            ),
            [`${autre} ${o.nom}`, `Ce possessif ne dit pas « à ${p} ».`],
            [o.groupe, 'Il manque le possessif : il dit à qui c’est.'],
          ],
        ),
        hint: `Quel petit mot veut dire « à ${p} » ? Accorde-le avec le nom.`,
        steps: [
          `Trouve à qui c’est : « à ${p} ».`,
          `Regarde le nom « ${o.nom} » : il est ${genre}.`,
          conseil,
          `Écris **${bon}**.`,
        ],
      };
    }
    default: {
      const compte = (l: (typeof LIGNES_DETERMINANTS)[number]) => (poss ? l.possessifs : l.demonstratifs);
      const lignes = troisLignes(rng, LIGNES_DETERMINANTS, compte);
      const k = total(lignes, compte);
      const autres = total(lignes, (l) => (poss ? l.demonstratifs : l.possessifs));
      return {
        prompt: `Lis ce texte. Combien de déterminants ${poss ? 'possessifs' : 'démonstratifs'} contient-il ?`,
        figure: document(
          'Quelques phrases',
          lignes.map((l) => l.texte),
        ),
        answer: num(k),
        traps: numTraps(r(k), [
          [autres, `Tu as compté les ${poss ? 'démonstratifs' : 'possessifs'}. Relis la question.`],
          [k + autres, 'Tu as compté les deux sortes. Garde seulement la sorte demandée.'],
          [k + 1, 'Tu en as un de trop : un article n’est ni possessif ni démonstratif.'],
        ]),
        hint: 'Regarde le petit mot devant chaque nom, ligne par ligne.',
        steps: [
          poss
            ? 'Cherche les mots qui disent à qui c’est.'
            : 'Cherche les mots qui montrent : « ce, cet, cette, ces ».',
          ...bullesCompte(releves(lignes, poss ? POSSESSIFS : DEMONSTRATIFS), k),
        ],
      };
    }
  }
}

// ───────────────────────── 4. Conjonctions de coordination ─────────────────────────

const whyNonConj = (m: string) => `« ${m} » n’est pas dans la liste : mais, ou, et, donc, or, ni, car.`;

function conjonctionsDraft(rng: Rng, level: Level): QuestionDraft {
  switch (level) {
    case 1: {
      const bon = rng.pick(CONJONCTIONS.filter((c) => c !== 'or' && c !== 'ni'));
      const { answer, traps } = choice(
        rng,
        bon,
        pickN(rng, MOTS_NON_CONJ, 2).map((m) => ({ label: m, why: whyNonConj(m) })),
      );
      return {
        prompt: 'Choisis la conjonction de coordination.',
        answer,
        traps,
        hint: 'C’est un petit mot qui relie des mots ou des phrases.',
        steps: [
          'Retiens les sept mots : mais, ou, et, donc, or, ni, car.',
          'Cherche lequel des trois mots est dans cette liste.',
          `Choisis **${bon}**.`,
        ],
      };
    }
    case 2: {
      const p = rng.pick(PHRASES_CONJ.filter((x) => x.conj !== 'or'));
      const { answer, traps } = choice(
        rng,
        p.conj,
        p.autres.map((m) => ({ label: m, why: whyNonConj(m) })),
      );
      return {
        prompt: `Choisis la conjonction de coordination dans « ${p.texte} »`,
        answer,
        traps,
        hint: 'Cherche le petit mot qui relie les deux parties.',
        steps: [
          'Retiens la liste : mais, ou, et, donc, or, ni, car.',
          'Cherche dans la phrase le mot qui relie.',
          `Choisis **${p.conj}**.`,
        ],
      };
    }
    case 3: {
      const p = rng.pick(PHRASES_CONJ);
      const accepted = [p.conj];
      return {
        prompt: `Écris la conjonction de coordination de cette phrase : « ${p.texte} »`,
        answer: { kind: 'text', accepted },
        traps: textTraps(
          accepted,
          p.autres.map((m) => [m, whyNonConj(m)] as const),
        ),
        hint: 'Récite la liste des sept conjonctions, puis cherche l’une d’elles.',
        steps: [
          'Retiens la liste : mais, ou, et, donc, or, ni, car.',
          'Relis la phrase. Repère le mot qui est dans la liste.',
          `Écris **${p.conj}**.`,
        ],
      };
    }
    case 4: {
      const choisies = pickN(rng, Object.keys(ROLES) as (keyof typeof ROLES)[], 5);
      const { right, pairs } = appariement(
        rng,
        choisies.map((c) => ROLES[c]),
      );
      return {
        prompt: `Associe chaque conjonction à ce qu’elle fait : ${choisies.join(', ')}.`,
        answer: { kind: 'match', left: choisies, right, pairs },
        hint: 'Mets chaque conjonction dans une petite phrase à toi : que dit-elle ?',
        steps: [
          'Mets chaque conjonction dans une petite phrase à toi.',
          'Demande-toi : ajoute-t-elle, propose-t-elle un choix, explique-t-elle ?',
          'Place d’abord celles que tu connais le mieux.',
          `Associe ainsi : **${choisies.map((c) => `${c} = ${ROLES_COURTS[c]}`).join(', ')}**.`,
        ],
      };
    }
    default: {
      const lignes = troisLignes(rng, LIGNES_CONJ, (l) => l.n);
      const k = total(lignes, (l) => l.n);
      return {
        prompt:
          'Lis ce texte. Combien de conjonctions de coordination contient-il en tout ? Un mot répété compte à chaque fois.',
        figure: document(
          'Quelques phrases',
          lignes.map((l) => l.texte),
        ),
        answer: num(k),
        traps: numTraps(r(k), [
          [k + 1, 'Tu en as un de trop : « est », « où » ou « puis » ne sont pas dans la liste.'],
          [
            k - 1,
            lignes.some((l) => l.texte.includes(' ni '))
              ? 'Il t’en manque une : « ni… ni » compte pour deux mots.'
              : 'Il t’en manque une : relis chaque ligne avec la liste des sept mots.',
          ],
          [lignes.filter((l) => l.n > 0).length, 'Tu as compté les lignes. Une ligne peut avoir deux conjonctions.'],
        ]),
        hint: 'Cherche les sept mots de la liste. Attention : « est » n’est pas « et ».',
        steps: [
          'Cherche les mots : mais, ou, et, donc, or, ni, car.',
          ...bullesCompte(releves(lignes, CONJONCTIONS), k),
        ],
      };
    }
  }
}

// ───────────────────────── 5. Adverbes fréquents ─────────────────────────

const NOMS_PIEGE = ['chien', 'maison', 'gâteau', 'vélo', 'jardin'];
const VERBES_PIEGE = ['chante', 'mange', 'dort', 'dessine', 'saute'];
const whyNonAdverbe = (m: string) => `« ${m} » n’est pas un adverbe : ce mot ne précise pas comment, quand ou où.`;

function adverbesDraft(rng: Rng, level: Level): QuestionDraft {
  switch (level) {
    case 1: {
      const bon = rng.pick(['souvent', 'toujours', 'beaucoup', 'très', 'demain', 'ici', 'vite']);
      const nom = rng.pick(NOMS_PIEGE);
      const verbe = rng.pick(VERBES_PIEGE);
      const { answer, traps } = choice(rng, bon, [
        { label: nom, why: `« ${nom} » est un nom : il désigne un animal ou une chose.` },
        { label: verbe, why: `« ${verbe} » est un verbe : il dit ce qu’on fait.` },
      ]);
      return {
        prompt: 'Choisis le mot qui est un adverbe.',
        answer,
        traps,
        hint: 'Écarte le nom (une chose) et le verbe (une action).',
        steps: [
          `Écarte « ${nom} » : ce mot nomme un animal ou une chose.`,
          `Écarte « ${verbe} » : ce verbe dit ce qu’on fait.`,
          `Choisis **${bon}**.`,
        ],
      };
    }
    case 2: {
      if (rng.int(0, 1) === 0) {
        const p = rng.pick(PHRASES_ADVERBES);
        const { answer, traps } = choice(
          rng,
          p.adverbe,
          p.autres.map((m) => ({ label: m, why: whyNonAdverbe(m) })),
        );
        return {
          prompt: `Choisis l’adverbe dans « ${p.texte} »`,
          answer,
          traps,
          hint: 'Cherche le mot qui dit comment, combien, quand ou où.',
          steps: [
            'Cherche le mot qui ajoute une précision.',
            'Demande-toi : dit-il comment, combien, quand ou où ?',
            `Choisis **${p.adverbe}**.`,
          ],
        };
      }
      const bon = rng.pick(CATEGORIES.temps);
      const { answer, traps } = choice(rng, bon, [
        { label: rng.pick(CATEGORIES.lieu), why: 'Cet adverbe dit où : c’est un adverbe de lieu.' },
        ...pickN(rng, CATEGORIES['quantité ou intensité'], 2).map((m) => ({
          label: m,
          why: `« ${m} » dit une quantité ou une force, pas un moment.`,
        })),
      ]);
      return {
        prompt: 'Choisis l’adverbe qui dit quand.',
        answer,
        traps,
        hint: 'Pose la question « quand ? » : un seul mot peut répondre.',
        steps: [
          'Pose la question « quand ? » à chaque mot.',
          'Écarte les mots qui disent où ou combien.',
          `Choisis **${bon}**.`,
        ],
      };
    }
    case 3: {
      const p = rng.pick(PHRASES_ADVERBES);
      const accepted = [p.adverbe];
      return {
        prompt: `Écris l’adverbe de cette phrase : « ${p.texte} »`,
        answer: { kind: 'text', accepted },
        traps: textTraps(
          accepted,
          p.autres.map((m) => [m, whyNonAdverbe(m)] as const),
        ),
        hint: 'Cherche le mot qui dit comment, combien, quand ou où. Il ne change jamais.',
        steps: [
          'Cherche le mot qui ajoute une précision.',
          'Demande-toi : dit-il comment, combien, quand ou où ?',
          `Écris **${p.adverbe}**.`,
        ],
      };
    }
    case 4: {
      const p = rng.pick(PLURIELS);
      const accepted = avecOuSansPoint(p.pluriel);
      return {
        prompt: `Écris cette phrase au pluriel : « ${p.singulier} »`,
        answer: { kind: 'text', accepted },
        traps: textTraps(accepted, [
          [p.faux, `L’adverbe « ${p.adverbe} » est invariable : il ne change pas au pluriel.`],
          [p.singulier, 'La phrase est encore au singulier : mets le sujet et le verbe au pluriel.'],
        ]),
        hint: 'Change le sujet et le verbe. Un des mots, lui, reste toujours pareil.',
        steps: [
          'Mets au pluriel le petit mot, le nom et le verbe.',
          `Garde « ${p.adverbe} » sans rien changer : cet adverbe est invariable.`,
          `Écris **${p.pluriel}**`,
        ],
      };
    }
    default: {
      const lignes = troisLignes(rng, LIGNES_ADVERBES, (l) => l.n);
      const k = total(lignes, (l) => l.n);
      return {
        prompt: 'Lis ce texte. Combien d’adverbes contient-il en tout ?',
        figure: document(
          'Quelques phrases',
          lignes.map((l) => l.texte),
        ),
        answer: num(k),
        traps: numTraps(r(k), [
          [k + 1, 'Tu en as un de trop : recompte. Un adjectif, comme « rouge » ou « long », n’est pas un adverbe.'],
          [k - 1, 'Il t’en manque un : une ligne peut en avoir deux.'],
          [lignes.filter((l) => l.n > 0).length, 'Tu as compté les lignes. Compte chaque adverbe.'],
        ]),
        hint: 'Pour chaque ligne, cherche les mots qui disent quand, où, comment ou combien.',
        steps: [
          'Cherche les mots qui disent quand, où, comment ou combien.',
          ...bullesCompte(releves(lignes, ADVERBES_DES_LIGNES), k),
        ],
      };
    }
  }
}

// ───────────────────────── 6. Pronoms personnels ─────────────────────────

const P_SUJET = 'un pronom personnel sujet';
const P_COMPL = 'un pronom personnel complément';
const DEF_SUJET = 'Le pronom sujet dit qui fait l’action : je, tu, il, elle, nous, vous, ils, elles.';
const DEF_COMPL = 'Le pronom complément complète le verbe : me, te, le, la, les, lui, leur…';
const PRONOMS_SUJETS = ['Il', 'Elle', 'Ils', 'Elles'];
const PRONOMS_OBJETS: readonly PronomObjet[] = ['le', 'la', 'les', 'lui', 'leur'];

const whyObjet = (o: ObjetPhrase) =>
  o.groupe.startsWith('à') || o.groupe.startsWith('aux')
    ? `« ${o.groupe} » est introduit par « à »${o.groupe.startsWith('aux') ? ' (« aux » veut dire « à les »)' : ''} : on le remplace par « lui » (un seul) ou « leur » (plusieurs).`
    : `« ${o.groupe} » suit le verbe sans « à » : on le remplace par « le », « la » ou « les », selon le genre et le nombre.`;

/** La bulle qui dit comment choisir le pronom complément d'un groupe. */
const CHOIX_PRONOM: Record<PronomObjet, string> = {
  le: 'pas de « à », masculin singulier. Prends « le ».',
  la: 'pas de « à », féminin singulier. Prends « la ».',
  les: 'pas de « à », pluriel. Prends « les ».',
  lui: 'avec « à », une seule personne. Prends « lui ».',
  leur: 'avec « à » ou « aux », plusieurs personnes. Prends « leur ».',
};
const choisirPronom = (o: ObjetPhrase) => `Regarde « ${o.groupe} » : ${CHOIX_PRONOM[o.pronom]}`;

function pronomsDraft(rng: Rng, level: Level): QuestionDraft {
  switch (level) {
    case 1: {
      const bon = rng.pick(['je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles']);
      const nom = rng.pick(NOMS_PIEGE);
      const verbe = rng.pick(VERBES_PIEGE);
      const { answer, traps } = choice(rng, bon, [
        { label: nom, why: `« ${nom} » est un nom : on peut dire « un » ou « une » devant.` },
        { label: verbe, why: `« ${verbe} » est un verbe : il dit ce qu’on fait.` },
      ]);
      return {
        prompt: 'Choisis le mot qui est un pronom personnel.',
        answer,
        traps,
        hint: 'C’est un petit mot qui désigne une personne ou remplace un nom.',
        steps: [
          `Écarte « ${nom} » : ce mot est un nom.`,
          `Écarte « ${verbe} » : ce verbe dit ce qu’on fait.`,
          `Choisis **${bon}** : ce pronom désigne une personne ou remplace un nom.`,
        ],
      };
    }
    case 2: {
      const p = rng.pick(PHRASES_PRONOMS);
      const bon = p.sujet ? P_SUJET : P_COMPL;
      const { answer, traps } = choice(rng, bon, [
        { label: p.sujet ? P_COMPL : P_SUJET, why: p.sujet ? DEF_SUJET : DEF_COMPL },
        { label: 'un nom', why: `On ne peut pas mettre « un » devant « ${p.pronom} » : ce n’est pas un nom.` },
        {
          label: 'un déterminant',
          why: `Un déterminant est devant un nom. Ici, « ${p.pronom} » n’accompagne pas un nom.`,
        },
      ]);
      return {
        prompt: `Choisis la bonne réponse. Dans « ${p.texte} », le mot « ${p.pronom} » est…`,
        answer,
        traps,
        hint: 'Trouve le verbe. Ce petit mot fait-il l’action, ou la complète-t-il ?',
        steps: [
          'Trouve le verbe de la phrase.',
          `Demande-toi : « ${p.pronom} » fait-il l’action, ou complète-t-il le verbe ?`,
          `Choisis **${bon}** : « ${p.pronom} » ${p.sujet ? 'dit qui fait l’action' : 'complète le verbe'}.`,
        ],
      };
    }
    case 3: {
      const s = rng.pick(SUJETS_GN);
      const accepted = [s.pronom];
      return {
        prompt: `Remplace « ${s.gn} » par un pronom personnel sujet : « ${s.phrase} » Écris le pronom.`,
        answer: { kind: 'text', accepted },
        traps: textTraps(
          accepted,
          PRONOMS_SUJETS.map(
            (x) => [x, `Regarde le genre et le nombre de « ${s.gn} » : « ${x} » ne convient pas.`] as const,
          ),
        ),
        hint: 'Le groupe est-il masculin ou féminin ? Y en a-t-il un ou plusieurs ?',
        steps: [
          `Trouve le genre de « ${s.gn} » : ${s.pronom.startsWith('Elle') ? 'féminin' : 'masculin'}.`,
          `Compte : le groupe est au ${s.pronom.endsWith('s') ? 'pluriel' : 'singulier'}.`,
          `Écris **${s.pronom}**.`,
        ],
      };
    }
    case 4: {
      const o = rng.pick(OBJETS_PHRASES);
      const accepted = avecOuSansPoint(phrasePronom(o));
      return {
        prompt: `Remplace « ${o.groupe} » par un pronom. Écris toute la phrase : « ${phraseObjet(o)} »`,
        answer: { kind: 'text', accepted },
        traps: textTraps(accepted, [
          [`${o.sujet} ${o.verbe} ${o.pronom}.`, 'Le pronom complément se place avant le verbe, pas après.'],
          ...PRONOMS_OBJETS.map((p) => [phrasePronom(o, o.sujet, p), whyObjet(o)] as const),
        ]),
        hint: 'Choisis le bon pronom, puis place-le juste avant le verbe.',
        steps: [choisirPronom(o), 'Place ce pronom juste avant le verbe.', `Écris **${phrasePronom(o)}**`],
      };
    }
    default: {
      const lignes = pickN(rng, OBJETS_PHRASES, 2);
      const i = rng.int(0, 1);
      const o = at(lignes, i);
      const bon = phrasePronom(o, o.pronomSujet);
      const accepted = avecOuSansPoint(bon);
      return {
        prompt: `Lis le texte. Remplace les deux groupes de la ligne ${i + 1} par des pronoms. Écris la phrase.`,
        figure: document(
          'Deux phrases',
          lignes.map((l) => phraseObjet(l)),
        ),
        answer: { kind: 'text', accepted },
        traps: textTraps(accepted, [
          [phrasePronom(o), `Tu as remplacé « ${o.groupe} » seulement : remplace aussi le sujet.`],
          [phraseObjet(o, o.pronomSujet), 'Tu as remplacé le sujet seulement : remplace aussi le complément.'],
          [`${o.pronomSujet} ${o.verbe} ${o.pronom}.`, 'Le pronom complément se place avant le verbe, pas après.'],
        ]),
        hint: 'Remplace d’abord le sujet, puis le complément. Le pronom complément passe devant le verbe.',
        steps: [
          `Remplace d’abord le sujet « ${o.sujet} » par « ${o.pronomSujet} ».`,
          choisirPronom(o),
          'Place ce pronom juste avant le verbe.',
          `Écris **${bon}**`,
        ],
      };
    }
  }
}

// ───────────────────────── Notions du chapitre ─────────────────────────

interface Notion {
  readonly id: string;
  readonly title: string;
  readonly memo: readonly string[];
  readonly sens: Sens;
  readonly factId: string;
  readonly faits: readonly string[];
  readonly generate: Skill['generate'];
}

const skill = (n: Notion): Skill => ({
  id: n.id,
  title: n.title,
  levels: 5,
  version: 2,
  lesson: {
    memo: n.memo,
    source: programme(n.factId),
    sources: [...new Set([...sourcesDe(n.factId, ...n.faits), n.sens.source])],
  },
  sens: [n.sens],
  generate: n.generate,
});

export const FCM1_NATURE: readonly Skill[] = [
  skill({
    id: 'fcm1-nature-fonction',
    title: 'Nature ou fonction',
    memo: [
      'La **nature** dit la sorte de mot ; la **fonction** dit son rôle.',
      'Dans « Le cheval dort », « le cheval » est un **groupe nominal** : c’est sa nature.',
      'Ce groupe est aussi le **sujet** : c’est sa fonction.',
    ],
    sens: SENS_NATURE.natureFonction,
    factId: 'nature-fonction',
    faits: ['natures', 'fonctions', 'fonction'],
    generate: natureFonctionDraft,
  }),
  skill({
    id: 'fcm1-articles',
    title: 'Articles définis et indéfinis',
    memo: [
      '**Article défini** : le, la, l’, les ; **article indéfini** : un, une, des.',
      'On présente avec « un chat », puis on reprend avec « le chat ».',
      'Devant une voyelle ou un **h muet**, « le » et « la » deviennent « l’ ».',
    ],
    sens: SENS_NATURE.articles,
    factId: 'determinants',
    faits: ['article-defini', 'article-indefini'],
    generate: articlesDraft,
  }),
  skill({
    id: 'fcm1-determinants-poss-dem',
    title: 'Déterminants possessifs et démonstratifs',
    memo: [
      'Le **déterminant possessif** dit à qui c’est : mon stylo, ta gomme.',
      'Le **déterminant démonstratif** montre : ce stylo, cet ours, cette porte, ces pages.',
      'Devant une voyelle ou un **h muet**, écris « mon histoire » et « cet hiver ».',
    ],
    sens: SENS_NATURE.determinants,
    factId: 'determinants',
    faits: ['possessif', 'mon', 'ton', 'son', 'notre', 'votre', 'leur', 'ce'],
    generate: determinantsDraft,
  }),
  skill({
    id: 'fcm1-conjonctions-coordination',
    title: 'Conjonctions de coordination',
    memo: [
      'Une **conjonction de coordination** relie : mais, ou, et, donc, or, ni, car.',
      '« et » : ajout ; « ou » : choix ; « mais » : **opposition** ; « car » : explication ; « donc » : **conséquence** ; « ni » : négation.',
      'Attention : « et » relie, mais « est » vient du verbe être.',
    ],
    sens: SENS_NATURE.conjonctions,
    factId: 'conjonctions',
    faits: ['mais', 'ou', 'et', 'donc', 'or', 'ni', 'car'],
    generate: conjonctionsDraft,
  }),
  skill({
    id: 'fcm1-adverbes',
    title: 'Adverbes fréquents',
    memo: [
      'Un **adverbe** précise un verbe, un adjectif ou un autre adverbe.',
      'Il est **invariable** : « il rit souvent », « ils rient souvent ».',
      'Il peut dire quand (hier), où (ici), combien (beaucoup) ou comment (vite).',
    ],
    sens: SENS_NATURE.adverbes,
    factId: 'adverbes',
    faits: [
      'invariable',
      'adverbe',
      'toujours',
      'souvent',
      'hier',
      'demain',
      'aujourdhui',
      'deja',
      'ensuite',
      'ici',
      'tres',
      'trop',
      'beaucoup',
      'bien',
      'vite',
    ],
    generate: adverbesDraft,
  }),
  skill({
    id: 'fcm1-pronoms-personnels',
    title: 'Pronoms personnels sujets et compléments',
    memo: [
      'Le **pronom personnel sujet** dit qui fait l’action : je, tu, il, elle, nous, vous, ils, elles.',
      'Le **pronom personnel complément** complète le verbe : me, te, le, la, les ; avec « à » : lui, leur.',
      'Il se place souvent devant le verbe : « Mon père lave le bol » devient « Il le lave ».',
    ],
    sens: SENS_NATURE.pronoms,
    factId: 'pronoms',
    faits: ['remplacer-sujet', 'remplacer-objet', 'je', 'tu', 'il', 'me', 'te', 'le', 'lui'],
    generate: pronomsDraft,
  }),
];
