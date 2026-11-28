/**
 * Preuves du chapitre CM1 « Le temps des rois » : chacune cite un identifiant du registre (`sources.ts`) et la
 * citation exacte du texte (programmes, BnF, ressources Éduscol, Académie française via le CNRTL).
 */
import type { Preuve } from './kit.ts';

const preuve =
  (source: string) =>
  (quote: string): Preuve & { readonly source: string } => ({ source, quote });

const programme = preuve('cycle3-2020');
const saintLouis = preuve('bnf-saint-louis');
const francois = preuve('bnf-francois-ier-arts');
const nantes = preuve('bnf-edit-nantes');
const henri = preuve('bnf-portrait-henri-iv');
const fetes = preuve('bnf-fetes-versailles');

export const PREUVES = {
  // Louis IX
  roiChretien: programme('Louis IX, le « roi chrétien » au XIIIe siècle'),
  regneLouisIx: preuve('eduscol-5e-occident-feodal')(
    'Le prestige religieux de la monarchie française est à son apogée avec le règne de Louis IX (1226-1270) qui est canonisé et devient saint Louis en 1297.',
  ),
  couronne: saintLouis(
    'Louis IX avait 12 ans lorsqu’il fut couronné. Sa mère, Blanche de Castille, l’aida à gouverner en assumant la régence.',
  ),
  juste: saintLouis('il se voulut un roi juste et miséricordieux'),
  croisades: saintLouis('Il n’en eut pas moins une action conforme à l’esprit de son temps : croisades'),
  croisade: preuve('academie-croisade')(
    'Au Moyen Âge, expédition faite par les chrétiens contre les musulmans pour libérer le tombeau du Christ à Jérusalem.',
  ),
  reliques: preuve('bnf-reliques-louis-ix')(
    'Le roi fit acheter vers 1239 à Byzance la couronne d’épines et une partie de la vraie croix et de la sainte lance, reliques pour lesquelles il fit bâtir la Sainte-Chapelle.',
  ),
  tunis: preuve('bnf-mort-louis-ix')(
    'La huitième croisade part de Paris le 15 mars 1270, et arrive le 7 juillet dans les ruines de Carthage, en face de Tunis. Affaiblie par la chaleur et la maladie, l’armée de Louis IX est incapable de se battre et doit attendre des renforts. Louis IX décède quelques heures avant leur arrivée, le 25 août 1270.',
  ),

  // François Ier
  protecteur: programme('François Ier, un protecteur des Arts et des Lettres à la Renaissance'),
  regneFrancois: francois('Le règne de François Ier (1515-1547)'),
  diffusion: francois(
    'C’est sous François Ier que la Renaissance et l’humanisme, nés en Italie, se diffusent en France.',
  ),
  activite: francois('Une activité artistique et intellectuelle soutenue par le souverain'),
  vinci: francois(
    'l’artiste vécut ses dernières années à Amboise, tout près des châteaux que François Ier possédait à Blois et à Chambord, et le roi lui acheta le célèbre portrait de la Joconde.',
  ),
  invitation: francois(
    'S’il ne put parvenir à persuader Michel-Ange de venir en France, il lui acheta une statue d’Hercule. Il eut plus de succès avec Léonard de Vinci et Benvenuto Cellini',
  ),
  college: francois('Il crée surtout, en 1530, le Collège de France'),
  chercheurs: francois(
    'Il crée surtout, en 1530, le Collège de France, sur la suggestion du savant humaniste Guillaume Budé. Il s’agit de constituer, à côté de la Sorbonne – principalement orientée vers les études religieuses –, un collège royal où des lecteurs appointés à 200 écus par an poursuivraient librement leurs recherches.',
  ),
  villers: francois(
    'En 1539, par l’ordonnance de Villers-Cotterêts, François Ier décrète l’usage obligatoire du français pour certains textes à caractère juridique.',
  ),

  // Henri IV
  signature: nantes(
    'Sacré roi en 1594, et converti au catholicisme pour des raisons politiques, Henri IV met fin aux guerres de religion en signant l’Édit de Nantes le 13 avril 1598.',
  ),
  droits: nantes(
    'les 1, 2 million de protestants français (sur une population totale de 18 millions) obtiennent un statut et des droits.',
  ),
  limites: nantes(
    'leur liberté de conscience est reconnue. Mais leur liberté de culte est restreinte et les lieux de cultes limités.',
  ),
  refuge: nantes('Il leur accorde aussi des « places de sûreté » (villes fortifiées où ils peuvent trouver refuge)'),
  assassinat: henri(
    'Son image devient alors celle du « bon roi », soucieux du bien-être de ses sujets. Avec son ministre Sully, il assainit les finances du royaume. Il est assassiné en 1610 par Ravaillac.',
  ),
  revocation: preuve('bnf-revocation-edit-nantes')('Le 18 octobre 1685, Louis XIV révoque l’édit de Nantes'),

  // Louis XIV
  soleil: programme('Louis XIV, le roi Soleil à Versailles'),
  dates: preuve('bnf-portrait-louis-xiv')('Portrait gravé de Louis XIV, roi de France de 1643 à 1715.'),
  regente: preuve('bnf-naissance-louis-xiv')(
    'Anne d’Autriche, la fille aînée du roi Philippe III d’Espagne, voie la naissance du dauphin Louis (1638), prénommé Dieudonné et fêté dans tout le royaume. À la mort de Louis XIII (1643), Anne d’Autriche devient régente et fait appel au cardinal Mazarin pour gouverner l’État',
  ),
  ballet: preuve('bnf-soleil-levant')(
    'Louis XIV alors âgé de 14 ans, vêtu en « Soleil levant suivi des Génies qui lui rendent hommage »',
  ),
  chasse: fetes(
    'château de Versailles, qui n’est encore que le pavillon de chasse de Louis XIII. Celui-ci sera peu à peu agrandi et embelli au cours des années, de même que le parc, jusqu’à devenir la résidence principale du roi à partir de 1682.',
  ),
  courtisans: fetes(
    'pour Louis XIV, la fête de cour est un acte à la fois esthétique et politique, un instrument au service du pouvoir qui lui permet d’exercer un contrôle sur les courtisans',
  ),
  premiereFete: fetes(
    'Donnés du 7 au 13 mai 1664 en l’honneur d’Anne d’Autriche et de la reine Marie-Thérèse, Les Plaisirs de l’Île enchantée constituent la première des grandes fêtes versaillaises du règne de Louis XIV.',
  ),
  colonial: programme(
    'une présentation de la formation du premier empire colonial français, porté par le pouvoir royal, et dont le peuplement repose notamment sur le déplacement d’Africains réduits en esclavage',
  ),
  historien: preuve('academie-historien')(
    'Personne qui fait des recherches, des études historiques, qui écrit des ouvrages d’histoire.',
  ),
} satisfies Record<string, Preuve & { readonly source: string }>;
