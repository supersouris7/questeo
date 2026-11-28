/**
 * Anglais 5e, « Écouter et comprendre » (lot an-5e-07) : données citées. Chaque fait porte l'identifiant de sa
 * source (registre `sources.ts`) et une citation exacte : programme d'anglais du collège (annexe 3 de l'arrêté du
 * 5 mai 2025, partie « Classe de cinquième ») et fiches du British Council consultées le 27/11/2026 (copies
 * d'archive web.archive.org). Les espaces et retours à la ligne sont réduits à une espace.
 *
 * Programme (5e) : compréhension de l'oral de messages et de conversations simples ; noter des informations
 * factuelles (horaires, dates, lieux, consignes) ; axe 6 obligatoire : le Royaume-Uni. Les messages et dialogues
 * des exercices sont inventés ; seuls les repères culturels affirment des faits réels.
 */
import type { Fait } from './presentation-faits.ts';

const fait = (id: string, sourceId: string, quote: string, claim: string): Fait => ({ id, sourceId, quote, claim });
const PROG = 'anglais-college-2025';
const UK = 'bck-uk';

export const FAITS: readonly Fait[] = [
  fait(
    'documents-oraux',
    PROG,
    'les documents sont variés mais simples, en lien avec le programme culturel',
    'Les messages à écouter sont courts, simples et variés.',
  ),
  fait(
    'noter-informations',
    PROG,
    'prendre en note des informations factuelles nécessaires à la réalisation d’un projet, telles que les horaires de trains ou de spectacles, dates, lieux, consignes',
    'L’élève note des horaires, des dates, des lieux et des consignes.',
  ),
  fait(
    'comprendre-conversations',
    PROG,
    'Il peut comprendre et repérer des informations simples, relevant de situations prévisibles, exprimées dans une langue usuelle, à l’aide d’expressions connues, dans des textes, des histoires, ou des conversations.',
    'Au niveau A2, l’élève repère des informations simples dans des conversations.',
  ),
  fait(
    'accord',
    PROG,
    'Faire part simplement de son accord ou de son désaccord. I agree with you.',
    'Dire son accord ou son désaccord est un acte de langage du niveau.',
  ),
  fait(
    'repeter',
    PROG,
    'Can you repeat please? / Slowly please?',
    'On peut demander de répéter ou de parler lentement.',
  ),
  fait(
    'axe-royaume-uni',
    PROG,
    'Axe 6. Le Royaume-Uni Pays voisin de la France, le Royaume-Uni a une histoire riche, parfois commune avec la France.',
    'Le Royaume-Uni est l’axe obligatoire de la 5e.',
  ),
  fait(
    'nations',
    PROG,
    'ce pays, incluant le patrimoine et la culture, qui comprend plusieurs nations et régions avec des accents, traditions et identités propres',
    'Le Royaume-Uni réunit plusieurs nations et régions.',
  ),
  fait(
    'quatre-parties',
    UK,
    'England, Scotland, Wales and Northern Ireland are the four parts of the UK.',
    'Le Royaume-Uni compte quatre parties.',
  ),
  fait('drapeau-gallois', UK, 'There’s a dragon on the Welsh flag.', 'Le drapeau gallois porte un dragon.'),
  fait(
    'chaussee-geants',
    UK,
    'Lots of tourists visit the Giant’s Causeway in Northern Ireland.',
    'La Chaussée des Géants est en Irlande du Nord.',
  ),
  fait(
    'livre',
    PROG,
    'The pound sterling is the official currency of the United Kingdom.',
    'La monnaie officielle du Royaume-Uni est la livre sterling.',
  ),
  fait(
    'hampton-court',
    PROG,
    'Hampton Court Palace is a beautiful place. It is located in west London, and was home to King Henry VIII.',
    'Hampton Court Palace, dans l’ouest de Londres, fut la demeure du roi Henry VIII.',
  ),
  fait(
    'chartwell',
    PROG,
    'Chartwell was the home of Winston Churchill. It is located in Kent, England, far from London.',
    'Chartwell, dans le Kent, fut la maison de Winston Churchill.',
  ),
  fait(
    'bristol',
    PROG,
    'I’ll go to Bristol with my family next month. I am impatient to visit the M Shed and even more the SS Great Britain, a ship designed by Isambard Kingdom Brunel.',
    'À Bristol, on visite le SS Great Britain, un navire conçu par Brunel.',
  ),
  fait(
    'tour-de-londres',
    PROG,
    'Take out your map of the Tower of London. We will visit the White Tower first, then the crown jewels, ok?',
    'La Tour de Londres abrite la White Tower et les joyaux de la couronne.',
  ),
  fait(
    'baker-street',
    PROG,
    'He created the character of Sherlock Holmes. Holmes lived at 221B Baker Street in London.',
    'Sherlock Holmes, personnage de Conan Doyle, habitait au 221B Baker Street à Londres.',
  ),
  fait(
    'globe',
    PROG,
    'We went to see a play at the Globe Theatre yesterday.',
    'Au Globe Theatre, on va voir des pièces de théâtre.',
  ),
];
