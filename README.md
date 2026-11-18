# Noma Heritage — le showroom en ligne

Site vitrine 100 % front-end (HTML, CSS, JavaScript + GSAP). Il n'y a ni serveur, ni base de données, ni paiement en ligne : les commandes partent sur WhatsApp.

```
index.html            la page
css/style.css         le style (couleurs et polices en variables en haut du fichier)
js/products.js        LE CATALOGUE : produits et looks
js/app.js             la logique et les animations
assets/logo/          logo (emblème du header et du pied de page), favicon
assets/image/         vos photos d'origine (non utilisées directement par le site)
assets/products/      une photo détourée par produit, couleur et face
assets/looks/         silhouettes du lookbook
assets/decor/         objets de décor posés sur l'étagère
assets/og-image.png   image d'aperçu pour les réseaux sociaux
```

## Ouvrir le site

Double-cliquez sur `index.html`. Il faut une connexion internet pour charger GSAP (les animations) et la police Manrope. Hors ligne, le site reste utilisable, mais sans animations.

---

## Ajouter un produit

### 1. Les images

Créez un dossier au nom du produit, sans espace ni accent :

```
assets/products/boubou-indigo/
  front-indigo.png    ← face (obligatoire)
  back-indigo.png     ← dos (facultatif)
  front-noir.png      ← une autre couleur
  back-noir.png
```

Pour un bon rendu :

- **PNG ou WebP détouré, fond transparent**, vêtement à plat et **sans cintre** (le site dessine le cintre lui-même). Le WebP est 5 à 10 fois plus léger qu'un PNG : c'est le format des vêtements actuels. Pour détourer une photo : [remove.bg](https://www.remove.bg), ou l'outil « Supprimer l'arrière-plan » de Canva ou de l'iPhone.
- **Vêtements** : format portrait **4:5** (par ex. 1200 × 1500 px), le col centré et collé en haut de l'image. Pour une jupe ou un pantalon, la ceinture doit toucher le haut de l'image.
- **Chaussures, sacs, accessoires** : format paysage **5:4** (par ex. 1500 × 1200 px), l'objet posé en bas de l'image.
- Visez un poids de 150 à 300 Ko par image (compressez sur [squoosh.app](https://squoosh.app) ou [tinypng.com](https://tinypng.com)).

### 2. L'entrée dans `js/products.js`

Copiez un produit existant dans le tableau `PRODUCTS` et adaptez-le :

```js
{
  id: "boubou-indigo",            // = nom du dossier d'images
  name: "Boubou Indigo",
  category: "vetements",          // vetements | accessoires | chaussures | sacs
  price: 35000,                   // en FCFA, sans espace
  colors: [
    { name: "Indigo", hex: "#2b3a67", front: "assets/products/boubou-indigo/front-indigo.png", back: "assets/products/boubou-indigo/back-indigo.png" },
    { name: "Noir",   hex: "#111111", front: "assets/products/boubou-indigo/front-noir.png",   back: "assets/products/boubou-indigo/back-noir.png" }
  ],
  sizes: ["XS", "S", "M", "L", "XL"],   // ou ["Unique"]
  description: "Texte court.",
  details: ["Coton tissé", "Coupe ample"], // facultatif
  isNew: true                           // facultatif : mention « Nouveau »
}
```

Champs facultatifs :

- `back` : ajoute le bouton **Face / Dos**.
- `worn: "assets/products/…/worn-indigo.png"` dans une couleur : ajoute un bouton **Porté**, pour une photo du vêtement porté.
- `hanger: "pince"` : cintre à pinces, à utiliser pour les jupes et les pantalons.

Rangement automatique : les `vetements` vont sur le portant, tout le reste sur l'étagère murale. Respectez bien les virgules entre les produits.

> Les vêtements utilisent vos vraies photos, détourées et sans le filigrane TikTok. Les sacs, chaussures et accessoires, ainsi que les silhouettes du lookbook, sont encore des visuels **provisoires** (`.svg`) : remplacez-les par vos photos en changeant simplement les chemins dans `products.js`.

### Looks

Ils se règlent aussi dans `js/products.js`, dans `LOOKS` :

- `image` : une photo de mannequin en pied, détourée, au format portrait (environ 300 × 820), déposée dans `assets/looks/`.
- `items` : les pièces portées, soit par leur id (`"pantalon-evase"`), soit avec la couleur (`{ id: "pantalon-evase", color: "Blanc" }`).

---

## Changer l'identité de la marque

Tout se trouve en haut de `css/style.css`, dans `:root` :

| Variable | Rôle |
|---|---|
| `--accent` | la couleur d'accent unique (bouton « Ajouté ✓ ») |
| `--ink`, `--muted` | les noirs et gris du texte |
| `--wall-top`, `--wall-bottom`, `--floor` | le mur et le sol du studio |
| `--kraft` | l'étiquette de prix en carton |
| `--font-sans` | la police (changez aussi le lien Google Fonts dans `index.html`) |
| `--radius-*` | les arrondis |

**Logo** : le header affiche `assets/logo/embleme.svg` (le masque soleil, en noir) et le pied de page, qui est noir, sa version blanche `assets/logo/embleme-blanc.svg`. Pour utiliser votre propre logo, remplacez ces deux fichiers, ou changez leurs chemins dans `index.html`. Le favicon est `assets/logo/favicon.svg`.

## Numéro WhatsApp et réseaux sociaux

- **WhatsApp** : en haut de `js/app.js`, remplacez le numéro d'exemple :
  ```js
  const WHATSAPP_NUMBER = '2250700000000'; // indicatif pays + numéro, sans + ni espaces
  ```
  Le bouton « Commander via WhatsApp » ouvre alors une conversation avec un message pré-rempli : articles, couleurs, tailles, quantités et total en FCFA. Le lien WhatsApp du pied de page utilise le même numéro.
- **Instagram et TikTok** : modifiez les liens dans le pied de page de `index.html` (`id="link-instagram"`, `id="link-tiktok"`).

---

## Mettre le site en ligne

Il n'y a aucune étape de compilation : on envoie le dossier tel quel.

- **Netlify** (le plus simple) : allez sur [app.netlify.com/drop](https://app.netlify.com/drop) et glissez-y le dossier du site.
- **Vercel** : créez un projet à partir du dépôt GitHub (ou lancez `npx vercel` dans le dossier), sans « Framework » ni commande de build.
- **GitHub Pages** : publiez le dossier dans un dépôt, puis allez dans *Settings → Pages → Deploy from a branch* et choisissez `main` / `root`.

Une fois en ligne, remplacez dans `index.html` la valeur de `og:image` par l'adresse complète, par exemple `https://votre-domaine.com/assets/og-image.png`. Les réseaux sociaux en ont besoin pour afficher l'aperçu.

---

## Notes techniques

- `js/app.js` est un script classique et non un module ES importé. Les navigateurs bloquent les modules quand la page est ouverte directement depuis le disque (`file://`) ; ce choix garantit que le double-clic sur `index.html` fonctionne. Le code reste en JavaScript moderne, découpé en fonctions (`renderRack()`, `renderShelf()`, `switchScene()`, `openProduct()`, `closeProduct()`, `cart.add()`…).
- Le panier est enregistré dans le `localStorage` du navigateur.
- Les animations ne touchent que `transform`, `opacity` et `filter`. Elles sont remplacées par de simples fondus si le visiteur a activé « réduire les animations ».
- Au clavier : `Tab` jusqu'au portant, flèches ← → pour parcourir, `Entrée` pour ouvrir, flèches ← → pour changer de produit dans la fiche, `Échap` pour fermer.
