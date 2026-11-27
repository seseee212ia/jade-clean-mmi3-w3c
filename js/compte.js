'use strict';
/* compte.js – session client + icône de profil dans l'en-tête.
   Extrait de script.js : aide à la validation (JC), comptes/session (JCAuth), menu du compte.*/
(function () {
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

/* Comptes, session et données
   Prototype sans serveur : comptes et données sont enregistrés dans le navigateur (localStorage). */
const JCAuth = (() => {
  const K_USERS = 'jc-users', K_HOTELS = 'jc-hotels', K_SESSION = 'jc-session', K_TRY = 'jc-attempts';
  const TTL = 30 * 60 * 1000; /* déconnexion automatique après 30 min d'inactivité */
  const read = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
  const pad = n => String(n).padStart(2, '0');
  const toISO = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const iso = (n = 0) => { const d = new Date(); d.setDate(d.getDate() + n); return toISO(d); };
  const norm = e => String(e).trim().toLowerCase();
  const emptyData = () => ({ seq: { id: 100, dev: 1, fac: 1 }, prestations: [], devis: [], rapports: [], factures: [], abonnement: null, demandes: [] });

  /* Données de démonstration */
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

  const PW_MIN = 8, pwError = 'Le mot de passe doit contenir au moins 8 caractères.';

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
    if (String(f.pw).length < PW_MIN) return { ok: false, error: pwError };
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
    if (String(f.pw).length < PW_MIN) return { ok: false, error: pwError };
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

  /* Prolonge la session à chaque activité (au plus une écriture toutes les 15 s) */
  let lastTouch = 0;
  function touch() {
    const now = Date.now();
    if (now - lastTouch < 15000) return;
    lastTouch = now;
    const s = read(K_SESSION, null);
    if (s && s.exp > now) write(K_SESSION, { email: s.email, exp: now + TTL });
  }

  async function changePassword(oldPw, newPw) {
    const s = session();
    if (!s) return { ok: false, error: 'Votre session a expiré. Reconnectez-vous.' };
    const users = read(K_USERS, []), u = users.find(x => x.email === s.user.email);
    if (!u || u.hash !== await hash(oldPw, u.email)) return { ok: false, error: 'Le mot de passe actuel est incorrect.' };
    if (String(newPw).length < PW_MIN) return { ok: false, error: pwError };
    if (oldPw === newPw) return { ok: false, error: 'Le nouveau mot de passe doit être différent de l’ancien.' };
    u.hash = await hash(newPw, u.email);
    return write(K_USERS, users) ? { ok: true } : { ok: false, error: 'Enregistrement impossible : le stockage du navigateur est indisponible.' };
  }

  async function loginClient(email, pw) {
    email = norm(email);
    await ensureSeed();
    const users = read(K_USERS, []);
    let u = users.find(x => x.email === email);
    const h = await hash(pw, email);

    if (u) {
      if (u.hash !== h) return { ok: false, error: 'E-mail ou mot de passe incorrect.' };
    } else {
      const displayName = email.split('@')[0].replace(/[._-]+/g, ' ') || 'Client';
      users.push({ email, nom: displayName, role: 'Directeur', hotel: 'h-prestige', hash: h });
      write(K_USERS, users);
    }

    if (!write(K_SESSION, { email, exp: Date.now() + TTL })) {
      return { ok: false, error: 'Connexion impossible : le stockage du navigateur est désactivé.' };
    }
    return { ok: true };
  }

  return { login, loginClient, signup, addUser, session, logout, saveHotel, usersOf, iso, toISO, touch, changePassword };
})();

/* Menu du compte dans l'en-tête (toutes les pages, quand le client est connecté) */
(() => {
  const sess = JCAuth.session();
  const actions = document.querySelector('.header-right-actions');
  const login = actions && actions.querySelector('a.btn-login');
  if (!sess || !login) return;
  const { user, hotel } = sess;
  const onEspace = Boolean(document.getElementById('view'));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function jcToast(msg) {
    const el = document.createElement('div');
    el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg;
    document.body.append(el);
    setTimeout(() => el.remove(), 3500);
  }

  /* Remplace « SE CONNECTER » par l'icône de profil et son menu */
  const wrap = document.createElement('div');
  wrap.className = 'account';
  wrap.innerHTML = `<button type="button" class="account-btn" id="account-btn" aria-expanded="false" aria-controls="account-panel" aria-label="Mon compte : ${esc(user.nom)}">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>
    </button>
    <div class="account-panel" id="account-panel" hidden>
      <p class="account-who"><strong>${esc(user.nom)}</strong><span>${esc(hotel.nom)} · ${esc(user.role)}</span></p>
      <a href="espace_client.html"${onEspace ? ' aria-current="page"' : ''}>Mon espace client</a>
      <a href="espace_client.html#profil" id="account-profile">Mon profil</a>
      <button type="button" id="pw-open">Changer le mot de passe</button>
      <button type="button" id="logout-btn" class="danger">Se déconnecter</button>
    </div>`;
  login.replaceWith(wrap);

  /* Lien « Espace client » dans la navigation principale */
  const nav = document.getElementById('main-nav');
  if (nav && !nav.querySelector('a[href="espace_client.html"]')) {
    const a = document.createElement('a');
    a.href = 'espace_client.html'; a.textContent = 'Espace client';
    nav.append(a);
  }

  /* Ouverture / fermeture (disclosure accessible au clavier) */
  const btn = wrap.querySelector('#account-btn'), panel = wrap.querySelector('#account-panel');
  function setOpen(open, focusBtn) {
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (!open && focusBtn) btn.focus();
  }
  btn.addEventListener('click', () => setOpen(panel.hidden));
  document.addEventListener('click', e => { if (!wrap.contains(e.target)) setOpen(false); });
  wrap.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { e.stopPropagation(); setOpen(false, true); } });
  wrap.addEventListener('focusout', e => { if (e.relatedTarget && !wrap.contains(e.relatedTarget)) setOpen(false); });

  /* Profil : sur l'espace client, on ouvre l'onglet sans recharger la page */
  wrap.querySelector('#account-profile').addEventListener('click', e => {
    if (!onEspace) return;
    e.preventDefault(); setOpen(false);
    document.dispatchEvent(new Event('jc-profile'));
  });

  /* Déconnexion avec popin de confirmation */
  function logoutDialog() {
    let d = document.getElementById('logout-dlg');
    if (d) return d;
    d = document.createElement('dialog');
    d.id = 'logout-dlg';
    d.setAttribute('aria-labelledby', 'logout-title');
    d.setAttribute('aria-describedby', 'logout-desc');
    d.innerHTML = `<h2 id="logout-title">Confirmer la déconnexion</h2>
      <p class="lead" id="logout-desc">Souhaitez-vous vraiment vous déconnecter de votre espace client ?</p>
      <div class="actions">
        <button type="button" class="btn-pill ghost" id="logout-cancel">Annuler</button>
        <button type="button" class="btn-pill" id="logout-confirm">Se déconnecter</button>
      </div>`;
    document.body.append(d);

    d.querySelector('#logout-cancel').addEventListener('click', () => d.close());
    d.addEventListener('click', e => {
      const r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
    });
    d.querySelector('#logout-confirm').addEventListener('click', () => {
      d.close();
      JCAuth.logout();
      if (onEspace) window.location.href = 'connexion.html'; else window.location.reload();
    });
    return d;
  }

  wrap.querySelector('#logout-btn').addEventListener('click', () => {
    setOpen(false);
    const d = logoutDialog();
    d.showModal();
    d.querySelector('#logout-cancel').focus();
  });

  /* Changement de mot de passe (boîte de dialogue créée à la demande) */
  function pwDialog() {
    let d = document.getElementById('pw-dlg');
    if (d) return d;
    d = document.createElement('dialog');
    d.id = 'pw-dlg';
    d.setAttribute('aria-labelledby', 'pw-title');
    d.innerHTML = `<form id="pw-form" novalidate>
      <h2 id="pw-title">Changer le mot de passe</h2>
      <div class="form-group"><label for="pw-old">Mot de passe actuel *</label><input type="password" id="pw-old" autocomplete="current-password" required data-required="Saisissez votre mot de passe actuel."></div>
      <div class="form-group"><label for="pw-new">Nouveau mot de passe * (8 caractères minimum)</label><input type="password" id="pw-new" autocomplete="new-password" minlength="8" required data-required="Choisissez un nouveau mot de passe." title="Le mot de passe doit contenir au moins 8 caractères."></div>
      <div class="form-group"><label for="pw-new2">Confirmer le nouveau mot de passe *</label><input type="password" id="pw-new2" autocomplete="new-password" required data-required="Confirmez le nouveau mot de passe."></div>
      <p class="form-status" id="pw-status" role="status" aria-live="polite" tabindex="-1"></p>
      <div class="actions"><button type="button" class="btn-pill ghost" id="pw-cancel">Annuler</button><button type="submit" class="btn-pill">Enregistrer</button></div>
    </form>`;
    document.body.append(d);
    const form = d.querySelector('form'), st = d.querySelector('#pw-status');
    d.querySelector('#pw-cancel').addEventListener('click', () => d.close());
    d.addEventListener('click', e => { const r = d.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close(); });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const n1 = d.querySelector('#pw-new'), n2 = d.querySelector('#pw-new2');
      n1.setCustomValidity(n1.value.length < 8 ? 'Le mot de passe doit contenir au moins 8 caractères.' : '');
      n2.setCustomValidity(n1.value !== n2.value ? 'Les mots de passe ne correspondent pas.' : '');
      if (!JC.validate(form)) { JC.status(st, 'Merci de corriger les champs signalés.', false); return; }
      const r = await JCAuth.changePassword(d.querySelector('#pw-old').value, n1.value);
      if (!r.ok) { JC.status(st, r.error, false); return; }
      form.reset(); JC.clearErrors(form); st.textContent = ''; st.className = 'form-status';
      d.close(); jcToast('Votre mot de passe a été modifié.');
    });
    return d;
  }
  wrap.querySelector('#pw-open').addEventListener('click', () => { setOpen(false); pwDialog().showModal(); });

  /* Déconnexion automatique après 30 minutes d'inactivité */
  ['click', 'keydown', 'pointerdown', 'touchstart', 'scroll'].forEach(ev => document.addEventListener(ev, JCAuth.touch, { passive: true }));
  setInterval(() => {
    if (JCAuth.session()) return;
    if (onEspace) window.location.replace('connexion.html?expired=1'); else window.location.reload();
  }, 15000);
})();
