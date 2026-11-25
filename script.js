'use strict';
/* script.js – JavaScript unique du site Jade Clean
   1. Commun : menu burger, thème clair/sombre, validation (toutes les pages)
   2. Comptes et session (JCAuth) : connexion, création de compte, données de l'espace client
   3. Connexion     (actif seulement sur connexion.html)
   4. Avis          (actif seulement sur avis.html)
   5. Contact       (actif seulement sur contact.html)
   6. Espace client (actif seulement sur espace_client.html) */

/* common.js – menu burger, thème clair/sombre, validation de formulaire (toutes les pages) */
(function () {
        var body = document.body;

    /* ---------- Thème ---------- */
    try { if (localStorage.getItem('theme') === 'light') body.classList.add('light-mode'); } catch (e) { /* stockage indisponible */ }
    var toggle = document.getElementById('theme-toggle');
    var fab = document.getElementById('theme-fab');

    function syncTheme() {
        var light = body.classList.contains('light-mode');
        if (toggle) toggle.checked = light;
        if (fab) {
            fab.textContent = light ? '🌙' : '☀️';
            fab.setAttribute('aria-label', light ? 'Passer en mode sombre' : 'Passer en mode clair');
        }
    }
    function setTheme(light) {
        body.classList.toggle('light-mode', light);
        try { localStorage.setItem('theme', light ? 'light' : 'dark'); } catch (e) { /* ignore */ }
        syncTheme();
    }
    if (toggle) toggle.addEventListener('change', function () { setTheme(toggle.checked); });
    if (fab) {
        fab.addEventListener('click', function () { setTheme(!body.classList.contains('light-mode')); });
        window.addEventListener('scroll', function () { fab.classList.toggle('visible', window.scrollY > 200); }, { passive: true });
    }
    syncTheme();

    /* ---------- Menu burger ---------- */
    var btn = document.getElementById('menu-btn');
    var nav = document.getElementById('main-nav');
    function setMenu(open) {
        btn.classList.toggle('active', open);
        nav.classList.toggle('active', open);
        btn.setAttribute('aria-expanded', String(open));
        btn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
        body.style.overflow = open ? 'hidden' : '';
    }
    if (btn && nav) {
        btn.addEventListener('click', function () { setMenu(!nav.classList.contains('active')); });
        nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
        window.addEventListener('resize', function () { if (window.innerWidth >= 768) setMenu(false); });
    }

    /* ---------- Validation de formulaire (messages en français) ---------- */
    function clearErrors(form) {
        form.querySelectorAll('.field-error').forEach(function (n) { n.remove(); });
        form.querySelectorAll('[aria-invalid]').forEach(function (n) { n.removeAttribute('aria-invalid'); n.removeAttribute('aria-describedby'); });
    }
    function validate(form) {
        clearErrors(form);
        var first = null;
        form.querySelectorAll('input, select, textarea').forEach(function (el) {
            if (el.type === 'radio' && el.name && form.querySelector('input[name="' + el.name + '"][data-required]') !== el && !el.dataset.required) return;
            if (!el.willValidate || el.checkValidity()) return;
            var msg = el.validity.valueMissing ? (el.dataset.required || 'Ce champ est obligatoire.') : (el.title || el.validationMessage);
            var err = document.createElement('p');
            err.className = 'field-error';
            err.id = 'err-' + (el.id || el.name);
            err.textContent = msg;
            (el.closest('.form-group, .input-field') || el.parentNode).appendChild(err);
            el.setAttribute('aria-invalid', 'true');
            el.setAttribute('aria-describedby', err.id);
            if (!first) first = el;
        });
        if (first) first.focus();
        return !first;
    }
    function status(el, text, ok) {
        if (!el) return;
        el.textContent = text;
        el.className = 'form-status ' + (ok ? 'ok' : 'ko');
        el.focus();
    }
    window.JC = { validate: validate, status: status, clearErrors: clearErrors };
})();

/* ===== Comptes, session et données =====
   Prototype sans serveur : comptes et données sont enregistrés dans le navigateur (localStorage).
   Pour la mise en production avec de vrais utilisateurs, remplacez les fonctions de JCAuth
   (login, signup, addUser, session, saveHotel) par des appels à votre API sécurisée. */
const JCAuth = (() => {
  const K_USERS = 'jc-users', K_HOTELS = 'jc-hotels', K_SESSION = 'jc-session', K_TRY = 'jc-attempts';
  const TTL = 12 * 3600 * 1000; /* durée de session : 12 h */
  const read = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
  const pad = n => String(n).padStart(2, '0');
  const toISO = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const iso = (n = 0) => { const d = new Date(); d.setDate(d.getDate() + n); return toISO(d); };
  const norm = e => String(e).trim().toLowerCase();
  const emptyData = () => ({ seq: { id: 100, dev: 1, fac: 1 }, prestations: [], devis: [], rapports: [], factures: [], abonnement: null, demandes: [] });

  /* Données de démonstration (dates calculées par rapport à aujourd'hui) */
  const seedData = () => ({
    seq: { id: 200, dev: 19, fac: 42 },
    prestations: [
      { id: 1, t: 'Nettoyage quotidien', d: iso(3), h: 'Matin (7h - 12h)', z: 'Étages 1 à 4', s: 'Planifiée', qte: '48 chambres', price: 0, hrs: 24 },
      { id: 2, t: 'Rangements', d: iso(4), h: 'Après-midi (12h - 18h)', z: 'Dressings, étage 5', s: 'Planifiée', qte: '6 heures', price: 0, hrs: 6 },
      { id: 3, t: 'Remise à blanc', d: iso(7), h: 'Matin (7h - 12h)', z: '24 chambres, étage 2', s: 'Planifiée', qte: '24 chambres', price: 1800 },
      { id: 4, t: 'Nettoyage des vitres', d: iso(11), h: 'Après-midi (12h - 18h)', z: 'Façade intérieure, patio', s: 'Planifiée', qte: '120 m²', price: 480 },
      { id: 5, t: 'Nettoyage quotidien', d: iso(0), h: 'Matin (7h - 12h)', z: 'Étages 1 à 4', s: 'En cours', qte: '48 chambres', price: 0, hrs: 24 },
      { id: 6, t: 'Traitement des textiles', d: iso(9), h: 'À confirmer', z: 'Rideaux et voilages', s: 'Demandée' },
      { id: 7, t: 'Remise à blanc', d: iso(-23), h: 'Matin (7h - 12h)', z: '20 chambres, étage 3', s: 'Terminée', qte: '20 chambres', price: 1500 },
      { id: 8, t: 'Nettoyage des vitres', d: iso(-19), h: 'Après-midi (12h - 18h)', z: 'Façade, patio', s: 'Terminée', qte: '100 m²', price: 400 }
    ],
    devis: [
      { id: 11, r: 'DEV-2026-018', t: 'Remise à blanc', z: 'suites du 5e étage', p: 1840, e: iso(-19), x: iso(11), n: 'Proposition valable 30 jours. 24 chambres, linge et produits inclus.', s: 'À valider' },
      { id: 12, r: 'DEV-2026-014', t: 'Traitement des textiles', z: 'rideaux et voilages', p: 960, e: iso(-8), x: iso(22), n: 'Prestation réalisée sur deux jours, produits respectueux des fibres délicates.', s: 'À valider' }
    ],
    rapports: [
      { id: 21, t: 'Remise à blanc — étage 3', d: iso(-23), n: '20 chambres traitées. Deux matelas signalés à remplacer.', lu: false },
      { id: 22, t: 'Nettoyage des vitres — façade', d: iso(-19), n: 'Façade intérieure et patio. Aucune anomalie.', lu: true }
    ],
    factures: [
      { id: 31, r: 'FAC-2026-041', t: 'Abonnement annuel — mois en cours', m: 2450, x: iso(6), s: 'En attente' },
      { id: 32, r: 'FAC-2026-036', t: 'Abonnement annuel — mois précédent', m: 2450, x: iso(-24), s: 'Payée' },
      { id: 33, r: 'FAC-2026-033', t: 'Remise à blanc — étage 3', m: 1500, x: iso(-14), s: 'En retard' }
    ],
    abonnement: { plan: 'prestige', debut: '2026-01-01', fin: '2026-12-31', used: 186 },
    demandes: []
  });

  async function hash(pw, email) {
    const s = 'jade-clean:' + email + ':' + pw;
    if (window.crypto && window.crypto.subtle) {
      const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    let h = 5381; for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
    return 'x' + (h >>> 0).toString(16);
  }

  async function ensureSeed() {
    if (read(K_USERS, null)) return;
    const mk = async (email, nom, role) => ({ email, nom, role, hotel: 'h-prestige', hash: await hash('Jade2026!', email) });
    write(K_USERS, [
      await mk('directeur@hotel-prestige.fr', 'Marie Laurent', 'Directeur'),
      await mk('gouvernante@hotel-prestige.fr', 'Sophie Martin', 'Gouvernante'),
      await mk('comptabilite@hotel-prestige.fr', 'Paul Girard', 'Comptabilité')
    ]);
    write(K_HOTELS, { 'h-prestige': { id: 'h-prestige', nom: 'Hôtel Le Prestige', email: 'contact@hotel-prestige.fr', tel: '01 23 45 67 89', data: seedData() } });
  }

  async function login(email, pw) {
    email = norm(email);
    const a = read(K_TRY, { n: 0, until: 0 });
    if (a.until > Date.now()) return { ok: false, error: 'Trop de tentatives. Réessayez dans ' + Math.ceil((a.until - Date.now()) / 1000) + ' secondes.' };
    await ensureSeed();
    const u = read(K_USERS, []).find(x => x.email === email);
    if (!u || u.hash !== await hash(pw, email)) {
      const n = a.n + 1;
      write(K_TRY, n >= 5 ? { n: 0, until: Date.now() + 60000 } : { n, until: 0 });
      return { ok: false, error: 'E-mail ou mot de passe incorrect.' };
    }
    write(K_TRY, { n: 0, until: 0 });
    if (!write(K_SESSION, { email, exp: Date.now() + TTL })) return { ok: false, error: 'Connexion impossible : le stockage du navigateur est désactivé.' };
    return { ok: true };
  }

  async function signup(f) {
    await ensureSeed();
    const email = norm(f.email), users = read(K_USERS, []);
    if (users.some(u => u.email === email)) return { ok: false, error: 'Un compte existe déjà avec cette adresse e-mail.' };
    const id = 'h-' + Date.now().toString(36);
    const hotels = read(K_HOTELS, {});
    hotels[id] = { id, nom: f.etab.trim(), email, tel: (f.tel || '').trim(), data: emptyData() };
    users.push({ email, nom: f.nom.trim(), role: 'Directeur', hotel: id, hash: await hash(f.pw, email) });
    if (!write(K_HOTELS, hotels) || !write(K_USERS, users)) return { ok: false, error: 'Création impossible : le stockage du navigateur est désactivé.' };
    write(K_SESSION, { email, exp: Date.now() + TTL });
    return { ok: true };
  }

  async function addUser(hotelId, f) {
    const email = norm(f.email), users = read(K_USERS, []);
    if (users.some(u => u.email === email)) return { ok: false, error: 'Un compte existe déjà avec cette adresse e-mail.' };
    users.push({ email, nom: f.nom.trim(), role: f.role, hotel: hotelId, hash: await hash(f.pw, email) });
    return write(K_USERS, users) ? { ok: true } : { ok: false, error: 'Enregistrement impossible.' };
  }

  function session() {
    const s = read(K_SESSION, null);
    if (!s || s.exp < Date.now()) return null;
    const user = read(K_USERS, []).find(u => u.email === s.email);
    const hotel = user && read(K_HOTELS, {})[user.hotel];
    if (!hotel) return null;
    const d = hotel.data = Object.assign(emptyData(), hotel.data || {});
    d.seq = Object.assign({ id: 100, dev: 1, fac: 1 }, d.seq);
    return { user, hotel };
  }

  const logout = () => { try { localStorage.removeItem(K_SESSION); } catch { /* ignore */ } };
  const saveHotel = h => { const all = read(K_HOTELS, {}); all[h.id] = h; return write(K_HOTELS, all); };
  const usersOf = hotelId => read(K_USERS, []).filter(u => u.hotel === hotelId);

  /* Bouton d'en-tête : « SE CONNECTER » devient « MON ESPACE » une fois connecté */
  if (session()) document.querySelectorAll('a.btn-login:not(#logout-link)').forEach(a => { a.textContent = 'MON ESPACE'; a.setAttribute('href', 'espace_client.html'); });

  return { login, signup, addUser, session, logout, saveHotel, usersOf, iso, toISO };
})();

/* ===== connexion (uniquement sur connexion.html) ===== */
if (document.getElementById('login-form')) {
(() => {
  const $ = id => document.getElementById(id);
  const NEXT = 'espace_client.html';
  if (JCAuth.session()) { window.location.replace(NEXT); return; }

  const forms = { login: $('login-form'), signup: $('signup-form') };
  const subs = { login: 'Connectez-vous pour suivre vos prestations.', signup: 'Créez le compte de votre établissement.' };

  document.querySelectorAll('.role-btn').forEach(b => b.addEventListener('click', () => {
    const mode = b.dataset.mode;
    document.querySelectorAll('.role-btn').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    forms.login.hidden = mode !== 'login';
    forms.signup.hidden = mode !== 'signup';
    $('login-sub').textContent = subs[mode];
  }));

  document.querySelectorAll('.toggle-password').forEach(b => b.addEventListener('click', () => {
    const input = b.parentNode.querySelector('input');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    b.setAttribute('aria-label', show ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
  }));

  async function run(form, btn, action, okText) {
    const st = form.querySelector('.form-status');
    if (!JC.validate(form)) { JC.status(st, 'Merci de corriger les champs signalés.', false); return; }
    const label = btn.textContent;
    btn.disabled = true; btn.textContent = 'PATIENTEZ…';
    try {
      const r = await action();
      if (r.ok) { JC.status(st, okText, true); window.location.replace(NEXT); return; }
      JC.status(st, r.error, false);
    } catch { JC.status(st, 'Une erreur est survenue. Réessayez dans un instant.', false); }
    btn.disabled = false; btn.textContent = label;
  }

  forms.login.addEventListener('submit', e => {
    e.preventDefault();
    run(forms.login, forms.login.querySelector('.btn-submit'), () => JCAuth.login($('l-email').value, $('l-pw').value), 'Connexion réussie…');
  });

  forms.signup.addEventListener('submit', e => {
    e.preventDefault();
    const pw = $('s-pw'), pw2 = $('s-pw2');
    pw2.setCustomValidity(pw.value !== pw2.value ? 'Les mots de passe ne correspondent pas.' : '');
    run(forms.signup, forms.signup.querySelector('.btn-submit'), () => JCAuth.signup({
      etab: $('s-etab').value, nom: $('s-nom').value, email: $('s-email').value, tel: $('s-tel').value, pw: pw.value
    }), 'Compte créé, bienvenue…');
  });
})();
}

/* ===== avis (uniquement sur sa page) ===== */
if (document.getElementById('avis-form')) {
(() => {
  /* ----------------------------------------------------------------
     CONFIGURATION
     ENDPOINT : adresse qui reçoit les nouveaux avis (votre API).
     Tant qu'elle est vide, le formulaire fonctionne en mode démonstration
     (validation et confirmation, sans envoi réel).
     AVIS : exemples fictifs à remplacer par les avis validés, issus de
     votre base de données.
     ---------------------------------------------------------------- */
  const ENDPOINT = '';
  const PAGE_SIZE = window.matchMedia('(min-width: 1100px)').matches ? 6 : 4; // 6 cartes = 2 rangées de 3 sur ordinateur
  const AVIS = [
    { n: 'Claire M.', r: 'Gouvernante générale', h: 'Palace parisien', d: '2026-09-18', note: 5, type: 'Remise à blanc', t: 'Des équipes ponctuelles et discrètes. Vingt-quatre chambres remises à blanc en une journée, sans aucune remarque de nos clients.' },
    { n: 'Thomas B.', r: 'Directeur d’exploitation', h: 'Hôtel 5 étoiles, Côte d’Azur', d: '2026-09-02', note: 5, type: 'Abonnement annuel', t: 'Le suivi depuis l’espace client nous fait gagner un temps précieux. Les rapports après chaque intervention sont clairs et précis.' },
    { n: 'Sophie L.', r: 'Gouvernante', h: 'Hôtel de luxe, Lyon', d: '2026-08-21', note: 4, type: 'Nettoyage quotidien', t: 'Un travail soigné au quotidien. Nous avons simplement ajusté les créneaux au début, et l’équipe s’est adaptée très rapidement.' },
    { n: 'Marc D.', r: 'Directeur', h: 'Boutique-hôtel, Bordeaux', d: '2026-08-05', note: 5, type: 'Vitrerie', t: 'Façade et patio impeccables. Les devis sont détaillés et les délais annoncés ont toujours été tenus.' },
    { n: 'Isabelle R.', r: 'Responsable des achats', h: 'Groupe hôtelier', d: '2026-07-19', note: 5, type: 'Abonnement annuel', t: 'La grille de prestations et la facturation sont lisibles. Un partenaire fiable pour plusieurs de nos établissements.' },
    { n: 'Julien P.', r: 'Gouverneur général', h: 'Hôtel 4 étoiles, Strasbourg', d: '2026-07-03', note: 4, type: 'Traitement des textiles', t: 'Rideaux et voilages traités avec beaucoup de soin. Prestation en deux jours, sans gêne pour la clientèle.' },
    { n: 'Nadia K.', r: 'Gouvernante générale', h: 'Palace, Paris', d: '2026-06-14', note: 5, type: 'Nettoyage quotidien', t: 'Réactivité exemplaire lors d’une demande urgente un week-end. L’équipe est intervenue en moins de deux heures.' },
    { n: 'Paul V.', r: 'Directeur', h: 'Hôtel de charme, Annecy', d: '2026-05-28', note: 5, type: 'Remise à blanc', t: 'Une remise à blanc avant la haute saison réalisée avec rigueur. Nous renouvelons notre abonnement.' }
  ];

  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = iso => new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const fmtNum = n => n.toFixed(1).replace('.', ',');
  const stars = n => `<span class="stars" role="img" aria-label="Note : ${n} sur 5"><span aria-hidden="true">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span></span>`;
  const initials = name => name.split(/[\s.]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');

  /* ---------- Note moyenne ---------- */
  const average = AVIS.reduce((s, a) => s + a.note, 0) / AVIS.length;
  $('score').textContent = fmtNum(average);
  $('score-stars').innerHTML = stars(Math.round(average));
  $('score-count').textContent = 'Basé sur ' + AVIS.length + ' avis vérifiés';
  $('bars').innerHTML = [5, 4, 3, 2, 1].map(n => {
    const c = AVIS.filter(a => a.note === n).length;
    return `<li><span>${n} ★</span><span class="bar"><i style="width:${Math.round(c / AVIS.length * 100)}%"></i></span><span>${c}</span></li>`;
  }).join('');

  /* ---------- Liste filtrable ---------- */
  const types = ['Toutes', ...new Set(AVIS.map(a => a.type))];
  let filter = 'Toutes', shown = PAGE_SIZE;

  const card = a => `<article class="avis-card"><div class="avis-top"><time datetime="${a.d}">${fmtDate(a.d)}</time>${stars(a.note)}</div><span class="quote" aria-hidden="true">“</span><blockquote><p>${esc(a.t)}</p></blockquote><footer class="avis-author"><span class="avatar" aria-hidden="true">${initials(a.n)}</span><span><strong>${esc(a.n)}</strong><small>${esc(a.r)} · ${esc(a.h)}</small></span></footer><span class="avis-tag">${esc(a.type)}</span></article>`;

  function renderList() {
    const list = AVIS.filter(a => filter === 'Toutes' || a.type === filter);
    $('avis-list').innerHTML = list.slice(0, shown).map(card).join('');
    $('avis-count').textContent = list.length + ' avis' + (filter === 'Toutes' ? '' : ' · ' + filter);
    $('more').hidden = shown >= list.length;
  }
  function renderFilters() {
    $('filters').innerHTML = types.map(t => `<button type="button" class="chip" aria-pressed="${t === filter}" data-f="${esc(t)}">${esc(t)}</button>`).join('');
  }
  $('filters').addEventListener('click', e => {
    const b = e.target.closest('[data-f]');
    if (!b) return;
    filter = b.dataset.f;
    shown = PAGE_SIZE;
    renderFilters();
    renderList();
  });
  $('more').addEventListener('click', () => {
    const previous = $('avis-list').children.length;
    shown += PAGE_SIZE;
    renderList();
    const next = $('avis-list').children[previous];
    if (next) next.querySelector('blockquote').setAttribute('tabindex', '-1'), next.querySelector('blockquote').focus();
  });
  renderFilters();
  renderList();

/* ---------- Formulaire d'avis ---------- */
  const form = $('avis-form');
  const status = $('form-status');
  const submitBtn = form.querySelector('.btn-submit');
  const fields = [...form.querySelectorAll('input, select, textarea')].filter(f => f.id !== 'website');

  function errorBox(field) {
    const id = 'err-' + (field.type === 'radio' ? 'note' : field.id);
    let box = $(id);
    if (!box) {
      box = document.createElement('span');
      box.id = id;
      box.className = 'field-error';
      field.closest('.form-group').append(box);
    }
    if (field.type !== 'radio') field.setAttribute('aria-describedby', id);
    return box;
  }

  function check(field, liveTyping = false) {
    const group = field.closest('.form-group');
    const isRadio = field.type === 'radio';
    const target = isRadio ? form.querySelector('input[name="note"]') : field;
    const trimmed = isRadio ? '' : field.value.trim();
    const meetsMin = !(field.minLength > 0 && trimmed.length < field.minLength);
    const valid = target.validity.valid && (liveTyping ? true : meetsMin);
    const box = errorBox(target);
    const hasValue = isRadio ? Boolean(form.querySelector('input[name="note"]:checked')) : (field.type === 'checkbox' ? field.checked : trimmed !== '');

    group.classList.toggle('has-error', !valid);
    group.classList.toggle('is-valid', valid && meetsMin && hasValue && !isRadio && field.type !== 'checkbox');

    if (valid) {
      box.textContent = '';
      if (isRadio) form.querySelectorAll('input[name="note"]').forEach(r => r.removeAttribute('aria-invalid'));
      else field.removeAttribute('aria-invalid');
    } else {
      box.textContent = target.validity.valueMissing
        ? (target.dataset.required || 'Veuillez remplir ce champ obligatoire.')
        : (target.title || 'Format invalide.');
      if (isRadio) form.querySelectorAll('input[name="note"]').forEach(r => r.setAttribute('aria-invalid', 'true'));
      else field.setAttribute('aria-invalid', 'true');
    }
    return valid && meetsMin;
  }

  function setStatus(message, type) {
    status.textContent = message;
    status.className = 'form-status' + (type ? ' ' + type : '');
  }

  /* Contrôle en temps réel lors de la saisie et à la sortie du champ */
  form.addEventListener('focusout', e => {
    if (fields.includes(e.target) && e.target.type !== 'radio' && (e.target.required || e.target.value !== '' || e.target.closest('.has-error'))) {
      check(e.target, false);
    }
  });

  form.addEventListener('input', e => {
    if (fields.includes(e.target) && e.target.type !== 'radio' && (e.target.value.trim() !== '' || e.target.closest('.has-error, .is-valid'))) {
      check(e.target, !e.target.closest('.has-error'));
    }
  });

  form.addEventListener('change', e => {
    if (fields.includes(e.target) && (e.target.type === 'checkbox' || e.target.type === 'radio' || e.target.tagName === 'SELECT')) {
      check(e.target, false);
    }
  });

  async function send(data) {
    if (!ENDPOINT) { await new Promise(resolve => setTimeout(resolve, 800)); return; }
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    setStatus('', '');

    /* Vérifie tous les champs obligatoires (note, identité, e-mail, avis >= 20 car., case cochée) */
    const results = fields.filter(f => f.type !== 'radio' || f.id === 'note5').map(f => [f, check(f, false)]);
    const invalid = results.filter(r => !r[1]).map(r => r[0]);
    if (invalid.length) {
      setStatus(
        'Envoi impossible : veuillez remplir ou corriger les ' + invalid.length + ' champ' + (invalid.length > 1 ? 's' : '') + ' obligatoire' + (invalid.length > 1 ? 's' : '') + ' signalé' + (invalid.length > 1 ? 's' : '') + '.',
        'ko'
      );
      invalid[0].focus();
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    const isBot = data.website !== '';
    delete data.website;

    const label = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'ENVOI EN COURS…';
    form.setAttribute('aria-busy', 'true');
    try {
      if (!isBot) await send(data);
      form.reset();
      form.querySelectorAll('.has-error, .is-valid').forEach(g => g.classList.remove('has-error', 'is-valid'));
      form.querySelectorAll('.field-error').forEach(b => { b.textContent = ''; });
      setStatus('Merci pour votre avis !', 'ok');
    } catch {
      setStatus('L’envoi a échoué. Réessayez dans un instant ou contactez-nous depuis la page Contact.', 'ko');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = label;
      form.removeAttribute('aria-busy');
      status.focus();
      status.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
})();
}

/* ===== contact (uniquement sur sa page) ===== */
if (document.getElementById('devis-form')) {
(() => {
  const ENDPOINT = '';
  const PHONE = '+33 1 45 00 00 00';

  const form = document.getElementById('devis-form');
  const status = document.getElementById('form-status');
  const submitBtn = form.querySelector('.submit_btn, .btn-submit');
  const fields = [...form.querySelectorAll('input, select, textarea')].filter(f => f.id !== 'website');

  function errorBox(field) {
    const id = 'err-' + field.id;
    let box = document.getElementById(id);
    if (!box) {
      box = document.createElement('span');
      box.id = id;
      box.className = 'field-error';
      field.closest('.form_group, .form-group').append(box);
      field.setAttribute('aria-describedby', id);
    }
    return box;
  }

  function check(field) {
    if (field.type === 'radio') return true;
    const group = field.closest('.form_group, .form-group');
    const valid = field.validity.valid;
    const box = errorBox(field);
    const hasValue = field.type === 'checkbox' ? field.checked : field.value.trim() !== '';

    group.classList.toggle('has-error', !valid);
    group.classList.toggle('is-valid', valid && hasValue);

    if (valid) {
      box.textContent = '';
      field.removeAttribute('aria-invalid');
    } else {
      box.textContent = field.validity.valueMissing
        ? (field.dataset.required || 'Veuillez remplir ce champ obligatoire.')
        : (field.title || 'Format invalide.');
      field.setAttribute('aria-invalid', 'true');
    }
    return valid;
  }

  function setStatus(message, type) {
    status.textContent = message;
    status.className = 'form_status' + (type ? ' ' + type : '');
  }

  /* ---------- Pré-remplissage depuis l'URL ou sessionStorage ---------- */
  const PREFILL_STORAGE_KEY = 'jadeCleanDevisPrefill';
  const params = new URLSearchParams(window.location.search);

  let besoin = params.get('besoin') || '';
  let projet = params.get('projet') || '';

  if (!besoin && !projet) {
    try {
      const raw = sessionStorage.getItem(PREFILL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        besoin = parsed.besoin || '';
        projet = parsed.projet || '';
        sessionStorage.removeItem(PREFILL_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }

  const needField = document.getElementById('besoin') || document.querySelector('[name="besoin"]');
  const projectField = document.getElementById('message') || document.querySelector('[name="message"]');

  if (needField && besoin) {
    if (needField.tagName === 'SELECT') {
      const matchingOption = Array.from(needField.options).find(
        (opt) => opt.value.toLowerCase() === besoin.toLowerCase() || opt.text.toLowerCase().includes(besoin.toLowerCase())
      );
      if (matchingOption) {
        needField.value = matchingOption.value;
      } else {
        const customOpt = document.createElement('option');
        customOpt.value = besoin;
        customOpt.textContent = besoin;
        customOpt.selected = true;
        needField.appendChild(customOpt);
      }
    } else {
      needField.value = besoin;
    }
    check(needField);
  }

  if (projectField && projet && !projectField.value.trim()) {
    projectField.value = projet;
    check(projectField);
  }

  /* ---------- Contrôle en temps réel lors de la saisie et à la sortie du champ ---------- */
  form.addEventListener('focusout', e => {
    if (fields.includes(e.target) && (e.target.required || e.target.value !== '' || e.target.closest('.has-error'))) {
      check(e.target);
    }
  });

  form.addEventListener('input', e => {
    if (fields.includes(e.target) && (e.target.value.trim() !== '' || e.target.closest('.has-error, .is-valid'))) {
      check(e.target);
    }
  });

  form.addEventListener('change', e => {
    if (fields.includes(e.target) && (e.target.type === 'checkbox' || e.target.tagName === 'SELECT')) {
      check(e.target);
    }
  });

  async function send(data) {
    if (!ENDPOINT) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return;
    }
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    setStatus('', '');

    const invalid = fields.filter(f => !check(f));
    if (invalid.length) {
      setStatus(
        'Envoi impossible : veuillez remplir ou corriger les ' + invalid.length + ' champ' + (invalid.length > 1 ? 's' : '') + ' obligatoire' + (invalid.length > 1 ? 's' : '') + ' signalé' + (invalid.length > 1 ? 's' : '') + '.',
        'ko'
      );
      invalid[0].focus();
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    const isBot = data.website !== '';
    delete data.website;

    const label = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'ENVOI EN COURS…';
    form.setAttribute('aria-busy', 'true');

    try {
      if (!isBot) await send(data);
      form.reset();
      form.querySelectorAll('.has-error, .is-valid').forEach(g => g.classList.remove('has-error', 'is-valid'));
      form.querySelectorAll('.field-error').forEach(b => { b.textContent = ''; });
      setStatus('Merci, votre demande a bien été envoyée. Nous vous répondons sous 24 h ouvrées.', 'ok');
    } catch {
      setStatus('L’envoi a échoué. Réessayez dans un instant ou appelez-nous au ' + PHONE + '.', 'ko');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = label;
      form.removeAttribute('aria-busy');
      status.focus();
      status.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
})();
}

/* ===== espace_client (uniquement sur espace_client.html) ===== */
if (document.getElementById('view')) {
(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  /* Icônes : fichiers dans images/ (calendar, clock, group) */
  const ico = name => `<img class="ico" src="images/${name}.svg" alt="" width="16" height="16">`;

  /* ---------- Configuration ----------
     ENDPOINT : adresse de votre API qui reçoit chaque action du client (commande, devis accepté,
     demande, souscription…). Vide = les actions sont uniquement enregistrées dans le navigateur. */
  const ENDPOINT = '';
  const LOGIN_URL = 'connexion.html';

  /* ---------- Session (voir JCAuth) ---------- */
  const sess = JCAuth.session();
  if (!sess) { window.location.replace(LOGIN_URL + '?next=espace_client.html'); return; }
  const { user, hotel } = sess;
  const data = hotel.data;

  /* ---------- Catalogue : grille de prestations, forfaits, abonnements annuels (tarifs HT) ---------- */
  const ROLES = {
    Directeur: ['Aperçu', 'Prestations', 'Devis', 'Contrats', 'Factures', 'Rapports'],
    Gouvernante: ['Aperçu', 'Prestations', 'Devis', 'Rapports'],
    Comptabilité: ['Devis', 'Contrats', 'Factures']
  };
  if (!ROLES[user.role]) { JCAuth.logout(); window.location.replace(LOGIN_URL); return; }
  const GRILLE = [
    { id: 'quotidien', t: 'Nettoyage quotidien', m: 'contrat', u: 'chambre', p: 18, hpu: 0.5 },
    { id: 'rangements', t: 'Rangements', m: 'contrat', u: 'heure', p: 45, hpu: 1 },
    { id: 'blanc', t: 'Remise à blanc', m: 'grille', u: 'chambre', p: 75 },
    { id: 'vitres', t: 'Nettoyage des vitres', m: 'grille', u: 'm²', p: 4 },
    { id: 'textiles', t: 'Traitement des textiles', m: 'devis', u: 'lot' }
  ];
  const FORFAITS = [
    { id: 'blanc10', t: 'Forfait remise à blanc — 10 chambres', p: 690 },
    { id: 'blanc24', t: 'Forfait remise à blanc — 24 chambres', p: 1650 },
    { id: 'vitrerie', t: 'Forfait vitrerie — façade et patio', p: 520 },
    { id: 'saison', t: 'Forfait remise en état avant saison', p: 2200 }
  ];
  const PLANS = {
    essentiel: { nom: 'Essentiel', mois: 950, h: 120, d: 'Nettoyage quotidien des chambres et rapport mensuel.' },
    confort: { nom: 'Confort', mois: 1650, h: 200, d: 'Quotidien, parties communes et remises à blanc à tarif préférentiel.' },
    prestige: { nom: 'Prestige', mois: 2450, h: 300, d: 'Toutes prestations courantes et intervention prioritaire.' }
  };
  const FILTERS = { 'À venir': ['Planifiée', 'Demandée'], 'En cours': ['En cours'], 'Terminées': ['Terminée', 'Annulée'] };
  const BADGE = { 'Terminée': 'b-ok', 'Payée': 'b-ok', 'Accepté': 'b-ok', 'En retard': 'b-late', 'À valider': 'b-late', 'Nouveau': 'b-late', 'Expiré': 'b-late' };
  const UNITS = { chambre: 'Nombre de chambres', 'm²': 'Surface (m²)', heure: 'Nombre d’heures' };

  const state = { tab: ROLES[user.role][0], filter: 'À venir' };
  const can = tab => ROLES[user.role].includes(tab);
  const canOrder = user.role !== 'Comptabilité';
  const isDir = user.role === 'Directeur';

  /* ---------- Utilitaires ---------- */
  const today = () => JCAuth.iso(0);
  const uid = () => (data.seq.id += 1);
  const euro = n => Number(n).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const dLong = iso => iso ? new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'À planifier';
  const dFull = iso => new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const byDate = (a, b) => (a.d || '9').localeCompare(b.d || '9');
  const devStatus = q => (q.s === 'À valider' && q.x < today()) ? 'Expiré' : q.s;
  const facStatus = f => (f.s === 'En attente' && f.x < today()) ? 'En retard' : f.s;
  const count = s => data.prestations.filter(p => p.s === s).length;
  const pending = () => ({
    Devis: data.devis.filter(q => devStatus(q) === 'À valider').length,
    Rapports: data.rapports.filter(r => !r.lu).length,
    Factures: data.factures.filter(f => f.s !== 'Payée').length
  });

  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.textContent = msg;
    document.body.append(el);
    setTimeout(() => el.remove(), 3500);
  }
  function persist() { if (!JCAuth.saveHotel(hotel)) toast('Enregistrement impossible : le stockage du navigateur est indisponible.'); }
  function notify(type, payload) {
    if (!ENDPOINT) return;
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, hotel: hotel.id, user: user.email, payload, at: new Date().toISOString() }) })
      .catch(() => toast('Le serveur est injoignable : votre action est enregistrée sur cet appareil.'));
  }
  function demande(type, ref) {
    const r = { id: uid(), type, ref: ref || '', date: today(), par: user.nom };
    data.demandes.unshift(r);
    persist(); notify('demande', r);
    toast('Votre demande de ' + type + ' a été enregistrée.');
    render();
  }

  /* ---------- Cartes ---------- */
  const priceLine = p => (p.price === undefined || p.price === null) ? '' : `<span>${p.price === 0 ? 'Inclus à l’abonnement' : euro(p.price) + ' HT'}</span>`;
  function prestaCard(p) {
    const btns = [];
    if (p.s === 'Terminée' && can('Rapports')) btns.push('<button type="button" class="mini" data-a="tab:Rapports">Voir le rapport</button>');
    if (['Planifiée', 'Demandée'].includes(p.s) && canOrder) btns.push(`<button type="button" class="mini ghost2" data-a="cancel:${p.id}">Annuler</button>`);
    return `<article class="card"><div class="row"><h3>${esc(p.t)}</h3><span class="badge ${BADGE[p.s] || ''}">${esc(p.s)}</span></div><div class="meta"><span>${ico('calendar')} ${esc(dLong(p.d))}</span><span>${ico('clock')} ${esc(p.h)}</span><span>${ico('group')} ${esc(p.z)}</span>${p.qte ? `<span>${esc(p.qte)}</span>` : ''}${priceLine(p)}</div>${p.n ? `<div class="note">${esc(p.n)}</div>` : ''}${btns.length ? `<div class="btnrow">${btns.join('')}</div>` : ''}</article>`;
  }
  function devisCard(q) {
    const s = devStatus(q);
    return `<article class="card"><div class="row"><div class="ref">${esc(q.r)}</div><span class="badge ${BADGE[s] || ''}">${esc(s)}</span></div><h3>${esc(q.t)} — ${esc(q.z)}</h3><div class="price">${euro(q.p)} HT</div><div class="meta stack">${ico('calendar')} Émis le ${esc(dFull(q.e))}<br>Échéance : ${esc(dFull(q.x))}</div><div class="note">${esc(q.n)}</div>${s === 'À valider' ? `<div class="btnrow"><button type="button" class="mini" data-a="ok:${q.id}">Accepter le devis</button><button type="button" class="mini ghost2" data-a="no:${q.id}">Refuser</button></div>` : ''}</article>`;
  }
  function aboCard(full) {
    const a = data.abonnement, pl = PLANS[a.plan];
    const pct = Math.min(100, Math.round(a.used / pl.h * 100));
    return `<article class="card"><div class="row"><h3>Abonnement annuel — ${esc(pl.nom)}</h3><span class="badge b-ok">Actif</span></div><div class="bar"><i style="width:${pct}%"></i></div><div class="meta"><span>${Math.round(a.used)} h utilisées sur ${pl.h} h incluses</span><span>${euro(pl.mois)} HT / mois</span></div><div class="meta"><span>${ico('calendar')} Du ${esc(dFull(a.debut))} au ${esc(dFull(a.fin))}</span></div>${full && isDir ? '<div class="btnrow"><button type="button" class="mini" data-a="req:renouvellement">Demander un renouvellement</button><button type="button" class="mini ghost2" data-a="req:modification de formule">Demander une modification</button></div>' : ''}</article>`;
  }
  const planCard = id => { const p = PLANS[id]; return `<article class="card"><div class="row"><h3>${esc(p.nom)}</h3><span class="badge">${euro(p.mois)} HT / mois</span></div><div class="note">${esc(p.d)} ${p.h} h incluses par an, engagement de 12 mois.</div>${isDir ? `<div class="btnrow"><button type="button" class="mini" data-a="sub:${id}">Souscrire</button></div>` : ''}</article>`; };

  /* ---------- Vues ---------- */
  const views = {
    'Aperçu'() {
      const n = pending();
      const alerts = [['Devis', n.Devis + ' devis à valider'], ['Rapports', n.Rapports + ' rapport' + (n.Rapports > 1 ? 's' : '') + ' à consulter'], ['Factures', n.Factures + ' facture' + (n.Factures > 1 ? 's' : '') + ' à régler']].filter(([t]) => n[t] && can(t));
      const stats = [[count('Planifiée'), 'À venir'], [count('Demandée'), 'Demandes'], [count('En cours'), 'En cours'], [count('Terminée'), 'Terminées']];
      const next = data.prestations.filter(p => ['Planifiée', 'En cours'].includes(p.s)).sort(byDate).slice(0, 5);
      const abo = data.abonnement ? aboCard(false) : (can('Contrats') ? '<article class="card"><div class="row"><h3>Aucun abonnement</h3></div><div class="note">Un abonnement annuel inclut des heures de prestation et un tarif préférentiel.</div><div class="btnrow"><button type="button" class="mini" data-a="tab:Contrats">Voir les formules</button></div></article>' : '');
      return `${alerts.length ? `<h2>À faire</h2>${alerts.map(([t, l]) => `<button type="button" class="alert" data-a="tab:${t}">${l}<span>Ouvrir</span></button>`).join('')}` : ''}
<div class="stats gap-top">${stats.map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
<h2>Prochaines interventions</h2>${next.map(prestaCard).join('') || `<p class="empty">Aucune intervention planifiée.${canOrder ? ' Utilisez « Demander une prestation » pour commencer.' : ''}</p>`}
${abo ? `<h2 class="sec-top">Formule souscrite</h2>${abo}` : ''}`;
    },
    'Prestations'() {
      const list = data.prestations.filter(p => FILTERS[state.filter].includes(p.s)).sort((a, b) => state.filter === 'Terminées' ? byDate(b, a) : byDate(a, b));
      return `<div class="chips">${Object.keys(FILTERS).map(k => `<button type="button" class="chip ${k === state.filter ? 'on' : ''}" aria-pressed="${k === state.filter}" data-a="filt:${k}">${k}</button>`).join('')}</div>${list.map(prestaCard).join('') || '<p class="empty">Aucune prestation dans cette catégorie.</p>'}`;
    },
    'Devis'() { return `<h2>Vos demandes de chiffrage et propositions tarifaires.</h2>${data.devis.map(devisCard).join('') || '<p class="empty">Aucun devis pour le moment. Une demande de prestation « sur devis » apparaîtra ici une fois chiffrée.</p>'}`; },
    'Contrats'() {
      const tag = { contrat: 'Inclus', grille: 'Grille', devis: 'Sur devis' };
      const gl = g => g.m === 'devis' ? 'Sur devis' : euro(g.p) + ' HT / ' + g.u;
      return `<h2>Votre abonnement annuel</h2>${data.abonnement ? aboCard(true) : `<p class="empty">Vous n’avez pas encore d’abonnement. Choisissez une formule :</p>${Object.keys(PLANS).map(planCard).join('')}`}
<h2 class="sec-top">Grille de prestations</h2>${GRILLE.map(g => `<article class="card"><div class="row"><h3>${esc(g.t)}</h3><span class="badge">${tag[g.m]}</span></div><div class="meta"><span>${gl(g)}</span></div></article>`).join('')}
<h2 class="sec-top">Forfaits</h2>${FORFAITS.map(f => `<article class="card"><div class="row"><h3>${esc(f.t)}</h3><span class="badge">${euro(f.p)} HT</span></div>${canOrder ? `<div class="btnrow"><button type="button" class="mini" data-a="order:f:${f.id}">Commander</button></div>` : ''}</article>`).join('')}
${data.demandes.length ? `<h2 class="sec-top">Vos demandes</h2>${data.demandes.map(r => `<article class="card"><div class="row"><h3>${esc(r.type)}</h3><span class="badge">Enregistrée</span></div><div class="meta"><span>${ico('calendar')} ${esc(dFull(r.date))}</span><span>${esc(r.par)}</span></div></article>`).join('')}` : ''}`;
    },
    'Factures'() {
      const due = data.factures.filter(f => f.s !== 'Payée').reduce((s, f) => s + f.m, 0);
      return `<h2>Vos factures</h2>${due ? `<p class="note">Montant restant à régler : <strong>${euro(due)} HT</strong></p>` : ''}${data.factures.map(f => { const s = facStatus(f); return `<article class="card"><div class="row"><div class="ref">${esc(f.r)}</div><span class="badge ${BADGE[s] || ''}">${esc(s)}</span></div><h3>${esc(f.t)}</h3><div class="price">${euro(f.m)} HT</div><div class="meta"><span>${ico('calendar')} Échéance : ${esc(dFull(f.x))}</span></div></article>`; }).join('') || '<p class="empty">Aucune facture pour le moment.</p>'}`;
    },
    'Rapports'() {
      return `<h2>Rapports d’intervention</h2>${data.rapports.map(r => `<article class="card"><div class="row"><h3>${esc(r.t)}</h3>${r.lu ? '' : '<span class="badge b-late">Nouveau</span>'}</div><div class="meta"><span>${ico('calendar')} ${esc(dFull(r.d))}</span></div><div class="note">${esc(r.n)}</div><div class="btnrow">${r.lu ? '' : `<button type="button" class="mini" data-a="lu:${r.id}">Marquer comme lu</button>`}<button type="button" class="mini ghost2" data-a="req:signalement">Signaler un point</button></div></article>`).join('') || '<p class="empty">Aucun rapport pour le moment : ils apparaissent ici après chaque intervention.</p>'}`;
    },
    'Profil'() {
      const team = JCAuth.usersOf(hotel.id);
      return `<h2>Mon profil</h2><article class="card"><dl class="prof flush"><dt>Établissement</dt><dd>${esc(hotel.nom)}</dd><dt>Nom</dt><dd>${esc(user.nom)}</dd><dt>Rôle</dt><dd>${esc(user.role)}</dd><dt>E-mail</dt><dd>${esc(user.email)}</dd>${hotel.tel ? `<dt>Téléphone</dt><dd>${esc(hotel.tel)}</dd>` : ''}</dl></article>
<h2 class="sec-top">Équipe</h2>${team.map(u => `<article class="card"><div class="row"><h3>${esc(u.nom)}</h3><span class="badge">${esc(u.role)}</span></div><div class="meta"><span>${esc(u.email)}</span></div></article>`).join('')}
${isDir ? `<h2 class="sec-top">Ajouter un collaborateur</h2><form class="card" id="collab-form" novalidate>
<div class="form-group"><label for="c-nom">Nom et prénom *</label><input type="text" id="c-nom" autocomplete="off" required data-required="Indiquez le nom."></div>
<div class="form-group"><label for="c-email">E-mail *</label><input type="email" id="c-email" autocomplete="off" required data-required="Indiquez l’adresse e-mail." title="Entrez une adresse e-mail valide."></div>
<div class="form-group"><label for="c-role">Rôle</label><select id="c-role"><option>Gouvernante</option><option>Comptabilité</option><option>Directeur</option></select></div>
<div class="form-group"><label for="c-pw">Mot de passe provisoire * (8 caractères minimum)</label><input type="password" id="c-pw" minlength="8" autocomplete="new-password" required data-required="Choisissez un mot de passe." title="8 caractères minimum."></div>
<button type="submit" class="btn-pill">Ajouter</button></form>` : ''}`;
    }
  };

  /* ---------- Rendu ---------- */
  function render() {
    const allowed = ROLES[user.role];
    if (!allowed.includes(state.tab) && state.tab !== 'Profil') state.tab = allowed[0];
    const n = pending();
    $('tabs').innerHTML = allowed.map(t => `<button type="button" class="${t === state.tab ? 'on' : ''}" data-tab="${t}"${t === state.tab ? ' aria-current="true"' : ''}>${t}${n[t] ? `<span class="cnt" aria-label="${n[t]} en attente">${n[t]}</span>` : ''}</button>`).join('');
    $('view').innerHTML = views[state.tab]();
    $('ask').style.display = canOrder ? 'flex' : 'none';
    $('client-name').textContent = hotel.nom;
    $('menu-user').textContent = hotel.nom + ' · ' + user.role;
    $('live').textContent = 'Connecté · ' + user.nom + ' (' + user.role + ')';
  }
  function goTab(t) { state.tab = t; render(); window.scrollTo(0, 0); }

  /* ---------- Actions ---------- */
  function subscribe(id) {
    const pl = PLANS[id];
    if (!isDir || data.abonnement || !pl) return;
    if (!window.confirm('Souscrire à la formule ' + pl.nom + ' ?\nEngagement de 12 mois : ' + euro(pl.mois) + ' HT par mois, ' + pl.h + ' h incluses.')) return;
    const fin = new Date(today() + 'T12:00:00'); fin.setFullYear(fin.getFullYear() + 1); fin.setDate(fin.getDate() - 1);
    data.abonnement = { plan: id, debut: today(), fin: JCAuth.toISO(fin), used: 0 };
    data.factures.unshift({ id: uid(), r: 'FAC-' + new Date().getFullYear() + '-' + String(data.seq.fac++).padStart(3, '0'), t: 'Abonnement annuel ' + pl.nom + ' — premier mois', m: pl.mois, x: JCAuth.iso(30), s: 'En attente' });
    persist(); notify('abonnement', data.abonnement);
    toast('Abonnement ' + pl.nom + ' souscrit. Votre première facture est disponible.');
    render();
  }
  function setDevis(id, accept) {
    const q = data.devis.find(x => x.id === +id);
    if (!q || devStatus(q) !== 'À valider') return;
    if (accept && !window.confirm('Accepter le devis ' + q.r + ' de ' + euro(q.p) + ' HT ?')) return;
    q.s = accept ? 'Accepté' : 'Refusé';
    if (accept) data.prestations.push({ id: uid(), t: q.t, d: '', h: 'À confirmer', z: q.z, s: 'Demandée', price: q.p });
    persist(); notify(accept ? 'devis-accepte' : 'devis-refuse', { ref: q.r });
    toast(accept ? 'Devis accepté : la prestation est ajoutée au planning.' : 'Devis refusé.');
    render();
  }
  function cancel(id) {
    const p = data.prestations.find(x => x.id === +id);
    if (!p || !['Planifiée', 'Demandée'].includes(p.s)) return;
    if (!window.confirm('Annuler cette prestation (' + p.t + ') ?')) return;
    p.s = 'Annulée';
    if (p.hrs && data.abonnement) data.abonnement.used = Math.max(0, data.abonnement.used - p.hrs);
    persist(); notify('prestation-annulee', { id: p.id });
    toast('Prestation annulée.');
    render();
  }

  /* ---------- Événements ---------- */
  $('tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) goTab(b.dataset.tab); });
  $('view').addEventListener('click', e => {
    const a = e.target.closest('[data-a]');
    if (!a) return;
    const [k, ...rest] = a.dataset.a.split(':'), v = rest.join(':');
    if (k === 'tab') goTab(v);
    else if (k === 'filt') { state.filter = v; render(); }
    else if (k === 'lu') { const r = data.rapports.find(x => x.id === +v); if (r) { r.lu = true; persist(); render(); } }
    else if (k === 'req') demande(v);
    else if (k === 'sub') subscribe(v);
    else if (k === 'ok') setDevis(v, true);
    else if (k === 'no') setDevis(v, false);
    else if (k === 'cancel') cancel(v);
    else if (k === 'order') openOrder(v);
  });
  $('view').addEventListener('submit', async e => {
    if (e.target.id !== 'collab-form') return;
    e.preventDefault();
    if (!isDir || !JC.validate(e.target)) return;
    const r = await JCAuth.addUser(hotel.id, { nom: $('c-nom').value, email: $('c-email').value, role: $('c-role').value, pw: $('c-pw').value });
    toast(r.ok ? 'Collaborateur ajouté.' : r.error);
    if (r.ok) render();
  });
  $('profile-btn').addEventListener('click', e => { e.preventDefault(); goTab('Profil'); });
  $('logout-link').addEventListener('click', e => { e.preventDefault(); JCAuth.logout(); window.location.href = LOGIN_URL; });

  /* ---------- Demande de prestation ---------- */
  const dlg = $('dlg'), sel = $('o-t'), qty = $('o-q');
  sel.innerHTML = '<optgroup label="Grille de prestations">' + GRILLE.map(g => `<option value="g:${g.id}">${esc(g.t)}</option>`).join('') + '</optgroup><optgroup label="Forfaits">' + FORFAITS.map(f => `<option value="f:${f.id}">${esc(f.t)}</option>`).join('') + '</optgroup>';
  const item = () => { const [k, id] = sel.value.split(':'); return k === 'f' ? Object.assign({ kind: 'f' }, FORFAITS.find(x => x.id === id)) : Object.assign({ kind: 'g' }, GRILLE.find(x => x.id === id)); };
  function quote(it, q) {
    if (it.kind === 'f') return { price: it.p, note: 'Forfait à prix ferme : ' + euro(it.p) + ' HT.' };
    if (it.m === 'devis') return { price: undefined, note: 'Sur devis : vous recevrez une proposition à valider.' };
    if (it.m === 'contrat' && data.abonnement) return { price: 0, note: 'Inclus à votre abonnement annuel (décompté de vos heures).' };
    const total = it.p * q;
    return { price: total, note: 'Tarif de la grille : ' + euro(it.p) + ' HT / ' + it.u + '. Estimation : ' + euro(total) + ' HT.' + (it.m === 'contrat' ? ' Inclus si vous souscrivez un abonnement.' : '') };
  }
  function updateForm() {
    const it = item(), noQty = it.kind === 'f' || it.m === 'devis';
    $('o-qg').hidden = noQty; qty.disabled = noQty;
    if (!noQty) $('o-ql').textContent = UNITS[it.u] || 'Quantité';
    $('o-h').textContent = quote(it, Math.max(1, parseInt(qty.value, 10) || 1)).note;
  }
  function openOrder(pre) {
    if (!canOrder) return;
    if (pre) sel.value = pre;
    $('o-d').min = today();
    updateForm();
    dlg.showModal();
  }
  sel.addEventListener('change', updateForm);
  qty.addEventListener('input', updateForm);
  $('ask').addEventListener('click', () => openOrder());
  $('o-x').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { const r = dlg.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close(); });
  $('form').addEventListener('submit', e => {
    e.preventDefault();
    if (!canOrder) return;
    const f = e.target;
    if (!f.checkValidity()) { f.reportValidity(); return; }
    const it = item(), q = Math.max(1, parseInt(qty.value, 10) || 1), qt = quote(it, q);
    const counted = it.kind === 'g' && it.m !== 'devis';
    const p = { id: uid(), t: it.t, d: $('o-d').value, h: $('o-c').value, z: $('o-z').value.trim(), s: (it.kind === 'g' && it.m === 'devis') ? 'Demandée' : 'Planifiée', n: $('o-m').value.trim(), par: user.nom };
    if (counted) p.qte = q + ' ' + (it.u === 'm²' ? 'm²' : it.u + (q > 1 ? 's' : ''));
    if (qt.price !== undefined) p.price = qt.price;
    if (it.m === 'contrat' && data.abonnement) { p.hrs = q * it.hpu; data.abonnement.used += p.hrs; }
    data.prestations.push(p);
    persist(); notify('prestation', p);
    toast(p.s === 'Demandée' ? 'Demande de chiffrage enregistrée : un devis vous sera transmis.' : 'Prestation ajoutée au planning.');
    f.reset(); dlg.close();
    state.filter = 'À venir';
    if (can('Prestations')) goTab('Prestations'); else render();
  });

  window.addEventListener('pageshow', () => { if (!JCAuth.session()) window.location.replace(LOGIN_URL + '?next=espace_client.html'); });
  render();
})();
}
