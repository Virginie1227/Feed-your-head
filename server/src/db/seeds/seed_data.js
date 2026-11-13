export const SITE_CONFIG = {
  intro: {
    // Animation d'accueil "graine qui germe". Affichée une fois par session.
    // Pour la désactiver totalement : mettre `enabled: false`.
    enabled: true,
    durationMs: 3500,
    skipLabel: 'Entrer',
  },
  brand: {
    name: 'Feed Your Head',
    baseline: 'Conseil RH humaniste',
    consultantName: '[Prénom Nom]',
    consultantRole: 'Consultante RH',
  },
  contact: {
    email: 'contact@feedyourhead.fr',
    linkedin: 'https://www.linkedin.com/in/virginie-coulange/',
    calendlyUrl: 'https://calendly.com/feedyourhead/echange',
    formspreeEndpoint: 'https://formspree.io/f/YOUR_ID_HERE',
  },
  nav: [
    { label: 'Approche', href: '#approche' },
    { label: 'Feed Your Crew', href: '#feedyourcrew' },
    { label: 'Offres', href: '#offres' },
    { label: 'Méthode', href: '#methode' },
    { label: 'À propos', href: '#apropos' },
    { label: 'Témoignages', href: '#temoignages' },
    { label: 'Ressources', href: '/ressources' },
  ],
  hero: {
    title: {
      before: 'Penser',
      italic: 'autrement',
      after: 'vos enjeux RH.',
    },
    subtitle:
      'Audit, accompagnement et conduite du changement pour DRH et dirigeants qui veulent dépasser le prêt-à-penser managérial.',
    ctaPrimary: { label: 'Réserver un échange', href: '#contact' },
    ctaSecondary: { label: 'Découvrir Feed Your Crew', href: '#feedyourcrew' },
  },
  approche: {
    heading: { line1: 'Une lecture', line2Italic: 'sensible', line3: 'des organisations.' },
    paragraphs: [
      "La fonction RH ne se résume pas à des processus. Elle articule des trajectoires individuelles, des dynamiques collectives et des décisions stratégiques — souvent dans l'inconfort.",
      "Mon métier : éclairer ces zones de tension, proposer des arbitrages tenables et accompagner leur mise en œuvre — avec exigence, sans posture.",
    ],
  },
  stats: [
    { number: '15+', label: "années d'expérience RH" },
    { number: '30+', label: 'organisations accompagnées' },
    { number: '100%', label: 'missions sur-mesure' },
  ],
  feedyourcrew: {
    kicker: 'Notre outil',
    heading: { before: 'Anticiper avec', italic: 'Feed Your Crew' },
    tagline: "Outil d'aide à la décision RH · user-friendly",
    paragraphs: [
      "Feed Your Crew éclaire les décisions RH sensibles avant qu'elles ne deviennent des urgences : anticipation des départs, cartographie des savoirs critiques, gestion des compétences.",
      "Une porte d'entrée simple : on commence par un diagnostic — technique & organisation, et ressources humaines — puis on déploie les solutions adaptées.",
    ],
    features: [
      { title: 'Risque de départ', description: 'Identifier les fragilités avant la crise.' },
      { title: 'Criticité du savoir', description: 'Cartographier les savoirs vitaux à préserver.' },
      { title: 'Gestion des compétences', description: 'Piloter les évolutions et les transmissions.' },
    ],
    cta: { label: 'Découvrir feedyourcrew.com', href: 'https://feedyourcrew.com' },
    logoUrl: '',
  },
  offres: {
    kicker: 'Offres',
    heading: { before: 'Cinq domaines pour', italic: 'transformer', after: ' les RH.' },
    subtitle: '',
    items: [
      {
        num: '01',
        title: 'Stratégie compétences & culture apprenante',
        description:
          "Faire de l'acquisition et de la cartographie dynamique des connaissances un levier de performance financière et humaine immédiat.",
      },
      {
        num: '02',
        title: 'Conduite du changement & engagement',
        description:
          "La réussite d'un projet dépend à 80 % de l'adoption humaine. Nous appliquons les sciences du comportement pour ancrer le changement et apporter une réelle approbation.",
      },
      {
        num: '03',
        title: 'Transformation digitale & gouvernance SIRH',
        description:
          "Une technologie sans vision n'est qu'un outil de plus. Nous mettons en œuvre des systèmes utiles et fiables pour atteindre vos objectifs stratégiques.",
      },
      {
        num: '04',
        title: 'Recrutement & expérience collaborateur',
        description:
          "Optimiser la stratégie de recrutement de manière globale : programmes jeunes talents / séniors / profils pénuriques, parcours d'intégration, pour fidéliser vos talents dans une logique long terme.",
      },
      {
        num: '05',
        title: 'Culture, diversité & performance sociale',
        description:
          "La performance économique ne s'oppose plus à la performance sociale. Nous traduisons les valeurs d'entreprise en comportements opérationnels.",
      },
    ],
    cta: { label: 'Échanger sur ces domaines', href: '#contact' },
  },
  methodeIntro: {
    heading: { before: 'Comment', italic: 'ça se passe.' },
    subtitle: 'Un cadre clair, du premier échange à la fin de mission.',
  },
  methode: [
    {
      num: '01',
      title: 'Rencontre',
      description:
        "Premier échange sans engagement pour comprendre votre contexte et vos enjeux.",
    },
    {
      num: '02',
      title: 'Cadrage',
      description:
        "Proposition d'intervention sur-mesure : périmètre, livrables, modalités, calendrier.",
    },
    {
      num: '03',
      title: 'Intervention',
      description:
        "Mise en œuvre en proximité avec les équipes, avec des points d'étape réguliers.",
    },
    {
      num: '04',
      title: 'Ancrage',
      description:
        'Transfert de compétences et supervision post-mission pour pérenniser les acquis.',
    },
  ],
  referencesIntro: {
    kicker: 'Références',
    heading:
      'Quelques organisations qui m’ont fait confiance, en France et à l’international.',
  },
  // Pour remplacer un nom par un vrai logo : ajoutez `logoUrl: '/logos/nom.svg'`
  // (déposer le fichier dans `public/logos/`). Format recommandé : SVG monochrome,
  // hauteur ~40px. À défaut de logoUrl, le nom est rendu en wordmark Fraunces.
  references: [
    { name: 'Référence 01' },
    { name: 'Référence 02' },
    { name: 'Référence 03' },
    { name: 'Référence 04' },
    { name: 'Référence 05' },
    { name: 'Référence 06' },
    { name: 'Référence 07' },
    { name: 'Référence 08' },
  ],
  temoignagesIntro: {
    heading: { before: 'Quelques', italic: 'retours.' },
    subtitle: 'Ce qu’en disent celles et ceux qui ont franchi le pas.',
  },
  temoignages: [
    {
      verbatim: 'À compléter — un verbatim client courrra ici dès que la mission sera publiable.',
      initials: 'AB',
      name: 'À compléter',
      role: 'DRH',
      company: 'Entreprise à venir',
    },
    {
      verbatim: 'À compléter — placeholder pour un deuxième témoignage client.',
      initials: 'CD',
      name: 'À compléter',
      role: 'Directrice générale',
      company: 'Entreprise à venir',
    },
    {
      verbatim: 'À compléter — placeholder pour un troisième témoignage client.',
      initials: 'EF',
      name: 'À compléter',
      role: 'Responsable RH',
      company: 'Entreprise à venir',
    },
  ],
  ressourcesIntro: {
    kicker: 'Ressources',
    heading: 'À lire, voir & écouter.',
    subtitle:
      "Articles, retours d'expérience et contenus vidéo sur les sujets qui traversent mon métier.",
  },
  ressources: [
    {
      title: "Exemple — un article de fond sur la fonction RH",
      type: 'article',
      url: 'https://example.com',
      thumbnailUrl: '',
      description:
        "À compléter — décrivez en une ou deux phrases ce que le lecteur trouvera dans cette ressource.",
      source: 'Source à compléter',
    },
    {
      title: "Exemple — un retour d'expérience de mission",
      type: 'retex',
      url: 'https://example.com',
      thumbnailUrl: '',
      description:
        "À compléter — un retour d'expérience concret, anonymisé si besoin.",
      source: 'Feed Your Head',
    },
  ],
  apropos: {
    heading: { name: '[Prénom Nom]', italic: 'Consultante RH' },
    paragraphs: [
      "À compléter — un premier paragraphe biographique présentant votre parcours, vos terrains et la philosophie de votre pratique.",
      "À compléter — un second paragraphe sur vos convictions, vos formations ou vos centres d'intérêt qui nourrissent votre approche.",
    ],
  },
  contact: {
    heading: { before: 'Parlons de votre', italic: 'contexte.' },
    subtitle:
      "Un premier échange de 30 minutes, sans engagement, pour explorer ensemble si une collaboration a du sens.",
    calendlyLabel: 'Réserver directement',
    formLabels: {
      name: 'Nom',
      email: 'Email',
      company: 'Entreprise',
      message: 'Votre message',
      submit: 'Envoyer le message',
      sending: 'Envoi…',
      sent: 'Message envoyé. Je reviens vers vous sous 48h ouvrées.',
      error:
        "Une erreur est survenue. Réessayez ou écrivez directement à l'adresse ci-contre.",
    },
  },
  footer: {
    rights: 'Tous droits réservés.',
  },
  legal: {
    editorName: 'Virginie Coulange',
    editorStatus: 'consultante RH indépendante',
    siret: '990 850 125 00016',
    address: '',
    hostName: 'Railway Corporation',
    hostAddress: '548 Market St Suite 68956, San Francisco, CA 94104, États-Unis',
  },
};
