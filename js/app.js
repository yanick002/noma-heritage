/* ==========================================================================
   NOMA HERITAGE — app.js
   --------------------------------------------------------------------------
   Logique et animations du showroom : portant, étagère, vue produit,
   catégories, lookbook, pièces phares, panier, recherche.
   JavaScript vanilla + GSAP 3 / ScrollTrigger (chargés par CDN dans index.html).

   Le fichier est volontairement un script « classique » (et non un module ES
   importé) pour que le site s'ouvre directement en double-cliquant sur
   index.html, sans serveur : les navigateurs bloquent les modules en file://.
   ========================================================================== */
(function () {
  'use strict';

  /* ========================================================================
     1. CONFIGURATION — à adapter
     ======================================================================== */

  // Numéro WhatsApp de la boutique : indicatif pays + numéro, sans « + » ni espaces.
  // Exemple Côte d'Ivoire : 2250700000000 · Sénégal : 221770000000
  const WHATSAPP_NUMBER = '2250700000000';

  const CART_STORAGE_KEY = 'noma-heritage-panier-v1';
  const DECOR = ['assets/decor/vase.svg', 'assets/decor/livres.svg', 'assets/decor/plante.svg'];
  // Les rayons (onglets) sont définis dans js/products.js (constante CATEGORIES).

  /* ========================================================================
     2. GSAP (avec repli statique si le CDN est indisponible)
     ======================================================================== */
  const gsap = window.gsap || createStaticGsap();
  const ScrollTrigger = window.gsap && window.ScrollTrigger ? window.ScrollTrigger : null;
  if (ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  /**
   * Version minimale de l'API GSAP utilisée par ce fichier : applique directement
   * l'état final sans animation. Le site reste ainsi utilisable hors ligne.
   */
  function createStaticGsap() {
    console.warn('[Noma Heritage] GSAP indisponible : le site fonctionne sans animations.');
    const TF = ['x', 'y', 'xPercent', 'yPercent', 'rotation', 'rotationY', 'scale'];
    const cache = new WeakMap();
    const list = (t) => (t == null ? [] : typeof t === 'string' ? Array.from(document.querySelectorAll(t))
      : t.nodeType || t === window ? [t] : Array.from(t));
    const apply = (targets, vars = {}) => {
      list(targets).forEach((el, i) => {
        if (!el || !el.style) return;
        if (vars.clearProps) { ['transform', 'opacity', 'filter', 'visibility', 'width'].forEach((p) => (el.style[p] = '')); cache.delete(el); return; }
        const s = cache.get(el) || {};
        let tf = false;
        Object.keys(vars).forEach((k) => {
          let v = vars[k];
          if (typeof v === 'function' && !/^on/.test(k)) v = v(i, el);
          if (TF.includes(k)) { s[k] = parseFloat(v) || 0; tf = true; }
          else if (k === 'opacity' || k === 'filter' || k === 'visibility' || k === 'zIndex' || k === 'transformOrigin') el.style[k] = v;
          else if (k === 'width') el.style.width = typeof v === 'number' ? v + 'px' : v;
        });
        if (tf) {
          cache.set(el, s);
          el.style.transform = `translate(${s.xPercent || 0}%, ${s.yPercent || 0}%) translate(${s.x || 0}px, ${s.y || 0}px) rotate(${s.rotation || 0}deg) rotateY(${s.rotationY || 0}deg) scale(${s.scale == null ? 1 : s.scale})`;
        }
      });
    };
    const done = (v) => v && typeof v.onComplete === 'function' && setTimeout(v.onComplete, 0);
    const chain = () => {
      const tl = {
        to: (t, v) => (apply(t, v), done(v), tl),
        from: (t, v) => (done(v), tl),
        fromTo: (t, a, b) => (apply(t, b), done(b), tl),
        set: (t, v) => (apply(t, v), tl),
        add: (f) => (typeof f === 'function' && f(), tl),
        kill: () => tl,
      };
      return tl;
    };
    const fns = new Set();
    let running = false;
    const loop = () => { fns.forEach((f) => f()); if (fns.size) requestAnimationFrame(loop); else running = false; };
    return {
      to: (t, v) => (apply(t, v), done(v), chain()),
      from: (t, v) => (done(v), chain()),
      fromTo: (t, a, b) => (apply(t, b), done(b), chain()),
      set: (t, v) => (apply(t, v), chain()),
      timeline: (v) => { done(v); return chain(); },
      killTweensOf: () => {},
      registerPlugin: () => {},
      ticker: {
        add: (f) => { fns.add(f); if (!running) { running = true; requestAnimationFrame(loop); } },
        remove: (f) => fns.delete(f),
        deltaRatio: () => 1,
      },
    };
  }

  /* ========================================================================
     3. UTILITAIRES
     ======================================================================== */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const mod = (n, m) => ((n % m) + m) % m;
  const pad = (n) => String(n).padStart(2, '0');

  const MQ_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');
  const MQ_MOBILE = window.matchMedia('(max-width: 767px)');
  const MQ_TOUCH = window.matchMedia('(hover: none), (pointer: coarse)');
  const reduced = () => MQ_REDUCED.matches;
  const isMobile = () => MQ_MOBILE.matches;
  const isTouch = () => MQ_TOUCH.matches;

  const NBSP = ' ';
  /** 35000 → « 35 000 FCFA » */
  function formatPrice(value, sep = NBSP) {
    return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, sep) + sep + 'FCFA';
  }
  const sizeLabel = (s) => (String(s).toLowerCase() === 'unique' ? 'Taille unique' : `Taille ${s}`);

  function esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  const normalize = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  /* ---- Catalogue ---- */
  function validProduct(p) {
    const ok = p && p.id && p.name && Array.isArray(p.colors) && p.colors.length && p.colors[0].front;
    if (!ok) { console.warn('[Noma Heritage] Produit ignoré (id, name ou colors[0].front manquant) :', p); return false; }
    if (!Array.isArray(p.sizes) || !p.sizes.length) p.sizes = ['Unique'];
    p.price = Number(p.price) || 0;
    return true;
  }
  const CATALOGUE = typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS) ? PRODUCTS.filter(validProduct) : [];
  const BY_ID = new Map(CATALOGUE.map((p) => [p.id, p]));
  const getProduct = (id) => BY_ID.get(id);

  /* ---- Rayons (onglets de la pilule) ---- */
  const ALL = 'tout'; // rayon qui affiche toute la collection
  const CATEGORY_LIST = (typeof CATEGORIES !== 'undefined' && Array.isArray(CATEGORIES) && CATEGORIES.length
    ? CATEGORIES
    : [{ id: ALL, label: 'Tout' }]).filter((c) => c && c.id && c.label);
  const CATEGORY_LABELS = Object.fromEntries(CATEGORY_LIST.map((c) => [c.id, c.label]));
  const SCENE_ORDER = CATEGORY_LIST.map((c) => c.id);
  const DEFAULT_SCENE = SCENE_ORDER[0];
  // Un rayon marqué { etagere: true } (accessoires, chaussures…) s'affiche sur l'étagère murale
  const SHELF_CATS = new Set(CATEGORY_LIST.filter((c) => c.etagere).map((c) => c.id));
  const isGarment = (p) => !SHELF_CATS.has(p.category);
  const RACK_PRODUCTS = CATALOGUE.filter(isGarment);
  const SHELF_PRODUCTS = CATALOGUE.filter((p) => !isGarment(p));
  CATALOGUE.forEach((p) => {
    if (!CATEGORY_LABELS[p.category]) console.warn(`[Noma Heritage] Rayon inconnu « ${p.category} » pour ${p.id} : ajoutez-le à CATEGORIES dans products.js.`);
  });
  const LOOK_LIST = typeof LOOKS !== 'undefined' && Array.isArray(LOOKS) ? LOOKS.filter((l) => l && l.image) : [];

  function colorIndexOf(p, name) {
    if (name == null) return 0;
    const n = normalize(name);
    const i = p.colors.findIndex((c) => normalize(c.name) === n);
    return i < 0 ? 0 : i;
  }

  /* ---- Préchargement des images (survol) ---- */
  const preloaded = new Set();
  function preload(src) {
    if (!src || preloaded.has(src)) return;
    preloaded.add(src);
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
  }
  function preloadProduct(p) {
    p.colors.forEach((c) => { preload(c.front); preload(c.back); preload(c.worn); });
  }

  /* ---- Annonces pour lecteurs d'écran ---- */
  function announce(msg) {
    const live = $('#live');
    live.textContent = '';
    setTimeout(() => { live.textContent = msg; }, 60);
  }

  /* ---- Blocage du défilement (vue produit, panier, recherche) ---- */
  let lockCount = 0;
  function lockScroll(on) {
    lockCount = Math.max(0, lockCount + (on ? 1 : -1));
    const root = document.documentElement;
    if (lockCount > 0 && !root.classList.contains('is-locked')) {
      // La barre de défilement de la page disparaît ; seuls les éléments fixes (header)
      // sont recalés pour ne pas bouger. Pas de marge ajoutée : aucune bande à droite.
      const sbw = window.innerWidth - root.clientWidth;
      root.style.setProperty('--sbw', sbw + 'px');
      root.classList.add('is-locked');
    } else if (lockCount === 0) {
      root.classList.remove('is-locked');
      root.style.removeProperty('--sbw');
    }
  }

  /* ---- Piège de focus dans les fenêtres modales ---- */
  function trapFocus(container, e) {
    if (e.key !== 'Tab') return;
    const items = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', container)
      .filter((el) => !el.closest('[hidden]') && el.getClientRects().length);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ========================================================================
     4. GABARITS HTML (cintre, vêtement, objet)
     ======================================================================== */
  function hangerSVG(type) {
    const hook = '<path class="hanger__hook" d="M100,58 L100,40 C100,30 110,27 110,16 C110,8 104,3 98,3 C91,3 86,8 86,14"/>';
    const neck = '<rect class="hanger__neck" x="96" y="52" width="8" height="12" rx="2"/>';
    if (type === 'pince') {
      return `<svg class="hanger" viewBox="0 0 200 100" aria-hidden="true" focusable="false">${hook}${neck}
        <path class="hanger__rod" d="M40,64 H160"/>
        <rect class="hanger__clip" x="42" y="60" width="15" height="24" rx="2.5"/>
        <rect class="hanger__clip" x="143" y="60" width="15" height="24" rx="2.5"/>
        <rect class="hanger__clip-hi" x="44" y="62" width="11" height="3" rx="1"/>
        <rect class="hanger__clip-hi" x="145" y="62" width="11" height="3" rx="1"/></svg>`;
    }
    return `<svg class="hanger" viewBox="0 0 200 100" aria-hidden="true" focusable="false">${hook}${neck}
      <path class="hanger__bar" d="M16,86 Q56,64 100,60 Q144,64 184,86"/></svg>`;
  }

  /** Cintre + vêtement (portant). */
  function garmentFigureHTML(p, colorIndex, withAlt) {
    const c = p.colors[colorIndex] || p.colors[0];
    const alt = withAlt ? `${p.name}, ${c.name}` : '';
    return `<div class="fig fig--${p.hanger === 'pince' ? 'pince' : 'classique'}">${hangerSVG(p.hanger)}
      <div class="garment"><img class="garment__img" src="${esc(c.front)}" alt="${esc(alt)}" draggable="false" decoding="async"></div></div>`;
  }

  /* ========================================================================
     5. LÉGENDE SOUS LE PORTANT (nom + prix au survol)
     ======================================================================== */
  const caption = {
    el: null,
    inner: null,
    current: undefined,
    init() {
      this.el = $('#stage-caption');
      this.inner = $('.stage-caption__inner', this.el);
    },
    /** Indication par défaut : « Glissez » seulement si le portant défile. */
    hint() {
      const r = activeRack();
      const scrolls = !r || r.loop;
      if (isTouch()) return scrolls ? 'Glissez · Touchez une pièce' : 'Touchez une pièce pour la découvrir';
      return scrolls ? 'Glissez pour parcourir · Cliquez pour découvrir' : 'Cliquez sur une pièce pour la découvrir';
    },
    /** Réaffiche l'indication (après un changement de rayon). */
    refresh() {
      if (this.current) return;
      this.current = undefined;
      this.show(null);
    },
    show(p) {
      if (p === this.current) return;
      this.current = p;
      gsap.killTweensOf(this.inner);
      gsap.to(this.inner, {
        opacity: 0, y: reduced() ? 0 : -6, duration: 0.14, ease: 'power1.in',
        onComplete: () => {
          const html = p
            ? `<span class="stage-caption__name">${esc(p.name)}</span>
               <span class="stage-caption__price">${formatPrice(p.price)}${p.isNew ? ' · <span class="stage-caption__new">Nouveau</span>' : ''}</span>`
            : `<span class="stage-caption__hint">${this.hint()}</span>`;
          this.inner.innerHTML = html;
          gsap.fromTo(this.inner, { opacity: 0, y: reduced() ? 0 : 8 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
        },
      });
    },
  };

  /* ========================================================================
     6. LE PORTANT (défilement infini, inertie, balancement)
     ======================================================================== */
  class Rack {
    constructor(root, products, { label, onHover, onCenter, onOpen }) {
      this.root = root;
      this.products = products;
      this.onHover = onHover;
      this.onCenter = onCenter;
      this.onOpen = onOpen;

      this.offset = 0;       // position affichée
      this.target = 0;       // position visée (lissage vers elle = inertie)
      this.last = 0;
      this.sway = 0;         // angle de balancement global (ressort)
      this.swayVel = 0;
      this.items = [];
      this.copies = 0;
      this.W = 0; this.vw = 0; this.spacing = 1; this.total = 1;
      this.active = false;   // la scène est-elle affichée ?
      this.dimmed = false;   // vue produit ouverte depuis ce portant
      this.dragging = false;
      this.pointerDown = false;
      this.hovered = null;
      this.hidden = null;
      this.centerK = null;
      this.focused = false;
      this.dirty = true;

      this.loop = true;      // boucle infinie, ou portant fixe et centré s'il y a peu d'articles
      this.base = 0;         // position du portant fixe
      this.cursor = 0;       // article sélectionné au clavier (portant fixe)

      root.innerHTML = `<div class="rack__rail" aria-hidden="true"></div>
        <div class="rack__viewport" tabindex="0" role="group" aria-roledescription="portant" aria-label="${esc(label)}">
          <ul class="rack__track"></ul>
        </div>
        <p class="rack__empty">Bientôt disponible</p>`;
      this.rail = $('.rack__rail', root);
      this.viewport = $('.rack__viewport', root);
      this.track = $('.rack__track', root);
      this.bindPointer();
      this.bindKeys();
    }

    /** Change les articles suspendus (changement de rayon). */
    setProducts(products) {
      if (products.length === this.products.length && products.every((p, i) => p === this.products[i])) return;
      this.products = products;
      this.copies = 0;   // force la reconstruction au prochain measure()
      this.W = 0;        // force le recentrage
      this.centerK = 0;
      this.cursor = 0;
      this.hovered = null;
      this.root.classList.toggle('is-empty', !products.length);
      if (!products.length) { this.track.innerHTML = ''; this.items = []; }
    }

    /** Calcule la taille des vêtements selon la place disponible. */
    measure() {
      const h = this.root.clientHeight;
      const vw = this.root.clientWidth;
      this.root.classList.toggle('is-empty', !this.products.length);
      if (!h || !vw || !this.products.length) return false;
      const railY = parseFloat(getComputedStyle(this.root).getPropertyValue('--rail-y')) || 26;
      const portrait = window.innerHeight > window.innerWidth * 1.05;
      const maxW = isMobile() ? vw * 0.64 : portrait ? vw * 0.5 : Math.min(460, vw * 0.26);
      const W = Math.round(clamp((h - railY - 12) / 1.4, 100, maxW));
      const gap = Math.round(W * (isMobile() ? 0.14 : 0.1));
      // On ne recentre que si la taille des vêtements change : une variation de largeur
      // de quelques pixels (barre de défilement masquée) ne doit pas faire bouger le portant.
      const changed = W !== this.W;
      this.W = W;
      this.vw = vw;
      this.spacing = W + gap;
      this.root.style.setProperty('--g-w', W + 'px');

      // Peu d'articles qui tiennent à l'écran : portant fixe et centré.
      // Sinon : boucle infinie, avec assez de copies pour ne jamais voir de trou.
      const n = this.products.length;
      const wasLoop = this.loop;
      this.loop = n * this.spacing > vw * 0.85;
      const copies = this.loop ? Math.max(1, Math.ceil((vw + 2 * this.spacing) / (n * this.spacing))) : 1;
      if (copies !== this.copies) { this.copies = copies; this.build(); }
      this.total = this.items.length * this.spacing;
      if (!this.loop) {
        this.base = (vw - (n * this.spacing - gap)) / 2;
        this.target = this.offset = this.last = this.base;
        this.cursor = clamp(this.cursor, 0, n - 1);
      } else if (changed || !wasLoop) {
        this.target = this.offset = this.last = this.centerOffset(this.centerK || 0);
      }
      this.dirty = true;
      return true;
    }

    /** Génère les articles suspendus (originaux + copies pour la boucle infinie). */
    build() {
      const n = this.products.length;
      let html = '';
      for (let c = 0; c < this.copies; c++) {
        this.products.forEach((p, i) => {
          html += `<li class="hi" data-index="${i}"${c ? ' aria-hidden="true"' : ''}>
            <div class="hi__depth"><div class="hi__sway"><div class="hi__swing">${garmentFigureHTML(p, 0, !c)}</div></div></div></li>`;
        });
      }
      this.track.innerHTML = html;
      this.items = $$('.hi', this.track).map((el, k) => {
        const depth = el.firstElementChild;
        const sway = depth.firstElementChild;
        const swing = sway.firstElementChild;
        return { el, k, index: k % n, depth, sway, swing, figure: swing.firstElementChild, colorIndex: 0, mult: 0.75 + ((k * 7) % 5) * 0.12 };
      });
      this.items.forEach((it) => this.bindItem(it));
      this.hidden = null;
      this.hovered = null;
      // Reconstruit pendant une vue produit (redimensionnement) : on garde le recul
      if (this.dimmed) this.items.forEach((it) => gsap.set(it.depth, { opacity: 0.15, filter: 'blur(6px)', scale: 0.94 }));
    }

    bindItem(it) {
      it.el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !this.pointerDown) this.hover(it, true); });
      it.el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') this.hover(it, false); });
      it.el.addEventListener('click', () => { if (!this.suppressClick) this.open(it); });
    }

    /** Survol : le vêtement se soulève et oscille comme un vrai cintre. */
    hover(it, on) {
      if (this.dimmed) return;
      const p = this.products[it.index];
      gsap.killTweensOf(it.swing, 'rotation');
      if (on) {
        this.hovered = it;
        it.el.style.zIndex = 5;
        preloadProduct(p);
        this.onHover && this.onHover(p);
        if (reduced()) return;
        gsap.to(it.swing, { y: -12, scale: 1.06, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
        gsap.timeline()
          .to(it.swing, { rotation: 2, duration: 0.16, ease: 'power2.out' })
          .to(it.swing, { rotation: 0, duration: 1.6, ease: 'elastic.out(1.1, 0.26)' });
      } else {
        it.el.style.zIndex = '';
        if (this.hovered === it) {
          this.hovered = null;
          if (this.focused || isTouch()) this.updateCurrent(true);
          else this.onHover && this.onHover(null);
        }
        if (reduced()) return;
        gsap.to(it.swing, { y: 0, scale: 1, duration: 0.55, ease: 'power3.out', overwrite: 'auto' });
        gsap.timeline()
          .to(it.swing, { rotation: -1.4, duration: 0.16, ease: 'power2.out' })
          .to(it.swing, { rotation: 0, duration: 1.4, ease: 'elastic.out(1, 0.3)' });
      }
    }

    open(it) {
      if (this.dimmed || !it) return;
      this.onOpen && this.onOpen(this.products[it.index], it, this);
    }

    /* ---- Glisser-déposer, swipe, molette ---- */
    bindPointer() {
      const vp = this.viewport;
      let startX = 0, startY = 0, startTarget = 0, lastX = 0, lastT = 0, vel = 0, id = null, moved = false;

      vp.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || this.dimmed) return;
        this.pointerDown = true;
        id = e.pointerId;
        startX = lastX = e.clientX;
        startY = e.clientY;
        startTarget = this.target;
        lastT = performance.now();
        vel = 0;
        moved = false;
      });

      vp.addEventListener('pointermove', (e) => {
        if (!this.pointerDown || e.pointerId !== id) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (!moved) {
          if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
          if (e.pointerType !== 'mouse' && Math.abs(dy) > Math.abs(dx)) { this.pointerDown = false; return; }
          moved = true;
          this.dragging = true;
          try { vp.setPointerCapture(id); } catch (err) { /* pointeur déjà relâché */ }
          vp.classList.add('is-dragging');
          if (this.hovered) this.hover(this.hovered, false);
        }
        const now = performance.now();
        const dt = Math.max(1, now - lastT);
        vel = vel * 0.6 + ((e.clientX - lastX) / dt) * 0.4; // px/ms, lissé
        lastX = e.clientX;
        lastT = now;
        // Portant fixe : léger effet élastique seulement
        this.target = this.loop ? startTarget + dx : this.base + dx * 0.25;
      });

      const end = (e) => {
        if (!this.pointerDown || e.pointerId !== id) return;
        this.pointerDown = false;
        if (!moved) return;
        this.dragging = false;
        vp.classList.remove('is-dragging');
        if (!this.loop) {
          this.target = this.base; // le portant fixe revient en place
        } else {
          if (performance.now() - lastT > 90) vel = 0; // l'utilisateur s'est arrêté avant de relâcher
          this.target += clamp(vel, -4, 4) * 340;     // inertie
          if (this.shouldSnap()) this.snap();
        }
        this.suppressClick = true;
        setTimeout(() => { this.suppressClick = false; }, 0);
      };
      vp.addEventListener('pointerup', end);
      vp.addEventListener('pointercancel', end);
      vp.addEventListener('dragstart', (e) => e.preventDefault());

      vp.addEventListener('wheel', (e) => {
        const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
        if (!d || this.dimmed || !this.loop) return;
        e.preventDefault();
        this.target -= d * (e.deltaMode === 1 ? 32 : 1);
        if (this.shouldSnap()) {
          clearTimeout(this.wheelTimer);
          this.wheelTimer = setTimeout(() => this.snap(), 160);
        }
      }, { passive: false });
    }

    /* ---- Clavier : flèches pour parcourir, Entrée pour ouvrir ---- */
    bindKeys() {
      const vp = this.viewport;
      vp.addEventListener('keydown', (e) => {
        if (this.dimmed) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); this.step(1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); this.step(-1); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.open(this.itemAtK(this.currentK())); }
      });
      vp.addEventListener('focus', () => { this.focused = true; this.updateCurrent(true); });
      vp.addEventListener('blur', () => {
        this.focused = false;
        if (!this.hovered && !isTouch() && !this.dimmed) this.onHover && this.onHover(null);
      });
    }

    shouldSnap() { return isMobile() || isTouch(); }
    centerOffset(K) { return this.loop ? (this.vw - this.W) / 2 - K * this.spacing : this.base; }
    currentK() { return this.loop ? Math.round(((this.vw - this.W) / 2 - this.target) / this.spacing) : this.cursor; }
    itemAtK(K) { return this.items[mod(K, this.items.length)]; }
    snap() { this.target = this.loop ? this.centerOffset(this.currentK()) : this.base; }
    step(dir) {
      if (this.loop) { this.target = this.centerOffset(this.currentK() + dir); return; }
      this.cursor = clamp(this.cursor + dir, 0, this.items.length - 1); // portant fixe : on déplace la sélection
      this.updateCurrent(true);
    }

    /** Position horizontale d'un article (avec ou sans boucle). */
    xOf(it) {
      const sp = this.spacing;
      return this.loop ? mod(it.k * sp + this.offset + sp, this.total) - sp : it.k * sp + this.offset;
    }

    /** Fait venir un produit au centre par le plus court chemin. Retourne l'élément concerné. */
    centerOn(index) {
      if (!this.loop) { this.cursor = index; this.updateCurrent(true); return this.items[index]; }
      const n = this.products.length;
      const K0 = this.currentK();
      let d = mod(index - K0, n);
      if (d > n / 2) d -= n;
      this.target = this.centerOffset(K0 + d);
      return this.itemAtK(K0 + d);
    }

    /** Met en avant l'article centré (clavier, tactile). */
    updateCurrent(force) {
      if (!this.items.length) return;
      const K = this.loop ? Math.round(((this.vw - this.W) / 2 - this.offset) / this.spacing) : this.cursor;
      if (K === this.centerK && !force) return;
      this.centerK = K;
      const cur = this.itemAtK(K);
      this.items.forEach((it) => it.el.classList.toggle('is-current', it === cur));
      if (!this.hovered && !this.dimmed && (this.focused || isTouch())) this.onCenter && this.onCenter(this.products[cur.index]);
    }

    /** Appelée à chaque image par le ticker GSAP. */
    tick(ratio) {
      if (!this.active || !this.items.length) return;
      const ease = this.dragging ? 0.32 : 0.085;
      const f = 1 - Math.pow(1 - ease, ratio);
      const diff = this.target - this.offset;
      this.offset = Math.abs(diff) < 0.05 ? this.target : this.offset + diff * f;
      const v = (this.offset - this.last) / ratio;
      this.last = this.offset;

      // Ressort amorti : les cintres prennent du retard puis reviennent
      let swaying = false;
      if (!reduced()) {
        const goal = clamp(v * 0.42, -9, 9);
        this.swayVel = (this.swayVel + (goal - this.sway) * 0.09 * ratio) * Math.pow(0.87, ratio);
        this.sway += this.swayVel * ratio;
        swaying = Math.abs(this.sway) > 0.004 || Math.abs(this.swayVel) > 0.004;
        if (!swaying && this.sway !== 0) { this.sway = 0; this.swayVel = 0; this.dirty = true; }
      }
      if (v !== 0 || swaying || this.dirty) {
        this.render();
        this.dirty = false;
      }
      this.updateCurrent();
    }

    render() {
      for (let i = 0; i < this.items.length; i++) {
        const it = this.items[i];
        const x = this.xOf(it);
        it.el.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
        it.sway.style.transform = this.sway ? `rotate(${(this.sway * it.mult).toFixed(3)}deg)` : '';
      }
    }

    /** Fige le portant sur sa position cible (avant une mesure FLIP). */
    settle() {
      this.offset = this.last = this.target;
      this.sway = this.swayVel = 0;
      this.render();
      this.updateCurrent(true);
    }

    /* ---- Mise au second plan pendant la vue produit ---- */
    dim(except) {
      this.dimmed = true;
      if (this.hovered) { this.hovered.el.style.zIndex = ''; this.hovered = null; }
      this.items.forEach((it) => {
        if (it === except) return;
        gsap.to(it.depth, { opacity: 0.15, filter: 'blur(6px)', scale: 0.94, duration: 0.7, ease: 'power2.out', overwrite: 'auto' });
        gsap.to(it.swing, { y: 0, scale: 1, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
      });
      gsap.to(this.rail, { opacity: 0.3, duration: 0.6 });
      this.setHidden(except);
    }

    /** Cache l'article actuellement « sorti » du portant (il est affiché en grand). */
    setHidden(it) {
      const prev = this.hidden;
      if (prev && prev !== it) {
        prev.el.style.visibility = '';
        if (this.dimmed) gsap.fromTo(prev.depth, { opacity: 0 }, { opacity: 0.15, filter: 'blur(6px)', scale: 0.94, duration: 0.5 });
      }
      this.hidden = it || null;
      if (it) {
        gsap.killTweensOf([it.depth, it.swing]);
        gsap.set(it.depth, { clearProps: 'all' });
        gsap.set(it.swing, { y: 0, scale: 1, rotation: 0, opacity: 1 });
        it.el.style.visibility = 'hidden';
      }
    }

    reveal() {
      if (this.hidden) { this.hidden.el.style.visibility = ''; this.hidden = null; }
    }

    undim() {
      this.dimmed = false;
      this.items.forEach((it) => {
        if (it === this.hidden) return;
        gsap.to(it.depth, {
          opacity: 1, filter: 'blur(0px)', scale: 1, duration: 0.7, ease: 'power2.out', overwrite: 'auto',
          onComplete: () => gsap.set(it.depth, { clearProps: 'all' }),
        });
      });
      gsap.to(this.rail, { opacity: 1, duration: 0.6, clearProps: 'opacity' });
    }

    /* ---- Animation d'entrée : les vêtements arrivent un par un ---- */
    prepEntrance() {
      this.items.forEach((it) => gsap.set(it.swing, { opacity: 0 }));
    }

    entrance(delay = 0) {
      this.settle();
      const visible = [];
      this.items.forEach((it) => {
        const x = this.xOf(it);
        if (x > -this.W && x < this.vw) { it._x = x; visible.push(it); }
        else gsap.set(it.swing, { opacity: 1 });
      });
      visible.sort((a, b) => a._x - b._x);
      const swings = visible.map((it) => it.swing);
      if (!swings.length) return;
      if (reduced()) {
        gsap.fromTo(swings, { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.05, delay });
        return;
      }
      gsap.fromTo(swings, { y: -46, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.09, delay });
      gsap.fromTo(swings, { rotation: -9 }, { rotation: 0, duration: 2.2, ease: 'elastic.out(1, 0.28)', stagger: 0.09, delay });
    }
  }

  /* ========================================================================
     7. L'ÉTAGÈRE MURALE (chaussures, sacs, accessoires)
     ======================================================================== */
  class Shelf {
    constructor(root, { onHover, onOpen }) {
      this.root = root;
      this.onHover = onHover;
      this.onOpen = onOpen;
      this.items = [];
      this.products = [];
      this.hidden = null;
    }

    render(products, { cols, rows, label }) {
      this.products = products;
      const n = products.length;
      const cells = Math.max(cols * rows, n);
      let html = '';
      let d = 0;
      for (let i = 0; i < cells; i++) {
        const p = products[i];
        if (p) {
          html += `<li class="shelf__cell">
            <button class="shelf-item" type="button" data-index="${i}" aria-label="${esc(p.name)}, ${formatPrice(p.price)}">
              <span class="shelf-item__shadow"></span>
              <span class="shelf-item__lift"><span class="obj__media"><img class="obj__img" src="${esc(p.colors[0].front)}" alt="" loading="lazy" decoding="async" draggable="false"></span></span>
            </button></li>`;
        } else {
          html += `<li class="shelf__cell" aria-hidden="true"><span class="shelf__decor"><img src="${DECOR[d++ % DECOR.length]}" alt="" loading="lazy" decoding="async"></span></li>`;
        }
      }
      let planks = '';
      for (let r = 0; r < rows; r++) planks += `<span class="shelf__plank" style="--r:${r}" aria-hidden="true"></span>`;
      this.root.innerHTML = `<div class="shelf__unit" style="--cols:${cols};--rows:${rows}">${planks}
        <ul class="shelf__grid" style="display:contents" role="list" aria-label="${esc(label)}">${html}</ul>
        ${n ? '' : '<p class="shelf__empty">Bientôt disponible</p>'}</div>`;

      this.hidden = null;
      this.items = $$('.shelf-item', this.root).map((el) => ({
        el, index: +el.dataset.index, cell: el.parentElement,
        lift: $('.shelf-item__lift', el), media: $('.obj__media', el), colorIndex: 0,
      }));
      this.items.forEach((it) => {
        const p = this.products[it.index];
        it.el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { preloadProduct(p); this.onHover && this.onHover(p); } });
        it.el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') this.onHover && this.onHover(null); });
        it.el.addEventListener('focus', () => this.onHover && this.onHover(p));
        it.el.addEventListener('blur', () => this.onHover && this.onHover(null));
        it.el.addEventListener('click', () => this.onOpen && this.onOpen(p, it, this));
      });
    }

    entrance() {
      const medias = this.items.map((it) => it.media);
      const decor = $$('.shelf__decor', this.root);
      if (reduced()) {
        if (medias.length + decor.length) gsap.fromTo([...medias, ...decor], { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.04 });
        return;
      }
      if (medias.length) gsap.fromTo(medias, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.7)', stagger: 0.07, delay: 0.15 });
      if (decor.length) gsap.fromTo(decor, { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.3, stagger: 0.05 });
    }

    dim(except) {
      this.items.forEach((it) => {
        if (it === except) return;
        gsap.to(it.cell, { opacity: 0.15, filter: 'blur(6px)', scale: 0.94, duration: 0.7, ease: 'power2.out', overwrite: 'auto' });
      });
      gsap.to($$('.shelf__cell[aria-hidden], .shelf__plank', this.root), { opacity: 0.25, duration: 0.6 });
      this.setHidden(except);
    }

    setHidden(it) {
      const prev = this.hidden;
      if (prev && prev !== it) {
        prev.lift.style.visibility = '';
        gsap.fromTo(prev.cell, { opacity: 0 }, { opacity: 0.15, filter: 'blur(6px)', scale: 0.94, duration: 0.5 });
      }
      this.hidden = it || null;
      if (it) {
        gsap.killTweensOf(it.cell);
        gsap.set(it.cell, { clearProps: 'all' });
        it.lift.style.visibility = 'hidden';
      }
    }

    reveal() {
      if (this.hidden) { this.hidden.lift.style.visibility = ''; this.hidden = null; }
    }

    undim() {
      this.items.forEach((it) => {
        if (it === this.hidden) return;
        gsap.to(it.cell, { opacity: 1, filter: 'blur(0px)', scale: 1, duration: 0.7, ease: 'power2.out', overwrite: 'auto', onComplete: () => gsap.set(it.cell, { clearProps: 'all' }) });
      });
      gsap.to($$('.shelf__cell[aria-hidden], .shelf__plank', this.root), { opacity: 1, duration: 0.6, clearProps: 'opacity' });
    }
  }

  /* ========================================================================
     8. SCÈNES ET CATÉGORIES
     ======================================================================== */
  const scenes = {};
  let currentCat = null;
  let sceneBusy = false;
  let pendingCat = null;
  let heroVisible = true;
  let lastMobile = isMobile();

  /**
   * Scène à afficher pour un rayon :
   * - 'rack'     : le portant (vêtements), filtré par rayon ;
   * - 'shelf'    : l'étagère murale (rayons marqués etagere: true) ;
   * - 'boutique' : portant + étagère côte à côte (rayon « Tout » quand il y a des deux).
   */
  function sceneKey(cat) {
    if (cat === ALL) {
      if (RACK_PRODUCTS.length && SHELF_PRODUCTS.length) return 'boutique';
      return RACK_PRODUCTS.length ? 'rack' : 'shelf';
    }
    return SHELF_CATS.has(cat) ? 'shelf' : 'rack';
  }
  const productsOf = (cat, list) => (cat === ALL ? list : list.filter((p) => p.category === cat));

  const SCENE_EVENTS = {
    onHover: (p) => caption.show(p),
    onCenter: (p) => caption.show(p),
  };

  /** Crée un portant (vêtements suspendus) dans l'élément donné. */
  function renderRack(root, products, label) {
    return new Rack(root, products, { ...SCENE_EVENTS, onOpen: openFromRack, label });
  }

  /** Crée une étagère murale (le contenu est rempli par populateShelf()). */
  function renderShelf(root) {
    return new Shelf(root, { ...SCENE_EVENTS, onOpen: openFromShelf });
  }

  function setupScenes() {
    scenes.rack = {
      el: $('#scene-vetements'),
      rack: renderRack($('#rack-main'), RACK_PRODUCTS, 'Portant. Flèches gauche et droite pour parcourir, Entrée pour ouvrir.'),
    };
    scenes.shelf = {
      el: $('#scene-shelf'),
      shelf: renderShelf($('#shelf-main')),
    };
    scenes.boutique = {
      el: $('#scene-boutique'),
      rack: renderRack($('#rack-boutique'), RACK_PRODUCTS, 'Portant de la boutique. Flèches gauche et droite pour parcourir, Entrée pour ouvrir.'),
      shelf: renderShelf($('#shelf-boutique')),
    };
    const stage = $('#stage');
    stage.setAttribute('role', 'tabpanel');
    stage.setAttribute('aria-label', 'Rayon affiché');
  }

  function shelfLayout(key, n) {
    if (key === 'boutique') {
      return isMobile() ? { cols: 3, rows: Math.max(1, Math.ceil(n / 3)) } : { cols: 2, rows: Math.max(2, Math.ceil(n / 2)) };
    }
    return isMobile() ? { cols: 2, rows: Math.max(2, Math.ceil(n / 2)) } : { cols: 3, rows: Math.max(2, Math.ceil(n / 3)) };
  }

  function populateShelf(cat) {
    const key = sceneKey(cat);
    const s = scenes[key];
    if (!s.shelf) return;
    const list = productsOf(cat, SHELF_PRODUCTS);
    s.shelf.render(list, { ...shelfLayout(key, list.length), label: `Étagère ${CATEGORY_LABELS[cat]}` });
  }

  /** Remplit la scène avec les articles du rayon choisi. */
  function populateScene(cat) {
    if (sceneKey(cat) === 'rack') scenes.rack.rack.setProducts(productsOf(cat, RACK_PRODUCTS));
    populateShelf(cat);
  }

  function activateScene(cat) {
    const s = scenes[sceneKey(cat)];
    s.el.hidden = false;
    populateScene(cat);
    if (s.rack) {
      s.rack.active = true;
      s.rack.measure();
      s.rack.settle();
    }
    caption.refresh();
  }

  function deactivateScene(key) {
    const s = scenes[key];
    s.el.hidden = true;
    if (s.rack) s.rack.active = false;
  }

  function sceneEntrance(key) {
    const s = scenes[key];
    if (s.rack) { s.rack.prepEntrance(); s.rack.entrance(0.2); }
    if (s.shelf) s.shelf.entrance();
  }

  function activeRack() {
    const s = currentCat && scenes[sceneKey(currentCat)];
    return s && s.rack ? s.rack : null;
  }

  /** Change de rayon : fondu + léger travelling de caméra. */
  function switchScene(cat, { instant = false } = {}) {
    if (!CATEGORY_LABELS[cat] || cat === currentCat) return;
    if (sceneBusy) { pendingCat = cat; return; }
    const prevCat = currentCat;
    currentCat = cat;
    updateCatnav(instant);
    caption.show(null);

    const nextKey = sceneKey(cat);
    const prevKey = prevCat ? sceneKey(prevCat) : null;
    const nextEl = scenes[nextKey].el;
    const prevEl = prevKey ? scenes[prevKey].el : null;
    const dir = prevCat ? Math.sign(SCENE_ORDER.indexOf(cat) - SCENE_ORDER.indexOf(prevCat)) || 1 : 1;

    // Le grand titre se décale un peu : effet de profondeur quand on « marche » dans la boutique
    const shift = isMobile() ? 0 : (SCENE_ORDER.indexOf(cat) - SCENE_ORDER.indexOf(DEFAULT_SCENE)) * -8;
    gsap.to('.hero__title-wrap', { x: reduced() ? 0 : shift, duration: instant ? 0 : 1.2, ease: 'power3.inOut' });

    if (!prevEl || instant) {
      if (prevKey && prevKey !== nextKey) deactivateScene(prevKey);
      activateScene(cat);
      return;
    }

    sceneBusy = true;
    const travel = reduced() ? 0 : 90;
    const zoom = reduced() ? 0 : 0.04;
    gsap.timeline({
      onComplete: () => {
        sceneBusy = false;
        if (pendingCat) { const c = pendingCat; pendingCat = null; switchScene(c); }
      },
    })
      .to(prevEl, { x: -dir * travel, scale: 1 - zoom, opacity: 0, duration: 0.42, ease: 'power2.in' })
      .add(() => {
        gsap.set(prevEl, { clearProps: 'all' });
        if (prevKey !== nextKey) deactivateScene(prevKey);
        activateScene(cat);
        sceneEntrance(nextKey);
        gsap.set(nextEl, { x: dir * travel, scale: 1 + zoom, opacity: 0 });
      })
      .to(nextEl, { x: 0, scale: 1, opacity: 1, duration: 0.75, ease: 'power3.out', clearProps: 'all' });
  }

  /* ---- Pilule de navigation ---- */
  function initCatnav() {
    const nav = $('#catnav');
    // Un onglet par rayon défini dans products.js
    $('.catnav__track', nav).insertAdjacentHTML('beforeend', CATEGORY_LIST.map((c) =>
      `<button class="catnav__tab" type="button" role="tab" data-cat="${esc(c.id)}" aria-selected="false" aria-controls="stage">${esc(c.label)}</button>`).join(''));
    const tabs = $$('.catnav__tab', nav);
    tabs.forEach((tab) => tab.addEventListener('click', () => goToCategory(tab.dataset.cat)));
    nav.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const i = tabs.indexOf(document.activeElement);
      const next = tabs[mod(i + (e.key === 'ArrowRight' ? 1 : -1), tabs.length)];
      next.focus();
      goToCategory(next.dataset.cat);
    });
  }

  function goToCategory(cat) {
    const hero = $('#boutique');
    if (window.scrollY > hero.offsetHeight * 0.35) window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
    switchScene(cat);
  }

  function updateCatnav(instant) {
    $$('.catnav__tab').forEach((t) => {
      const on = t.dataset.cat === currentCat;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    moveIndicator(instant);
  }

  function moveIndicator(instant) {
    const tab = $(`.catnav__tab[data-cat="${currentCat}"]`);
    if (!tab) return;
    gsap.to('#catnav-indicator', { x: tab.offsetLeft, width: tab.offsetWidth, duration: instant || reduced() ? 0 : 0.55, ease: 'power3.out' });
    const nav = $('#catnav');
    if (nav.scrollWidth > nav.clientWidth + 1) {
      nav.scrollTo({ left: tab.offsetLeft - (nav.clientWidth - tab.offsetWidth) / 2, behavior: instant || reduced() ? 'auto' : 'smooth' });
    }
  }

  /* ========================================================================
     9. VUE PRODUIT (transition FLIP)
     ======================================================================== */
  const pv = {
    open: false,
    busy: false,
    flipping: false,
    product: null,
    colorIndex: 0,
    side: 'front',
    size: null,
    qty: 1,
    list: [],
    origin: { type: 'none' },
    sourceProductId: null,
    colorHints: null,
    lastFocus: null,
  };
  let PV = {};

  function initProductView() {
    PV = {
      root: $('#product-view'), veil: $('#pv-veil'), figwrap: $('#pv-figwrap'), fig: $('#pv-fig'),
      panel: $('#pv-panel'), inner: $('#pv-panel-inner'), grab: $('#pv-grab'),
      cat: $('#pv-cat'), name: $('#pv-name'), price: $('#pv-price'), colorName: $('#pv-color-name'),
      swatches: $('#pv-swatches'), sideRow: $('#pv-side-row'), sides: $('#pv-sides'),
      sizes: $('#pv-sizes'), sizeHint: $('#pv-size-hint'), qty: $('#pv-qty'), qtyValue: $('#pv-qty-value'),
      add: $('#pv-add'), detailsToggle: $('#pv-details-toggle'), details: $('#pv-details'),
      prev: $('#pv-prev'), next: $('#pv-next'), close: $('#pv-close'),
      media: null, tag: null,
    };
    PV.veil.addEventListener('click', closeProduct);
    PV.close.addEventListener('click', closeProduct);
    PV.prev.addEventListener('click', () => navigateProduct(-1));
    PV.next.addEventListener('click', () => navigateProduct(1));
    PV.swatches.addEventListener('click', (e) => { const b = e.target.closest('.swatch'); if (b) setColor(+b.dataset.index); });
    PV.sides.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setSide(b.dataset.side); });
    PV.sizes.addEventListener('click', (e) => { const b = e.target.closest('.size'); if (b) setSize(b.dataset.size); });
    PV.qty.addEventListener('click', (e) => { const b = e.target.closest('[data-qty]'); if (b) setQty(pv.qty + Number(b.dataset.qty)); });
    PV.add.addEventListener('click', addFromPanel);
    PV.detailsToggle.addEventListener('click', toggleDetails);
    PV.root.addEventListener('keydown', (e) => trapFocus(PV.root, e));
    initSheetDrag();
  }

  function openFromRack(p, it, rack) {
    openProduct(p.id, {
      list: rack.products.map((x) => x.id),
      origin: { type: 'rack', rack, item: it },
      sourceEl: it.figure,
      colorIndex: it.colorIndex,
    });
  }

  function openFromShelf(p, it, shelf) {
    openProduct(p.id, {
      list: shelf.products.map((x) => x.id),
      origin: { type: 'shelf', shelf, item: it },
      sourceEl: it.lift,
      colorIndex: it.colorIndex,
    });
  }

  /**
   * Ouvre la vue produit.
   * @param {string} id
   * @param {object} opts list (ids pour ‹ ›), origin (rack | shelf | el | none), sourceEl (élément de départ du FLIP), colorIndex, colorHints
   */
  function openProduct(id, { list, origin, sourceEl, colorIndex = 0, colorHints = null } = {}) {
    const p = getProduct(id);
    if (!p || pv.open || pv.busy) return;
    pv.open = true;
    pv.busy = true;
    pv.lastFocus = document.activeElement;
    pv.list = (list && list.length ? list : [id]).filter((x) => BY_ID.has(x));
    pv.origin = origin || { type: 'none' };
    pv.sourceProductId = id;
    pv.colorHints = colorHints;
    preloadProduct(p);

    // 1. Mesure de l'élément de départ (avant de le cacher)
    const src = sourceEl ? sourceEl.getBoundingClientRect() : null;

    // 2. Préparation de la vue
    PV.root.classList.toggle('pv--soft', pv.origin.type !== 'rack' && pv.origin.type !== 'shelf');
    PV.root.hidden = false;
    document.body.classList.add('pv-open');
    lockScroll(true);
    loadProduct(p, colorIndex);
    PV.prev.hidden = PV.next.hidden = pv.list.length < 2;

    // 3. Le reste de la scène s'estompe et recule
    const o = pv.origin;
    o.siblings = siblingsOf(o);
    o.siblings.forEach((x) => x.dim(null));
    if (o.type === 'rack') o.rack.dim(o.item);
    else if (o.type === 'shelf') o.shelf.dim(o.item);

    // 4. FLIP : le vêtement glisse de sa place vers le centre en grossissant
    const dst = PV.fig.getBoundingClientRect();
    const tl = gsap.timeline({
      onComplete: () => {
        pv.busy = false;
        PV.close.focus({ preventScroll: true });
      },
    });
    pv.openTl = tl;
    tl.fromTo(PV.veil, { opacity: 0 }, { opacity: 1, duration: 0.55, ease: 'power1.out' }, 0);
    if (src && src.width && !reduced()) {
      tl.fromTo(PV.fig,
        { x: src.left - dst.left, y: src.top - dst.top, scale: src.width / dst.width, transformOrigin: '0 0' },
        { x: 0, y: 0, scale: 1, duration: 0.9, ease: 'expo.inOut' }, 0);
    } else {
      tl.fromTo(PV.fig, { opacity: 0, y: reduced() ? 0 : 24 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.1);
    }
    tl.add(panelIn(), reduced() ? 0.1 : 0.42);
    tl.add(() => tagIn(), reduced() ? 0.2 : 0.8);
    tl.fromTo([PV.close, PV.prev, PV.next], { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.45);
    announce(`${p.name}, ${formatPrice(p.price)}`);
  }

  /** Dans la scène Boutique, le portant et l'étagère s'estompent ensemble. */
  function siblingsOf(o) {
    if (o.type !== 'rack' && o.type !== 'shelf') return [];
    const own = o.type === 'rack' ? o.rack : o.shelf;
    const s = Object.values(scenes).find((x) => x.rack === own || x.shelf === own);
    return s ? [s.rack, s.shelf].filter((x) => x && x !== own) : [];
  }

  function loadProduct(p, colorIndex = 0) {
    pv.product = p;
    pv.colorIndex = clamp(colorIndex || 0, 0, p.colors.length - 1);
    pv.side = 'front';
    pv.size = p.sizes.length === 1 ? p.sizes[0] : null;
    pv.qty = 1;
    buildFigure();
    sizeFigure();
    fillPanel();
  }

  const currentColor = () => pv.product.colors[pv.colorIndex];
  const sideSrc = (c, side) => (side === 'back' && c.back ? c.back : side === 'worn' && c.worn ? c.worn : c.front);
  function altFor() {
    const p = pv.product;
    const c = currentColor();
    return `${p.name}, ${c.name}, vue ${pv.side === 'back' ? 'de dos' : pv.side === 'worn' ? 'portée' : 'de face'}`;
  }

  function buildFigure() {
    const p = pv.product;
    const c = currentColor();
    const garment = isGarment(p);
    PV.fig.className = 'pv__fig ' + (garment ? `fig fig--${p.hanger === 'pince' ? 'pince' : 'classique'}` : 'obj');
    const img = `<img class="${garment ? 'garment__img' : 'obj__img'}" src="${esc(c.front)}" alt="${esc(altFor())}" decoding="async" draggable="false">`;
    const amount = formatPrice(p.price).replace(NBSP + 'FCFA', '');
    PV.fig.innerHTML = (garment
      ? `${hangerSVG(p.hanger)}<div class="garment" data-media>${img}</div>`
      : `<div class="obj__media" data-media>${img}</div>`) +
      `<div class="tag" aria-hidden="true"><span class="tag__string"></span>
        <div class="tag__card"><span class="tag__brand">NOMA HERITAGE</span>
        <span class="tag__price">${amount}<br>FCFA</span><span class="tag__meta">${esc(c.name)}</span></div></div>`;
    PV.media = $('[data-media]', PV.fig);
    PV.tag = $('.tag', PV.fig);
    gsap.set(PV.tag, { opacity: 0 });
  }

  /** Taille du vêtement en vue produit selon l'écran. */
  function sizeFigure() {
    if (!pv.product) return;
    const garment = isGarment(pv.product);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const headerH = $('#header').offsetHeight;
    let W;
    if (isMobile()) {
      const availH = vh * 0.44 - headerH - 6; // zone au-dessus du bottom sheet
      W = garment ? availH / 1.4 : Math.min(vw * 0.72, availH / 0.8);
    } else {
      const panelW = PV.panel.offsetWidth || 384;
      const pad = vw < 1100 ? 76 : 104;
      const availW = vw - panelW - pad * 2 - 40;
      const availH = vh - headerH - 44;
      W = garment ? Math.min(availH / 1.4, availW, 540) : Math.min(availW, (availH * 0.72) / 0.8, 620);
    }
    W = Math.max(110, Math.round(W));
    const H = Math.round(garment ? W * 1.4 : W * 0.8);
    PV.fig.style.setProperty('--g-w', W + 'px');
    PV.fig.style.width = W + 'px';
    PV.fig.style.height = H + 'px';
    PV.figwrap.style.width = W + 'px';
    PV.figwrap.style.height = H + 'px';
  }

  function fillPanel() {
    const p = pv.product;
    PV.cat.textContent = (CATEGORY_LABELS[p.category] || '') + (p.isNew ? ' · Nouveau' : '');
    PV.name.textContent = p.name;
    PV.price.textContent = formatPrice(p.price);
    PV.swatches.innerHTML = p.colors.map((c, i) =>
      `<button type="button" class="swatch" data-index="${i}" style="--sw:${esc(c.hex || '#cccccc')}" aria-label="${esc(c.name)}" title="${esc(c.name)}" aria-pressed="${i === pv.colorIndex}"></button>`).join('');
    PV.colorName.textContent = currentColor().name;
    renderSides();
    PV.sizes.className = 'sizes' + (p.sizes.length > 5 ? ' sizes--grid' : '');
    PV.sizes.innerHTML = p.sizes.map((s) =>
      `<button type="button" class="size" data-size="${esc(s)}" aria-pressed="${s === pv.size}">${esc(String(s).toLowerCase() === 'unique' ? 'Taille unique' : s)}</button>`).join('');
    PV.sizeHint.textContent = '';
    PV.qtyValue.textContent = pv.qty;
    resetAddButton();
    PV.details.innerHTML = `<p>${esc(p.description || '')}</p>
      ${p.details && p.details.length ? `<ul>${p.details.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
      <small>Livraison et paiement à convenir sur WhatsApp.</small>`;
    PV.details.hidden = true;
    PV.detailsToggle.setAttribute('aria-expanded', 'false');
    PV.detailsToggle.textContent = 'Voir les détails';
  }

  function renderSides() {
    const c = currentColor();
    const sides = [['front', 'Face']];
    if (c.back) sides.push(['back', 'Dos']);
    if (c.worn) sides.push(['worn', 'Porté']);
    if (!sides.some(([k]) => k === pv.side)) pv.side = 'front';
    PV.sideRow.hidden = sides.length < 2;
    PV.sides.innerHTML = sides.map(([k, label]) => `<button type="button" data-side="${k}" aria-pressed="${k === pv.side}">${label}</button>`).join('');
  }

  /* ---- Panneau : apparition / disparition ---- */
  function panelIn() {
    const tl = gsap.timeline();
    if (isMobile() && !reduced()) tl.fromTo(PV.panel, { yPercent: 100, opacity: 1 }, { yPercent: 0, duration: 0.6, ease: 'power3.out' });
    else tl.fromTo(PV.panel, { opacity: 0, x: reduced() || isMobile() ? 0 : 40 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' });
    tl.fromTo(PV.inner.children, { opacity: 0, y: reduced() ? 0 : 12 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.035, ease: 'power2.out' }, 0.12);
    return tl;
  }
  function panelOut() {
    if (isMobile() && !reduced()) return gsap.to(PV.panel, { yPercent: 100, duration: 0.4, ease: 'power2.in' });
    return gsap.to(PV.panel, { opacity: 0, x: reduced() || isMobile() ? 0 : 30, duration: 0.35, ease: 'power2.in' });
  }

  /* ---- Étiquette en carton : apparition avec balancement ---- */
  function tagIn() {
    if (!PV.tag) return;
    gsap.killTweensOf(PV.tag);
    if (reduced()) { gsap.to(PV.tag, { opacity: 1, duration: 0.3 }); return; }
    gsap.timeline()
      .fromTo(PV.tag, { opacity: 0, rotation: -30, transformOrigin: '0 0' }, { opacity: 1, rotation: 0, duration: 1.6, ease: 'elastic.out(1, 0.3)' })
      .to(PV.tag, { rotation: 3.5, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }

  /** Ferme la vue produit : tout revient à sa place, en animation inverse. */
  function closeProduct() {
    if (!pv.open) return;
    // Fermeture demandée pendant l'ouverture : on termine l'ouverture d'un coup
    const opening = pv.openTl;
    if (pv.busy && opening && typeof opening.isActive === 'function' && opening.isActive()) opening.progress(1);
    if (pv.busy) return;
    pv.busy = true;
    // La page retrouve sa barre de défilement avant la mesure : l'article revient pile à sa place
    lockScroll(false);
    const o = pv.origin;
    let target = null;
    if (o.type === 'rack') { o.rack.settle(); syncOriginImage(); target = o.item.figure; }
    else if (o.type === 'shelf') { syncOriginImage(); target = o.item.lift; }
    if (target && (!target.isConnected || !target.getClientRects().length)) target = null; // élément reconstruit entre-temps

    // Retour sur la face avant
    if (pv.side !== 'front') {
      const img = $$('img', PV.media).pop();
      if (img) img.src = currentColor().front;
      pv.side = 'front';
    }
    gsap.killTweensOf([PV.tag, PV.media]);
    gsap.set(PV.media, { rotationY: 0 });

    const tl = gsap.timeline({ onComplete: finishClose });
    tl.add(panelOut(), 0);
    tl.to([PV.tag, PV.close, PV.prev, PV.next], { opacity: 0, duration: 0.22 }, 0);
    if (target && !reduced()) {
      const dst = PV.fig.getBoundingClientRect();
      const src = target.getBoundingClientRect();
      const curX = Number(gsap.getProperty ? gsap.getProperty(PV.fig, 'x') : 0) || 0;
      const curY = Number(gsap.getProperty ? gsap.getProperty(PV.fig, 'y') : 0) || 0;
      tl.to(PV.fig, {
        x: curX + src.left - dst.left, y: curY + src.top - dst.top, scale: src.width / (dst.width || 1),
        transformOrigin: '0 0', duration: 0.8, ease: 'expo.inOut',
      }, 0.06);
    } else {
      tl.to(PV.fig, { opacity: 0, y: reduced() ? 0 : 20, duration: 0.4, ease: 'power2.in' }, 0.05);
    }
    tl.to(PV.veil, { opacity: 0, duration: 0.55 }, 0.3);
    tl.add(() => {
      if (o.type === 'rack') o.rack.undim();
      else if (o.type === 'shelf') o.shelf.undim();
      (o.siblings || []).forEach((x) => x.undim());
    }, 0.3);
  }

  function finishClose() {
    const o = pv.origin;
    if (o.type === 'rack') o.rack.reveal();
    else if (o.type === 'shelf') o.shelf.reveal();
    PV.root.hidden = true;
    gsap.killTweensOf(PV.tag);
    gsap.set([PV.panel, PV.veil, PV.close, PV.prev, PV.next], { clearProps: 'all' });
    gsap.set(PV.fig, { clearProps: 'transform,opacity' });
    document.body.classList.remove('pv-open');
    pv.open = false;
    pv.busy = false;
    if (pv.lastFocus && document.contains(pv.lastFocus) && pv.lastFocus.getClientRects().length) pv.lastFocus.focus({ preventScroll: true });
  }

  /** Reporte la couleur choisie sur l'article du portant / de l'étagère. */
  function syncOriginImage() {
    const o = pv.origin;
    const it = o.item;
    if (!it || !pv.product) return;
    const idx = o.type === 'rack' ? o.rack.products.indexOf(pv.product) : o.shelf.products.indexOf(pv.product);
    if (idx !== it.index) return;
    const img = $('img', o.type === 'rack' ? it.figure : it.lift);
    const src = currentColor().front;
    if (img && img.getAttribute('src') !== src) img.src = src;
    it.colorIndex = pv.colorIndex;
  }

  /** Flèches ‹ › : produit précédent / suivant, glissement latéral. */
  function navigateProduct(dir) {
    if (!pv.open || pv.busy || pv.list.length < 2) return;
    pv.busy = true;
    const i = pv.list.indexOf(pv.product.id);
    const p = getProduct(pv.list[mod(i + dir, pv.list.length)]);
    preloadProduct(p);
    const o = pv.origin;
    let colorIndex = pv.colorHints && pv.colorHints[p.id] != null ? pv.colorHints[p.id] : 0;

    // En arrière-plan, le portant tourne pour suivre le produit affiché
    if (o.type === 'rack') {
      syncOriginImage();
      const it = o.rack.centerOn(o.rack.products.indexOf(p));
      o.rack.setHidden(it);
      o.item = it;
      colorIndex = it.colorIndex;
    } else if (o.type === 'shelf') {
      syncOriginImage();
      const idx = o.shelf.products.indexOf(p);
      const it = o.shelf.items.find((x) => x.index === idx);
      if (it) { o.shelf.setHidden(it); o.item = it; colorIndex = it.colorIndex; }
    }

    const shift = reduced() ? 0 : Math.min(160, window.innerWidth * 0.12);
    const panelShift = reduced() || isMobile() ? 0 : 14;
    gsap.killTweensOf(PV.tag);
    gsap.timeline({ onComplete: () => { pv.busy = false; } })
      .to(PV.fig, { x: -dir * shift, opacity: 0, duration: 0.3, ease: 'power2.in' }, 0)
      .to(PV.inner, { opacity: 0, x: -dir * panelShift, duration: 0.24, ease: 'power1.in' }, 0)
      .add(() => {
        loadProduct(p, colorIndex);
        gsap.set(PV.fig, { x: dir * shift, y: 0, scale: 1 });
        announce(`${p.name}, ${formatPrice(p.price)}`);
      })
      .to(PV.fig, { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' })
      .fromTo(PV.inner, { opacity: 0, x: dir * panelShift }, { opacity: 1, x: 0, duration: 0.45, ease: 'power2.out' }, '<0.05')
      .add(() => tagIn(), '<0.25');
  }

  /* ---- Couleur : fondu enchaîné ---- */
  function setColor(i) {
    if (i === pv.colorIndex || !pv.product.colors[i]) return;
    pv.colorIndex = i;
    const c = currentColor();
    if ((pv.side === 'back' && !c.back) || (pv.side === 'worn' && !c.worn)) pv.side = 'front';
    crossfade(PV.media, sideSrc(c, pv.side), altFor());
    $$('.swatch', PV.swatches).forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    PV.colorName.textContent = c.name;
    renderSides();
    const meta = $('.tag__meta', PV.fig);
    if (meta) meta.textContent = c.name;
    announce(`Couleur ${c.name}`);
  }

  function crossfade(container, src, alt) {
    const imgs = $$('img', container);
    const old = imgs[imgs.length - 1];
    const img = document.createElement('img');
    img.className = old.className;
    img.decoding = 'async';
    img.draggable = false;
    img.alt = alt;
    img.src = src;
    old.alt = '';
    gsap.set(img, { opacity: 0 });
    container.appendChild(img);
    const run = () => gsap.to(img, {
      opacity: 1, duration: reduced() ? 0.25 : 0.5, ease: 'power1.inOut',
      onComplete: () => $$('img', container).forEach((x) => {
        if (x !== img && x.compareDocumentPosition(img) & Node.DOCUMENT_POSITION_FOLLOWING) x.remove();
      }),
    });
    (img.decode ? img.decode() : Promise.resolve()).then(run, run);
  }

  /* ---- Face / Dos : rotation 3D rapide sur l'axe Y ---- */
  function setSide(side) {
    if (side === pv.side || pv.flipping) return;
    const src = sideSrc(currentColor(), side);
    pv.side = side;
    $$('button', PV.sides).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.side === side)));
    if (reduced()) { crossfade(PV.media, src, altFor()); return; }
    pv.flipping = true;
    const dir = side === 'front' ? -1 : 1;
    const img = $$('img', PV.media).pop();
    gsap.timeline({ onComplete: () => { pv.flipping = false; } })
      .to(PV.media, { rotationY: 90 * dir, transformPerspective: 1200, duration: 0.2, ease: 'power2.in' })
      .add(() => {
        $$('img', PV.media).forEach((x) => { if (x !== img) x.remove(); });
        img.src = src;
        img.alt = altFor();
        gsap.set(img, { opacity: 1 });
      })
      .set(PV.media, { rotationY: -90 * dir })
      .to(PV.media, { rotationY: 0, duration: 0.32, ease: 'power2.out' });
  }

  function setSize(s) {
    pv.size = s;
    $$('.size', PV.sizes).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.size === s)));
    PV.sizeHint.textContent = '';
  }

  function setQty(q) {
    pv.qty = clamp(q, 1, 10);
    PV.qtyValue.textContent = pv.qty;
  }

  function addFromPanel() {
    const p = pv.product;
    if (!pv.size) {
      PV.sizeHint.textContent = 'Choisissez une taille';
      if (!reduced()) gsap.fromTo(PV.sizes, { x: -10 }, { x: 0, duration: 0.7, ease: 'elastic.out(1.2, 0.3)' });
      const first = $('.size', PV.sizes);
      if (first) first.focus();
      return;
    }
    cart.add({ id: p.id, color: currentColor().name, size: pv.size, qty: pv.qty });
    flashAdded(PV.add, 'Ajouté ✓', 'Ajouter au panier');
    announce(`${p.name} ajouté au panier`);
  }

  function flashAdded(btn, okText, baseText) {
    const label = $('.btn__label', btn);
    clearTimeout(btn._timer);
    btn.classList.add('is-added');
    label.textContent = okText;
    if (!reduced()) gsap.fromTo(label, { scale: 0.7, y: 4 }, { scale: 1, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' });
    btn._timer = setTimeout(() => {
      btn.classList.remove('is-added');
      label.textContent = baseText;
    }, 1900);
  }

  function resetAddButton() {
    clearTimeout(PV.add._timer);
    PV.add.classList.remove('is-added');
    $('.btn__label', PV.add).textContent = 'Ajouter au panier';
  }

  function toggleDetails() {
    const open = PV.details.hidden;
    PV.details.hidden = !open;
    PV.detailsToggle.setAttribute('aria-expanded', String(open));
    PV.detailsToggle.textContent = open ? 'Masquer les détails' : 'Voir les détails';
    if (open) {
      if (!reduced()) gsap.fromTo(PV.details, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
      PV.details.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
    }
  }

  /* ---- Bottom sheet mobile : glisser vers le bas pour fermer ---- */
  function initSheetDrag() {
    const handle = PV.panel;
    let startY = 0, dy = 0, lastY = 0, lastT = 0, v = 0, dragging = false, id = null;
    handle.addEventListener('pointerdown', (e) => {
      if (!isMobile() || pv.busy) return;
      // On saisit la poignée, ou l'en-tête de la fiche quand elle n'est pas défilée
      const onGrab = PV.grab.contains(e.target);
      const onHead = PV.panel.scrollTop <= 0 && e.target.closest('.pv__cat, .pv__name, .pv__price');
      if (!onGrab && !onHead) return;
      dragging = true;
      id = e.pointerId;
      startY = lastY = e.clientY;
      lastT = performance.now();
      dy = 0;
      v = 0;
      try { handle.setPointerCapture(id); } catch (err) { /* rien */ }
    });
    handle.addEventListener('pointermove', (e) => {
      if (!dragging || e.pointerId !== id) return;
      const now = performance.now();
      v = (e.clientY - lastY) / Math.max(1, now - lastT);
      lastY = e.clientY;
      lastT = now;
      dy = Math.max(0, e.clientY - startY);
      gsap.set(PV.panel, { y: dy });
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      if (dy > 110 || v > 0.6) closeProduct();
      else gsap.to(PV.panel, { y: 0, duration: 0.45, ease: 'power3.out' });
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  /* ========================================================================
     10. PANIER (localStorage + commande WhatsApp)
     ======================================================================== */
  let CART = {};
  const cart = {
    items: [],

    load() {
      try {
        const raw = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
        this.items = Array.isArray(raw)
          ? raw.filter((it) => it && BY_ID.has(it.id)).map((it) => ({
            id: it.id, color: String(it.color || ''), size: String(it.size || ''), qty: clamp(parseInt(it.qty, 10) || 1, 1, 99),
          }))
          : [];
      } catch (e) {
        this.items = [];
      }
    },

    save() {
      try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items)); } catch (e) { /* stockage indisponible */ }
    },

    key: (it) => `${it.id}|${it.color}|${it.size}`,

    add({ id, color, size, qty = 1 }) {
      const k = this.key({ id, color, size });
      const existing = this.items.find((it) => this.key(it) === k);
      if (existing) existing.qty = clamp(existing.qty + qty, 1, 99);
      else this.items.push({ id, color, size, qty });
      this.save();
      this.render();
      bumpCartIcon();
    },

    setQty(k, qty) {
      const it = this.items.find((x) => this.key(x) === k);
      if (!it) return;
      if (qty <= 0) { this.remove(k); return; }
      it.qty = clamp(qty, 1, 99);
      this.save();
      this.render();
    },

    remove(k) {
      this.items = this.items.filter((x) => this.key(x) !== k);
      this.save();
      this.render();
    },

    count() { return this.items.reduce((s, it) => s + it.qty, 0); },
    total() { return this.items.reduce((s, it) => s + (getProduct(it.id).price * it.qty), 0); },

    render() {
      const count = this.count();
      CART.badge.textContent = count;
      CART.badge.classList.toggle('is-empty', !count);
      CART.openBtn.setAttribute('aria-label', `Ouvrir le panier, ${count} article${count > 1 ? 's' : ''}`);
      CART.countLabel.textContent = count ? `(${count})` : '';
      CART.root.classList.toggle('is-empty', !count);
      CART.list.innerHTML = this.items.map((it) => {
        const p = getProduct(it.id);
        const c = p.colors[colorIndexOf(p, it.color)];
        return `<li class="cart-item" data-key="${esc(this.key(it))}">
          <div class="cart-item__thumb"><img src="${esc(c.front)}" alt="" loading="lazy" decoding="async"></div>
          <div class="cart-item__info">
            <p class="cart-item__name">${esc(p.name)}</p>
            <p class="cart-item__meta">${esc(it.color)} · ${esc(sizeLabel(it.size))}</p>
            <div class="qty qty--sm">
              <button type="button" data-act="dec" aria-label="Retirer un exemplaire de ${esc(p.name)}">−</button>
              <output aria-label="Quantité">${it.qty}</output>
              <button type="button" data-act="inc" aria-label="Ajouter un exemplaire de ${esc(p.name)}">+</button>
            </div>
          </div>
          <div class="cart-item__side">
            <p class="cart-item__price">${formatPrice(p.price * it.qty)}${it.qty > 1 ? `<span class="cart-item__unit">${formatPrice(p.price)} / pièce</span>` : ''}</p>
            <button type="button" class="cart-item__remove" data-act="remove">Retirer</button>
          </div>
        </li>`;
      }).join('');
      CART.total.textContent = formatPrice(this.total());
      CART.whatsapp.href = count ? whatsappURL() : '#';
      CART.whatsapp.setAttribute('aria-disabled', String(!count));
      if (count) CART.whatsapp.removeAttribute('tabindex'); else CART.whatsapp.tabIndex = -1;
    },
  };

  /** Message WhatsApp pré-rempli : articles, tailles, quantités, total. */
  function whatsappMessage() {
    const lines = cart.items.map((it) => {
      const p = getProduct(it.id);
      return `• ${p.name} — ${it.color} — ${sizeLabel(it.size)} — Qté ${it.qty} — ${formatPrice(p.price * it.qty, ' ')}`;
    });
    return [
      'Bonjour Noma Heritage,',
      '',
      'Je souhaite commander :',
      ...lines,
      '',
      `Total : ${formatPrice(cart.total(), ' ')}`,
      '',
      'Merci de me confirmer la disponibilité et la livraison.',
    ].join('\n');
  }
  const whatsappURL = () => `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage())}`;

  function bumpCartIcon() {
    if (reduced()) return;
    const icon = $('svg', CART.openBtn);
    gsap.killTweensOf(icon);
    gsap.timeline()
      .to(icon, { y: -6, scale: 1.18, duration: 0.16, ease: 'power2.out' })
      .to(icon, { y: 0, scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.32)' });
    gsap.fromTo(CART.badge, { scale: 0.3 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
  }

  const drawer = { open: false, lastFocus: null };

  function initCart() {
    CART = {
      root: $('#cart'), panel: $('#cart-panel'), backdrop: $('.drawer__backdrop', $('#cart')),
      list: $('#cart-items'), total: $('#cart-total'), countLabel: $('#cart-count-label'),
      whatsapp: $('#cart-whatsapp'), openBtn: $('#cart-open'), badge: $('#cart-badge'),
    };
    CART.openBtn.addEventListener('click', openCart);
    $$('[data-cart-close]', CART.root).forEach((b) => b.addEventListener('click', closeCart));
    CART.root.addEventListener('keydown', (e) => trapFocus(CART.root, e));
    CART.whatsapp.addEventListener('click', (e) => {
      if (!cart.items.length) { e.preventDefault(); return; }
      CART.whatsapp.href = whatsappURL();
    });
    CART.list.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const li = b.closest('.cart-item');
      const k = li.dataset.key;
      const it = cart.items.find((x) => cart.key(x) === k);
      if (!it) return;
      const act = b.dataset.act;
      const refocus = () => {
        const row = $$('.cart-item', CART.list).find((x) => x.dataset.key === k);
        const btn = row && $(`[data-act="${act}"]`, row);
        (btn || $('[data-cart-close].round-btn', CART.root)).focus({ preventScroll: true });
      };
      if (act === 'inc') { cart.setQty(k, it.qty + 1); refocus(); }
      else if (act === 'dec') { cart.setQty(k, it.qty - 1); refocus(); }
      else {
        gsap.to(li, {
          opacity: 0, x: reduced() ? 0 : 30, duration: 0.3, ease: 'power2.in',
          onComplete: () => { cart.remove(k); refocus(); announce('Article retiré du panier'); },
        });
      }
    });
  }

  function openCart() {
    if (drawer.open) return;
    drawer.open = true;
    drawer.lastFocus = document.activeElement;
    cart.render();
    CART.root.hidden = false;
    lockScroll(true);
    document.body.classList.add('drawer-open');
    CART.openBtn.setAttribute('aria-expanded', 'true');
    gsap.fromTo(CART.backdrop, { opacity: 0 }, { opacity: 1, duration: 0.4 });
    if (reduced()) gsap.fromTo(CART.panel, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    else {
      gsap.fromTo(CART.panel, { xPercent: 100 }, { xPercent: 0, duration: 0.6, ease: 'power3.out' });
      const rows = $$('.cart-item', CART.list);
      if (rows.length) gsap.fromTo(rows, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.05, delay: 0.18, ease: 'power2.out' });
    }
    setTimeout(() => $('[data-cart-close].round-btn', CART.root).focus({ preventScroll: true }), 60);
  }

  function closeCart() {
    if (!drawer.open) return;
    drawer.open = false;
    gsap.to(CART.backdrop, { opacity: 0, duration: 0.35 });
    gsap.to(CART.panel, {
      ...(reduced() ? { opacity: 0 } : { xPercent: 100 }), duration: 0.42, ease: 'power2.in',
      onComplete: () => {
        CART.root.hidden = true;
        gsap.set([CART.panel, CART.backdrop], { clearProps: 'all' });
        lockScroll(false);
        document.body.classList.remove('drawer-open');
        CART.openBtn.setAttribute('aria-expanded', 'false');
        if (drawer.lastFocus && document.contains(drawer.lastFocus)) drawer.lastFocus.focus({ preventScroll: true });
      },
    });
  }

  /* ========================================================================
     11. LOOKBOOK — « Essayez le look »
     ======================================================================== */
  let lookShown = -1;
  let lookItems = [];

  function resolveLookItems(look) {
    return (look.items || []).map((entry) => {
      const id = typeof entry === 'string' ? entry : entry && entry.id;
      const p = getProduct(id);
      if (!p) return null;
      return { p, ci: colorIndexOf(p, typeof entry === 'object' ? entry.color : null) };
    }).filter(Boolean);
  }

  function initLookbook() {
    const section = $('#looks');
    if (!LOOK_LIST.length) { section.hidden = true; return; }
    const row = $('#lookbook-row');
    const vp = $('#lookbook-viewport');
    row.innerHTML = LOOK_LIST.map((look, i) => `<li class="look" data-index="${i}">
        <button type="button" class="look__btn" aria-pressed="false" aria-controls="lookpanel" aria-label="Look ${pad(i + 1)} : ${esc(look.title)}">
          <img src="${esc(look.image)}" alt="${esc(look.alt || `Silhouette du look ${look.title}`)}" loading="lazy" decoding="async" draggable="false">
        </button>
        <p class="look__caption"><span>${pad(i + 1)}</span>${esc(look.title)}</p>
      </li>`).join('');
    const looks = $$('.look', row);
    const drag = dragToScroll(vp);
    let selected = 0;
    let locked = false;

    const focusLook = (i, focusing) => {
      looks.forEach((el, k) => el.classList.toggle('is-active', k === i));
      row.classList.toggle('is-focusing', focusing);
      renderLookPanel(i);
    };

    looks.forEach((el, i) => {
      const btn = $('.look__btn', el);
      el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !drag.dragging) focusLook(i, true); });
      btn.addEventListener('click', () => {
        if (drag.suppress) return;
        selected = i;
        locked = true;
        looks.forEach((x, k) => $('.look__btn', x).setAttribute('aria-pressed', String(k === i)));
        focusLook(i, true);
      });
      btn.addEventListener('focus', () => focusLook(i, true));
    });
    row.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') focusLook(selected, locked); });
    row.addEventListener('focusout', (e) => { if (!row.contains(e.relatedTarget)) focusLook(selected, locked); });
    focusLook(0, false);

    // Ajout direct au panier depuis le panneau « Dans ce look »
    const list = $('#lookpanel-list');
    list.addEventListener('click', (e) => {
      const li = e.target.closest('.lookitem');
      if (!li) return;
      const { p, ci } = lookItems[+li.dataset.k];
      const addBtn = e.target.closest('.lookitem__add');
      if (addBtn) {
        const sel = $('select', li);
        cart.add({ id: p.id, color: p.colors[ci].name, size: sel ? sel.value : p.sizes[0], qty: 1 });
        addBtn.classList.add('is-added');
        addBtn.textContent = '✓';
        clearTimeout(addBtn._timer);
        addBtn._timer = setTimeout(() => { addBtn.classList.remove('is-added'); addBtn.textContent = '+'; }, 1500);
        announce(`${p.name} ajouté au panier`);
      } else if (e.target.closest('.lookitem__thumb')) {
        const hints = {};
        lookItems.forEach((x) => { hints[x.p.id] = x.ci; });
        openProduct(p.id, { list: lookItems.map((x) => x.p.id), colorIndex: ci, colorHints: hints });
      }
    });

    $('#lookpanel-all').addEventListener('click', (e) => {
      $$('.lookitem', list).forEach((li) => {
        const { p, ci } = lookItems[+li.dataset.k];
        const sel = $('select', li);
        cart.add({ id: p.id, color: p.colors[ci].name, size: sel ? sel.value : p.sizes[0], qty: 1 });
      });
      const btn = e.currentTarget;
      const old = btn.textContent;
      btn.textContent = 'Look ajouté ✓';
      clearTimeout(btn._timer);
      btn._timer = setTimeout(() => { btn.textContent = old; }, 1800);
      announce('Le look complet a été ajouté au panier');
    });
  }

  function renderLookPanel(i) {
    if (i === lookShown) return;
    lookShown = i;
    const look = LOOK_LIST[i];
    lookItems = resolveLookItems(look);
    $('#lookpanel-title').textContent = `Look ${pad(i + 1)} — ${look.title}`;
    const list = $('#lookpanel-list');
    list.innerHTML = lookItems.map(({ p, ci }, k) => {
      const c = p.colors[ci];
      const def = p.sizes.includes('M') ? 'M' : p.sizes.includes('38') ? '38' : p.sizes[0];
      const sizeCtrl = p.sizes.length > 1
        ? `<select class="lookitem__size" aria-label="Taille pour ${esc(p.name)}">${p.sizes.map((s) => `<option${s === def ? ' selected' : ''}>${esc(s)}</option>`).join('')}</select>`
        : '';
      return `<li class="lookitem" data-k="${k}">
        <button type="button" class="lookitem__thumb" aria-label="Voir ${esc(p.name)}"><img src="${esc(c.front)}" alt="" loading="lazy" decoding="async"></button>
        <div><p class="lookitem__name">${esc(p.name)}</p><p class="lookitem__meta">${esc(c.name)} · ${formatPrice(p.price)}</p></div>
        <div class="lookitem__actions">${sizeCtrl}<button type="button" class="lookitem__add" aria-label="Ajouter ${esc(p.name)} au panier">+</button></div>
      </li>`;
    }).join('');
    $('#lookpanel-total').textContent = formatPrice(lookItems.reduce((s, x) => s + x.p.price, 0));
    if (!reduced()) gsap.fromTo($$('.lookitem', list), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' });
  }

  /** Défilement horizontal par glisser à la souris (le tactile utilise le défilement natif). */
  function dragToScroll(vp) {
    const state = { dragging: false, suppress: false };
    let down = false, startX = 0, startLeft = 0;
    vp.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true;
      startX = e.clientX;
      startLeft = vp.scrollLeft;
    });
    vp.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!state.dragging && Math.abs(dx) > 5) {
        state.dragging = true;
        vp.classList.add('is-dragging');
        try { vp.setPointerCapture(e.pointerId); } catch (err) { /* rien */ }
      }
      if (state.dragging) vp.scrollLeft = startLeft - dx;
    });
    const up = () => {
      if (!down) return;
      down = false;
      if (state.dragging) {
        state.suppress = true;
        setTimeout(() => { state.suppress = false; }, 0);
        vp.classList.remove('is-dragging');
        state.dragging = false;
      }
    };
    vp.addEventListener('pointerup', up);
    vp.addEventListener('pointercancel', up);
    vp.addEventListener('dragstart', (e) => e.preventDefault());
    return state;
  }

  /* ========================================================================
     12. RECHERCHE
     ======================================================================== */
  const search = { open: false, ids: [], lastFocus: null };

  function initSearch() {
    const root = $('#search');
    const input = $('#search-input');
    const results = $('#search-results');
    const status = $('#search-status');
    const openBtn = $('#search-open');

    const render = () => {
      const terms = normalize(input.value.trim()).split(/\s+/).filter(Boolean);
      const list = CATALOGUE.filter((p) => {
        const hay = normalize([p.name, CATEGORY_LABELS[p.category], p.description, ...p.colors.map((c) => c.name)].join(' '));
        return terms.every((t) => hay.includes(t));
      });
      search.ids = list.map((p) => p.id);
      status.textContent = !terms.length
        ? `Toute la collection · ${list.length} pièces`
        : list.length ? `${list.length} résultat${list.length > 1 ? 's' : ''}` : 'Aucun résultat';
      results.innerHTML = list.map((p) => `<li><button type="button" class="result" data-id="${esc(p.id)}">
          <span class="result__thumb"><img src="${esc(p.colors[0].front)}" alt="" loading="lazy" decoding="async"></span>
          <span class="result__name">${esc(p.name)}</span>
          <span class="result__meta">${esc(CATEGORY_LABELS[p.category] || '')} · ${formatPrice(p.price)}</span>
        </button></li>`).join('');
    };

    const open = () => {
      if (search.open) return;
      search.open = true;
      search.lastFocus = document.activeElement;
      root.hidden = false;
      lockScroll(true);
      openBtn.setAttribute('aria-expanded', 'true');
      render();
      gsap.fromTo($('.search__backdrop', root), { opacity: 0 }, { opacity: 1, duration: 0.35 });
      gsap.fromTo('#search-panel', { opacity: 0, y: reduced() ? 0 : -18 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' });
      setTimeout(() => input.focus(), 30);
    };

    search.close = (instant = false) => {
      if (!search.open) return;
      search.open = false;
      const finish = () => {
        root.hidden = true;
        gsap.set(['#search-panel', $('.search__backdrop', root)], { clearProps: 'all' });
        lockScroll(false);
        openBtn.setAttribute('aria-expanded', 'false');
        if (search.lastFocus && document.contains(search.lastFocus)) search.lastFocus.focus({ preventScroll: true });
      };
      if (instant) { finish(); return; }
      gsap.to($('.search__backdrop', root), { opacity: 0, duration: 0.25 });
      gsap.to('#search-panel', { opacity: 0, y: reduced() ? 0 : -12, duration: 0.25, onComplete: finish });
    };

    openBtn.addEventListener('click', open);
    $$('[data-search-close]', root).forEach((b) => b.addEventListener('click', () => search.close()));
    input.addEventListener('input', render);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && search.ids.length) { e.preventDefault(); const id = search.ids[0]; search.close(true); openProduct(id, { list: search.ids }); }
    });
    results.addEventListener('click', (e) => {
      const b = e.target.closest('.result');
      if (!b) return;
      const ids = search.ids.slice();
      search.close(true);
      openProduct(b.dataset.id, { list: ids });
    });
    results.addEventListener('pointerover', (e) => {
      const b = e.target.closest('.result');
      if (b) preloadProduct(getProduct(b.dataset.id));
    });
    root.addEventListener('keydown', (e) => trapFocus(root, e));
  }

  /* ========================================================================
     13. HERO : titre, parallaxe au scroll, intro
     ======================================================================== */
  function splitHeroTitle() {
    const h1 = $('#hero-title');
    h1.setAttribute('aria-label', 'Noma Heritage');
    $$('.hero__word', h1).forEach((w) => {
      const text = w.textContent;
      w.setAttribute('aria-hidden', 'true');
      w.innerHTML = [...text].map((ch) => `<span class="hero__char">${esc(ch)}</span>`).join('');
    });
  }

  /** Ajuste le grand titre à la largeur de l'écran (sans dépasser une hauteur raisonnable). */
  function fitHeroTitle() {
    const h1 = $('#hero-title');
    const wrap = h1.parentElement;
    const cs = getComputedStyle(wrap);
    const avail = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    h1.style.fontSize = '100px';
    const words = $$('.hero__word', h1);
    const w = isMobile() ? Math.max(...words.map((x) => x.offsetWidth)) : h1.offsetWidth;
    let fs = (100 * avail) / Math.max(1, w);
    fs = Math.min(fs, window.innerHeight * (isMobile() ? 0.13 : 0.24), 320);
    document.documentElement.style.setProperty('--title-fs', fs.toFixed(2) + 'px');
    h1.style.fontSize = '';
  }

  function initHeroScroll() {
    const header = $('#header');
    const title = $('#hero-title');
    const hero = $('#boutique');

    if (ScrollTrigger) {
      // Le nom géant remonte et s'estompe au scroll ; le logo du header reste visible
      gsap.to(title, { yPercent: reduced() ? 0 : -45, opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '40% top', scrub: true } });
    }

    let lastY = window.scrollY;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      header.classList.toggle('is-solid', y > hero.offsetHeight * 0.3);
      const dy = y - lastY;
      lastY = y;
      // Sur ordinateur, la molette fait aussi glisser le portant pendant qu'on quitte le hero
      if (dy && !isTouch() && !reduced() && y < hero.offsetHeight && !pv.open) {
        const r = activeRack();
        if (r && !r.dimmed && r.loop) r.target -= dy * 0.5;
      }
    }, { passive: true });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => { heroVisible = entries[0].isIntersecting; }).observe(hero);
    }
  }

  function intro() {
    const rack = activeRack();
    const cap = $('#stage-caption');
    const nav = $('#catnav');
    if (reduced()) {
      gsap.fromTo(['#hero-title', '#stage', cap, nav], { opacity: 0 }, { opacity: 1, duration: 0.8, stagger: 0.1, clearProps: 'opacity' });
      return;
    }
    const tl = gsap.timeline({ delay: 0.1 })
      .fromTo('.hero__char', { yPercent: 115 }, { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.04 }, 0)
      .fromTo([cap, nav], { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1, clearProps: 'transform,opacity' }, 1.2);
    if (rack) {
      rack.prepEntrance();
      tl.fromTo(rack.rail, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 1.2, ease: 'power3.inOut', clearProps: 'transform' }, 0.25)
        .add(() => rack.entrance(), 0.8);
    } else {
      sceneEntrance(sceneKey(currentCat));
    }
  }

  /* ========================================================================
     14. REDIMENSIONNEMENT
     ======================================================================== */
  const onResize = debounce(() => {
    fitHeroTitle();
    const mobileNow = isMobile();
    if (mobileNow !== lastMobile && currentCat) {
      lastMobile = mobileNow;
      populateShelf(currentCat);
    }
    Object.values(scenes).forEach((s) => { if (s.rack && s.rack.active) s.rack.measure(); });
    caption.refresh();
    moveIndicator(true);
    if (pv.open) sizeFigure();
  }, 120);

  /* ========================================================================
     15. DÉMARRAGE
     ======================================================================== */
  function init() {
    if (!CATALOGUE.length) console.warn('[Noma Heritage] Aucun produit valide dans js/products.js');
    caption.init();
    splitHeroTitle();
    fitHeroTitle();
    setupScenes();
    initCatnav();
    initProductView();
    initCart();
    cart.load();
    cart.render();
    initSearch();
    initLookbook();
    initHeroScroll();
    switchScene(DEFAULT_SCENE, { instant: true });
    intro();

    // Une seule boucle d'animation pour tous les portants
    gsap.ticker.add(() => {
      if (!heroVisible) return;
      const ratio = clamp(gsap.ticker.deltaRatio ? gsap.ticker.deltaRatio(60) : 1, 0.2, 4);
      Object.values(scenes).forEach((s) => { if (s.rack) s.rack.tick(ratio); });
    });

    // Raccourcis clavier globaux
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (search.open) search.close();
        else if (drawer.open) closeCart();
        else if (pv.open) closeProduct();
        return;
      }
      if (pv.open && !drawer.open && !search.open && !/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) {
        if (e.key === 'ArrowLeft') navigateProduct(-1);
        else if (e.key === 'ArrowRight') navigateProduct(1);
      }
    });

    window.addEventListener('resize', onResize);
    if ('ResizeObserver' in window) {
      new ResizeObserver(debounce(() => {
        Object.values(scenes).forEach((s) => { if (s.rack && s.rack.active) s.rack.measure(); });
      }, 80)).observe($('#stage'));
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        fitHeroTitle();
        moveIndicator(true);
        if (ScrollTrigger) ScrollTrigger.refresh();
      });
    }

    // Pied de page
    $('#year').textContent = new Date().getFullYear();
    $('#link-whatsapp').href = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}`;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
