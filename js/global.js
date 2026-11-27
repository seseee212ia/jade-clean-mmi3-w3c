
/* ---------- Bascule Thème Sombre / Clair ---------- */
(function appliquerThemeInitial() {
  const saved = localStorage.getItem('jadeclean-theme');
  if (saved === 'light' || saved === 'dark') {
    document.documentElement.setAttribute('data-theme', saved);
  }
})();

function initThemeToggle() {
  const toggles = document.querySelectorAll('.theme-toggle');
  if (!toggles.length) return;

  const majEtat = () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    toggles.forEach(btn => {
      btn.setAttribute('aria-pressed', String(isLight));
      btn.setAttribute('title', isLight ? 'Passer en mode sombre' : 'Passer en mode clair');
    });
  };

  toggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('jadeclean-theme', next);
      majEtat();
    });
  });

  majEtat();
}

// Signale au CSS que le JavaScript fonctionne (active les animations .reveal)
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  initMenuMobile();
  initNavbarScroll();
  initBarreLecture();
  initReveal();
  initThemeToggle();
  initSessionGlobale();
});

/* ---------- Menu burger ---------- */
function initMenuMobile() {
  const menuBtn = document.getElementById('menu-btn');
  const menuMobile = document.getElementById('menu-mobile');
  if (!menuBtn || !menuMobile) return;

  const fermer = () => {
    menuBtn.classList.remove('ouvert');
    menuMobile.classList.remove('ouvert');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  menuBtn.addEventListener('click', () => {
    const ouvert = menuMobile.classList.toggle('ouvert');
    menuBtn.classList.toggle('ouvert', ouvert);
    menuBtn.setAttribute('aria-expanded', ouvert);
    // Bloque le défilement de la page quand le menu est ouvert
    document.body.style.overflow = ouvert ? 'hidden' : '';
  });

  // Un clic sur un lien ou la touche Échap referme le menu
  menuMobile.querySelectorAll('a').forEach(lien => lien.addEventListener('click', fermer));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fermer();
  });

  // Si on agrandit la fenêtre en mode ordinateur, le menu mobile se ferme
  window.matchMedia('(min-width: 992px)').addEventListener('change', (e) => {
    if (e.matches) fermer();
  });
}

/* ---------- Barre de progression de lecture ---------- */
function initBarreLecture() {
  if (!document.getElementById('mainNavbar')) return;

  const barre = document.createElement('div');
  barre.className = 'barre-lecture';
  document.body.prepend(barre);

  const mettreAJour = () => {
    const hauteur = document.documentElement.scrollHeight - window.innerHeight;
    barre.style.width = hauteur > 0 ? `${(window.scrollY / hauteur) * 100}%` : '0';
  };

  window.addEventListener('scroll', mettreAJour, { passive: true });
  window.addEventListener('resize', mettreAJour);
  mettreAJour();
}

/* ---------- Apparition des blocs au défilement ---------- */
function initReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  // Navigateur trop ancien : on affiche tout directement
  if (!('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observateur = new IntersectionObserver((entrees) => {
    entrees.forEach(entree => {
      if (entree.isIntersecting) {
        entree.target.classList.add('visible');
        observateur.unobserve(entree.target);
      }
    });
  }, { threshold: 0.12 });

  elements.forEach(el => observateur.observe(el));
}


/* ---------- Affichage / Masquage de la navbar au scroll ---------- */
function initNavbarScroll() {
  const navbar = document.getElementById('mainNavbar');
  const menuMobile = document.getElementById('menu-mobile');
  if (!navbar) return;

  let lastScroll = window.scrollY || 0;
  const seuil = 10;

  window.addEventListener('scroll', () => {
    if (menuMobile && menuMobile.classList.contains('ouvert')) return;

    const currentScroll = window.scrollY || document.documentElement.scrollTop;

    if (currentScroll <= 20) {
      navbar.classList.remove('nav-hidden');
      lastScroll = 0;
      return;
    }

    if (Math.abs(currentScroll - lastScroll) <= seuil) return;

    if (currentScroll > lastScroll) {
      navbar.classList.add('nav-hidden');
    } else {
      navbar.classList.remove('nav-hidden');
    }

    lastScroll = currentScroll;
  }, { passive: true });
}


/* ---------- Gestion de la session utilisateur sur tout le site (validité 25 min) ---------- */
const DUREE_SESSION_MS = 25 * 60 * 1000; // 25 minutes

function lireDonneeSession(cle) {
  try {
    const valLocal = localStorage.getItem(cle);
    if (valLocal !== null) return valLocal;
  } catch (e) {}
  try {
    return sessionStorage.getItem(cle);
  } catch (e) {}
  return null;
}

function ecrireDonneeSession(cle, valeur) {
  try { localStorage.setItem(cle, valeur); } catch (e) {}
  try { sessionStorage.setItem(cle, valeur); } catch (e) {}
}

function supprimerDonneeSession(cle) {
  try { localStorage.removeItem(cle); } catch (e) {}
  try { sessionStorage.removeItem(cle); } catch (e) {}
}

function afficherPopinDeconnexion(message = 'Vous avez bien été déconnecté de votre espace.', titre = 'Déconnexion confirmée') {
  const existant = document.getElementById('jadeLogoutPopin');
  if (existant) existant.remove();

  const popin = document.createElement('div');
  popin.id = 'jadeLogoutPopin';
  popin.className = 'jade-popin-toast';
  popin.setAttribute('role', 'status');
  popin.setAttribute('aria-live', 'polite');
  popin.innerHTML = `
    <div class="jade-popin-icone"><i class="bi bi-check-circle-fill"></i></div>
    <div class="jade-popin-texte">
      <strong>${titre}</strong>
      <span>${message}</span>
    </div>
    <button type="button" class="jade-popin-fermer" aria-label="Fermer">&times;</button>
  `;

  document.body.appendChild(popin);
  requestAnimationFrame(() => popin.classList.add('visible'));

  const fermer = () => {
    popin.classList.remove('visible');
    setTimeout(() => popin.remove(), 300);
  };

  popin.querySelector('.jade-popin-fermer').addEventListener('click', fermer);
  setTimeout(fermer, 4500);
}

function nettoyerSessionStockage() {
  supprimerDonneeSession('jadeLoggedIn');
  supprimerDonneeSession('jadeUserRole');
  supprimerDonneeSession('jadeUserName');
  supprimerDonneeSession('jadeSessionExpiresAt');
  supprimerDonneeSession('jadeclean-role');
}

function prolongerSession() {
  if (lireDonneeSession('jadeLoggedIn') === 'true') {
    ecrireDonneeSession('jadeSessionExpiresAt', String(Date.now() + DUREE_SESSION_MS));
  }
}

function deconnecterUtilisateur(redirigerVers = 'index.html', estExpiration = false) {
  const roleActuel = lireDonneeSession('jadeUserRole');
  let msg;
  if (estExpiration) {
    msg = 'Votre session a expiré après 25 minutes d’inactivité.';
  } else {
    msg = roleActuel === 'interne'
      ? 'Vous avez bien été déconnecté de votre espace interne.'
      : 'Vous avez bien été déconnecté de votre espace client.';
  }
  nettoyerSessionStockage();
  try {
    sessionStorage.setItem('jadeJustLoggedOut', JSON.stringify({
      titre: estExpiration ? 'Session expirée' : 'Déconnexion confirmée',
      message: msg
    }));
  } catch (e) {}
  window.location.assign(redirigerVers);
}

function verifierValiditeSession() {
  if (lireDonneeSession('jadeLoggedIn') !== 'true') return false;

  const expiresAt = Number(lireDonneeSession('jadeSessionExpiresAt') || 0);
  if (!expiresAt) {
    prolongerSession();
    return true;
  }

  if (Date.now() > expiresAt) {
    const pageCourante = window.location.pathname.split('/').pop() || 'index.html';
    const estSurEspacePrive = pageCourante === 'espace-client.html' || pageCourante === 'espace-interne.html';
    deconnecterUtilisateur(estSurEspacePrive ? 'connexion.html' : pageCourante, true);
    return false;
  }

  return true;
}

function initSessionGlobale() {
  try {
    const rawPopin = sessionStorage.getItem('jadeJustLoggedOut');
    if (rawPopin) {
      sessionStorage.removeItem('jadeJustLoggedOut');
      try {
        const data = JSON.parse(rawPopin);
        afficherPopinDeconnexion(data.message, data.titre);
      } catch {
        afficherPopinDeconnexion(rawPopin === 'true' ? undefined : rawPopin);
      }
    }
  } catch (e) {}

  const estConnecte = verifierValiditeSession();
  const role = lireDonneeSession('jadeUserRole') || 'client';
  const pageCourante = window.location.pathname.split('/').pop() || 'index.html';
  const estSurEspacePrive = pageCourante === 'espace-client.html' || pageCourante === 'espace-interne.html';

  const navAuthBtn = document.getElementById('navAuthBtn');
  const menuMobileList = document.querySelector('#menu-mobile ul');

  if (estConnecte) {
    prolongerSession();
    ['click', 'keydown', 'scroll'].forEach(evt => {
      document.addEventListener(evt, prolongerSession, { passive: true });
    });

    setInterval(() => {
      verifierValiditeSession();
    }, 30000);

    const urlEspace = role === 'interne' ? 'espace-interne.html' : 'espace-client.html';
    const labelEspace = role === 'interne' ? 'Espace interne' : 'Espace client';

    if (!estSurEspacePrive) {
      if (navAuthBtn) {
        navAuthBtn.href = urlEspace;
        navAuthBtn.innerHTML = `<i class="bi bi-person-check me-1"></i> ${labelEspace}`;
      }

      const navActions = document.querySelector('.nav-right-actions');
      if (navActions && !document.getElementById('navQuickLogout')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.type = 'button';
        logoutBtn.id = 'navQuickLogout';
        logoutBtn.className = 'btn-deconnexion-rapide d-none d-lg-inline-flex';
        logoutBtn.title = 'Se déconnecter';
        logoutBtn.setAttribute('aria-label', 'Se déconnecter');
        logoutBtn.innerHTML = '<i class="bi bi-box-arrow-right"></i>';
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          deconnecterUtilisateur('index.html', false);
        });
        const burger = document.getElementById('menu-btn');
        if (burger) {
          navActions.insertBefore(logoutBtn, burger);
        } else {
          navActions.appendChild(logoutBtn);
        }
      }

      if (menuMobileList && !menuMobileList.querySelector('.mobile-espace-link')) {
        const liEspace = document.createElement('li');
        liEspace.className = 'mobile-espace-link';
        liEspace.innerHTML = `<a href="${urlEspace}">${labelEspace}</a>`;
        menuMobileList.appendChild(liEspace);

        const liLogout = document.createElement('li');
        liLogout.className = 'mobile-logout-link';
        liLogout.innerHTML = `<a href="#" class="text-jade-rose">Déconnexion</a>`;
        liLogout.querySelector('a').addEventListener('click', (e) => {
          e.preventDefault();
          deconnecterUtilisateur('index.html', false);
        });
        menuMobileList.appendChild(liLogout);
      }
    } else {
      document.querySelectorAll('.btn-logout, #navAuthBtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          deconnecterUtilisateur('index.html', false);
        });
      });

      if (menuMobileList && !menuMobileList.querySelector('.mobile-logout-link')) {
        const liLogout = document.createElement('li');
        liLogout.className = 'mobile-logout-link';
        liLogout.innerHTML = `<a href="#" class="text-jade-rose">Déconnexion</a>`;
        liLogout.querySelector('a').addEventListener('click', (e) => {
          e.preventDefault();
          deconnecterUtilisateur('index.html', false);
        });
        menuMobileList.appendChild(liLogout);
      }
    }
  } else {
    // Si l'utilisateur ouvre directement espace-client.html ou espace-interne.html, on active automatiquement une session démo de 25 min au lieu de le bloquer !
    if (estSurEspacePrive) {
      const roleDemo = pageCourante === 'espace-interne.html' ? 'interne' : 'client';
      ecrireDonneeSession('jadeLoggedIn', 'true');
      ecrireDonneeSession('jadeUserRole', roleDemo);
      ecrireDonneeSession('jadeSessionExpiresAt', String(Date.now() + DUREE_SESSION_MS));

      document.querySelectorAll('.btn-logout, #navAuthBtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          deconnecterUtilisateur('index.html', false);
        });
      });
    }
  }
}
