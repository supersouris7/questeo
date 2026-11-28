import { choice, num, traps as numTraps } from '../build.ts';
import { r } from '../rational.ts';
import type { Rng } from '../rng.ts';
import type { Level, QuestionDraft, Sens, Skill } from '../types.ts';
import {
  CONSTAT,
  DEFINITION,
  EN_FAISANT,
  ENTREES,
  MANIPS,
  NOM_MANIP,
  SENS_COMPL,
  base,
  consigne,
  deux,
  devant,
  ecritures,
  faitCompl,
  groupeAccepte,
  manipsDe,
  phraseAcceptee,
  resultat,
  sansCirc,
  type Entree,
  type Manip,
} from './complements.donnees.ts';
import { document, lowerFirst, pickN, textTrap } from './outils.ts';

/**
 * Chapitre « Les compléments » (CM1). Programme de français du cycle 3 (BO du 17 avril 2025),
 * enseignement de la langue : « Analyser une phrase simple ».
 */
const PROGRAMME = 'francais-cycle3-2025';
const programme = (id: string) =>
  `Programme de français du cycle 3 (BO du 17 avril 2025), CM1 — « ${faitCompl(id).citation} »`;

const cods = ENTREES.filter((e) => e.type === 'cod');
const cois = ENTREES.filter((e) => e.type === 'coi');
/** Les phrases dont le groupe circonstanciel dit où : on peut leur ajouter un repère de temps ou « souvent ». */
const deLieu = ENTREES.flatMap((e) => (e.avant ? [{ ...e, avant: e.avant }] : []));
const deLieuCod = deLieu.filter((e) => e.type === 'cod');
const deLieuCoi = deLieu.filter((e) => e.type === 'coi');
/** Le groupe circonstanciel à la fin ou déplacé au début (tirage). */
const avecCirc = (rng: Rng, e: Entree): string => (rng.int(0, 1) === 0 ? base(e) : devant(e));

const whyObjet = (e: Entree) =>
  `« ${e.obj} » complète le verbe : si on le déplace, la phrase sonne mal. Ce n’est pas un groupe circonstanciel.`;
const whyCirc = (e: Entree) => `« ${e.circ} » se déplace (« ${devant(e)} ») : ce n’est pas un complément d’objet.`;
const whySujet = (e: Entree) => `« ${e.gs} » est le sujet : il dit qui fait l’action. Ce n’est pas ce groupe-là.`;
const whyPasObjet = (e: Entree) =>
  `« ${e.circ} » peut se déplacer et se supprimer : c’est un groupe circonstanciel, pas un complément d’objet.`;

/** COI écrit sans sa préposition (« son chien » au lieu de « à son chien »). */
const sansPrep = (e: Entree) =>
  e.prep
    ? [textTrap(e.obj.slice(e.prep.length + 1), `Il manque « ${e.prep} » : cette préposition fait partie du COI.`)]
    : [];

/** « « a », « b » » : des groupes cités les uns après les autres. */
const cites = (groupes: readonly string[]): string => groupes.map((g) => `« ${g} »`).join(', ');

// ───────────────────────── 1. Complément d'objet ou circonstanciel ─────────────────────────

function objetCircDraft(rng: Rng, level: Level): QuestionDraft {
  switch (level) {
    case 1: {
      const e = rng.pick(ENTREES);
      const estObjet = rng.int(0, 1) === 0;
      const g = estObjet ? e.obj : e.circ;
      const OBJET = 'un complément d’objet';
      const CIRC = 'un groupe circonstanciel';
      const { answer, traps } = choice(rng, estObjet ? OBJET : CIRC, [
        { label: estObjet ? CIRC : OBJET, why: estObjet ? whyObjet(e) : whyCirc(e) },
        {
          label: 'le sujet',
          why: `Le sujet dit qui fait l’action : ici, c’est « ${e.gs} ». « ${g} » n’est pas le sujet.`,
        },
      ]);
      return {
        prompt: `Choisis le rôle du groupe « ${g} » dans « ${base(e)} »`,
        answer,
        traps,
        hint: 'Déplace le groupe au début. Lis la phrase à voix haute : reste-t-elle correcte ?',
        steps: [
          `Essaie de déplacer « ${g} » au début de la phrase.`,
          estObjet
            ? `Lis la phrase à voix haute : elle n’est plus correcte. Garde ce groupe avec le verbe « ${e.verbe} ».`
            : `Lis : « ${devant(e)} » La phrase reste correcte.`,
          `Choisis **${estObjet ? OBJET : CIRC}**.`,
        ],
      };
    }
    case 2: {
      const e = rng.pick(ENTREES);
      const { answer, traps } = choice(rng, e.circ, [
        { label: e.gs, why: `« ${e.gs} » est le sujet : il reste devant le verbe.` },
        {
          label: `${e.verbe} ${e.obj}`,
          why: `« ${e.verbe} ${e.obj} » contient le verbe « ${e.verbe} » : ce groupe reste après le sujet.`,
        },
        { label: e.obj, why: whyObjet(e) },
      ]);
      return {
        prompt: `Choisis le groupe qui se déplace bien au début : « ${base(e)} »`,
        answer,
        traps,
        hint: 'Essaie les groupes un par un. Un seul se déplace bien.',
        steps: [
          'Essaie de mettre chaque groupe au début de la phrase.',
          `Lis : « ${devant(e)} » La phrase marche.`,
          `Choisis **${e.circ}**.`,
        ],
      };
    }
    case 3: {
      const e = rng.pick(ENTREES);
      return {
        prompt: `Écris le groupe que tu peux déplacer et aussi supprimer : « ${base(e)} »`,
        answer: { kind: 'text', accepted: groupeAccepte(e.circ) },
        traps: [textTrap(e.obj, whyObjet(e)), textTrap(e.gs, whySujet(e))],
        hint: 'Cherche un groupe qui peut aller au début. Il peut aussi disparaître.',
        steps: [
          `Essaie de déplacer un groupe : « ${devant(e)} »`,
          `Essaie de le supprimer : « ${sansCirc(e)} » C’est encore correct.`,
          `Écris **${e.circ}**.`,
        ],
      };
    }
    case 4: {
      const e = rng.pick(ENTREES);
      const s = avecCirc(rng, e);
      return {
        prompt: `Écris le complément d’objet de cette phrase : « ${s} »`,
        answer: { kind: 'text', accepted: groupeAccepte(e.obj) },
        traps: [
          textTrap(e.circ, whyPasObjet(e)),
          textTrap(e.gs, whySujet(e)),
          ...sansPrep(e).map((t) => ({
            ...t,
            why: `Il manque « ${e.prep} » : ce petit mot fait partie du complément.`,
          })),
        ],
        hint: 'Mets de côté le groupe qui se déplace. Regarde ensuite après le verbe.',
        steps: [
          `Mets de côté « ${e.circ} » : ce groupe se déplace.`,
          `Regarde le verbe « ${e.verbe} ». Cherche le groupe qui le complète.`,
          `Écris **${e.obj}**.`,
        ],
      };
    }
    default: {
      const lines = pickN(rng, ENTREES, 4);
      const k = rng.int(1, 3);
      const texte = lines.map((e, i) => (i < k ? avecCirc(rng, e) : sansCirc(e)));
      return {
        prompt: 'Lis ces phrases. Combien contiennent un groupe circonstanciel ?',
        figure: document('Quelques phrases', rng.shuffle(texte)),
        answer: num(k),
        traps: numTraps(r(k), [
          [4 - k, 'Tu as compté les phrases qui n’en ont pas. Cherche celles où un groupe se déplace.'],
          [k + 1, 'Tu en as compté un de trop : un complément d’objet reste avec le verbe.'],
          [k - 1, 'Il t’en manque un : cherche aussi les groupes placés au début, avant la virgule.'],
        ]),
        hint: 'Dans chaque phrase, cherche un groupe qui se déplace et se supprime.',
        steps: [
          'Lis chaque phrase et essaie de déplacer un groupe.',
          'Garde les compléments d’objet avec le verbe : ils ne comptent pas.',
          `Repère les groupes qui se déplacent : ${cites(lines.slice(0, k).map((e) => e.circ))}.`,
          `Compte les phrases trouvées, puis écris **${k}**.`,
        ],
      };
    }
  }
}

// ───────────────────────── 2. COD ou COI ─────────────────────────

const COD = 'un COD (complément d’objet direct)';
const COI = 'un COI (complément d’objet indirect)';
const CIRC = 'un groupe circonstanciel';
const whyCod = (e: Entree) =>
  `Il n’y a pas de petit mot (à, de) entre « ${e.verbe} » et « ${e.obj} » : c’est un COD, pas un COI.`;
const whyCoi = (e: Entree) =>
  `« ${e.obj} » est relié au verbe par « ${e.prep ?? 'à'} » : c’est un COI. Un COD n’a ni « à » ni « de » pour le relier au verbe.`;
const whyType = (e: Entree) => (e.type === 'cod' ? whyCod(e) : whyCoi(e));

/** Les deux bulles de méthode : poser la question, puis chercher la préposition. */
const methodeCodCoi = (e: Entree): readonly [string, string] => [
  `Pose la question après le verbe : « ${e.gs} ${e.q} ? » Tu trouves « ${e.obj} ».`,
  e.type === 'cod'
    ? `Regarde entre « ${e.verbe} » et « ${e.obj} » : ni « à » ni « de ».`
    : `Repère le petit mot « ${e.prep ?? 'à'} » : il relie le complément au verbe.`,
];

function codCoiDraft(rng: Rng, level: Level): QuestionDraft {
  switch (level) {
    case 1: {
      const e = rng.pick(ENTREES);
      const bon = e.type === 'cod' ? COD : COI;
      const { answer, traps } = choice(rng, bon, [
        { label: e.type === 'cod' ? COI : COD, why: whyType(e) },
        {
          label: CIRC,
          why: `« ${e.obj} » répond à la question « ${e.gs} ${e.q} ? » et complète le verbe : c’est un complément d’objet.`,
        },
      ]);
      return {
        prompt: `Choisis le rôle de « ${e.obj} » dans « ${sansCirc(e)} »`,
        answer,
        traps,
        hint: 'Cherche un petit mot (à, de) entre le verbe et le complément.',
        steps: [...methodeCodCoi(e), `Choisis **${e.type === 'cod' ? 'un COD' : 'un COI'}**.`],
      };
    }
    case 2: {
      const cible = rng.pick(['cod', 'coi'] as const);
      const bon = rng.pick(cible === 'cod' ? cods : cois);
      const faux = pickN(rng, cible === 'cod' ? cois : cods, 3);
      const options = rng.shuffle([bon, ...faux]);
      return {
        prompt: `Choisis la phrase qui contient un ${cible === 'cod' ? 'COD' : 'COI'}.`,
        answer: { kind: 'choice', options: options.map(sansCirc), correct: options.indexOf(bon) },
        traps: options.flatMap((e, i) =>
          e === bon
            ? []
            : [
                {
                  option: i,
                  why:
                    cible === 'cod'
                      ? `Dans cette phrase, « ${e.obj} » est relié au verbe par « ${e.prep ?? 'à'} » : c’est un COI.`
                      : `Dans cette phrase, « ${e.obj} » suit le verbe sans « à » ni « de » : c’est un COD.`,
                },
              ],
        ),
        hint: 'Regarde ce qui suit chaque verbe : un petit mot (à, de) ou rien.',
        steps: [
          'Repère le verbe de chaque phrase, puis lis ce qui suit.',
          cible === 'cod'
            ? 'Cherche un complément placé sans « à » ni « de ».'
            : 'Cherche un complément relié au verbe par « à » ou « de ».',
          `Choisis cette phrase : **${sansCirc(bon)}**`,
        ],
      };
    }
    case 3: {
      const e = rng.pick(ENTREES);
      const s = avecCirc(rng, e);
      const [bon, autre] = e.type === 'cod' ? ['COD', 'COI'] : ['COI', 'COD'];
      const { answer, traps } = choice(rng, `« ${e.obj} » : ${bon}`, [
        { label: `« ${e.obj} » : ${autre}`, why: whyType(e) },
        { label: `« ${e.circ} » : ${bon}`, why: whyPasObjet(e) },
        { label: `« ${e.circ} » : ${autre}`, why: whyPasObjet(e) },
      ]);
      return {
        prompt: `Choisis le complément d’objet et son type : « ${s} »`,
        answer,
        traps,
        hint: 'Mets de côté le groupe qui se déplace. Cherche ensuite « à » ou « de ».',
        steps: [
          `Mets de côté « ${e.circ} » : ce groupe se déplace.`,
          ...methodeCodCoi(e),
          `Choisis **« ${e.obj} » : ${bon}**.`,
        ],
      };
    }
    case 4: {
      const type = rng.pick(['cod', 'coi'] as const);
      const e = rng.pick(type === 'cod' ? cods : cois);
      const s = avecCirc(rng, e);
      return {
        prompt: `Écris le ${type === 'cod' ? 'COD' : 'COI'} de cette phrase : « ${s} »`,
        answer: { kind: 'text', accepted: groupeAccepte(e.obj) },
        traps: [textTrap(e.circ, whyPasObjet(e)), textTrap(e.gs, whySujet(e)), ...sansPrep(e)],
        hint: 'Mets de côté le groupe qui se déplace. Pose la question après le verbe.',
        steps: [
          `Mets de côté « ${e.circ} » : ce groupe se déplace.`,
          `Pose la question : « ${e.gs} ${e.q} ? »`,
          type === 'cod'
            ? `Écris la réponse, sans « à » ni « de » : **${e.obj}**.`
            : `Écris la réponse avec « ${e.prep ?? 'à'} » : **${e.obj}**.`,
        ],
      };
    }
    default: {
      const k = rng.int(1, 3);
      const lines = rng.shuffle([...pickN(rng, cois, k), ...pickN(rng, cods, 4 - k)]);
      const trop = 'Tu en as compté trop : un COD n’a ni « à » ni « de ». Un groupe qui se déplace n’est pas un COI.';
      const manque = 'Il t’en manque : cherche « à » ou « de » juste après chaque verbe.';
      return {
        prompt: 'Lis ces phrases. Dans combien de phrases y a-t-il un COI ?',
        figure: document(
          'Quelques phrases',
          lines.map((e) => base(e)),
        ),
        answer: num(k),
        traps: numTraps(r(k), [
          [k + 1, trop],
          [k - 1, manque],
          [4 - k, 'Tu as compté les COD. Un COI est relié au verbe par « à » ou « de ».'],
        ]),
        hint: 'Oublie le groupe qui se déplace. Regarde ce qui suit chaque verbe.',
        steps: [
          'Mets de côté les groupes qui se déplacent.',
          'Cherche « à » ou « de » devant chaque complément d’objet.',
          `Repère les COI : ${cites(lines.filter((e) => e.type === 'coi').map((e) => e.obj))}.`,
          `Compte-les, puis écris **${k}**.`,
        ],
      };
    }
  }
}

// ───────────────────────── 3. Repérer les groupes circonstanciels ─────────────────────────

const NOMBRE = ['aucun', 'un', 'deux', 'trois'] as const;

const whyNombre = (w: number, juste: number): string =>
  w === 0
    ? 'Il y en a : un groupe qui dit où ou quand se déplace et se supprime.'
    : w < juste
      ? 'Tu en as oublié un : relis le début et la fin de la phrase.'
      : 'Tu en as compté trop : le complément d’objet ne se déplace pas, ce n’est pas un groupe circonstanciel.';

function circonstancielsDraft(rng: Rng, level: Level): QuestionDraft {
  switch (level) {
    case 1: {
      const e = rng.pick(ENTREES);
      const { answer, traps } = choice(rng, e.circ, [
        { label: e.obj, why: whyObjet(e) },
        { label: e.gs, why: whySujet(e) },
      ]);
      return {
        prompt: `Choisis le groupe circonstanciel dans « ${base(e)} »`,
        answer,
        traps,
        hint: 'Cherche le groupe qui dit où ou quand.',
        steps: [
          'Cherche le groupe qui dit où ou quand.',
          `Essaie de le déplacer : « ${devant(e)} » C’est correct.`,
          `Choisis **${e.circ}**.`,
        ],
      };
    }
    case 2: {
      const e = rng.pick(ENTREES);
      const avant = e.avant && rng.int(0, 1) === 1 ? rng.pick(e.avant) : undefined;
      const juste = avant ? 2 : 1;
      const s = avant ? deux(e, avant) : base(e);
      const { answer, traps } = choice(
        rng,
        NOMBRE[juste],
        NOMBRE.map((label, w) => ({ label, why: whyNombre(w, juste) })),
      );
      return {
        prompt: `Combien de groupes circonstanciels vois-tu ? « ${s} »`,
        answer,
        traps,
        hint: 'Regarde le début et la fin. Cherche ce qui dit où ou quand.',
        steps: [
          'Cherche au début et à la fin de la phrase.',
          avant ? `Repère « ${avant} » et « ${e.circ} ».` : `Repère « ${e.circ} ». Garde « ${e.obj} » avec le verbe.`,
          `Choisis **${NOMBRE[juste]}**.`,
        ],
      };
    }
    case 3:
    case 4: {
      // Seule difficulté ajoutée au niveau 4 : le complément d’objet commence par « à » ou « de », comme un détail.
      const e = rng.pick(level === 3 ? deLieuCod : deLieuCoi);
      const avant = rng.pick(e.avant);
      return {
        prompt: `Écris le groupe circonstanciel qui est à la fin de cette phrase : « ${deux(e, avant)} »`,
        answer: { kind: 'text', accepted: groupeAccepte(e.circ) },
        traps: [
          textTrap(avant, `« ${avant} » est aussi un groupe circonstanciel, mais il est au début de la phrase.`),
          textTrap(e.obj, whyObjet(e)),
          textTrap(
            `${e.obj} ${e.circ}`,
            `Tu as pris deux groupes : « ${e.obj} » complète le verbe, il ne fait pas partie du groupe circonstanciel.`,
          ),
        ],
        hint: 'Trouve le complément d’objet. Regarde ce qui vient après lui.',
        steps: [
          `Repère « ${e.obj} » : ce groupe complète le verbe.`,
          'Regarde ce qui vient après lui, jusqu’au point.',
          `Écris **${e.circ}**.`,
        ],
      };
    }
    default: {
      // Au moins une phrase à deux groupes : sinon, compter les phrases suffirait.
      const double = rng.pick(deLieu);
      const premier = rng.pick(double.avant);
      const autres = pickN(
        rng,
        ENTREES.filter((e) => e.gs !== double.gs || e.obj !== double.obj),
        2,
      ).map((e) => {
        const avant = e.avant && rng.int(0, 1) === 1 ? rng.pick(e.avant) : undefined;
        return { texte: avant ? deux(e, avant) : avecCirc(rng, e), n: avant ? 2 : 1 };
      });
      const lignes = rng.shuffle([{ texte: deux(double, premier), n: 2 }, ...autres]);
      const total = lignes.reduce((n, l) => n + l.n, 0);
      return {
        prompt: 'Lis ces phrases. Combien de groupes circonstanciels contiennent-elles en tout ?',
        figure: document(
          'Quelques phrases',
          lignes.map((l) => l.texte),
        ),
        answer: num(total),
        traps: numTraps(r(total), [
          [3, 'Tu as compté un groupe par phrase. Certaines phrases en ont deux.'],
          [total - 1, 'Il t’en manque un : relis chaque phrase, au début comme à la fin.'],
          [total + 1, 'Tu en as compté un de trop : un complément d’objet reste avec le verbe, il ne compte pas.'],
        ]),
        hint: 'Lis une phrase à la fois. Regarde son début et sa fin.',
        steps: [
          'Cherche dans chaque phrase les groupes qui disent où ou quand.',
          `Regarde bien : « ${premier} » et « ${double.circ} » sont ensemble.`,
          `Additionne les groupes, phrase par phrase : ${lignes.map((l) => l.n).join(' + ')}.`,
          `Écris **${total}**.`,
        ],
      };
    }
  }
}

// ───────────────────────── 4. Les manipulations ─────────────────────────

const phraseDe = (e: Entree, m: Manip) => resultat(e, m);
/** Deux manipulations enchaînées (niveau 5). */
const ENCHAINEMENTS: readonly (readonly [Manip, Manip])[] = [
  ['remplacer', 'deplacer'],
  ['remplacer', 'encadrer'],
  ['ajouter', 'deplacer'],
  ['ajouter', 'supprimer'],
];

function manipulationsDraft(rng: Rng, level: Level): QuestionDraft {
  // « ajouter » peut apparaître aux niveaux 2, 4 et 5 : seules les phrases qui acceptent « souvent » y servent.
  const e = rng.pick(level === 1 || level === 3 ? ENTREES : deLieu);
  const depart = base(e);
  switch (level) {
    case 1: {
      const m = rng.pick(['deplacer', 'supprimer', 'encadrer'] as const);
      const autres = (['deplacer', 'supprimer', 'encadrer'] as const).filter((x) => x !== m);
      const { answer, traps } = choice(
        rng,
        NOM_MANIP[m],
        autres.map((x) => ({ label: NOM_MANIP[x], why: `${DEFINITION[x]} Ici, ${CONSTAT[m]}.` })),
      );
      return {
        prompt: `Compare « ${depart} » et « ${phraseDe(e, m)} » Choisis la manipulation faite.`,
        answer,
        traps,
        hint: 'Regarde ce qui change. Un groupe a-t-il bougé, disparu ou été entouré ?',
        steps: ['Compare les deux phrases, mot à mot.', `Regarde : ${CONSTAT[m]}.`, `Choisis **${NOM_MANIP[m]}**.`],
      };
    }
    case 2: {
      const m = rng.pick(MANIPS);
      const faux = pickN(
        rng,
        MANIPS.filter((x) => x !== m),
        3,
      );
      const options = rng.shuffle([m, ...faux]);
      return {
        prompt: `Phrase de départ : « ${depart} » Consigne : ${consigne(e, m)}. Choisis la nouvelle phrase.`,
        answer: { kind: 'choice', options: options.map((x) => phraseDe(e, x)), correct: options.indexOf(m) },
        traps: options.flatMap((x, i) =>
          x === m
            ? []
            : [
                {
                  option: i,
                  why: `Cette phrase est obtenue ${EN_FAISANT[x]}. La consigne demande de ${NOM_MANIP[m]}.`,
                },
              ],
        ),
        hint: 'Applique la consigne à la phrase de départ. Cherche ensuite la même phrase.',
        steps: [
          `Lis la consigne : ${consigne(e, m)}.`,
          `Retiens ceci. ${DEFINITION[m]}`,
          `Choisis cette phrase : **${phraseDe(e, m)}**`,
        ],
      };
    }
    case 3: {
      const m = rng.pick(['deplacer', 'supprimer', 'remplacer'] as const);
      const autres = pickN(
        rng,
        manipsDe(e).filter((x) => x !== m),
        2,
      );
      return {
        prompt: `Phrase de départ : « ${depart} » Consigne : ${consigne(e, m)}. Écris la nouvelle phrase.`,
        answer: { kind: 'text', accepted: phraseAcceptee(phraseDe(e, m)) },
        traps: autres.flatMap((x) =>
          ecritures(phraseDe(e, x)).map((t) =>
            textTrap(t, `Cette phrase est obtenue ${EN_FAISANT[x]}. La consigne demande de ${NOM_MANIP[m]}.`),
          ),
        ),
        hint: 'Recopie la phrase. Change seulement ce que la consigne demande.',
        steps: [
          `Lis la consigne : ${consigne(e, m)}.`,
          `Retiens ceci. ${DEFINITION[m]}`,
          `Écris la nouvelle phrase : **${phraseDe(e, m)}**`,
        ],
      };
    }
    case 4: {
      const m = rng.pick(['encadrer', 'ajouter'] as const);
      const pieges =
        m === 'encadrer'
          ? [
              ...ecritures(phraseDe(e, 'deplacer')).map((t) =>
                textTrap(
                  t,
                  'Tu as déplacé le groupe, mais tu n’as écrit ni « C’est » ni « que » : ce n’est pas un encadrement.',
                ),
              ),
              ...ecritures(`C’est ${e.circ} ${lowerFirst(e.gs)} ${e.verbe} ${e.obj}.`).map((t) =>
                textTrap(t, 'Il manque « que » : on encadre le groupe avec « C’est » et « que ».'),
              ),
            ]
          : [
              ...ecritures(depart).map((t) =>
                textTrap(t, 'Tu as recopié la phrase de départ : il fallait ajouter « souvent ».'),
              ),
              ...ecritures(`${e.gs} ${e.verbe} ${e.obj} ${e.circ} souvent.`).map((t) =>
                textTrap(t, 'Le mot est ajouté, mais pas au bon endroit : la consigne dit « juste après le verbe ».'),
              ),
            ];
      return {
        prompt: `Phrase de départ : « ${depart} » Consigne : ${consigne(e, m)}. Écris la nouvelle phrase.`,
        answer: { kind: 'text', accepted: phraseAcceptee(phraseDe(e, m)) },
        traps: pieges,
        hint:
          m === 'encadrer'
            ? 'Place le groupe entre « C’est » et « que ». Écris ensuite le reste.'
            : 'Trouve d’abord le verbe. Glisse le mot juste après lui.',
        steps: [
          `Lis la consigne : ${consigne(e, m)}.`,
          `Retiens ceci. ${DEFINITION[m]}`,
          `Écris la nouvelle phrase : **${phraseDe(e, m)}**`,
        ],
      };
    }
    default: {
      const [m1, m2] = rng.pick(ENCHAINEMENTS);
      // La seconde manipulation porte sur la phrase déjà transformée.
      const apres = m1 === 'remplacer' ? { ...e, circ: e.autre } : e;
      const milieu = phraseDe(e, m1);
      const fin = m1 === 'remplacer' ? phraseDe(apres, m2) : phraseDe(e, m2).replace(e.verbe, `${e.verbe} souvent`);
      const attendu = phraseAcceptee(fin);
      return {
        prompt: `Phrase de départ : « ${depart} » Fais 1) ${consigne(e, m1)}, puis 2) ${consigne(apres, m2)}. Écris la phrase finale.`,
        answer: { kind: 'text', accepted: attendu },
        traps: [
          ...ecritures(milieu).map((t) =>
            textTrap(t, 'Tu as suivi la première consigne seulement : fais aussi la seconde.'),
          ),
          ...ecritures(phraseDe(e, m2)).map((t) =>
            textTrap(t, 'Tu as suivi la seconde consigne seulement : commence par la première.'),
          ),
        ],
        hint: 'Écris au brouillon la phrase après la consigne 1. Transforme ensuite cette phrase.',
        steps: [
          `Fais la consigne 1 : « ${milieu} »`,
          `Applique la consigne 2 à cette nouvelle phrase. ${DEFINITION[m2]}`,
          `Écris la phrase finale : **${fin}**`,
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
  readonly factId: string;
  readonly sens: Sens;
  readonly sources?: readonly string[];
  readonly generate: Skill['generate'];
}

const skill = (n: Notion): Skill => ({
  id: n.id,
  title: n.title,
  levels: 5,
  version: 2,
  lesson: { memo: n.memo, source: programme(n.factId), sources: [PROGRAMME, ...(n.sources ?? [])] },
  sens: [n.sens],
  generate: n.generate,
});

export const FCM1_COMPLEMENTS: readonly Skill[] = [
  skill({
    id: 'fcm1-objet-circonstanciel',
    title: 'Complément d’objet ou groupe circonstanciel',
    memo: [
      'Un **complément d’objet** complète le verbe et reste avec lui.',
      'Un **groupe circonstanciel** dit par exemple où ou quand : il se déplace.',
      'Pour tester, mets le groupe au début : « Dans la cour, je lance le ballon. »',
    ],
    sens: SENS_COMPL.objetCirc,
    factId: 'objet-circ',
    generate: objetCircDraft,
  }),
  skill({
    id: 'fcm1-cod-coi',
    title: 'COD ou COI dans des phrases simples',
    memo: [
      'Le **COD** complète le verbe sans « à » ni « de » : « je lance le ballon ».',
      'Le **COI** est relié au verbe par une **préposition** : « je parle à mon voisin ».',
      'Pose la question après le verbe : « je lance quoi ? »',
    ],
    sens: SENS_COMPL.codCoi,
    factId: 'cod-coi',
    generate: codCoiDraft,
  }),
  skill({
    id: 'fcm1-groupes-circonstanciels',
    title: 'Repérer les groupes circonstanciels',
    memo: [
      'Un **groupe circonstanciel** dit par exemple où ou quand.',
      'On peut le déplacer et le supprimer.',
      'Il y en a deux dans « Le soir, je lis dans ma chambre ».',
    ],
    sens: SENS_COMPL.circonstanciels,
    sources: [SENS_COMPL.circonstanciels.source],
    factId: 'circonstanciels',
    generate: circonstancielsDraft,
  }),
  skill({
    id: 'fcm1-manipulations',
    title: 'Manipuler une phrase : déplacer, supprimer, remplacer, ajouter, encadrer',
    memo: [
      'Une **manipulation** est un petit test pour comprendre une phrase.',
      'Il y en a cinq : déplacer, supprimer, remplacer, ajouter et **encadrer**.',
      'Pour **encadrer** « dans la cour », écris : « C’est dans la cour que je joue. »',
    ],
    sens: SENS_COMPL.manipulations,
    factId: 'manipulations',
    generate: manipulationsDraft,
  }),
];
