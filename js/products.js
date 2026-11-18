/* ==========================================================================
   NOMA HERITAGE — Catalogue de la boutique
   --------------------------------------------------------------------------
   C'est le SEUL fichier à modifier pour gérer vos rayons, vos produits et
   vos looks. Respectez simplement la forme des exemples ci-dessous.
   ========================================================================== */

/* ==========================================================================
   RAYONS — les onglets de la pilule de navigation, dans l'ordre.
   - id    : identifiant, à reprendre dans le champ "category" des produits
   - label : texte affiché
   Le rayon "tout" affiche toute la collection. Pour ajouter un rayon (par
   exemple les robes), ajoutez une ligne { id: "robes", label: "Robes" } et
   donnez category: "robes" aux produits concernés.
   ========================================================================== */
const CATEGORIES = [
  { id: "tout", label: "Tout" },
  { id: "hauts", label: "Hauts" },
  { id: "gilets", label: "Gilets" },
  { id: "pantalons", label: "Pantalons" },
  { id: "jupes", label: "Jupes" }
];

/* ==========================================================================
   PRODUITS
   - id          identifiant unique, sans espace ni accent (ex. "boubou-indigo").
                 Utilisez-le aussi comme nom de dossier dans assets/products/.
   - name        nom affiché.
   - category    l'id d'un rayon ci-dessus (ex. "hauts").
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
   - hanger      (facultatif) "pince" pour les jupes et pantalons
                 (cintre à pinces), sinon cintre classique.
   ========================================================================== */
const PRODUCTS = [
  {
    id: "gilet-cache-coeur",
    name: "Gilet Cache-Cœur",
    category: "gilets",
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
    category: "hauts",
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
    category: "pantalons",
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
    category: "jupes",
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
    category: "hauts",
    price: 30000,
    colors: [
      { name: "Sable", hex: "#E9CF9A", front: "assets/products/blouse-nouee/front-sable.webp" },
      { name: "Indigo", hex: "#2E5E98", front: "assets/products/blouse-nouee/front-indigo.webp" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Blouse croisée à col V qui se noue sur le devant, manches longues et poignets boutonnés.",
    details: ["Lin lavé", "Lien à nouer", "Manches longues", "Impression trois masques"],
    isNew: true
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
    items: [{ id: "top-dos-nu", color: "Blanc" }, { id: "pantalon-evase", color: "Blanc" }]
  },
  {
    title: "Cacao",
    image: "assets/looks/look-cacao.svg",
    items: [{ id: "top-dos-nu", color: "Chocolat" }, { id: "jupe-portefeuille", color: "Chocolat" }]
  },
  {
    title: "Lin écru",
    image: "assets/looks/look-lin.svg",
    items: [{ id: "gilet-cache-coeur", color: "Écru" }, { id: "pantalon-evase", color: "Blanc" }]
  },
  {
    title: "Indigo",
    image: "assets/looks/look-indigo.svg",
    items: [{ id: "blouse-nouee", color: "Indigo" }, { id: "pantalon-evase", color: "Blanc" }]
  },
  {
    title: "Sable",
    image: "assets/looks/look-sable.svg",
    items: [{ id: "blouse-nouee", color: "Sable" }, { id: "jupe-portefeuille", color: "Chocolat" }]
  }
];
