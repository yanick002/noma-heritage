/* ==========================================================================
   NOMA HERITAGE — Catalogue de la boutique
   --------------------------------------------------------------------------
   C'est le SEUL fichier à modifier pour gérer vos produits et vos looks.
   Respectez simplement la forme des exemples ci-dessous.

   Pour chaque produit :
   - id          identifiant unique, sans espace ni accent (ex. "boubou-indigo").
                 Utilisez-le aussi comme nom de dossier dans assets/products/.
   - name        nom affiché.
   - category    "vetements" | "accessoires" | "chaussures" | "sacs".
                 Les vêtements sont suspendus au portant ; le reste est posé
                 sur l'étagère murale.
   - price       prix en FCFA, sans espace (ex. 35000).
   - colors      une entrée par couleur, avec :
                   name  : nom de la couleur affiché,
                   hex   : couleur de la pastille,
                   front : image de face (PNG ou WebP détouré, fond transparent),
                   back  : image de dos (facultatif),
                   worn  : photo portée (facultatif, ajoute un bouton « Porté »).
   - sizes       tailles proposées. Une seule taille → ["Unique"].
   - description texte court.
   - details     (facultatif) liste de caractéristiques.
   - isNew       true pour afficher la mention « Nouveau ».
   - hanger      (facultatif, vêtements) "pince" pour les jupes et pantalons
                 (cintre à pinces), sinon cintre classique.

   Les vêtements utilisent vos vraies photos détourées (.webp). Les sacs,
   chaussures et accessoires ont encore des visuels provisoires (.svg) :
   remplacez-les par vos photos détourées, par exemple
   assets/products/cabas-masques/front-ecru.png
   ========================================================================== */

const PRODUCTS = [
  /* ---------------------------- VÊTEMENTS ---------------------------- */
  {
    id: "gilet-cache-coeur",
    name: "Gilet Cache-Cœur",
    category: "vetements",
    price: 38000,
    colors: [
      { name: "Écru", hex: "#E2D8D4", front: "assets/products/gilet-cache-coeur/front-ecru.webp" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Gilet sans manches en lin lavé, col croisé et patte boutonnée sur le côté. Les trois masques Noma sont imprimés sur le devant.",
    details: ["Lin lavé", "Impression trois masques", "Bouton et patte latérale", "Coupe droite, longueur hanche"],
    isNew: true
  },
  {
    id: "top-dos-nu",
    name: "Top Dos-Nu Masques",
    category: "vetements",
    price: 22000,
    colors: [
      { name: "Blanc", hex: "#F7F6F2", front: "assets/products/top-dos-nu/front-blanc.webp" },
      { name: "Chocolat", hex: "#6E4630", front: "assets/products/top-dos-nu/front-chocolat.webp" }
    ],
    sizes: ["XS", "S", "M", "L"],
    description: "Top dos-nu à col montant et grand décolleté en V. Il s'assortit au pantalon évasé ou à la jupe portefeuille.",
    details: ["Lin et viscose", "Attache nuque", "Dos ouvert, fermeture zippée", "Impression trois masques"],
    isNew: true
  },
  {
    id: "pantalon-evase",
    name: "Pantalon Évasé",
    category: "vetements",
    price: 26000,
    colors: [
      { name: "Blanc", hex: "#F7F6F2", front: "assets/products/pantalon-evase/front-blanc.webp" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Pantalon taille haute, jambe évasée et pli marqué. Il allonge la silhouette.",
    details: ["Lin lavé", "Taille haute", "Poches italiennes", "Longueur au sol"],
    hanger: "pince"
  },
  {
    id: "jupe-portefeuille",
    name: "Jupe Portefeuille",
    category: "vetements",
    price: 19000,
    colors: [
      { name: "Chocolat", hex: "#6E4630", front: "assets/products/jupe-portefeuille/front-chocolat.webp" }
    ],
    sizes: ["XS", "S", "M", "L"],
    description: "Jupe courte portefeuille, gros bouton en corne et ceinture droite.",
    details: ["Lin lavé", "Bouton en corne", "Longueur mi-cuisse"],
    hanger: "pince"
  },
  {
    id: "blouse-nouee",
    name: "Blouse Nouée Masques",
    category: "vetements",
    price: 30000,
    colors: [
      { name: "Sable", hex: "#E9CF9A", front: "assets/products/blouse-nouee/front-sable.webp" },
      { name: "Indigo", hex: "#2E5E98", front: "assets/products/blouse-nouee/front-indigo.webp" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Blouse croisée à col V qui se noue sur le devant, manches longues et poignets boutonnés.",
    details: ["Lin lavé", "Lien à nouer", "Manches longues", "Impression trois masques"],
    isNew: true
  },

  /* ------------------------------ SACS ------------------------------- */
  {
    id: "cabas-masques",
    name: "Cabas Trois Masques",
    category: "sacs",
    price: 15000,
    colors: [
      { name: "Écru", hex: "#E4DDD1", front: "assets/products/cabas-masques/front-ecru.svg", back: "assets/products/cabas-masques/back-ecru.svg" },
      { name: "Noir", hex: "#242424", front: "assets/products/cabas-masques/front-noir.svg", back: "assets/products/cabas-masques/back-noir.svg" }
    ],
    sizes: ["Unique"],
    description: "Grand cabas en toile épaisse, avec nos trois masques imprimés côte à côte.",
    details: ["Toile de coton épaisse", "Anses renforcées", "40 × 38 cm"]
  },
  {
    id: "pochette-cauri",
    name: "Pochette Cauri",
    category: "sacs",
    price: 17000,
    colors: [
      { name: "Cognac", hex: "#9A5B32", front: "assets/products/pochette-cauri/front-cognac.svg", back: "assets/products/pochette-cauri/back-cognac.svg" },
      { name: "Noir", hex: "#242424", front: "assets/products/pochette-cauri/front-noir.svg", back: "assets/products/pochette-cauri/back-noir.svg" }
    ],
    sizes: ["Unique"],
    description: "Pochette enveloppe en cuir, rabat brodé de perles et fermoir cauri.",
    details: ["Cuir pleine fleur", "Perles brodées main", "Fermoir cauri"],
    isNew: true
  },

  /* --------------------------- CHAUSSURES ---------------------------- */
  {
    id: "mules-tressees",
    name: "Mules Tressées",
    category: "chaussures",
    price: 27000,
    colors: [
      { name: "Cognac", hex: "#9A5B32", front: "assets/products/mules-tressees/front-cognac.svg", back: "assets/products/mules-tressees/back-cognac.svg" },
      { name: "Noir", hex: "#2A2A2A", front: "assets/products/mules-tressees/front-noir.svg", back: "assets/products/mules-tressees/back-noir.svg" }
    ],
    sizes: ["36", "37", "38", "39", "40", "41", "42"],
    description: "Mules plates en cuir tressé à la main, semelle cuir et talon de 1 cm.",
    details: ["Cuir tressé main", "Semelle cuir", "Chaussant normal"]
  },
  {
    id: "sandales-lanieres",
    name: "Sandales Lanières",
    category: "chaussures",
    price: 23000,
    colors: [
      { name: "Camel", hex: "#C08A55", front: "assets/products/sandales-lanieres/front-camel.svg", back: "assets/products/sandales-lanieres/back-camel.svg" },
      { name: "Crème", hex: "#EFE8DA", front: "assets/products/sandales-lanieres/front-creme.svg", back: "assets/products/sandales-lanieres/back-creme.svg" }
    ],
    sizes: ["36", "37", "38", "39", "40", "41", "42"],
    description: "Sandales plates à fines lanières croisées, bride cheville et boucle dorée.",
    details: ["Cuir lisse", "Boucle laiton", "Semelle antidérapante"]
  },

  /* --------------------------- ACCESSOIRES --------------------------- */
  {
    id: "foulard-masques",
    name: "Foulard Masques",
    category: "accessoires",
    price: 12000,
    colors: [
      { name: "Sable", hex: "#E6CC97", front: "assets/products/foulard-masques/front-sable.svg", back: "assets/products/foulard-masques/back-sable.svg" },
      { name: "Indigo", hex: "#2F5C99", front: "assets/products/foulard-masques/front-indigo.svg", back: "assets/products/foulard-masques/back-indigo.svg" }
    ],
    sizes: ["Unique"],
    description: "Carré de 90 cm à bordure graphique. Il se porte en turban, au cou ou noué au sac.",
    details: ["Twill de coton", "90 × 90 cm", "Ourlets roulottés"]
  },
  {
    id: "bob-masques",
    name: "Bob Masques",
    category: "accessoires",
    price: 9500,
    colors: [
      { name: "Écru", hex: "#E4DDD1", front: "assets/products/bob-masques/front-ecru.svg", back: "assets/products/bob-masques/back-ecru.svg" },
      { name: "Chocolat", hex: "#74482F", front: "assets/products/bob-masques/front-chocolat.svg", back: "assets/products/bob-masques/back-chocolat.svg" }
    ],
    sizes: ["S/M", "M/L"],
    description: "Bob en lin surpiqué, masque soleil brodé sur le devant.",
    details: ["Lin épais", "Broderie ton sur ton", "Bord surpiqué"]
  }
];

/* ==========================================================================
   LOOKS — section « Essayez le look »
   - image : photo de mannequin en pied, détourée (assets/looks/)
   - items : pièces portées. Soit l'id seul ("pantalon-evase"),
             soit { id: "...", color: "Nom de la couleur" }.
   ========================================================================== */
const LOOKS = [
  {
    title: "Ivoire",
    image: "assets/looks/look-ivoire.svg",
    items: [{ id: "top-dos-nu", color: "Blanc" }, { id: "pantalon-evase", color: "Blanc" }, { id: "sandales-lanieres", color: "Camel" }]
  },
  {
    title: "Cacao",
    image: "assets/looks/look-cacao.svg",
    items: [{ id: "top-dos-nu", color: "Chocolat" }, { id: "jupe-portefeuille", color: "Chocolat" }, { id: "mules-tressees", color: "Cognac" }, { id: "pochette-cauri", color: "Cognac" }]
  },
  {
    title: "Lin écru",
    image: "assets/looks/look-lin.svg",
    items: [{ id: "gilet-cache-coeur", color: "Écru" }, { id: "pantalon-evase", color: "Blanc" }, { id: "mules-tressees", color: "Noir" }, { id: "cabas-masques", color: "Écru" }]
  },
  {
    title: "Indigo",
    image: "assets/looks/look-indigo.svg",
    items: [{ id: "blouse-nouee", color: "Indigo" }, { id: "pantalon-evase", color: "Blanc" }, { id: "sandales-lanieres", color: "Crème" }, { id: "foulard-masques", color: "Indigo" }]
  },
  {
    title: "Sable",
    image: "assets/looks/look-sable.svg",
    items: [{ id: "blouse-nouee", color: "Sable" }, { id: "jupe-portefeuille", color: "Chocolat" }, { id: "sandales-lanieres", color: "Camel" }, { id: "bob-masques", color: "Écru" }]
  }
];
