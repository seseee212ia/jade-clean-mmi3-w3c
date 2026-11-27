'use strict';
(() => {
  const K_ADMIN_SESSION = 'jc-admin-session';
  const K_CLIENT_SESSION = 'jc-session';
  const TTL = 30 * 60 * 1000; /* 30 min d'inactivité */
  const onInterne = document.body.classList.contains('page-admin');

  const read = (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
  const remove = (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function getSession() {
    const s = read(K_ADMIN_SESSION);
    if (!s || s.exp < Date.now()) {
      if (s) remove(K_ADMIN_SESSION);
      return null;
    }
    return s;
  }

  let lastTouch = 0;
  function touch() {
    const now = Date.now();
    if (now - lastTouch < 15000) return;
    lastTouch = now;
    const s = read(K_ADMIN_SESSION);
    if (s && s.exp > now) write(K_ADMIN_SESSION, { ...s, exp: now + TTL });
  }

  /*Interception de la connexion INTERNE sur connexion.html */
  const loginForm = document.getElementById('loginForm');
  const btnInterne = document.getElementById('btnInterne');
  if (loginForm && btnInterne) {
    loginForm.addEventListener('submit', () => {
      if (!btnInterne.classList.contains('active')) {
        remove(K_ADMIN_SESSION);
        return;
      }
      const email = (document.getElementById('email')?.value || '').trim().toLowerCase();
      const password = document.getElementById('password')?.value || '';
      const savedPassword = localStorage.getItem('user_custom_password');
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

      if (!email || (!(savedPassword && password === savedPassword) && !passwordRegex.test(password))) {
        return;
      }

      const nom = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Administrateur';
      remove(K_CLIENT_SESSION); /* Évite tout conflit avec une ancienne session client */
      write(K_ADMIN_SESSION, { email, nom, role: 'Administration', exp: Date.now() + TTL });
    });
  }

  /* 2. Protection de la page espace-interne.html */
  const sess = getSession();
  if (onInterne && !sess) {
    window.location.replace('connexion.html?next=espace-interne.html');
    return;
  }
  if (!sess) return;

  /*Modification du header (identique à espace client) */
  const actions = document.querySelector('.header-right-actions');
  const loginBtn = actions && actions.querySelector('a.btn-login');
  if (loginBtn) {
    const wrap = document.createElement('div');
    wrap.className = 'account';
    wrap.innerHTML = `<button type="button" class="account-btn" id="account-btn" aria-expanded="false" aria-controls="account-panel" aria-label="Mon compte interne : ${esc(sess.nom)}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>
      </button>
      <div class="account-panel" id="account-panel" hidden>
        <p class="account-who"><strong>${esc(sess.nom)}</strong><span>Jade Clean · ${esc(sess.role)}</span></p>
        <a href="espace-interne.html"${onInterne ? ' aria-current="page"' : ''}>Mon espace interne</a>
        <button type="button" id="admin-logout-btn" class="danger">Se déconnecter</button>
      </div>`;
    loginBtn.replaceWith(wrap);

    const btn = wrap.querySelector('#account-btn');
    const panel = wrap.querySelector('#account-panel');
    const setOpen = (open, focusBtn) => {
      panel.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      if (!open && focusBtn) btn.focus();
    };

    btn.addEventListener('click', () => setOpen(panel.hidden));
    document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) setOpen(false); });
    wrap.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { e.stopPropagation(); setOpen(false, true); } });
    wrap.addEventListener('focusout', (e) => { if (e.relatedTarget && !wrap.contains(e.relatedTarget)) setOpen(false); });

    /* Confirmation de déconnexion */
    function logoutDialog() {
      let d = document.getElementById('admin-logout-dlg');
      if (d) return d;
      d = document.createElement('dialog');
      d.id = 'admin-logout-dlg';
      d.setAttribute('aria-labelledby', 'admin-logout-title');
      d.setAttribute('aria-describedby', 'admin-logout-desc');
      d.innerHTML = `<h2 id="admin-logout-title">Confirmer la déconnexion</h2>
        <p class="lead" id="admin-logout-desc">Souhaitez-vous vraiment vous déconnecter de l’espace interne ?</p>
        <div class="actions">
          <button type="button" class="btn-pill ghost" id="admin-logout-cancel">Annuler</button>
          <button type="button" class="btn-pill" id="admin-logout-confirm">Se déconnecter</button>
        </div>`;
      document.body.append(d);

      d.querySelector('#admin-logout-cancel').addEventListener('click', () => d.close());
      d.addEventListener('click', (e) => {
        const r = d.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
      });
      d.querySelector('#admin-logout-confirm').addEventListener('click', () => {
        d.close();
        remove(K_ADMIN_SESSION);
        if (onInterne) window.location.href = 'connexion.html';
        else window.location.reload();
      });
      return d;
    }

    wrap.querySelector('#admin-logout-btn').addEventListener('click', () => {
      setOpen(false);
      const d = logoutDialog();
      d.showModal();
      d.querySelector('#admin-logout-cancel').focus();
    });
  }

  /* Ajout du lien «Espace interne» dans la navigation principale */
  const nav = document.querySelector('.main-nav');
  if (nav && !nav.querySelector('a[href="espace-interne.html"]')) {
    const a = document.createElement('a');
    a.href = 'espace-interne.html';
    a.textContent = 'Espace interne';
    nav.append(a);
  }

  /*Expiration automatique après 30 minutes d'inactivité */
  ['click', 'keydown', 'pointerdown', 'touchstart', 'scroll'].forEach(ev => document.addEventListener(ev, touch, { passive: true }));
  setInterval(() => {
    if (getSession()) return;
    if (onInterne) window.location.replace('connexion.html?expired=1');
    else window.location.reload();
  }, 15000);
})();
