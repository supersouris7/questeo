/**
 * Anglais 5e, « Vocabulaire thématique » (lot an-5e-08) : données citées. Chaque fait porte l'identifiant de sa
 * source (registre `sources.ts`) et une citation exacte : programme d'anglais du collège (annexe 3 de l'arrêté du
 * 5 mai 2025, partie « Classe de cinquième ») et fiches LearnEnglish Teens du British Council consultées le
 * 27/11/2026 (copies d'archive web.archive.org). Les espaces et retours à la ligne sont réduits à une espace.
 *
 * Programme (5e) : lexique en lien avec les axes culturels (transports et déplacements, paysages et saisons, école et
 * loisirs) ; six axes culturels. Les phrases et documents des exercices sont inventés.
 */
import type { Fait } from './presentation-faits.ts';
import type { Noun, Term } from './vocabulaire-6e-faits.ts';

const fait = (id: string, sourceId: string, quote: string, claim: string): Fait => ({ id, sourceId, quote, claim });
const PROG = 'anglais-college-2025';
const TRANSPORT = 'bct-voc-transport';
const AIR = 'bct-voc-air-travel';
const NATURE = 'bct-voc-nature';
const EVENTS = 'bct-voc-sporting-events';
const OLYMPIC = 'bct-voc-olympic-sports';

/** Un mot et une phrase d'exemple qui le contient une fois (elle sert de phrase à trou et d'explication). */
export interface Word5 extends Term {
  readonly ex: string;
}
const word = (
  group: string,
  noun: Noun,
  ...[en, fr, typo, ex, alt = []]: [en: string, fr: string, typo: string, ex: string, alt?: readonly string[]]
): Word5 => ({ group, noun, en, fr, typo, ex, alt });

// ——— Voyages ———
export const TRAVEL: readonly Word5[] = [
  word('transports', 'one', 'bike', 'le vélo', 'bik', 'I ride my bike to the park.', ['bicycle']),
  word('transports', 'one', 'bus', 'le bus', 'buss', 'We take the bus to school.'),
  word('transports', 'one', 'coach', 'l’autocar', 'coche', 'Our class travels in the coach.'),
  word('transports', 'one', 'boat', 'le bateau', 'bote', 'We cross the river in the boat.', ['ship']),
  word('transports', 'one', 'car', 'la voiture', 'carr', 'My dad washes his car.'),
  word('transports', 'one', 'taxi', 'le taxi', 'taxy', 'We call the taxi at the hotel.', ['cab']),
  word('transports', 'one', 'plane', 'l’avion', 'plain', 'The plane is flying over the sea.', [
    'airplane',
    'aeroplane',
  ]),
  word('transports', 'one', 'van', 'la camionnette', 'vane', 'The painter drives his van.'),
  word('transports', 'one', 'lorry', 'le camion', 'lory', 'The lorry carries heavy boxes.', ['truck']),
  word('transports', 'one', 'motorbike', 'la moto', 'motorbik', 'She rides her motorbike to work.', ['motorcycle']),
  word('transports', 'one', 'train', 'le train', 'trane', 'The train leaves from platform two.'),
  word('aéroport', 'one', 'airport', 'l’aéroport', 'airoport', 'My aunt is waiting at the airport.'),
  word('aéroport', 'one', 'gate', 'la porte d’embarquement', 'gait', 'Please go to the gate for your flight.', [
    'boarding gate',
    'departure gate',
  ]),
  word('aéroport', 'mass', 'baggage', 'les bagages', 'bagage', 'Do not leave your baggage here.', ['luggage']),
  word(
    'aéroport',
    'one',
    'boarding card',
    'la carte d’embarquement',
    'bording card',
    'Show your boarding card, please.',
    ['boarding pass'],
  ),
  word('aéroport', 'one', 'seat belt', 'la ceinture de sécurité', 'seet belt', 'Please fasten your seat belt.', [
    'seatbelt',
    'safety belt',
  ]),
  word(
    'aéroport',
    'one',
    'check-in desk',
    'le comptoir d’enregistrement',
    'chek-in desk',
    'Go to the check-in desk first.',
    ['check in desk', 'check-in counter'],
  ),
  word(
    'aéroport',
    'one',
    'departures board',
    'le tableau des départs',
    'departurs board',
    'Look at the departures board.',
    ['departure board'],
  ),
  word(
    'aéroport',
    'one',
    'overhead locker',
    'le coffre à bagages au-dessus des sièges',
    'overhed locker',
    'Put your coat in the overhead locker.',
    ['overhead bin', 'overhead compartment'],
  ),
  word('voyage', 'one', 'journey', 'le trajet', 'journy', 'The journey to London takes two hours.', ['trip']),
  word('voyage', 'mass', 'sightseeing', 'la visite touristique', 'sightseing', 'We love sightseeing in a new city.'),
  word('voyage', 'mass', 'traffic', 'la circulation', 'trafic', 'We are late because of the traffic.'),
  word('voyage', 'one', 'underground', 'le métro', 'undergound', 'In London, we take the underground.', [
    'tube',
    'subway',
    'metro',
  ]),
  word(
    'voyage',
    'mass',
    'public transport',
    'les transports en commun',
    'public transpor',
    'I often use public transport.',
    ['public transportation'],
  ),
];

// ——— Sport ———
export const SPORT: readonly Word5[] = [
  word('disciplines', 'none', 'boxing', 'la boxe', 'boxxing', 'My uncle watches boxing on TV.'),
  word('disciplines', 'none', 'diving', 'le plongeon', 'diveing', 'In diving, you jump into the water.'),
  word('disciplines', 'none', 'rowing', 'l’aviron', 'roing', 'In rowing, you move a boat with oars.'),
  word('disciplines', 'none', 'gymnastics', 'la gymnastique', 'gymnastic', 'She does gymnastics on Fridays.'),
  word('disciplines', 'none', 'swimming', 'la natation', 'swiming', 'I go swimming on Wednesdays.'),
  word('disciplines', 'none', 'hockey', 'le hockey', 'hocky', 'We play hockey on the field.', ['field hockey']),
  word('disciplines', 'none', 'fencing', 'l’escrime', 'fensing', 'In fencing, you wear a white mask.'),
  word('disciplines', 'none', 'volleyball', 'le volley-ball', 'voleyball', 'We play volleyball on the beach.', [
    'volley-ball',
  ]),
  word('disciplines', 'none', 'wrestling', 'la lutte', 'wresling', 'Wrestling is a very old sport.'),
  word('disciplines', 'none', 'athletics', 'l’athlétisme', 'athletic', 'Running is part of athletics.'),
  word('disciplines', 'one', 'marathon', 'le marathon', 'maraton', 'He is training for his first marathon.'),
  word('compétition', 'one', 'athlete', 'l’athlète', 'athlet', 'The athlete runs very fast.'),
  word('compétition', 'one', 'winner', 'le vainqueur', 'winer', 'The winner is very happy.'),
  word('compétition', 'one', 'spectator', 'le spectateur', 'spectater', 'Every spectator claps.'),
  word('compétition', 'one', 'team', 'l’équipe', 'teem', 'Our team plays on Saturday.'),
  word('compétition', 'one', 'stadium', 'le stade', 'stadion', 'The match is at the stadium.'),
  word('compétition', 'none', 'to train', 's’entraîner', 'to trane', 'We need to train twice a week.', ['train']),
  word('objets', 'one', 'medal', 'la médaille', 'medale', 'She shows her new medal.'),
  word('objets', 'one', 'gold medal', 'la médaille d’or', 'gold medale', 'The first runner gets the gold medal.'),
  word(
    'objets',
    'one',
    'silver medal',
    'la médaille d’argent',
    'silver medale',
    'The second runner gets the silver medal.',
  ),
  word(
    'objets',
    'one',
    'bronze medal',
    'la médaille de bronze',
    'bronz medal',
    'The third runner gets the bronze medal.',
  ),
  word('objets', 'one', 'ticket', 'le billet', 'tiket', 'I need my ticket for the match.'),
  word('objets', 'one', 'flag', 'le drapeau', 'flagg', 'The fans wave the flag.'),
];

// ——— Nature ———
export const NATURE_WORDS: readonly Word5[] = [
  word('eau', 'one', 'river', 'la rivière', 'rivver', 'The river crosses the town.'),
  word('eau', 'one', 'sea', 'la mer', 'see', 'We swim in the sea.'),
  word('eau', 'one', 'lake', 'le lac', 'lac', 'There are ducks on the lake.'),
  word('eau', 'one', 'waterfall', 'la cascade', 'waterfal', 'We hear the waterfall behind the trees.'),
  word('eau', 'one', 'flood', 'l’inondation', 'flod', 'After the flood, the road is closed.'),
  word('relief', 'one', 'mountain', 'la montagne', 'montain', 'There is snow on the mountain.'),
  word('relief', 'one', 'hill', 'la colline', 'hil', 'Our house is on a hill.'),
  word('relief', 'one', 'summit', 'le sommet', 'sumit', 'We reach the summit at noon.', ['peak', 'top']),
  word('relief', 'one', 'island', 'l’île', 'iland', 'We take a boat to the island.', ['isle']),
  word('relief', 'one', 'desert', 'le désert', 'dessert', 'It is very dry in the desert.'),
  word('relief', 'none', 'landscape', 'le paysage', 'landscap', 'I love the landscape here.', ['scenery']),
  word('vivant', 'one', 'forest', 'la forêt', 'forrest', 'We walk in the forest.', ['wood', 'woods']),
  word('vivant', 'mass', 'grass', 'l’herbe', 'gras', 'The sheep eat the grass.'),
  word('vivant', 'one', 'plant', 'la plante', 'plante', 'This plant needs water.'),
  word('vivant', 'one', 'flower', 'la fleur', 'flowre', 'She picks a red flower.'),
  word('vivant', 'one', 'tree', 'l’arbre', 'tre', 'A bird is in the tree.'),
  word('temps', 'one', 'sky', 'le ciel', 'skye', 'The sky is blue today.'),
  word('temps', 'mass', 'weather', 'le temps qu’il fait', 'wether', 'The weather is nice today.'),
  word('temps', 'one', 'season', 'la saison', 'seson', 'Spring is my favourite season.'),
  word('temps', 'one', 'climate', 'le climat', 'climat', 'This region has a mild climate.'),
  word('temps', 'one', 'hurricane', 'l’ouragan', 'huricane', 'The hurricane brings strong winds.'),
  word('temps', 'one', 'harvest', 'la récolte (la moisson)', 'harvist', 'Farmers work hard during the harvest.'),
];

export const FAITS: readonly Fait[] = [
  fait(
    'lexique-transports',
    PROG,
    'to travel, to go on a trip, globetrotting, public transport, bus, coach, bike, to move, camper van, underground, subway, traffic',
    'Le programme de 5e liste ces mots des transports.',
  ),
  fait(
    'lexique-deplacements',
    PROG,
    'location, journey, to get from…to…, sightseeing',
    'Journey et sightseeing sont au programme de 5e.',
  ),
  fait(
    'images-transports',
    TRANSPORT,
    'bike bus boat car taxi scooter ship plane van lorry motorbike train',
    'Mots des moyens de transport.',
  ),
  fait('velo', TRANSPORT, 'bike OR bicycle', 'bike et bicycle sont admis.'),
  fait('avion', TRANSPORT, 'plane OR airplane OR aeroplane', 'plane, airplane et aeroplane sont admis.'),
  fait(
    'images-aeroport',
    AIR,
    'departures board plane meal gate',
    'Mots de l’aéroport : tableau des départs, porte d’embarquement.',
  ),
  fait(
    'images-aeroport-2',
    AIR,
    'airport overhead locker baggage boarding card seat belt',
    'Aéroport, coffre à bagages, bagages, carte d’embarquement, ceinture.',
  ),
  fait('images-comptoir', AIR, 'check-in desk', 'check-in desk est le comptoir d’enregistrement.'),
  fait(
    'olympiques',
    OLYMPIC,
    'boxing track diving rowing gymnastics swimming hockey fencing volleyball wrestling athletics marathon',
    'Noms de sports olympiques.',
  ),
  fait(
    'evenements',
    EVENTS,
    'athlete winner flag team medal gold medal silver medal bronze medal stadium ticket spectator',
    'Mots d’un évènement sportif.',
  ),
  fait(
    'entrainement',
    PROG,
    'When do you train for baseball during the week in middle school?',
    'to train veut dire s’entraîner.',
  ),
  fait(
    'images-nature',
    NATURE,
    'river mountain grass hill plant sea flower island tree forest sky fire',
    'Mots de la nature.',
  ),
  fait(
    'lexique-paysages',
    PROG,
    'weather, season, seasonal, pure, colourful, changing, climate, hill, mountain, forest, desert, river, lake, rural',
    'Le programme de 5e liste ces mots des paysages et des saisons.',
  ),
  fait(
    'lexique-paysages-a2',
    PROG,
    'landscape, waterfall, dry, hurricane, humid, flood, yearly, bright, harvest, summit',
    'Autres mots des paysages (niveau A2).',
  ),
];

// ——— Personnages célèbres ———

export interface Famous {
  readonly name: string;
  readonly accepted: readonly [string, ...string[]];
  /** « Qui … ? » : question française du niveau 1. */
  readonly who: string;
  /** Ce que l'on retient. */
  readonly deed: string;
  /** Deux phrases anglaises qui l'identifient sans dire son nom. */
  readonly clues: readonly [string, string];
}

export const PEOPLE: readonly Famous[] = [
  {
    name: 'Abraham Lincoln',
    accepted: ['Abraham Lincoln', 'Lincoln', 'Abe Lincoln', 'President Lincoln'],
    who: 'Qui était président des États-Unis pendant la guerre de Sécession ?',
    deed: 'président des États-Unis pendant la guerre de Sécession',
    clues: ['I was president during the American Civil War.', 'I was born in Kentucky.'],
  },
  {
    name: 'John F. Kennedy',
    accepted: [
      'John F. Kennedy',
      'John F Kennedy',
      'Kennedy',
      'John Kennedy',
      'JFK',
      'John Fitzgerald Kennedy',
      'President Kennedy',
    ],
    who: 'Quel président américain est né à Brookline en 1917 ?',
    deed: 'président américain né à Brookline en 1917',
    clues: ['I was born in Brookline in 1917.', 'I was president, and Robert was my brother.'],
  },
  {
    name: 'Arthur Conan Doyle',
    accepted: ['Arthur Conan Doyle', 'Conan Doyle', 'Doyle', 'Sir Arthur Conan Doyle'],
    who: 'Qui a créé le personnage de Sherlock Holmes ?',
    deed: 'l’auteur qui a créé Sherlock Holmes',
    clues: ['I created the character of Sherlock Holmes.', 'I wrote over fifty stories.'],
  },
  {
    name: 'Mark Twain',
    accepted: ['Mark Twain', 'Twain'],
    who: 'Dans les romans de quel auteur trouve-t-on Tom et Huck ?',
    deed: 'l’auteur des romans de Tom et Huck',
    clues: ['Tom is a character in my novels.', 'Huck is another brave character of mine.'],
  },
  {
    name: 'Winston Churchill',
    accepted: ['Winston Churchill', 'Churchill', 'Sir Winston Churchill'],
    who: 'Qui avait sa maison à Chartwell, dans le Kent ?',
    deed: 'l’habitant de Chartwell, dans le Kent',
    clues: ['Chartwell was my home.', 'My house was in Kent, far from London.'],
  },
  {
    name: 'Isambard Kingdom Brunel',
    accepted: ['Isambard Kingdom Brunel', 'Brunel', 'Isambard Brunel'],
    who: 'Qui a conçu le navire SS Great Britain ?',
    deed: 'celui qui a conçu le navire SS Great Britain',
    clues: ['I designed a famous ship.', 'The ship is the SS Great Britain.'],
  },
  {
    name: 'Henry VIII',
    accepted: ['Henry VIII', 'Henry', 'King Henry VIII', 'Henry the Eighth', 'King Henry the Eighth', 'Henry 8'],
    who: 'Quel roi avait Hampton Court Palace comme demeure ?',
    deed: 'le roi qui habitait Hampton Court Palace',
    clues: ['I was a king.', 'Hampton Court Palace was my home.'],
  },
  {
    name: 'Elton John',
    accepted: ['Elton John', 'Sir Elton John'],
    who: 'Quel chanteur Terry O’Neill a-t-il photographié au piano sur scène ?',
    deed: 'le chanteur photographié au piano par Terry O’Neill',
    clues: ['Terry O’Neill took a photo of me at a concert.', 'I was on stage, playing the piano.'],
  },
];

export interface Fill {
  /** Phrase anglaise avec « … ». */
  readonly text: string;
  readonly fr: string;
  readonly accepted: readonly [string, ...string[]];
  readonly trap: readonly [string, string];
}
const fill = (text: string, fr: string, accepted: Fill['accepted'], trap: Fill['trap']): Fill => ({
  text,
  fr,
  accepted,
  trap,
});

export const PEOPLE_FILLS: readonly Fill[] = [
  fill(
    'Abraham Lincoln was … of the United States.',
    'le président',
    ['president', 'the president'],
    ['king', 'Les États-Unis ont un président, pas un roi.'],
  ),
  fill('Henry the Eighth was a ….', 'un roi', ['king'], ['queen', '« queen » veut dire reine.']),
  fill(
    'Arthur Conan Doyle was a famous ….',
    'un auteur',
    ['author', 'writer', 'novelist'],
    ['painter', '« painter » veut dire peintre.'],
  ),
  fill('Elton John is a famous ….', 'un chanteur', ['singer'], ['painter', '« painter » veut dire peintre.']),
  fill(
    'Terry O’Neill was the … of this picture of Elton John.',
    'le photographe',
    ['photographer'],
    ['photograph', '« photograph » est la photo ; ici on veut la personne.'],
  ),
  fill(
    'Arthur Conan Doyle … Sherlock Holmes.',
    'a créé',
    ['created', 'invented'],
    ['create', 'Le fait est passé : le verbe prend -d.'],
  ),
  fill('Brunel … a famous ship.', 'a conçu', ['designed'], ['design', 'Le fait est passé : ajoute -ed au verbe.']),
  fill('Abraham Lincoln was … in Kentucky.', 'né', ['born'], ['birth', '« birth » est la naissance, un nom.']),
];

export const PEOPLE_FACTS: readonly Fait[] = [
  fait(
    'lincoln',
    PROG,
    'This is Abraham Lincoln. He was president of the United States during the Civil War. He was born in Kentucky.',
    'Lincoln fut président pendant la guerre de Sécession et naquit dans le Kentucky.',
  ),
  fait(
    'kennedy',
    PROG,
    'He was born in Brookline, Massachusetts in 1917.',
    'John F. Kennedy est né à Brookline en 1917.',
  ),
  fait('kennedy-frere', PROG, 'He is Robert’s brother.', 'John F. Kennedy était le frère de Robert.'),
  fait(
    'conan-doyle',
    PROG,
    'Arthur Conan Doyle created the character of Sherlock Holmes during the Victorian period.',
    'Conan Doyle a créé Sherlock Holmes.',
  ),
  fait('conan-recits', PROG, 'Conan Doyle wrote over fifty stories.', 'Conan Doyle a écrit plus de cinquante récits.'),
  fait(
    'twain',
    PROG,
    'I really like the main characters in Mark Twain’s novels. Tom and Huck are so brave!',
    'Tom et Huck sont des personnages des romans de Mark Twain.',
  ),
  fait(
    'churchill',
    PROG,
    'Chartwell was the home of Winston Churchill. It is located in Kent, England, far from London.',
    'Churchill avait sa maison à Chartwell.',
  ),
  fait(
    'brunel',
    PROG,
    'the SS Great Britain, a ship designed by Isambard Kingdom Brunel',
    'Brunel a conçu le SS Great Britain.',
  ),
  fait(
    'henry',
    PROG,
    'It is located in west London, and was home to King Henry VIII.',
    'Hampton Court Palace fut la demeure de Henry VIII.',
  ),
  fait(
    'elton',
    PROG,
    'I really appreciate the photograph of Elton John by Terry O’Neill.',
    'Terry O’Neill a photographié Elton John.',
  ),
  fait(
    'elton-scene',
    PROG,
    'He shows the energy of the singer on stage playing the piano.',
    'La photo montre le chanteur au piano sur scène.',
  ),
];

// ——— Repères des axes culturels ———

export const AXES = [
  'Portrait, autoportrait',
  'Le quotidien : lieux, rythmes, saisons',
  'Le réel et l’imaginaire',
  'École et loisirs',
  'Des langues, des lieux, des histoires',
  'Le Royaume-Uni',
] as const;

export interface Reference {
  readonly name: string;
  readonly accepted: readonly [string, ...string[]];
  /** Ce que le programme en dit, en français. */
  readonly about: string;
  /** La même chose en quelques mots (association). */
  readonly short: string;
  readonly typo: string;
  /** Indice du niveau 1, quand le nom ne contient aucun mot courant. */
  readonly hint?: string;
}

export const REFERENCES: readonly Reference[] = [
  {
    name: 'yearbook',
    short: 'l’album de fin d’année',
    accepted: ['yearbook', 'a yearbook', 'the yearbook', 'year book', 'year-book', 'yearbooks'],
    about: 'l’album que chaque élève d’une école américaine reçoit en fin d’année',
    typo: 'yearbok',
  },
  {
    name: 'National Portrait Gallery',
    short: 'le musée de portraits',
    accepted: ['National Portrait Gallery', 'the National Portrait Gallery'],
    about: 'le musée de portraits, à Londres, qui montre l’histoire britannique en images',
    typo: 'National Portrait Galery',
  },
  {
    name: 'National Trust',
    short: 'le patrimoine britannique',
    accepted: ['National Trust', 'the National Trust'],
    about: 'l’organisme qui fait découvrir le patrimoine britannique',
    typo: 'National Trost',
  },
  {
    name: 'BBC',
    short: 'l’institution qui crée des séries',
    accepted: ['BBC', 'the BBC', 'B.B.C', 'the B.B.C'],
    about: 'l’institution britannique présente dans les familles, qui crée des séries',
    typo: 'BCC',
  },
  {
    name: 'Cadbury',
    short: 'la famille de la cité idéale',
    accepted: ['Cadbury', 'the Cadbury family', 'Cadbury family', 'the Cadburys', 'Cadburys'],
    about: 'la famille associée à une cité idéale',
    hint: 'C’est un nom propre : retrouve dans la leçon les repères de l’imaginaire.',
    typo: 'Cadburry',
  },
  {
    name: 'Roald Dahl',
    short: 'un imaginaire à explorer',
    accepted: ['Roald Dahl', 'Dahl'],
    about: 'celui dont l’imaginaire illustre l’axe « Le réel et l’imaginaire »',
    hint: 'C’est un nom de personne : retrouve dans la leçon les repères de l’imaginaire.',
    typo: 'Roald Dhal',
  },
  {
    name: 'Thanksgiving',
    short: 'la fête à la dinde',
    accepted: ['Thanksgiving', 'Thanksgiving Day'],
    about: 'la fête américaine de novembre où l’on mange traditionnellement de la dinde',
    typo: 'Thanksgivin',
  },
];

/** Activités inventées : chacune ne touche qu'un seul axe ; le mot-clé résume l'activité. */
export const ACTIVITIES: readonly (readonly [axis: number, text: string, key: string])[] = [
  [0, 'We paint our self-portraits.', 'self-portraits'],
  [0, 'We write a portrait of a classmate.', 'a portrait'],
  [1, 'We compare holidays in each season.', 'seasons'],
  [1, 'We talk about meals around the table.', 'meals'],
  [2, 'We read a fantasy story about an imaginary world.', 'fantasy story'],
  [2, 'We invent a dream city.', 'dream city'],
  [3, 'We discover after-school clubs.', 'clubs'],
  [3, 'We visit a very unusual school.', 'unusual school'],
  [4, 'We study how the English language changes from place to place.', 'language'],
  [4, 'We tell stories about people who moved to a new country.', 'migration stories'],
  [5, 'We visit a National Trust house in the UK.', 'National Trust'],
  [5, 'We learn about the four nations of the United Kingdom.', 'four nations'],
];

export const AXIS_FACTS: readonly Fait[] = [
  fait('axe-portrait', PROG, 'Axe 1. Portrait, autoportrait', 'Premier axe de 5e.'),
  fait('axe-quotidien', PROG, 'Axe 2. Le quotidien : lieux, rythmes, saisons', 'Deuxième axe de 5e.'),
  fait('axe-imaginaire', PROG, 'Axe 3. Le réel et l’imaginaire', 'Troisième axe de 5e.'),
  fait('axe-ecole', PROG, 'Axe 4. École et loisirs', 'Quatrième axe de 5e.'),
  fait('axe-langues', PROG, 'Axe 5. Des langues, des lieux, des histoires', 'Cinquième axe de 5e.'),
  fait('axe-uk', PROG, 'Axe 6. Le Royaume-Uni', 'Sixième axe de 5e.'),
  fait(
    'axes-obligatoires',
    PROG,
    'Cinq axes parmi les six proposés doivent être traités pendant l’année, dont obligatoirement l’axe 6.',
    'Cinq axes sur six, dont le Royaume-Uni.',
  ),
  fait(
    'yearbook',
    PROG,
    'Yearbooks are a popular tradition in American schools.',
    'Les yearbooks sont une tradition des écoles américaines.',
  ),
  fait(
    'yearbook-fin',
    PROG,
    'Every pupil receives a yearbook at the end of the year.',
    'Chaque élève en reçoit un en fin d’année.',
  ),
  fait(
    'npg',
    PROG,
    'The National Portrait Gallery : l’histoire britannique en image',
    'La National Portrait Gallery montre l’histoire britannique en images.',
  ),
  fait(
    'npg-londres',
    PROG,
    'The National Portrait Gallery is next to Trafalgar Square, in the centre of London.',
    'Elle est à Londres.',
  ),
  fait(
    'national-trust',
    PROG,
    'Découvrir le patrimoine britannique grâce au National Trust',
    'Le National Trust fait découvrir le patrimoine britannique.',
  ),
  fait(
    'bbc',
    PROG,
    'La BBC, une institution dans la vie des familles britanniques',
    'La BBC compte dans la vie des familles britanniques.',
  ),
  fait('bbc-serie', PROG, 'The BBC made a new series a few years ago', 'La BBC produit des séries.'),
  fait(
    'cadbury',
    PROG,
    'Mondes réels, mondes rêvés : de la cité idéale de la famille Cadbury à l’imaginaire de Roald Dahl',
    'La famille Cadbury et Roald Dahl illustrent le réel et l’imaginaire.',
  ),
  fait('thanksgiving-novembre-5e', 'bc-teens-thanksgiving', 'Thursday of November', 'Thanksgiving a lieu en novembre.'),
  fait(
    'thanksgiving-dinde-5e',
    'bc-teens-thanksgiving',
    'Turkey is traditionally eaten on Thanksgiving',
    'On mange traditionnellement de la dinde.',
  ),
];
