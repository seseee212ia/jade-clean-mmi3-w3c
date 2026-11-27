
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


/* ---------- Gestion de la session utilisateur, avatar & menu profil sur tout le site (validité 25 min) ---------- */
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

function echapperHtmlProfil(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
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

function ouvrirModaleProfilUtilisateur(role, nomUtilisateur) {
  let modaleEl = document.getElementById('jadeModalProfilUtilisateur');
  if (!modaleEl) {
    modaleEl = document.createElement('div');
    modaleEl.className = 'modal fade';
    modaleEl.id = 'jadeModalProfilUtilisateur';
    modaleEl.tabIndex = -1;
    modaleEl.setAttribute('aria-hidden', 'true');
    modaleEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content jade-profil-modal">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title" style="font-family: var(--font-display); font-size: 1.65rem; font-weight: 400;">Mon profil</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fermer"></button>
          </div>
          <form id="jadeFormProfilUtilisateur">
            <div class="modal-body pt-3">
              <div class="mb-3">
                <label class="form-label" style="font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--jade-grey);">Identifiant</label>
                <input type="text" id="jadeProfilInputNom" class="form-control jade-profil-input" required>
              </div>
              <div class="mb-3">
                <label class="form-label" style="font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--jade-grey);">Établissement / Fonction</label>
                <input type="text" id="jadeProfilInputFonction" class="form-control jade-profil-input" readonly>
              </div>
              <div class="mb-2">
                <label class="form-label" style="font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--jade-grey);">Email</label>
                <input type="email" id="jadeProfilInputEmail" class="form-control jade-profil-input" required>
              </div>
            </div>
            <div class="modal-footer border-0 pt-2">
              <button type="button" class="bouton-secondaire" data-bs-dismiss="modal">Fermer</button>
              <button type="submit" class="bouton-primaire">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modaleEl);

    modaleEl.querySelector('#jadeFormProfilUtilisateur').addEventListener('submit', (e) => {
      e.preventDefault();
      const nouveauNom = modaleEl.querySelector('#jadeProfilInputNom').value.trim();
      const nouvelEmail = modaleEl.querySelector('#jadeProfilInputEmail').value.trim();
      if (nouveauNom) {
        ecrireDonneeSession('jadeUserName', nouveauNom);
        const titrePopup = document.querySelector('.jade-profile-name');
        if (titrePopup) titrePopup.textContent = nouveauNom;
        const infoClient = document.getElementById('infoUtilisateur');
        if (infoClient) infoClient.textContent = `Connecté · ${nouveauNom} (Directeur)`;
        const infoInterne = document.getElementById('infoUtilisateurInterne');
        if (infoInterne) infoInterne.textContent = `Connecté · ${nouveauNom} (Administration)`;
      }
      if (nouvelEmail) {
        ecrireDonneeSession('jadeUserEmail', nouvelEmail);
      }
      if (window.bootstrap) {
        window.bootstrap.Modal.getOrCreateInstance(modaleEl).hide();
      }
      afficherPopinDeconnexion('Vos informations de profil ont été mises à jour.', 'Profil enregistré');
    });
  }

  const nomActuel = lireDonneeSession('jadeUserName') || nomUtilisateur || 'rvmioraniaina';
  const emailActuel = lireDonneeSession('jadeUserEmail') || `${nomActuel}@hotel-leprestige.fr`;
  const fonctionActuelle = role === 'interne' ? 'Jade Clean · Administration' : 'Hôtel Le Prestige · Directeur';

  modaleEl.querySelector('#jadeProfilInputNom').value = nomActuel;
  modaleEl.querySelector('#jadeProfilInputFonction').value = fonctionActuelle;
  modaleEl.querySelector('#jadeProfilInputEmail').value = emailActuel;

  if (window.bootstrap) {
    window.bootstrap.Modal.getOrCreateInstance(modaleEl).show();
  }
}

function monterMenuProfilNavbar(role, pageCourante, estSurEspacePrive) {
  const navActions = document.querySelector('.nav-right-actions');
  const navCenterLinks = document.querySelector('.nav-center-links');
  const menuMobileList = document.querySelector('#menu-mobile ul');
  if (!navActions) return;

  const urlEspace = role === 'interne' ? 'espace-interne.html' : 'espace-client.html';
  const labelEspace = role === 'interne' ? 'Espace interne' : 'Espace client';
  const labelMonEspace = role === 'interne' ? 'Mon espace interne' : 'Mon espace client';
  const nomUtilisateur = lireDonneeSession('jadeUserName') || 'rvmioraniaina';
  const sousTitreRole = role === 'interne' ? 'Jade Clean · Administration' : 'Hôtel Le Prestige · Directeur';

  // 1. Ajouter le lien "Espace client" (ou "Espace interne") dans les liens centraux de la navbar comme sur la maquette
  if (navCenterLinks && !navCenterLinks.querySelector('.nav-item-espace')) {
    const liEspace = document.createElement('li');
    liEspace.className = 'nav-item nav-item-espace';
    const isCurrent = pageCourante === urlEspace;
    liEspace.innerHTML = `<a class="nav-link${isCurrent ? ' active' : ''}"${isCurrent ? ' aria-current="page"' : ''} href="${urlEspace}">${labelEspace}</a>`;
    navCenterLinks.appendChild(liEspace);
  }

  // 2. Remplacer le bouton "Se connecter" / "Déconnexion" par le bouton avatar circulaire + popup dropdown
  const anciensBoutonsAuth = navActions.querySelectorAll('#navAuthBtn, .btn-logout, #navQuickLogout');
  anciensBoutonsAuth.forEach(el => el.remove());

  if (!document.getElementById('jadeProfileMenuWrapper')) {
    const wrapper = document.createElement('div');
    wrapper.id = 'jadeProfileMenuWrapper';
    wrapper.className = 'jade-profile-wrapper';
    wrapper.innerHTML = `
      <button type="button" class="jade-avatar-btn" id="jadeAvatarBtn" aria-label="Menu du profil" aria-expanded="false" aria-haspopup="true">
        <i class="bi bi-person"></i>
      </button>
      <div class="jade-profile-dropdown" id="jadeProfileDropdown" role="menu" aria-labelledby="jadeAvatarBtn">
        <div class="jade-profile-header">
          <strong class="jade-profile-name">${echapperHtmlProfil(nomUtilisateur)}</strong>
          <span class="jade-profile-role">${echapperHtmlProfil(sousTitreRole)}</span>
        </div>
        <div class="jade-profile-divider"></div>
        <a href="${urlEspace}" class="jade-profile-item${estSurEspacePrive ? ' active' : ''}" role="menuitem">
          ${labelMonEspace}
        </a>
        <button type="button" class="jade-profile-item" id="jadeMenuMonProfil" role="menuitem">
          Mon profil
        </button>
        <a href="mot-de-passe-oublie.html" class="jade-profile-item" role="menuitem">
          Changer le mot de passe
        </a>
        <button type="button" class="jade-profile-item jade-profile-logout" id="jadeMenuDeconnexion" role="menuitem">
          Se déconnecter
        </button>
      </div>
    `;

    const burger = document.getElementById('menu-btn');
    if (burger) {
      navActions.insertBefore(wrapper, burger);
    } else {
      navActions.appendChild(wrapper);
    }

    const avatarBtn = wrapper.querySelector('#jadeAvatarBtn');
    const dropdown = wrapper.querySelector('#jadeProfileDropdown');

    const fermerDropdown = () => {
      dropdown.classList.remove('open');
      avatarBtn.setAttribute('aria-expanded', 'false');
    };

    avatarBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const ouvert = dropdown.classList.toggle('open');
      avatarBtn.setAttribute('aria-expanded', String(ouvert));
    });

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        fermerDropdown();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') fermerDropdown();
    });

    wrapper.querySelector('#jadeMenuMonProfil').addEventListener('click', () => {
      fermerDropdown();
      ouvrirModaleProfilUtilisateur(role, nomUtilisateur);
    });

    wrapper.querySelector('#jadeMenuDeconnexion').addEventListener('click', (e) => {
      e.preventDefault();
      fermerDropdown();
      deconnecterUtilisateur('index.html', false);
    });
  }

  // 3. Synchroniser également le menu mobile
  if (menuMobileList) {
    if (!menuMobileList.querySelector('.mobile-espace-link') && !estSurEspacePrive) {
      const liEspace = document.createElement('li');
      liEspace.className = 'mobile-espace-link';
      liEspace.innerHTML = `<a href="${urlEspace}">${labelEspace}</a>`;
      menuMobileList.appendChild(liEspace);
    }
    if (!menuMobileList.querySelector('.mobile-logout-link')) {
      const liLogout = document.createElement('li');
      liLogout.className = 'mobile-logout-link';
      liLogout.innerHTML = `<a href="#" class="text-jade-rose">Se déconnecter</a>`;
      liLogout.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        deconnecterUtilisateur('index.html', false);
      });
      menuMobileList.appendChild(liLogout);
    }
  }
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

  let estConnecte = verifierValiditeSession();
  const pageCourante = window.location.pathname.split('/').pop() || 'index.html';
  const estSurEspacePrive = pageCourante === 'espace-client.html' || pageCourante === 'espace-interne.html';

  // Si l'utilisateur ouvre directement espace-client.html ou espace-interne.html, activer automatiquement une session démo de 25 min
  if (!estConnecte && estSurEspacePrive) {
    const roleDemo = pageCourante === 'espace-interne.html' ? 'interne' : 'client';
    ecrireDonneeSession('jadeLoggedIn', 'true');
    ecrireDonneeSession('jadeUserRole', roleDemo);
    if (!lireDonneeSession('jadeUserName')) {
      ecrireDonneeSession('jadeUserName', 'rvmioraniaina');
    }
    ecrireDonneeSession('jadeSessionExpiresAt', String(Date.now() + DUREE_SESSION_MS));
    estConnecte = true;
  }

  const role = lireDonneeSession('jadeUserRole') || 'client';

  if (estConnecte) {
    prolongerSession();
    ['click', 'keydown', 'scroll'].forEach(evt => {
      document.addEventListener(evt, prolongerSession, { passive: true });
    });

    setInterval(() => {
      verifierValiditeSession();
    }, 30000);

    monterMenuProfilNavbar(role, pageCourante, estSurEspacePrive);
  }
}
