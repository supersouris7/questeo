/**
 * Anglais 5e, « Écouter et comprendre » (lot an-5e-07) : annonces et dialogues inventés pour les exercices, et
 * repères culturels qui reprennent les faits cités dans `ecoute-5e-faits.ts`. Aucun prénom d'élève réel.
 */
import type { Time } from './ecoute-cm2.ts';

export interface Place {
  /** Tel qu'il est dit dans le message. */
  readonly en: string;
  /** Traductions acceptées ; la première est la réponse montrée. */
  readonly fr: readonly [string, ...string[]];
}
const place = (en: string, ...fr: [string, ...string[]]): Place => ({ en, fr });
const at = (h: number, m: number): Time => ({ h, m });

// ——— 1. Messages enregistrés ———

export interface Announcement {
  /** Qui reçoit le message : distingue les énoncés sans dire d'où il vient. */
  readonly listener: string;
  /** Qui parle (réponse du niveau 1). */
  readonly source: string;
  readonly opening: string;
  /** Début de la phrase de l'horaire ; l'heure s'ajoute après « at ». */
  readonly event: string;
  /** Ce qui a lieu, en français : « le film ». */
  readonly what: string;
  readonly time: Time;
  readonly newTime: Time;
  readonly place: Place;
  readonly newPlace: Place;
  /** Prix en livres. */
  readonly price: number;
  readonly rule: { readonly en: string; readonly fr: string };
}

export const ANNOUNCEMENTS: readonly Announcement[] = [
  {
    listener: 'Mia',
    source: 'une gare',
    opening: 'Attention, please. This is a message for train passengers.',
    event: 'The train to Bristol leaves',
    what: 'le départ du train',
    time: at(9, 15),
    newTime: at(9, 45),
    place: place(
      'on platform two',
      'quai 2',
      'le quai 2',
      'au quai 2',
      'sur le quai 2',
      'quai deux',
      'quai numéro 2',
      'quai n°2',
      'voie 2',
    ),
    newPlace: place(
      'on platform five',
      'quai 5',
      'le quai 5',
      'au quai 5',
      'sur le quai 5',
      'quai cinq',
      'quai numéro 5',
      'quai n°5',
      'voie 5',
    ),
    price: 12,
    rule: { en: 'You must keep your ticket.', fr: 'garder son billet' },
  },
  {
    listener: 'Leo',
    source: 'un cinéma',
    opening: 'Hello, you are calling the Star Cinema.',
    event: 'The film starts',
    what: 'le film',
    time: at(5, 30),
    newTime: at(6, 15),
    place: place(
      'in screen one',
      'salle 1',
      'la salle 1',
      'dans la salle 1',
      'en salle 1',
      'salle un',
      'salle numéro 1',
      'salle n°1',
    ),
    newPlace: place(
      'in screen three',
      'salle 3',
      'la salle 3',
      'dans la salle 3',
      'en salle 3',
      'salle trois',
      'salle numéro 3',
      'salle n°3',
    ),
    price: 8,
    rule: { en: 'Please turn off your phone.', fr: 'éteindre son téléphone' },
  },
  {
    listener: 'Nina',
    source: 'un musée',
    opening: 'Welcome to the City Museum.',
    event: 'The guided visit starts',
    what: 'la visite guidée',
    time: at(10, 30),
    newTime: at(11, 15),
    place: place(
      'next to the gift shop',
      'à côté de la boutique',
      'à côté de la boutique de souvenirs',
      'à côté du magasin de souvenirs',
      'à côté du magasin',
      'près de la boutique',
      'près de la boutique de souvenirs',
    ),
    newPlace: place('next to the café', 'à côté du café', 'près du café'),
    price: 6,
    rule: { en: 'You mustn’t eat inside.', fr: 'ne pas manger à l’intérieur' },
  },
  {
    listener: 'Sam',
    source: 'un club de sport',
    opening: 'Hi, this is the coach of your rugby club.',
    event: 'Training starts',
    what: 'l’entraînement',
    time: at(4, 45),
    newTime: at(5, 15),
    place: place('at the stadium', 'au stade', 'dans le stade', 'le stade', 'stade'),
    newPlace: place(
      'in the sports hall',
      'au gymnase',
      'dans le gymnase',
      'le gymnase',
      'gymnase',
      'à la salle de sport',
      'dans la salle de sport',
      'la salle de sport',
      'salle de sport',
    ),
    price: 3,
    rule: { en: 'Please bring a bottle of water.', fr: 'apporter une bouteille d’eau' },
  },
  {
    listener: 'Zoé',
    source: 'un théâtre',
    opening: 'Good evening, and thank you for calling the River Theatre.',
    event: 'The play starts',
    what: 'la pièce',
    time: at(7, 30),
    newTime: at(8, 15),
    place: place(
      'at the front door',
      'à la porte d’entrée',
      'la porte d’entrée',
      'porte d’entrée',
      'devant la porte d’entrée',
      'à l’entrée',
      'à la porte principale',
      'à la porte de devant',
    ),
    newPlace: place(
      'at the back door',
      'à la porte de derrière',
      'la porte de derrière',
      'porte de derrière',
      'à l’entrée de derrière',
      'à la porte arrière',
      'la porte arrière',
    ),
    price: 15,
    rule: { en: 'Please arrive early.', fr: 'arriver en avance' },
  },
  {
    listener: 'Hugo',
    source: 'un professeur',
    opening: 'Hello, this is your teacher with news about the school trip.',
    event: 'The coach leaves',
    what: 'le départ du car',
    time: at(8, 15),
    newTime: at(8, 45),
    place: place(
      'at the school gate',
      'au portail de l’école',
      'au portail du collège',
      'devant l’école',
      'devant le collège',
    ),
    newPlace: place('in the car park', 'sur le parking', 'au parking', 'dans le parking', 'le parking', 'parking'),
    price: 10,
    rule: { en: 'Please bring your lunch.', fr: 'apporter son déjeuner' },
  },
  {
    listener: 'Lisa',
    source: 'une bibliothèque',
    opening: 'Hello, this is the Town Library.',
    event: 'The story club begins',
    what: 'le club lecture',
    time: at(2, 30),
    newTime: at(3, 15),
    place: place(
      'on the first floor',
      'au premier étage',
      'le premier étage',
      'premier étage',
      'au 1er étage',
      '1er étage',
      'à l’étage 1',
    ),
    newPlace: place(
      'on the ground floor',
      'au rez-de-chaussée',
      'le rez-de-chaussée',
      'rez-de-chaussée',
      'au rez de chaussée',
      'rez de chaussée',
    ),
    price: 2,
    rule: { en: 'You mustn’t talk loudly.', fr: 'ne pas parler fort' },
  },
  {
    listener: 'Emir',
    source: 'une piscine',
    opening: 'Thank you for calling the Blue Water Pool.',
    event: 'The swimming lesson starts',
    what: 'le cours de natation',
    time: at(11, 45),
    newTime: at(12, 15),
    place: place('near the entrance', 'près de l’entrée', 'à côté de l’entrée'),
    newPlace: place('near the showers', 'près des douches', 'à côté des douches'),
    price: 4,
    rule: { en: 'You must wear a swimming cap.', fr: 'porter un bonnet de bain' },
  },
];

// ——— 2. Dialogues ———

export interface Talk {
  readonly context: string;
  readonly lines: readonly string[];
  /** Sujet de la conversation (réponse du niveau 1). */
  readonly topic: string;
  readonly question: string;
  readonly good: string;
  readonly wrong: readonly { readonly label: string; readonly why: string }[];
  /** Réplique anglaise qui donne la réponse. */
  readonly key: string;
  readonly why: string;
}
const options = (...rows: readonly (readonly [string, string])[]) => rows.map(([label, why]) => ({ label, why }));

export const TALKS: readonly Talk[] = [
  {
    context: 'Lisa parle avec Tom.',
    lines: ['Lisa: Can you come to the cinema on Friday?', 'Tom: I’m sorry, I can’t. I have a piano lesson.'],
    topic: 'une sortie au cinéma',
    question: 'Que répond Tom ?',
    good: 'Il refuse : il a un cours de piano.',
    wrong: options(
      ['Il accepte : il adore le cinéma.', '« I’m sorry, I can’t » est un refus.'],
      ['Il refuse : il n’aime pas les films.', 'Tom ne dit rien sur les films.'],
      ['Il accepte, après son cours de piano.', 'Aucun « after » : il dit seulement qu’il ne peut pas.'],
    ),
    key: 'I’m sorry, I can’t.',
    why: '« I can’t » veut dire « je ne peux pas » ; la raison vient juste après.',
  },
  {
    context: 'Maya parle avec Emir.',
    lines: ['Maya: I think this book is great.', 'Emir: I disagree. It is too long.'],
    topic: 'un livre',
    question: 'Qu’en pense Emir ?',
    good: 'Il n’est pas d’accord : le livre est trop long.',
    wrong: options(
      ['Il est d’accord : le livre est génial.', '« I disagree » veut dire « je ne suis pas d’accord ».'],
      ['Il n’est pas d’accord : le livre est trop court.', '« too long » veut dire « trop long ».'],
      ['Il demande à Maya de répéter.', 'Emir donne son avis, il ne demande pas de répéter.'],
    ),
    key: 'I disagree. It is too long.',
    why: '« disagree » est le contraire de « agree » (être d’accord).',
  },
  {
    context: 'Un élève parle à sa professeure.',
    lines: ['Pupil: Can I open the window, please?', 'Teacher: Yes, of course. It is very warm today.'],
    topic: 'une fenêtre à ouvrir',
    question: 'Quelle est la réponse de la professeure ?',
    good: 'Elle autorise : il fait très chaud.',
    wrong: options(
      ['Elle refuse : il fait très froid.', '« Yes, of course » donne la permission.'],
      ['Elle refuse : il y a trop de bruit.', 'Le bruit n’est pas dans la conversation.'],
      ['Elle demande de fermer la porte.', 'La porte n’est pas dans la conversation.'],
    ),
    key: 'Yes, of course. It is very warm today.',
    why: '« Yes, of course » veut dire « oui, bien sûr ».',
  },
  {
    context: 'Deux amis visitent une ville.',
    lines: ['Zoé: Where is the museum, please?', 'Sam: It is next to the park, in the city centre.'],
    topic: 'le chemin vers un musée',
    question: 'Où est le musée ?',
    good: 'à côté du parc',
    wrong: options(
      ['dans le parc', '« next to » veut dire à côté, pas dedans.'],
      ['en face de la gare', 'La gare n’est pas dans la conversation.'],
      ['loin du centre-ville', '« in the city centre » : il est au centre.'],
    ),
    key: 'It is next to the park, in the city centre.',
    why: '« next to the park » veut dire à côté du parc.',
  },
  {
    context: 'Ana parle avec Paul.',
    lines: ['Ana: Where did you go during the holidays?', 'Paul: I went to Scotland with my family.'],
    topic: 'les vacances',
    question: 'Où Paul est-il allé ?',
    good: 'en Écosse',
    wrong: options(
      ['au pays de Galles', '« Scotland » désigne l’Écosse, pas le pays de Galles.'],
      ['en Irlande', 'L’Irlande se dit « Ireland ».'],
      ['en Angleterre', 'L’Angleterre se dit « England ».'],
    ),
    key: 'I went to Scotland with my family.',
    why: '« I went » raconte au passé : Paul est allé en Écosse.',
  },
  {
    context: 'Yuna parle avec son frère.',
    lines: ['Yuna: I’m hungry. Can we eat now?', 'Brother: Good idea! Let’s make a sandwich.'],
    topic: 'un en-cas à préparer',
    question: 'Comment réagit le frère de Yuna ?',
    good: 'Il est d’accord et propose un sandwich.',
    wrong: options(
      ['Il refuse : il n’a pas faim.', '« Good idea! » montre qu’il est d’accord.'],
      ['Il propose d’attendre le dîner.', 'Le dîner n’est pas dans la conversation.'],
      ['Il demande à Yuna de répéter.', 'Il répond tout de suite à la question.'],
    ),
    key: 'Good idea! Let’s make a sandwich.',
    why: '« Let’s » sert à proposer de faire quelque chose ensemble.',
  },
  {
    context: 'Hugo téléphone à Nina.',
    lines: ['Hugo: We have a rugby match on Sunday.', 'Nina: Sorry, can you repeat, please?'],
    topic: 'un match de rugby',
    question: 'Que demande Nina ?',
    good: 'de répéter',
    wrong: options(
      ['de venir au match', '« repeat » ne parle pas de venir.'],
      ['de parler d’un autre sport', 'Aucun autre sport n’est cité.'],
      ['de changer le jour du match', 'Elle ne propose aucun autre jour.'],
    ),
    key: 'Sorry, can you repeat, please?',
    why: '« Can you repeat » veut dire « peux-tu répéter ».',
  },
  {
    context: 'Jamie parle avec Lily.',
    lines: ['Jamie: You look tired. Are you OK?', 'Lily: Not really. I went to bed late.'],
    topic: 'la fatigue d’une amie',
    question: 'Pourquoi Lily est-elle fatiguée ?',
    good: 'Elle s’est couchée tard.',
    wrong: options(
      ['Elle s’est levée très tôt.', '« went to bed late » parle du coucher, pas du lever.'],
      ['Elle a fait beaucoup de sport.', 'Le sport n’est pas dans la conversation.'],
      ['Elle va très bien.', '« Not really » veut dire « pas vraiment ».'],
    ),
    key: 'I went to bed late.',
    why: '« late » veut dire tard.',
  },
];

export interface Day {
  readonly en: string;
  readonly fr: string;
}
const day = (en: string, fr: string): Day => ({ en, fr });

/** Conversation à rendez-vous : un premier jour refusé, un second accepté. */
export interface Plan {
  readonly names: readonly [string, string];
  readonly invitation: string;
  readonly no: Day;
  readonly excuse: string;
  readonly yes: Day;
  readonly place: Place;
  readonly time: Time;
}

export const PLANS: readonly Plan[] = [
  {
    names: ['Ben', 'Ana'],
    invitation: 'Can you come to the museum',
    no: day('Monday', 'lundi'),
    excuse: 'I have a music lesson.',
    yes: day('Wednesday', 'mercredi'),
    place: place('at the bus stop', 'à l’arrêt de bus', 'à l’arrêt du bus', 'à l’arrêt de car'),
    time: at(2, 15),
  },
  {
    names: ['Lisa', 'Tom'],
    invitation: 'Do you want to play tennis',
    no: day('Tuesday', 'mardi'),
    excuse: 'I have a lot of homework.',
    yes: day('Saturday', 'samedi'),
    place: place('in front of the park', 'devant le parc', 'à l’entrée du parc'),
    time: at(10, 30),
  },
  {
    names: ['Maya', 'Leo'],
    invitation: 'Can you come to my house',
    no: day('Thursday', 'jeudi'),
    excuse: 'I am going to the dentist.',
    yes: day('Friday', 'vendredi'),
    place: place(
      'at the school gate',
      'au portail de l’école',
      'au portail du collège',
      'devant l’école',
      'devant le collège',
    ),
    time: at(4, 45),
  },
  {
    names: ['Sam', 'Zoé'],
    invitation: 'Do you want to go swimming',
    no: day('Sunday', 'dimanche'),
    excuse: 'We are visiting my grandparents.',
    yes: day('Wednesday', 'mercredi'),
    place: place('next to the library', 'à côté de la bibliothèque', 'près de la bibliothèque'),
    time: at(3, 30),
  },
  {
    names: ['Emir', 'Yuna'],
    invitation: 'Can you come to the cinema',
    no: day('Saturday', 'samedi'),
    excuse: 'I have a football match.',
    yes: day('Sunday', 'dimanche'),
    place: place('at the station', 'à la gare', 'devant la gare'),
    time: at(1, 45),
  },
  {
    names: ['Paul', 'Nina'],
    invitation: 'Do you want to ride our bikes',
    no: day('Friday', 'vendredi'),
    excuse: 'I am helping my dad.',
    yes: day('Monday', 'lundi'),
    place: place('near the bridge', 'près du pont', 'à côté du pont'),
    time: at(5, 15),
  },
  {
    names: ['Alex', 'Lily'],
    invitation: 'Can you come to the library',
    no: day('Wednesday', 'mercredi'),
    excuse: 'I have a dance class.',
    yes: day('Tuesday', 'mardi'),
    place: place('in the playground', 'dans la cour', 'dans la cour de récréation', 'à la cour de récréation'),
    time: at(12, 30),
  },
];

export interface Intention {
  readonly en: string;
  readonly fr: string;
}
/** Répliques et ce que la personne veut faire en les disant. */
export const INTENTIONS: readonly Intention[] = [
  { en: 'Can you come on Saturday?', fr: 'inviter' },
  { en: 'I’m sorry, I can’t.', fr: 'refuser poliment' },
  { en: 'Good idea! No problem.', fr: 'accepter' },
  { en: 'Can you repeat, please?', fr: 'faire répéter' },
  { en: 'Can I open the window?', fr: 'demander la permission' },
  { en: 'You should take a map.', fr: 'conseiller' },
  { en: 'I disagree. You’re wrong.', fr: 'dire son désaccord' },
  { en: 'Be careful! Wait a minute.', fr: 'prévenir d’un danger' },
  { en: 'Thanks a lot!', fr: 'remercier' },
];

export interface Scene {
  readonly context: string;
  readonly lines: readonly string[];
  /** Moments dans l'ordre où ils se passent. */
  readonly moments: readonly [string, string, string, string];
  /** Comment le dialogue montre l'ordre. */
  readonly how: string;
}

export const SCENES: readonly Scene[] = [
  {
    context: 'Mia organise sa journée avec Leo.',
    lines: [
      'Mia: What are we doing on Saturday?',
      'Leo: First, we are meeting at the station. Then we are taking the train.',
      'Mia: And after the train?',
      'Leo: We are visiting the castle. Finally, we are having a picnic.',
    ],
    moments: ['le rendez-vous à la gare', 'le trajet en train', 'la visite du château', 'le pique-nique'],
    how: 'Repère « First », « Then » et « Finally ».',
  },
  {
    context: 'Sam raconte à Zoé sa journée d’hier.',
    lines: [
      'Zoé: Did you have a good day?',
      'Sam: Yes! I played tennis after lunch.',
      'Zoé: And in the morning?',
      'Sam: I did my homework, then I helped my mum. In the evening, I watched a film.',
    ],
    moments: ['les devoirs', 'l’aide à sa mère', 'le tennis', 'le film'],
    how: 'Remets le matin avant le déjeuner, même s’il est dit en second.',
  },
  {
    context: 'Nina explique sa recette à Paul.',
    lines: [
      'Paul: How do you make this cake?',
      'Nina: Mix the eggs and the sugar. But before that, wash your hands.',
      'Paul: OK. What next?',
      'Nina: Add the flour. Finally, put the cake in the oven.',
    ],
    moments: ['se laver les mains', 'mélanger les œufs et le sucre', 'ajouter la farine', 'mettre le gâteau au four'],
    how: 'Repère « before that » : le lavage des mains passe avant le mélange.',
  },
  {
    context: 'Emir prépare une visite avec Maya.',
    lines: [
      'Maya: Can we see the animals first?',
      'Emir: No, first we are going to the gift shop to get a map.',
      'Maya: Then the animals?',
      'Emir: Yes. After the animals, we are eating lunch. Then we are watching the penguin show.',
    ],
    moments: ['la boutique pour le plan', 'les animaux', 'le déjeuner', 'le spectacle des manchots'],
    how: 'Compare : Maya propose les animaux d’abord, mais Emir dit « No, first… ».',
  },
  {
    context: 'Yuna téléphone à Alex.',
    lines: [
      'Alex: When can you come to my house?',
      'Yuna: After my swimming lesson. Before the lesson, I am having lunch.',
      'Alex: Great. We can play, then we can watch a match.',
    ],
    moments: ['le déjeuner de Yuna', 'son cours de natation', 'le jeu chez Alex', 'le match à regarder'],
    how: 'Repère « Before the lesson » : le déjeuner passe avant la natation.',
  },
  {
    context: 'Lily parle de son voyage avec Jamie.',
    lines: [
      'Jamie: How did you get to London?',
      'Lily: We took the bus to the airport. Then we flew to London.',
      'Jamie: And in London?',
      'Lily: We took the Tube to the hotel and, finally, we visited a museum.',
    ],
    moments: ['le bus vers l’aéroport', 'l’avion pour Londres', 'le métro vers l’hôtel', 'la visite d’un musée'],
    how: 'Suis les verbes au passé : took, flew, took, visited.',
  },
];

// ——— 3. Repères culturels ———

export interface Landmark {
  readonly id: string;
  /** Qui suit la visite : distingue les énoncés. */
  readonly listener: string;
  /** Nom du repère, montré à partir du niveau 4. */
  readonly name: string;
  /** Sujet du message (réponse du niveau 1). */
  readonly topic: string;
  readonly lines: readonly string[];
  readonly question: string;
  readonly good: string;
  readonly wrong: readonly { readonly label: string; readonly why: string }[];
  /** Phrase anglaise qui donne la réponse. */
  readonly key: string;
  /** Mot difficile du message, expliqué à l'élève. */
  readonly help?: string;
  /** Saisie : consigne, réponses acceptées, erreur typique. */
  readonly typed: {
    readonly ask: string;
    readonly accepted: readonly [string, ...string[]];
    readonly trap: readonly [string, string];
  };
  /** Ce que le repère est, en français (association). */
  readonly clue: string;
}

export const LANDMARKS: readonly Landmark[] = [
  {
    id: 'hampton',
    listener: 'Tom',
    name: 'Hampton Court Palace',
    topic: 'un palais lié à un roi',
    lines: ['Hampton Court Palace is in west London.', 'It was home to King Henry the Eighth.'],
    question: 'Qui a habité ce palais ?',
    good: 'le roi Henry VIII',
    wrong: options(
      ['Winston Churchill', 'La maison de Churchill, c’est Chartwell.'],
      ['Sherlock Holmes', 'Holmes est un personnage de roman.'],
      ['Brunel', 'Brunel a conçu un navire.'],
    ),
    key: 'It was home to King Henry the Eighth.',
    typed: {
      ask: 'Écris en anglais le prénom du roi.',
      accepted: [
        'Henry',
        'King Henry',
        'Henry VIII',
        'King Henry VIII',
        'Henry the Eighth',
        'King Henry the Eighth',
        'Henry 8',
      ],
      trap: ['London', '« London » est la ville, pas le prénom du roi.'],
    },
    clue: 'la demeure du roi Henry VIII',
  },
  {
    id: 'chartwell',
    listener: 'Ana',
    name: 'Chartwell',
    topic: 'la maison d’un homme célèbre',
    lines: ['Chartwell was the home of Winston Churchill.', 'It is in Kent, in England, far from London.'],
    question: 'Qui habitait à Chartwell ?',
    good: 'Winston Churchill',
    wrong: options(
      ['le roi Henry VIII', 'Henry VIII habitait Hampton Court Palace.'],
      ['Arthur Conan Doyle', 'Conan Doyle n’est pas cité dans le message.'],
      ['Brunel', 'Brunel n’est pas cité dans le message.'],
    ),
    key: 'Chartwell was the home of Winston Churchill.',
    typed: {
      ask: 'Écris en anglais le nom du comté où se trouve Chartwell.',
      accepted: ['Kent', 'in Kent'],
      trap: ['London', 'Le message dit « far from London » : loin de Londres.'],
    },
    clue: 'la maison de Winston Churchill',
  },
  {
    id: 'bristol',
    listener: 'Paul',
    name: 'SS Great Britain',
    topic: 'un navire à visiter',
    lines: ['In Bristol, you can visit the SS Great Britain.', 'Brunel designed this ship.'],
    question: 'Que peut-on visiter ?',
    good: 'un navire',
    wrong: options(
      ['un château', '« ship » veut dire navire.'],
      ['une tour', '« ship » veut dire navire, pas tour.'],
      ['un théâtre', 'Le message ne parle pas de théâtre.'],
    ),
    key: 'Brunel designed this ship.',
    typed: {
      ask: 'Écris en anglais le nom de la ville.',
      accepted: ['Bristol', 'in Bristol'],
      trap: ['Britain', '« Britain » fait partie du nom du navire.'],
    },
    clue: 'un navire conçu par Brunel',
  },
  {
    id: 'tower',
    listener: 'Maya',
    name: 'Tower of London',
    topic: 'la visite d’une tour célèbre',
    lines: ['We are at the Tower of London.', 'We will visit the White Tower first, then the crown jewels.'],
    question: 'Que visite-t-on après la White Tower ?',
    good: 'les joyaux de la couronne',
    wrong: options(
      ['la boutique', 'La boutique n’est pas dans le message.'],
      ['un navire', 'Le message ne parle pas de navire.'],
      ['le palais du roi', 'Aucun palais n’est cité après « then ».'],
    ),
    key: 'We will visit the White Tower first, then the crown jewels.',
    typed: {
      ask: 'Écris en anglais le nom de ce que l’on visite en premier.',
      accepted: ['White Tower', 'the White Tower'],
      trap: ['Tower of London', 'C’est le nom du lieu entier, pas la première visite.'],
    },
    clue: 'la White Tower et les joyaux de la couronne',
  },
  {
    id: 'baker',
    listener: 'Alex',
    name: '221B Baker Street',
    topic: 'un personnage de roman et sa rue',
    lines: ['Sherlock Holmes is a character by Arthur Conan Doyle.', 'In the stories, he lived on Baker Street.'],
    question: 'Qui a créé le personnage de Sherlock Holmes ?',
    good: 'Arthur Conan Doyle',
    wrong: options(
      ['Winston Churchill', 'Churchill n’est pas cité dans le message.'],
      ['Mark Twain', 'Mark Twain n’est pas cité dans le message.'],
      ['Brunel', 'Brunel a conçu un navire, il n’est pas cité ici.'],
    ),
    key: 'Sherlock Holmes is a character by Arthur Conan Doyle.',
    typed: {
      ask: 'Écris en anglais le nom de la rue.',
      accepted: ['Baker Street', 'Baker St', '221B Baker Street'],
      trap: ['Holmes', '« Holmes » est le nom du personnage, pas de la rue.'],
    },
    clue: 'l’adresse de Sherlock Holmes',
  },
  {
    id: 'pound',
    listener: 'Lily',
    name: 'pound sterling',
    topic: 'la monnaie d’un pays',
    lines: ['The pound sterling is the official currency of the United Kingdom.', 'This mug costs twelve pounds.'],
    question: 'Quelle est la monnaie officielle du Royaume-Uni ?',
    good: 'la livre sterling',
    wrong: options(
      ['l’euro', '« pound sterling » est la livre, pas l’euro.'],
      ['le dollar', 'Le dollar n’est pas dans le message.'],
      ['le franc', 'Le franc n’est pas dans le message.'],
    ),
    key: 'The pound sterling is the official currency of the United Kingdom.',
    help: 'Retiens ce mot : « currency » veut dire « monnaie ».',
    typed: {
      ask: 'Écris en anglais le nom de la monnaie.',
      accepted: ['pound', 'pound sterling', 'the pound', 'the pound sterling', 'pounds', 'sterling'],
      trap: ['euro', 'Le message cite la monnaie britannique, pas l’euro.'],
    },
    clue: 'la monnaie officielle du Royaume-Uni',
  },
  {
    id: 'causeway',
    listener: 'Jamie',
    name: 'Giant’s Causeway',
    topic: 'un lieu d’Irlande du Nord',
    lines: ['Lots of tourists visit the Giant’s Causeway.', 'It is in Northern Ireland.'],
    question: 'Dans quelle partie du Royaume-Uni se trouve ce site ?',
    good: 'en Irlande du Nord',
    wrong: options(
      ['en Écosse', '« Northern Ireland » est l’Irlande du Nord.'],
      ['au pays de Galles', '« Northern Ireland » est l’Irlande du Nord.'],
      ['en Angleterre', '« Northern Ireland » est l’Irlande du Nord.'],
    ),
    key: 'It is in Northern Ireland.',
    typed: {
      ask: 'Écris en anglais la partie du Royaume-Uni citée.',
      accepted: ['Northern Ireland', 'in Northern Ireland'],
      trap: ['Ireland', 'Il manque « Northern » : c’est la partie du nord.'],
    },
    clue: 'un site touristique d’Irlande du Nord',
  },
  {
    id: 'dragon',
    listener: 'Yuna',
    name: 'Welsh flag',
    topic: 'un drapeau',
    lines: ['Look at the Welsh flag.', 'There is a dragon on it.'],
    question: 'De quel pays parle-t-on ?',
    good: 'le pays de Galles',
    wrong: options(
      ['l’Écosse', '« Welsh » veut dire gallois.'],
      ['l’Angleterre', '« Welsh » veut dire gallois.'],
      ['l’Irlande du Nord', '« Welsh » veut dire gallois.'],
    ),
    key: 'Look at the Welsh flag.',
    typed: {
      ask: 'Écris en anglais l’animal qui est sur le drapeau.',
      accepted: ['dragon', 'a dragon', 'the dragon'],
      trap: ['flag', '« flag » veut dire drapeau : ce n’est pas un animal.'],
    },
    clue: 'un drapeau qui porte un dragon',
  },
  {
    id: 'globe',
    listener: 'Ben',
    name: 'Globe Theatre',
    topic: 'une sortie au théâtre',
    lines: ['Yesterday we went to the Globe Theatre.', 'We saw a play. It was great!'],
    question: 'Qu’ont-ils vu là-bas ?',
    good: 'une pièce de théâtre',
    wrong: options(
      ['un match', '« play » est ici un nom : une pièce de théâtre.'],
      ['un film', 'Un film se dit « film ».'],
      ['un drapeau', 'Aucun drapeau n’est cité.'],
    ),
    key: 'We saw a play.',
    typed: {
      ask: 'Écris en anglais le nom du théâtre.',
      accepted: ['Globe', 'the Globe', 'Globe Theatre', 'the Globe Theatre', 'Globe Theater'],
      trap: ['play', '« play » veut dire pièce : ce n’est pas le nom du théâtre.'],
    },
    clue: 'un théâtre où l’on voit des pièces',
  },
];

/** Lieux d'une visite guidée : le nom entendu et sa description. */
export const VISITS = {
  hampton: { say: 'Hampton Court Palace', clue: 'la demeure du roi Henry VIII' },
  chartwell: { say: 'Chartwell', clue: 'la maison de Winston Churchill' },
  tower: { say: 'the Tower of London', clue: 'le lieu de la White Tower' },
  baker: { say: 'Baker Street', clue: 'la rue de Sherlock Holmes' },
  globe: { say: 'the Globe Theatre', clue: 'le théâtre' },
  ship: { say: 'the SS Great Britain', clue: 'le navire de Brunel' },
} as const;
type Visit = keyof typeof VISITS;

/** Voyages inventés : quatre visites dans l'ordre prévu (la deuxième est annoncée après la troisième). */
export const TOURS: readonly { readonly guest: string; readonly stops: readonly [Visit, Visit, Visit, Visit] }[] = [
  { guest: 'Mia', stops: ['hampton', 'tower', 'globe', 'baker'] },
  { guest: 'Leo', stops: ['chartwell', 'ship', 'hampton', 'tower'] },
  { guest: 'Nina', stops: ['baker', 'globe', 'chartwell', 'hampton'] },
  { guest: 'Sam', stops: ['tower', 'baker', 'ship', 'chartwell'] },
  { guest: 'Zoé', stops: ['ship', 'chartwell', 'baker', 'globe'] },
  { guest: 'Hugo', stops: ['globe', 'hampton', 'tower', 'ship'] },
  { guest: 'Lisa', stops: ['hampton', 'baker', 'ship', 'globe'] },
  { guest: 'Emir', stops: ['tower', 'chartwell', 'globe', 'hampton'] },
];
