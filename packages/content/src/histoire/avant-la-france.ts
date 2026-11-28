import type { Skill } from '../types.ts';
import { notionGuidee, type NotionGuidee } from './avant-la-france-guide.ts';

/**
 * CM1, thème 1 « Et avant la France ? » (lot hi-cm1-01, repassé par rp-hi-cm1-01). Chaque fait cite sa source et la
 * citation exacte : le programme du cycle 3 (registre `cycle3-2020`) sauf mention contraire ; les textes à lire du
 * niveau 5 sont écrits pour l’exercice.
 */
export const SOURCE = 'cycle3-2020';

/** Citations exactes du programme. */
const P = {
  compare:
    'On confronte rapidement ces traces proches à des traces préhistoriques et historiques différentes relevées dans un autre lieu en France',
  anciennete: 'pour montrer l’ancienneté du peuplement et la pluralité des héritages',
  materielles: 'la civilisation gauloise, dont on garde des traces matérielles, ne connaît pas de rupture brusque',
  proche: 'on identifie des traces spécifiques de la préhistoire et de l’histoire dans leur environnement proche',
  situer: 'pour situer ces traces dans le temps et construire des repères historiques qui leur sont liés',
  brassage: 'caractérisées par le brassage de leurs populations',
  apports:
    'Les apports de la romanité sont néanmoins nombreux : villes, routes, religion chrétienne (mais aussi judaïsme) en sont des exemples.',
  contacts:
    'On se centrera ensuite sur les Gaules, caractérisées par le brassage de leurs populations et les contacts entre Celtes, Gaulois et civilisations méditerranéennes.',
  colonisation:
    'L’histoire de la colonisation romaine des Gaules ne doit pas faire oublier que la civilisation gauloise',
  migrations:
    "à partir du IVe siècle, des peuples venus de l'est, notamment les Francs et les Wisigoths, s'installent sur plusieurs siècles dans l'empire romain d'Occident",
  chute: "l'empire romain d'Occident, qui s'effondre définitivement vers la fin du Ve siècle",
  clovis:
    'Clovis, roi des Francs, est l’occasion de revisiter les relations entre les peuples dits barbares et l’empire romain',
  bapteme:
    'de montrer la continuité entre mondes romain et mérovingien, dont atteste le geste politique de son baptême',
  charlemagne:
    'Charlemagne, couronné empereur en 800, roi des Francs et des Lombards, reconstitue un empire romain et chrétien',
};

const traces: NotionGuidee = {
  id: 'hcm1-traces',
  title: 'Traces d’une occupation ancienne du territoire',
  memo: [
    'Une **trace** est ce qui reste du passé, comme un vieux mur.',
    'Les traces anciennes montrent le **peuplement** : des gens vivent ici depuis longtemps.',
    'Compare deux lieux : tu découvres la **pluralité** des **héritages**, donc plusieurs sortes.',
  ],
  sens: {
    type: 'metier',
    text: 'L’archéologie étudie les humains du passé grâce aux monuments et aux objets qui restent.',
    source: 'cnrtl-archeologie',
    citation:
      "Science qui a pour objet l'étude des civilisations humaines passées à partir des monuments et objets qui en subsistent",
  },
  faits: [
    {
      quote: P.anciennete,
      q: 'Des outils très anciens sont trouvés près d’un village. Que montrent-ils ?',
      a: 'des gens vivaient là il y a très longtemps',
      wrong: [
        {
          label: 'le village vient d’être construit',
          why: 'Ces outils sont très anciens : ils ne parlent pas d’un village neuf.',
        },
        { label: 'personne n’a jamais vécu là', why: 'Un outil a été fabriqué par quelqu’un : des gens étaient là.' },
        { label: 'les habitants avaient des voitures', why: 'La voiture est une invention bien plus récente.' },
      ],
      gap: ['Des outils très anciens prouvent un ', ' ancien : la présence d’habitants (un mot en p).', ['peuplement']],
      indice: 'Pense à ceux qui ont fabriqué ces outils.',
      etapes: [
        'Regarde les outils : quelqu’un les a fabriqués ici.',
        'Retiens ce mot : le peuplement, c’est la présence d’habitants.',
      ],
    },
    {
      quote: P.compare,
      q: 'Deux lieux de France ont des traces différentes. Que montrent-elles ?',
      a: 'le passé a laissé plusieurs sortes d’héritages',
      wrong: [
        {
          label: 'toute la France a le même passé',
          why: 'Les traces sont différentes : le passé n’est pas le même partout.',
        },
        { label: 'un des deux lieux n’a aucun passé', why: 'Chaque lieu a ses traces : les deux ont un passé.' },
        { label: 'les traces sont forcément fausses', why: 'Des traces différentes peuvent être toutes vraies.' },
      ],
      gap: [
        'Deux lieux, des traces différentes : voilà la pluralité des ',
        ' (un mot en h).',
        ['héritages', 'heritages'],
      ],
      indice: 'Pense à ce que le passé nous transmet.',
      etapes: [
        'Compare les deux lieux : leurs traces ne se ressemblent pas.',
        'Retiens ceci : un héritage est ce que le passé nous laisse.',
      ],
    },
    {
      quote: P.materielles,
      q: 'Qu’est-ce qui est une trace matérielle des Gaulois ?',
      a: 'un outil gaulois que l’on peut toucher',
      wrong: [
        {
          label: 'un dessin animé sur les Gaulois',
          why: 'Un dessin animé est fait aujourd’hui : il ne vient pas des Gaulois.',
        },
        { label: 'un rêve où tu vois un Gaulois', why: 'Un rêve ne se touche pas : ce n’est pas une trace.' },
        { label: 'un costume de Gaulois acheté hier', why: 'Ce costume est neuf : il ne vient pas du passé.' },
      ],
      gap: ['Une trace du passé que l’on peut toucher est une trace ', ' (un mot en m).', ['matérielle', 'materielle']],
      indice: 'Cherche ce qui vient du passé et se touche.',
      etapes: [
        'Cherche un objet qui vient vraiment du passé.',
        'Vérifie qu’on peut le toucher : on le dit « matériel ».',
      ],
    },
    {
      quote: P.proche,
      q: 'Où commences-tu à chercher des traces du passé ?',
      a: 'près de chez toi',
      wrong: [
        {
          label: 'seulement dans un pays étranger',
          why: 'On commence près de toi, puis on compare avec un autre lieu.',
        },
        { label: 'seulement au fond de l’océan', why: 'Le point de départ est l’endroit que tu connais.' },
        { label: 'seulement sur la Lune', why: 'Les traces de notre histoire se cherchent autour de toi.' },
      ],
      gap: [
        'Tu cherches d’abord des traces dans ton ',
        ' proche (un mot qui commence par « envi »).',
        ['environnement'],
      ],
      indice: 'Pense aux lieux que tu connais déjà.',
      etapes: [
        'Pense à ton quartier ou à ton village.',
        'Commence par ces lieux familiers, puis compare avec un autre.',
      ],
    },
    {
      quote: P.situer,
      q: 'Tu découvres un vieux mur près de l’école. Que cherches-tu à faire avec cette trace ?',
      a: 'la situer dans le temps',
      wrong: [
        { label: 'la détruire pour faire de la place', why: 'On étudie une trace, on ne la détruit pas.' },
        { label: 'la repeindre pour la rendre neuve', why: 'La repeindre cacherait ce qu’elle raconte du passé.' },
        {
          label: 'l’oublier le plus vite possible',
          why: 'Une trace aide à comprendre le passé : on la garde en tête.',
        },
      ],
      gap: ['Savoir de quand date une trace, c’est la situer dans le ', ' (un mot en t).', ['temps']],
      indice: 'Demande-toi quelle question poser sur son âge.',
      etapes: ['Demande-toi : « De quand date ce mur ? »', 'Cherche sa place parmi les périodes que tu connais.'],
    },
    {
      source: 'academie-prehistoire',
      quote: 'Période antérieure à celle sur laquelle on possède des témoignages écrits et qu’on appelle Histoire',
      q: 'Quelle nouveauté marque la fin de la préhistoire ?',
      a: 'les premiers textes écrits',
      wrong: [
        { label: 'les premiers outils en pierre', why: 'Des outils en pierre existent déjà pendant la préhistoire.' },
        {
          label: 'la naissance de ton école',
          why: 'Ton école est très récente : la préhistoire est déjà finie depuis longtemps.',
        },
        { label: 'l’invention de la voiture', why: 'La voiture est très récente : la préhistoire finit bien avant.' },
      ],
      gap: ['La préhistoire est la période avant les premiers textes ', ' (un mot en é).', ['écrits', 'ecrits']],
      indice: 'Pense à ce que les humains ne faisaient pas encore.',
      etapes: [
        'Repère le début du mot : « pré » veut dire « avant ».',
        'Souviens-toi : ensuite, des textes racontent le passé.',
      ],
    },
  ],
  paires3: [
    ['Trace', 'Reste du passé'],
    ['Préhistoire', 'Avant les textes écrits'],
    ['Peuplement', 'Présence d’habitants'],
  ],
  paires5: [
    ['Préhistoire', 'Avant l’écrit'],
    ['Peuplement', 'Présence d’habitants'],
    ['Pluralité', 'Plusieurs sortes'],
    ['Trace matérielle', 'Se touche'],
    ['Environnement proche', 'Près de toi'],
  ],
  libres: [
    {
      quote: P.anciennete,
      q: 'Écris le mot en p qui nomme la présence d’habitants dans un lieu.',
      accepted: ['peuplement', 'le peuplement', 'un peuplement'],
      traps: [
        { text: 'passé', why: 'Le passé est un temps. On cherche la présence d’habitants.' },
        { text: 'pays', why: 'Un pays est un lieu. On cherche la présence des gens.' },
        { text: 'population', why: 'La population, ce sont les gens. Le mot demandé ressemble à « peuple ».' },
      ],
      indice: 'Ce mot ressemble à « peuple ».',
      etapes: ['Pense au mot « peuple ».', 'Ajoute la fin du mot : elle dit que des gens habitent là.'],
    },
    {
      source: 'academie-prehistoire',
      quote: 'Période antérieure à celle sur laquelle on possède des témoignages écrits et qu’on appelle Histoire',
      q: 'Écris le nom de la très longue période d’avant les textes écrits.',
      accepted: ['préhistoire', 'la préhistoire', 'prehistoire', 'la prehistoire'],
      traps: [
        { text: 'histoire', why: 'L’histoire s’appuie aussi sur des textes. On cherche la période d’avant.' },
        { text: 'antiquité', why: 'L’Antiquité vient après : on y écrit déjà.' },
      ],
      indice: 'Pense à l’époque des tout premiers outils en pierre.',
      etapes: ['Repère l’idée : cette période vient avant les textes.', 'Cherche le mot qui commence par « pré ».'],
    },
    {
      quote: P.materielles,
      q: 'Un mur ou un outil se touche. Complète avec un mot en m : une trace …',
      accepted: ['matérielle', 'materielle'],
      traps: [
        { text: 'écrite', why: 'Une trace écrite est un texte. Ici, on parle d’un objet à toucher.' },
        { text: 'orale', why: 'Orale veut dire « dite à voix haute » : cela ne se touche pas.' },
      ],
      indice: 'Pense au mot « matière ».',
      etapes: [
        'Pense à la matière : la pierre, le métal, le bois.',
        'Cherche l’adjectif qui vient du mot « matière ».',
      ],
    },
    {
      quote: P.anciennete,
      q: 'Écris le mot en h : ce que les gens du passé nous ont laissé.',
      accepted: [
        'héritage',
        'un héritage',
        'l’héritage',
        'heritage',
        'un heritage',
        'l’heritage',
        'héritages',
        'des héritages',
        'les héritages',
        'heritages',
        'des heritages',
        'les heritages',
      ],
      traps: [
        { text: 'histoire', why: 'L’histoire raconte le passé. On cherche ce qui nous est transmis.' },
        { text: 'habitude', why: 'Une habitude se répète chaque jour. On cherche ce qui est transmis.' },
      ],
      indice: 'Pense à ce qu’on reçoit de ses grands-parents.',
      etapes: ['Pense à ce qu’une famille transmet à ses enfants.', 'Applique la même idée aux gens du passé.'],
    },
  ],
  docs: [
    {
      title: 'Le vieux mur',
      lines: [
        'Au bord d’un champ, Lina observe un vieux mur de pierres.',
        'Ce mur est là depuis des siècles.',
        'Elle peut le toucher avec la main.',
      ],
      qs: [
        {
          quote: P.materielles,
          q: 'Elle peut toucher ce reste du passé. Complète avec un mot en m : une trace …',
          accepted: ['matérielle', 'materielle'],
          traps: [
            { text: 'écrite', why: 'Le mur n’est pas un texte : on le touche.' },
            { text: 'ancienne', why: 'Elle est ancienne, mais le mot demandé commence par m.' },
          ],
          indice: 'Pense à la matière du mur.',
          etapes: ['Relis la ligne 3 : Lina peut toucher le mur.', 'Cherche l’adjectif qui vient du mot « matière ».'],
        },
        {
          quote: P.proche,
          q: 'Complète avec un mot en t : ce vieux mur est une … du passé.',
          accepted: ['trace', 'une trace', 'la trace'],
          traps: [
            { text: 'terre', why: 'La terre est le sol. On cherche le nom de ce qui reste du passé.' },
            { text: 'tour', why: 'Le texte décrit un mur, pas une tour.' },
          ],
          indice: 'Pense au titre de la leçon.',
          etapes: ['Relis les lignes 1 et 2 : ce mur est très vieux.', 'Cherche le mot qui désigne un reste du passé.'],
        },
      ],
    },
    {
      title: 'Des fouilles',
      lines: [
        'Sous un champ, des savants trouvent des outils en pierre.',
        'Ces outils datent d’avant les premiers textes écrits.',
        'Des gens les ont fabriqués ici.',
      ],
      qs: [
        {
          source: 'academie-prehistoire',
          quote: 'Période antérieure à celle sur laquelle on possède des témoignages écrits et qu’on appelle Histoire',
          q: 'Écris le nom de la période de ces outils.',
          accepted: ['préhistoire', 'la préhistoire', 'prehistoire', 'la prehistoire'],
          traps: [
            { text: 'antiquité', why: 'Pendant l’Antiquité, on écrit déjà. Relis la ligne 2.' },
            { text: 'moyen âge', why: 'Le Moyen Âge vient bien après les premiers textes.' },
          ],
          indice: 'Relis la ligne 2 : on n’écrit pas encore.',
          etapes: [
            'Relis la ligne 2 : les textes n’existent pas encore.',
            'Rappelle-toi le nom qui commence par « pré ».',
          ],
        },
        {
          quote: P.anciennete,
          q: 'Complète avec un mot en p qui veut dire « présence d’habitants » : un … ancien.',
          accepted: ['peuplement'],
          traps: [
            { text: 'paysage', why: 'Le paysage est ce qu’on voit. Les outils parlent des habitants.' },
            { text: 'peuple', why: 'Un peuple est un groupe de gens. On cherche le mot pour leur présence.' },
            { text: 'passage', why: 'Les gens ont fabriqué les outils ici : on cherche leur présence.' },
          ],
          indice: 'Pense à la présence des habitants.',
          etapes: ['Relis la ligne 3 : des gens étaient là.', 'Cherche le mot qui désigne la présence d’habitants.'],
        },
      ],
    },
    {
      title: 'Deux villages',
      lines: [
        'Près du village de Sami, on voit de grandes pierres dressées.',
        'Près du village de Noé, on voit un pont très ancien.',
        'Les deux villages sont loin l’un de l’autre.',
      ],
      qs: [
        {
          quote: P.anciennete,
          q: 'Le passé a laissé ces pierres et ce pont. Écris le mot en h qui les nomme.',
          accepted: [
            'héritages',
            'des héritages',
            'les héritages',
            'heritages',
            'des heritages',
            'les heritages',
            'héritage',
            'un héritage',
            'l’héritage',
            'heritage',
            'un heritage',
            'l’heritage',
          ],
          traps: [
            { text: 'habitants', why: 'Les habitants sont des personnes. On cherche ce que le passé laisse.' },
            { text: 'histoires', why: 'Une histoire se raconte. Des pierres et un pont se transmettent.' },
          ],
          indice: 'Pense à ce que le passé nous transmet.',
          etapes: [
            'Regarde les pierres et le pont : ils viennent du passé.',
            'Cherche le mot pour ce qui nous est transmis.',
          ],
        },
        {
          quote: P.compare,
          q: 'Ces traces sont de sortes différentes. Complète avec un mot en p : la … des héritages.',
          accepted: ['pluralité', 'la pluralité', 'pluralite', 'la pluralite'],
          traps: [
            { text: 'préhistoire', why: 'La préhistoire est une période. On cherche l’idée de « plusieurs ».' },
            { text: 'place', why: 'On cherche un mot qui veut dire « plusieurs sortes ».' },
          ],
          indice: 'Ce mot ressemble à « plusieurs ».',
          etapes: ['Compare les lignes 1 et 2 : les traces sont différentes.', 'Cherche le mot proche de « pluriel ».'],
        },
      ],
    },
  ],
};

const heritages: NotionGuidee = {
  id: 'hcm1-heritages',
  title: 'Celtes, Gaulois, Grecs et Romains : des héritages',
  memo: [
    'Dans les **Gaules**, les populations se mélangent : c’est un **brassage**.',
    'La **colonisation** romaine n’arrête pas net la **civilisation** gauloise.',
    'La **romanité** apporte aussi des villes, des routes et des religions.',
  ],
  sens: {
    type: 'usage',
    text: 'Connaître le passé t’aide à comprendre que le monde d’aujourd’hui en est l’héritier.',
    source: 'cycle3-2020',
    citation: 'comprendre que le monde d’aujourd’hui et la société contemporaine sont les héritiers de longs processus',
  },
  faits: [
    {
      quote: P.brassage,
      q: 'Dans les Gaules, les populations se mélangent. Comment appelle-t-on ce mélange ?',
      a: 'un brassage',
      wrong: [
        { label: 'une rupture', why: 'Une rupture est une coupure nette, pas un mélange.' },
        { label: 'un désert', why: 'Un désert est vide : les Gaules ont des habitants.' },
        { label: 'une frontière', why: 'Une frontière sépare. Ici, les populations se mélangent.' },
      ],
      gap: ['Les Gaules sont marquées par le ', ' des populations (un mélange, en b).', ['brassage']],
      indice: 'Pense à ce que fait une cuillère qui remue tout.',
      etapes: [
        'Imagine des populations qui se rencontrent et se mélangent.',
        'Retiens ce mot : brasser, c’est mélanger.',
      ],
    },
    {
      quote: P.apports,
      q: 'Qu’est-ce que la romanité apporte aux Gaules ?',
      a: 'des routes',
      wrong: [
        { label: 'des avions', why: 'L’avion est une invention bien plus récente.' },
        { label: 'des trains', why: 'Le train arrive bien après les Romains.' },
        { label: 'l’électricité', why: 'L’électricité est utilisée bien plus tard.' },
      ],
      gap: ['La romanité apporte des villes et des ', ' (un mot en r) pour voyager.', ['routes']],
      indice: 'Pense à ce qui existait déjà au temps de Rome.',
      etapes: [
        'Élimine les inventions récentes, avec un moteur ou de l’électricité.',
        'Pense à ce que suivent les voyageurs.',
      ],
    },
    {
      quote: P.contacts,
      q: 'Avec qui les Celtes et les Gaulois ont-ils des contacts ?',
      a: 'des civilisations de la Méditerranée',
      wrong: [
        {
          label: 'des civilisations d’Amérique',
          why: 'L’Amérique est de l’autre côté d’un océan : pas de contact ici.',
        },
        { label: 'des civilisations d’Australie', why: 'L’Australie est très loin : pas de contact ici.' },
        { label: 'aucune autre civilisation', why: 'Les Celtes et les Gaulois rencontrent d’autres civilisations.' },
      ],
      gap: [
        'Les Celtes et les Gaulois ont des contacts avec des peuples proches de la mer ',
        ' (au sud de la France).',
        ['Méditerranée', 'mediterranée', 'mediterranee', 'méditerranee'],
      ],
      indice: 'Pense à la mer au sud de la France.',
      etapes: [
        'Regarde une carte : cherche la mer au sud de la France.',
        'Pense aux Grecs et aux Romains, qui vivent près d’elle.',
      ],
    },
    {
      quote: P.materielles,
      q: 'La colonisation romaine arrête-t-elle net la civilisation gauloise ?',
      a: 'non, il n’y a pas de rupture brusque',
      wrong: [
        { label: 'oui, tout s’arrête en un seul jour', why: 'Il n’y a pas de rupture brusque : tout ne s’arrête pas.' },
        { label: 'oui, et il n’en reste aucune trace', why: 'On garde des traces matérielles de cette civilisation.' },
        {
          label: 'non, car les Romains ne viennent jamais',
          why: 'Les Romains viennent : c’est la colonisation romaine.',
        },
      ],
      gap: [
        'La civilisation gauloise ne connaît pas de rupture ',
        ' (un mot en b) : elle ne s’arrête pas net.',
        ['brusque', 'brutale'],
      ],
      indice: 'Demande-toi si tout change d’un seul coup.',
      etapes: [
        'Imagine un Gaulois : il garde des habitudes sous les Romains.',
        'Compare : changer peu à peu n’est pas s’arrêter net.',
      ],
    },
    {
      quote: P.apports,
      q: 'Quelle religion fait partie des apports de la romanité ?',
      a: 'la religion chrétienne',
      wrong: [
        { label: 'la religion des pharaons', why: 'La religion des pharaons n’est pas un apport de la romanité.' },
        {
          label: 'la religion des Vikings',
          why: 'La religion des Vikings ne vient pas du monde romain.',
        },
        { label: 'la religion des Aztèques', why: 'La religion des Aztèques ne vient pas du monde romain.' },
      ],
      gap: [
        'Parmi les apports de la romanité : la religion chrétienne et le ',
        ', religion des Juifs.',
        ['judaïsme', 'judaisme'],
      ],
      indice: 'Pense aux religions apportées avec la romanité.',
      etapes: [
        'Pense aux religions arrivées dans les Gaules à l’époque romaine.',
        'Retiens les deux exemples : les religions des chrétiens et des Juifs.',
      ],
    },
    {
      quote: P.materielles,
      q: 'Que garde-t-on encore de la civilisation gauloise ?',
      a: 'des traces matérielles',
      wrong: [
        { label: 'des films de l’époque', why: 'Les films n’existaient pas au temps des Gaulois.' },
        { label: 'des photos de familles', why: 'La photographie est une invention bien plus récente.' },
        { label: 'absolument rien', why: 'Il reste des traces que l’on peut toucher.' },
      ],
      gap: [
        'Les traces laissées par les habitants des Gaules viennent de la civilisation ',
        ' (un mot en g).',
        ['gauloise'],
      ],
      indice: 'Pense au nom des habitants des Gaules.',
      etapes: [
        'Élimine les films et les photos : ils sont trop récents.',
        'Pense aux objets que l’on peut toucher, venus des Gaulois.',
      ],
    },
  ],
  paires3: [
    ['Brassage', 'Mélange de populations'],
    ['Romanité', 'Vient de Rome'],
    ['Rupture', 'Arrêt net'],
  ],
  paires5: [
    ['Brassage', 'Mélange'],
    ['Romanité', 'Vient de Rome'],
    ['Colonisation', 'Installation pour contrôler'],
    ['Gaules', 'Pays des Gaulois'],
    ['Rupture', 'Arrêt net'],
  ],
  libres: [
    {
      quote: P.brassage,
      q: 'Écris le mot en b qui veut dire « mélange de populations ».',
      accepted: ['brassage', 'le brassage', 'un brassage'],
      traps: [
        { text: 'bataille', why: 'Une bataille est un combat, pas un mélange.' },
        { text: 'barrière', why: 'Une barrière sépare. On cherche un mélange.' },
      ],
      indice: 'Pense au verbe qui veut dire « mélanger ».',
      etapes: ['Pense au verbe « brasser » : il veut dire mélanger.', 'Transforme ce verbe en nom.'],
    },
    {
      quote: P.apports,
      q: 'Écris le mot en r pour tout ce qui vient du monde romain.',
      accepted: ['romanité', 'la romanité', 'romanite', 'la romanite'],
      traps: [
        { text: 'rupture', why: 'Une rupture est un arrêt net. On cherche ce qui vient de Rome.' },
        { text: 'royauté', why: 'La royauté est le pouvoir d’un roi.' },
      ],
      indice: 'Ce mot ressemble à « romain ».',
      etapes: ['Pense au mot « romain ».', 'Cherche le nom qui commence comme lui.'],
    },
    {
      quote: P.colonisation,
      q: 'Rome s’installe dans les Gaules et les contrôle. Écris le nom de cette action (un mot en « col »).',
      accepted: ['colonisation', 'la colonisation', 'une colonisation'],
      traps: [
        { text: 'croisade', why: 'Les croisades ont lieu bien plus tard, au Moyen Âge.' },
        { text: 'conversation', why: 'Une conversation est un échange de paroles.' },
      ],
      indice: 'Pense au mot « colonie ».',
      etapes: ['Pense à un peuple qui s’installe chez un autre.', 'Cherche le nom qui vient du mot « colonie ».'],
    },
    {
      quote: P.apports,
      q: 'Écris le nom en j de la religion des Juifs.',
      accepted: ['judaïsme', 'le judaïsme', 'judaisme', 'le judaisme'],
      traps: [
        { text: 'christianisme', why: 'Le christianisme est la religion des chrétiens, pas des Juifs.' },
        { text: 'juif', why: 'Un Juif est une personne. On cherche le nom de la religion.' },
      ],
      indice: 'Pense au nom de ceux qui pratiquent cette religion.',
      etapes: ['Pense au mot « Juif ».', 'Cherche le nom de la religion, qui finit par « isme ».'],
    },
  ],
  docs: [
    {
      title: 'Au marché',
      lines: [
        'Dans une ville de Gaule, des marchands arrivent de la mer Méditerranée.',
        'Des Gaulois leur vendent des objets.',
        'Peu à peu, les uns et les autres se mélangent.',
      ],
      qs: [
        {
          quote: P.brassage,
          q: 'Écris le mot en b qui nomme le mélange de la ligne 3.',
          accepted: ['brassage', 'le brassage', 'un brassage'],
          traps: [
            { text: 'bateau', why: 'Un bateau transporte les marchands. On cherche le nom du mélange.' },
            { text: 'bénéfice', why: 'Un bénéfice est un gain. On cherche le nom du mélange.' },
          ],
          indice: 'Pense au verbe qui veut dire « mélanger ».',
          etapes: ['Relis la ligne 3 : des personnes se mélangent.', 'Rappelle-toi le mot qui vient de « brasser ».'],
        },
        {
          quote: P.contacts,
          q: 'Complète avec un mot qui commence par « con » : ces rencontres sont des … entre civilisations.',
          accepted: ['contacts', 'des contacts', 'les contacts', 'contact'],
          traps: [
            { text: 'combats', why: 'Le texte raconte des échanges, pas des combats.' },
            { text: 'conquêtes', why: 'Une conquête se fait par la force. Ici, on vend et on achète.' },
          ],
          indice: 'Pense à des personnes qui se rencontrent et se touchent.',
          etapes: ['Relis les lignes 1 et 2 : des gens se rencontrent.', 'Cherche le mot pour ces liens entre eux.'],
        },
      ],
    },
    {
      title: 'Une route et une ville',
      lines: [
        'Dans les Gaules, les Romains tracent une route et bâtissent une ville.',
        'Longtemps après, on les voit encore.',
        'Elles viennent du monde romain.',
      ],
      qs: [
        {
          quote: P.contacts,
          q: 'Qui habite ces terres quand les Romains arrivent ? Écris le nom en G.',
          accepted: ['Gaulois', 'les Gaulois', 'des Gaulois'],
          traps: [
            { text: 'Grecs', why: 'Les Grecs ont des contacts avec les Gaules : le nom demandé vient du pays.' },
            { text: 'Romains', why: 'Les Romains arrivent : on cherche ceux qui sont déjà là.' },
          ],
          indice: 'Pense au nom du pays de la scène.',
          etapes: ['Relis la ligne 1 : repère le nom du pays.', 'Trouve le nom des habitants de ce pays.'],
        },
        {
          quote: P.apports,
          q: 'Cette route et cette ville nous ont été laissées. Écris le mot en h qui les nomme.',
          accepted: [
            'héritages',
            'des héritages',
            'les héritages',
            'heritages',
            'des heritages',
            'les heritages',
            'héritage',
            'un héritage',
            'l’héritage',
            'heritage',
            'un heritage',
            'l’heritage',
          ],
          traps: [
            { text: 'habitants', why: 'Les habitants sont des personnes, pas des routes.' },
            { text: 'histoires', why: 'Une route n’est pas un récit.' },
          ],
          indice: 'Pense à ce que le passé nous transmet.',
          etapes: [
            'Relis la ligne 2 : la route et la ville sont restées.',
            'Cherche le mot pour ce qui nous est transmis.',
          ],
        },
      ],
    },
    {
      title: 'L’atelier',
      lines: [
        'Les Romains contrôlent maintenant la région.',
        'Un Gaulois fabrique encore ses outils comme ses parents.',
        'Ses habitudes ne changent pas d’un seul coup.',
      ],
      qs: [
        {
          quote: P.materielles,
          q: 'Écris le mot en r qui veut dire « cassure nette » avec le passé.',
          accepted: ['rupture', 'de rupture', 'une rupture', 'la rupture'],
          traps: [
            { text: 'route', why: 'Une route sert à voyager. On cherche un arrêt net.' },
            { text: 'rencontre', why: 'Les rencontres existent. On cherche un mot pour un arrêt net.' },
          ],
          indice: 'Pense à quelque chose qui casse net.',
          etapes: [
            'Relis les lignes 2 et 3 : les habitudes continuent.',
            'Cherche le mot pour un changement qui casse tout.',
          ],
        },
        {
          quote: P.colonisation,
          q: 'Les Romains s’installent dans les Gaules et les contrôlent. Écris le nom de cette action (un mot en « col »).',
          accepted: ['colonisation', 'la colonisation', 'une colonisation'],
          traps: [
            { text: 'croisade', why: 'Les croisades ont lieu bien plus tard.' },
            { text: 'civilisation', why: 'Une civilisation est une façon de vivre, pas cette action.' },
          ],
          indice: 'Pense au mot « colonie ».',
          etapes: [
            'Relis la ligne 1 : les Romains contrôlent la région.',
            'Cherche le nom qui vient du mot « colonie ».',
          ],
        },
      ],
    },
  ],
};

const mouvements: NotionGuidee = {
  id: 'hcm1-mouvements',
  title: 'Grands mouvements de populations (IVe-Xe siècles)',
  memo: [
    'À partir du IVe siècle, des peuples de l’est arrivent peu à peu.',
    'Les **Francs** et les **Wisigoths** s’installent dans l’**empire romain d’Occident**.',
    'Cet empire **s’effondre** vers la fin du Ve siècle.',
  ],
  sens: {
    type: 'savais-tu',
    text: 'Le mot « France » vient du latin Francia : le « pays habité par les Francs ».',
    source: 'cnrtl-etym-francais',
    citation: 'France issu du b. lat. Francia « pays habité par les Francs »',
  },
  faits: [
    {
      quote: P.migrations,
      q: 'À partir de quel siècle des peuples de l’est s’installent-ils dans l’empire romain d’Occident ?',
      a: 'le IVe siècle',
      wrong: [
        { label: 'le XVe siècle', why: 'C’est bien plus tard : l’empire romain d’Occident n’existe plus.' },
        { label: 'le Ier siècle', why: 'C’est trop tôt : ces installations commencent plus tard.' },
        { label: 'le XIIIe siècle', why: 'Au XIIIe siècle, règne Louis IX : c’est bien plus tard.' },
      ],
      gap: [
        'Les peuples de l’est s’installent dans l’empire romain à partir du ',
        ' siècle.',
        ['IVe', 'IV', 'IVème', 'IVè', '4e', '4ème', '4eme', 'quatrième', 'quatrieme'],
      ],
      indice: 'Ce siècle vient juste avant celui de la chute.',
      etapes: [
        'Lis les chiffres romains : I vaut 1 et V vaut 5.',
        'Cherche le siècle placé juste avant la chute de l’empire.',
      ],
    },
    {
      quote: P.migrations,
      q: 'D’où viennent les Francs et les Wisigoths ?',
      a: 'de l’est',
      wrong: [
        { label: 'de l’ouest', why: 'À l’ouest, il y a l’océan : ces peuples viennent du côté opposé.' },
        { label: 'du sud', why: 'Ces peuples ne viennent pas du sud.' },
        { label: 'du nord', why: 'Ces peuples ne viennent pas du nord.' },
      ],
      gap: ['Les Francs et les Wisigoths sont venus de l’', ' (un point cardinal).', ['est']],
      indice: 'Pense à la rose des vents.',
      etapes: ['Imagine une carte : place les quatre points cardinaux.', 'Repère le côté où le soleil se lève.'],
    },
    {
      quote: P.migrations,
      q: 'Quels sont deux peuples venus de l’est dans l’empire romain d’Occident ?',
      a: 'les Francs et les Wisigoths',
      wrong: [
        { label: 'les Grecs et les Égyptiens', why: 'Ce ne sont pas les peuples venus de l’est étudiés ici.' },
        { label: 'les Gaulois et les Romains', why: 'Gaulois et Romains vivent déjà dans l’empire.' },
        { label: 'les Aztèques et les Mayas', why: 'Ces deux peuples ne sont pas ceux de la leçon.' },
      ],
      gap: ['Deux peuples venus de l’est : les Francs et les ', ' (en W).', ['Wisigoths', 'Visigoths']],
      indice: 'L’un d’eux a donné son nom à la France.',
      etapes: [
        'Élimine les peuples qui vivaient déjà dans l’empire.',
        'Pense au peuple de Clovis et à son voisin en W.',
      ],
    },
    {
      quote: P.chute,
      q: 'Vers quand l’empire romain d’Occident s’effondre-t-il ?',
      a: 'vers la fin du Ve siècle',
      wrong: [
        { label: 'vers la fin du IIe siècle', why: 'C’est trop tôt : l’empire est encore là.' },
        {
          label: 'au début du IVe siècle',
          why: 'Au IVe siècle, les installations commencent : l’empire tient encore.',
        },
        { label: 'vers la fin du XIe siècle', why: 'C’est bien trop tard.' },
      ],
      gap: [
        'L’empire romain d’Occident s’effondre vers la fin du ',
        ' siècle.',
        ['Ve', 'V', 'Vème', 'Vè', '5e', '5ème', '5eme', 'cinquième', 'cinquieme'],
      ],
      indice: 'Cela arrive après le début des installations.',
      etapes: [
        'Souviens-toi : les installations commencent au IVe siècle.',
        'Place la chute un siècle plus tard, vers la fin.',
      ],
    },
    {
      quote: P.migrations,
      q: 'Les peuples de l’est arrivent-ils tous en même temps ?',
      a: 'non, sur plusieurs siècles',
      wrong: [
        { label: 'oui, en une seule journée', why: 'Un si grand déplacement ne se fait pas en un jour.' },
        { label: 'oui, en une seule semaine', why: 'Ces arrivées durent bien plus longtemps.' },
        { label: 'non, car ils ne viennent jamais', why: 'Ils viennent bien : ils s’installent dans l’empire.' },
      ],
      gap: ['Les peuples de l’est s’installent sur plusieurs ', ', des périodes de cent ans.', ['siècles', 'siecles']],
      indice: 'Pense à la durée de ces arrivées.',
      etapes: ['Imagine des groupes qui arrivent les uns après les autres.', 'Compte en périodes de cent ans.'],
    },
    {
      quote: P.migrations,
      q: 'Dans quel empire les Francs et les Wisigoths s’installent-ils ?',
      a: 'l’empire romain d’Occident',
      wrong: [
        { label: 'l’empire de Napoléon', why: 'Napoléon vit bien des siècles plus tard.' },
        { label: 'l’empire des Han en Chine', why: 'L’empire des Han n’est pas l’empire de Rome.' },
        { label: 'l’empire colonial français', why: 'Cet empire se forme bien plus tard.' },
      ],
      gap: ['Les Francs et les Wisigoths s’installent dans l’empire romain d’', ', la partie ouest.', ['Occident']],
      indice: 'Pense à la partie ouest de l’empire de Rome.',
      etapes: ['Pense à l’empire qui contrôle les Gaules.', 'Choisis le nom de sa partie ouest.'],
    },
  ],
  paires3: [
    ['IVe siècle', 'Début des arrivées'],
    ['Ve siècle', 'Chute de l’empire'],
    ['Wisigoths', 'Peuple de l’est'],
  ],
  paires5: [
    ['IVe siècle', 'Début des arrivées'],
    ['Ve siècle', 'Chute de l’empire'],
    ['An 800', 'Charlemagne couronné'],
    ['Francs', 'Peuple de Clovis'],
    ['Wisigoths', 'Autre peuple arrivé'],
  ],
  ordre: {
    reperes: [
      'IVe siècle : des peuples de l’est s’installent',
      'Fin du Ve siècle : l’empire d’Occident s’effondre',
      'An 800 : Charlemagne est couronné empereur',
    ],
    reponse: 'IVe siècle, fin du Ve siècle, an 800',
    indice: 'Regarde les siècles et l’année.',
    etapes: [
      'Cherche le siècle le plus petit : il est le plus ancien.',
      'Souviens-toi : l’an 800 vient après le Ve siècle.',
    ],
  },
  libres: [
    {
      quote: P.migrations,
      q: 'Écris le nom en W d’un peuple venu de l’est, comme les Francs.',
      accepted: ['Wisigoths', 'les Wisigoths', 'Visigoths', 'les Visigoths', 'Wisigoth', 'Visigoth'],
      traps: [
        { text: 'Vikings', why: 'Les Vikings viennent du nord. Le nom demandé commence par W.' },
        { text: 'Romains', why: 'Les Romains vivent déjà dans l’empire.' },
      ],
      indice: 'Pense aux deux peuples venus de l’est.',
      etapes: ['Pense aux deux peuples venus de l’est.', 'Garde celui qui n’est pas le peuple franc.'],
    },
    {
      quote: P.clovis,
      q: 'Écris le nom du peuple venu de l’est dont Clovis est le roi.',
      accepted: ['Francs', 'les Francs', 'Franc'],
      traps: [
        { text: 'Gaulois', why: 'Les Gaulois vivent déjà sur place.' },
        { text: 'Wisigoths', why: 'Les Wisigoths sont l’autre peuple venu de l’est.' },
      ],
      indice: 'Le nom de la France vient de ce peuple.',
      etapes: ['Pense au pays où tu apprends cette leçon.', 'Cherche le peuple qui lui a donné son nom.'],
    },
    {
      quote: P.chute,
      q: 'Écris en chiffres romains le siècle où s’effondre l’empire romain d’Occident.',
      accepted: [
        'Ve',
        'V',
        'Vème',
        'Ve siècle',
        'V siècle',
        'Vème siècle',
        'le Ve siècle',
        'le V siècle',
        'le Vème siècle',
      ],
      traps: [
        { text: 'IVe', why: 'Au IVe siècle, les installations commencent seulement.' },
        { text: 'VIe', why: 'C’est trop tard : l’empire est déjà tombé.' },
      ],
      indice: 'La chute arrive un siècle après le début des installations.',
      etapes: [
        'Rappelle-toi le siècle du début des installations.',
        'Ajoute un siècle, puis écris-le en chiffres romains.',
      ],
    },
    {
      quote: P.migrations,
      q: 'Écris le point cardinal d’où viennent les Francs et les Wisigoths.',
      accepted: ['est', 'l’est', 'à l’est', 'de l’est'],
      traps: [
        { text: 'ouest', why: 'L’ouest est le côté opposé.' },
        { text: 'nord', why: 'Ces peuples ne viennent pas du nord.' },
      ],
      indice: 'Pense au côté où le soleil se lève.',
      etapes: ['Imagine la rose des vents.', 'Repère le côté où le soleil se lève.'],
    },
  ],
  docs: [
    {
      title: 'Des familles en route',
      lines: [
        'Des familles marchent vers l’empire romain d’Occident.',
        'Elles viennent du côté opposé à l’ouest.',
        'D’autres groupes les suivront très longtemps.',
      ],
      qs: [
        {
          quote: P.migrations,
          q: 'Écris le point cardinal d’où viennent ces familles.',
          accepted: ['est', 'l’est', 'à l’est', 'de l’est'],
          traps: [
            { text: 'ouest', why: 'La ligne 2 dit « le côté opposé à l’ouest ».' },
            { text: 'sud', why: 'Le sud n’est pas l’opposé de l’ouest.' },
          ],
          indice: 'Trouve l’opposé de l’ouest.',
          etapes: ['Relis la ligne 2 avec attention.', 'Place l’ouest sur une carte, puis regarde en face.'],
        },
        {
          quote: P.migrations,
          q: 'À partir de quel siècle ces arrivées ont-elles lieu ? Écris-le en chiffres romains.',
          accepted: [
            'IVe',
            'IV',
            'IVème',
            'IVe siècle',
            'IV siècle',
            'IVème siècle',
            'le IVe siècle',
            'le IV siècle',
            'le IVème siècle',
          ],
          traps: [
            { text: 'Ve', why: 'Le Ve siècle est celui de la chute. Les arrivées commencent avant.' },
            { text: 'VIe', why: 'C’est trop tard : elles commencent bien avant.' },
          ],
          indice: 'Ce siècle vient avant celui de la chute.',
          etapes: ['Rappelle-toi le siècle de la chute de l’empire.', 'Recule d’un siècle pour trouver le début.'],
        },
      ],
    },
    {
      title: 'La fin d’un empire',
      lines: [
        'Dans l’ouest, de nouveaux peuples sont installés.',
        'L’empire romain d’Occident finit par s’effondrer.',
        'Un de ces peuples a pour roi Clovis.',
      ],
      qs: [
        {
          quote: P.chute,
          q: 'Vers la fin de quel siècle a lieu cette chute ? Écris-le en chiffres romains.',
          accepted: [
            'Ve',
            'V',
            'Vème',
            'Ve siècle',
            'V siècle',
            'Vème siècle',
            'le Ve siècle',
            'le V siècle',
            'le Vème siècle',
          ],
          traps: [
            { text: 'IVe', why: 'Au IVe siècle, les peuples commencent à s’installer.' },
            { text: 'XVe', why: 'C’est bien trop tard.' },
          ],
          indice: 'Les installations ont commencé un siècle plus tôt.',
          etapes: ['Relis la ligne 2 : l’empire s’effondre.', 'Rappelle-toi le siècle qui suit le IVe.'],
        },
        {
          quote: P.clovis,
          q: 'Écris le nom du peuple de la ligne 3.',
          accepted: ['Francs', 'les Francs', 'Franc'],
          traps: [
            { text: 'Wisigoths', why: 'Les Wisigoths ne sont pas le peuple de Clovis.' },
            { text: 'Lombards', why: 'Les Lombards sont liés à Charlemagne.' },
          ],
          indice: 'Clovis règne sur un peuple qui a donné un nom à la France.',
          etapes: ['Relis la ligne 3 : cherche le roi.', 'Rappelle-toi le peuple dont Clovis est roi.'],
        },
      ],
    },
    {
      title: 'Au musée',
      lines: [
        'Un panneau parle de deux peuples venus de l’est.',
        'Le premier a donné son nom à la France.',
        'Ils s’installent dans la partie ouest de l’empire romain.',
      ],
      qs: [
        {
          quote: P.migrations,
          q: 'Écris le nom en W du second peuple.',
          accepted: ['Wisigoths', 'les Wisigoths', 'Visigoths', 'les Visigoths', 'Wisigoth', 'Visigoth'],
          traps: [
            { text: 'Vikings', why: 'Les Vikings viennent du nord, pas de l’est.' },
            { text: 'Francs', why: 'Les Francs sont le premier peuple du panneau.' },
          ],
          indice: 'Pense aux deux peuples venus de l’est.',
          etapes: [
            'Relis la ligne 1 : deux peuples viennent de l’est.',
            'Rappelle-toi celui qui accompagne les Francs.',
          ],
        },
        {
          quote: P.migrations,
          q: 'Complète avec un mot en O : l’empire romain d’…',
          accepted: ['Occident'],
          traps: [
            { text: 'Orient', why: 'L’Orient est la partie est. La ligne 3 parle de l’ouest.' },
            { text: 'Océan', why: 'Un océan est une étendue d’eau, pas une partie de l’empire.' },
          ],
          indice: 'Ce mot désigne l’ouest.',
          etapes: ['Relis la ligne 3 : cherche la partie ouest.', 'Rappelle-toi le nom de cette partie de l’empire.'],
        },
      ],
    },
  ],
};

const rois: NotionGuidee = {
  id: 'hcm1-clovis-charlemagne',
  title: 'Clovis et Charlemagne, Mérovingiens et Carolingiens',
  memo: [
    '**Clovis**, roi des **Francs**, reçoit le **baptême** : c’est un **geste politique**.',
    'Ce geste montre la **continuité** entre le monde romain et les **Mérovingiens**.',
    'En 800, **Charlemagne**, un **Carolingien**, est couronné **empereur**.',
  ],
  sens: {
    type: 'histoire',
    text: 'Le mot « carolingien » vient de Carolus, le nom de l’empereur Charlemagne.',
    source: 'cnrtl-etym-carolingien',
    citation: "dér. de Carolus, nom de l'empereur Charlemagne",
  },
  faits: [
    {
      quote: P.clovis,
      q: 'Clovis est le roi de quel peuple ?',
      a: 'les Francs',
      wrong: [
        { label: 'les Grecs', why: 'Clovis n’est pas le roi des Grecs.' },
        { label: 'les Lombards', why: 'Les Lombards sont liés à Charlemagne.' },
        { label: 'les Wisigoths', why: 'Les Wisigoths sont un autre peuple venu de l’est.' },
      ],
      gap: ['Clovis est le roi des ', ' (en F).', ['Francs']],
      indice: 'Ce peuple a donné son nom à la France.',
      etapes: ['Pense aux peuples venus de l’est.', 'Choisis celui qui a donné son nom à la France.'],
    },
    {
      quote: P.bapteme,
      q: 'Que montre le baptême de Clovis ?',
      a: 'un lien qui continue avec le monde romain',
      wrong: [
        { label: 'une coupure totale avec Rome', why: 'Au contraire, ce baptême montre une continuité.' },
        { label: 'la fin des rois', why: 'Clovis reste roi après son baptême.' },
        { label: 'le début de la préhistoire', why: 'La préhistoire est bien plus ancienne que Clovis.' },
      ],
      gap: ['Le baptême de Clovis est un geste ', ' (un mot en po) : il compte pour gouverner.', ['politique']],
      indice: 'Demande-toi si Clovis coupe ou garde le lien avec Rome.',
      etapes: [
        'Pense au baptême : par lui, Clovis devient chrétien.',
        'Observe ce geste : il rapproche Clovis du monde romain.',
      ],
    },
    {
      quote: P.charlemagne,
      q: 'En quelle année Charlemagne est-il couronné empereur ?',
      a: 'en 800',
      wrong: [
        { label: 'en 1789', why: 'En 1789, la Révolution commence.' },
        { label: 'en 1515', why: 'Cette date est bien trop tardive pour Charlemagne.' },
        { label: 'en 476', why: 'En 476, Charlemagne n’est pas encore né.' },
      ],
      gap: ['Charlemagne est couronné empereur en l’an ', ' (en chiffres).', ['800']],
      indice: 'C’est une année ronde à trois chiffres.',
      etapes: [
        'Élimine les dates à quatre chiffres : elles sont trop récentes.',
        'Cherche une année ronde, après la chute de l’empire.',
      ],
    },
    {
      quote: P.charlemagne,
      q: 'Quel empire Charlemagne reconstitue-t-il ?',
      a: 'un empire romain et chrétien',
      wrong: [
        { label: 'un empire sans religion', why: 'Cet empire est lié à la religion chrétienne.' },
        { label: 'un empire grec et égyptien', why: 'Charlemagne reprend le modèle de Rome.' },
        { label: 'un empire d’Amérique', why: 'L’empire de Charlemagne est lié au monde romain.' },
      ],
      gap: ['Charlemagne reconstitue un empire romain et ', ', un mot formé sur « Christ ».', ['chrétien', 'chretien']],
      indice: 'Pense à Rome et à une religion.',
      etapes: ['Pense au modèle de Charlemagne : l’ancien empire de Rome.', 'Ajoute sa religion : il croit au Christ.'],
    },
    {
      quote: P.charlemagne,
      q: 'Charlemagne est roi des Francs, mais aussi de quel peuple ?',
      a: 'les Lombards',
      wrong: [
        { label: 'les Wisigoths', why: 'Les Wisigoths sont un autre peuple venu de l’est.' },
        { label: 'les Grecs', why: 'Charlemagne n’est pas le roi des Grecs.' },
        { label: 'les Égyptiens', why: 'Les Égyptiens ne sont pas son second peuple.' },
      ],
      gap: ['Charlemagne est roi des Francs et des ', ' (en L).', ['Lombards']],
      indice: 'Pense aux deux titres de roi de Charlemagne.',
      etapes: ['Rappelle-toi : Charlemagne règne sur deux peuples.', 'Garde les Francs, puis cherche le second, en L.'],
    },
    {
      source: 'cnrtl-etym-carolingien',
      quote: "dér. de Carolus, nom de l'empereur Charlemagne",
      q: 'Comment s’appelle la famille de rois de Charlemagne ?',
      a: 'les Carolingiens',
      wrong: [
        { label: 'les Mérovingiens', why: 'Les Mérovingiens sont liés à Clovis.' },
        { label: 'les Lombards', why: 'Les Lombards sont un peuple, pas cette famille.' },
        { label: 'les Wisigoths', why: 'Les Wisigoths sont un peuple venu de l’est.' },
      ],
      gap: ['La famille de rois de Charlemagne s’appelle les ', ' (en C).', ['Carolingiens']],
      indice: 'Pense à Carolus, son nom en latin.',
      etapes: ['Pense à Carolus : c’est Charlemagne en latin.', 'Cherche le nom de famille qui commence pareil.'],
    },
  ],
  paires3: [
    ['Clovis', 'Roi baptisé'],
    ['Charlemagne', 'Empereur en 800'],
    ['Lombards', 'Peuple de Charlemagne'],
  ],
  paires5: [
    ['Clovis', 'Roi baptisé'],
    ['Charlemagne', 'Empereur en 800'],
    ['Mérovingiens', 'Époque de Clovis'],
    ['Carolingiens', 'Famille de Charlemagne'],
    ['Lombards', 'Peuple d’un empereur'],
  ],
  libres: [
    {
      quote: P.charlemagne,
      q: 'Écris en chiffres l’année où Charlemagne est couronné empereur.',
      accepted: ['800', 'en 800', 'l’an 800', 'an 800'],
      traps: [
        { text: '1000', why: 'Charlemagne est couronné avant l’an 1000.' },
        { text: '476', why: 'En 476, Charlemagne n’est pas encore né.' },
      ],
      indice: 'C’est une année ronde à trois chiffres.',
      etapes: ['Pense à une année ronde, à trois chiffres.', 'Place-la après la chute de l’empire d’Occident.'],
    },
    {
      quote: P.charlemagne,
      q: 'Charlemagne est roi des Francs. Écris le nom en L de son autre peuple.',
      accepted: ['Lombards', 'les Lombards', 'des Lombards', 'Lombard'],
      traps: [
        { text: 'Latins', why: 'Ce n’est pas le peuple des Latins.' },
        { text: 'Francs', why: 'Les Francs sont déjà donnés dans la question.' },
      ],
      indice: 'Pense aux deux titres de roi de ce souverain.',
      etapes: ['Rappelle-toi le titre de Charlemagne.', 'Cherche le second peuple, après les Francs.'],
    },
    {
      source: 'cnrtl-etym-carolingien',
      quote: "dér. de Carolus, nom de l'empereur Charlemagne",
      q: 'Écris le nom en C de la famille de rois de Charlemagne.',
      accepted: ['Carolingiens', 'les Carolingiens', 'Carolingien'],
      traps: [
        { text: 'Capétiens', why: 'Les Capétiens règnent plus tard.' },
        { text: 'Celtes', why: 'Les Celtes vivent bien avant Charlemagne.' },
      ],
      indice: 'Pense à Carolus, son nom en latin.',
      etapes: ['Pense à Carolus, le nom latin de Charlemagne.', 'Ajoute la fin d’un nom de famille de rois.'],
    },
    {
      quote: P.bapteme,
      q: 'Complète avec un mot en m, lié à la famille de Clovis : le monde …',
      accepted: ['mérovingien', 'merovingien'],
      traps: [
        { text: 'médiéval', why: 'Médiéval veut dire « du Moyen Âge ». On cherche le nom lié à Clovis.' },
        { text: 'méditerranéen', why: 'Méditerranéen parle d’une mer, pas de Clovis.' },
      ],
      indice: 'Pense au monde qui suit le monde romain.',
      etapes: ['Rappelle-toi le nom de la famille de Clovis.', 'Construis l’adjectif à partir de ce nom.'],
    },
    {
      quote: P.clovis,
      q: 'Écris le nom du roi des Francs dont le baptême est un geste politique.',
      accepted: ['Clovis', 'le roi Clovis'],
      traps: [
        { text: 'Charlemagne', why: 'Charlemagne est connu pour son couronnement en 800.' },
        { text: 'César', why: 'César est un Romain, pas un roi des Francs.' },
      ],
      indice: 'Pense au roi dont tu as appris le baptême.',
      etapes: ['Pense au roi lié au monde mérovingien.', 'Souviens-toi : ce roi est franc, pas empereur.'],
    },
  ],
  docs: [
    {
      title: 'Un baptême',
      lines: [
        'Un roi des Francs décide de recevoir le baptême.',
        'Les habitants de l’ancien monde romain y voient un signe.',
        'Ce roi veut garder un lien avec Rome.',
      ],
      qs: [
        {
          quote: P.bapteme,
          q: 'Écris le nom de ce roi.',
          accepted: ['Clovis', 'le roi Clovis'],
          traps: [
            { text: 'Charlemagne', why: 'Charlemagne est couronné empereur. Ici, il s’agit d’un baptême célèbre.' },
            { text: 'César', why: 'César est un Romain, pas un roi des Francs.' },
          ],
          indice: 'Pense au baptême le plus célèbre de la leçon.',
          etapes: ['Relis la ligne 1 : un roi franc est baptisé.', 'Rappelle-toi le roi dont on étudie le baptême.'],
        },
        {
          quote: P.bapteme,
          q: 'Écris le nom en M de la famille de ce roi.',
          accepted: [
            'Mérovingiens',
            'les Mérovingiens',
            'Merovingiens',
            'les Merovingiens',
            'Mérovingien',
            'merovingien',
          ],
          traps: [
            { text: 'Carolingiens', why: 'Les Carolingiens sont la famille de Charlemagne.' },
            { text: 'Romains', why: 'Le roi est franc, pas romain.' },
          ],
          indice: 'Pense au monde qui suit le monde romain.',
          etapes: ['Trouve d’abord le roi de la ligne 1.', 'Rappelle-toi le nom de sa famille, en M.'],
        },
      ],
    },
    {
      title: 'Une couronne',
      lines: [
        'Un roi des Francs reçoit une couronne d’empereur.',
        'Il est aussi roi des Lombards.',
        'Il reconstitue un empire romain et chrétien.',
      ],
      qs: [
        {
          quote: P.charlemagne,
          q: 'Écris le nom de ce roi.',
          accepted: ['Charlemagne', 'le roi Charlemagne', 'l’empereur Charlemagne'],
          traps: [
            { text: 'Clovis', why: 'Clovis n’est pas couronné empereur.' },
            { text: 'Louis XIV', why: 'Louis XIV vit bien des siècles plus tard.' },
          ],
          indice: 'Cherche le roi devenu empereur.',
          etapes: ['Relis les trois lignes du texte.', 'Rappelle-toi le roi couronné empereur.'],
        },
        {
          quote: P.charlemagne,
          q: 'En quelle année reçoit-il cette couronne ? Écris-la en chiffres.',
          accepted: ['800', 'en 800', 'l’an 800', 'an 800'],
          traps: [
            { text: '476', why: 'En 476, ce roi n’est pas encore né.' },
            { text: '1789', why: 'En 1789, la Révolution commence.' },
          ],
          indice: 'C’est une année ronde à trois chiffres.',
          etapes: ['Trouve d’abord le nom du roi.', 'Rappelle-toi l’année de son couronnement.'],
        },
      ],
    },
    {
      title: 'Un nom latin',
      lines: [
        'Inès lit un nom dans un livre : « Carolus ».',
        'C’est le nom latin d’un grand empereur.',
        'Sa famille de rois porte un nom proche.',
      ],
      qs: [
        {
          source: 'cnrtl-etym-carolingien',
          quote: "dér. de Carolus, nom de l'empereur Charlemagne",
          q: 'Écris le nom français de cet empereur, couronné en 800.',
          accepted: ['Charlemagne', 'l’empereur Charlemagne'],
          traps: [
            { text: 'Clovis', why: 'Clovis n’est pas empereur.' },
            { text: 'Napoléon', why: 'Napoléon vit bien des siècles plus tard.' },
          ],
          indice: 'Pense à un empereur très célèbre.',
          etapes: ['Relis la ligne 2 : cherche un empereur.', 'Pense à l’empereur couronné en 800.'],
        },
        {
          source: 'cnrtl-etym-carolingien',
          quote: "dér. de Carolus, nom de l'empereur Charlemagne",
          q: 'Écris le nom en C de cette famille de rois.',
          accepted: ['Carolingiens', 'les Carolingiens', 'Carolingien'],
          traps: [
            { text: 'Celtes', why: 'Les Celtes vivent bien avant cet empereur.' },
            { text: 'Mérovingiens', why: 'Les Mérovingiens sont liés à Clovis, et leur nom commence par M.' },
          ],
          indice: 'Regarde le début du mot « Carolus ».',
          etapes: ['Relis la ligne 3 : le nom est proche.', 'Cherche un nom de famille qui ressemble à « Carolus ».'],
        },
      ],
    },
  ],
};

export const NOTIONS: readonly NotionGuidee[] = [traces, heritages, mouvements, rois];
export const SKILLS: readonly Skill[] = NOTIONS.map((n) => notionGuidee(n, SOURCE));
