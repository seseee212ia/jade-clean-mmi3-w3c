document.addEventListener('DOMContentLoaded', () => {
  initConnexion();
  initInscription();
  initMotDePasseOublie();
  initTogglePassword();
});

/* ---------- Connexion : choix Client / Interne puis redirection ---------- */
function initConnexion() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const boutonClient = document.getElementById('roleClientBtn');
  const boutonInterne = document.getElementById('roleInterneBtn');
  let role = 'client';

  const choisir = (nouveauRole) => {
    role = nouveauRole;
    if (boutonClient) boutonClient.classList.toggle('active', role === 'client');
    if (boutonInterne) boutonInterne.classList.toggle('active', role === 'interne');
  };

  if (boutonClient) boutonClient.addEventListener('click', () => choisir('client'));
  if (boutonInterne) boutonInterne.addEventListener('click', () => choisir('interne'));

  // Si l'utilisateur vient de se déconnecter ou si sa session a expiré, afficher le popin
  try {
    const rawPopin = sessionStorage.getItem('jadeJustLoggedOut');
    if (rawPopin) {
      sessionStorage.removeItem('jadeJustLoggedOut');
      if (typeof afficherPopinDeconnexion === 'function') {
        try {
          const data = JSON.parse(rawPopin);
          afficherPopinDeconnexion(data.message, data.titre);
        } catch {
          afficherPopinDeconnexion(rawPopin === 'true' ? undefined : rawPopin);
        }
      }
    }
  } catch (e) {}

  const effectuerConnexion = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Validation HTML5 native si disponible
    if (emailInput && !emailInput.checkValidity()) {
      emailInput.reportValidity();
      return;
    }
    if (passwordInput && !passwordInput.checkValidity()) {
      passwordInput.reportValidity();
      return;
    }

    const email = emailInput ? emailInput.value.trim() : '';
    const identifiant = email ? email.split('@')[0] : 'rvmioraniaina';
    const expiresAt = String(Date.now() + 25 * 60 * 1000);

    try {
      localStorage.setItem('jadeLoggedIn', 'true');
      localStorage.setItem('jadeUserRole', role);
      localStorage.setItem('jadeUserName', identifiant);
      localStorage.setItem('jadeSessionExpiresAt', expiresAt);
    } catch (err) {}

    try {
      sessionStorage.setItem('jadeLoggedIn', 'true');
      sessionStorage.setItem('jadeUserRole', role);
      sessionStorage.setItem('jadeUserName', identifiant);
      sessionStorage.setItem('jadeSessionExpiresAt', expiresAt);
      sessionStorage.setItem('jadeclean-role', role);
    } catch (err) {}

    const cible = role === 'interne' ? 'espace-interne.html' : 'espace-client.html';
    window.location.assign(cible);
  };

  form.addEventListener('submit', effectuerConnexion);

  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      // Si le navigateur ne déclenche pas submit pour une raison quelconque, forcer effectuerConnexion
      if (form.checkValidity()) {
        effectuerConnexion(e);
      }
    });
  }
}
/* ---------- Inscription ---------- */
function initInscription() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('registerBtn').disabled = true;
    document.getElementById('registerSuccess').classList.add('visible');
    setTimeout(() => {
      window.location.href = 'connexion.html';
    }, 1500);
  });
}

/* ---------- Mot de passe oublié ---------- */
function initMotDePasseOublie() {
  const form = document.getElementById('resetPasswordForm');
  if (!form) return;

  const succes = document.getElementById('resetSuccess');
  const erreur = document.getElementById('resetError');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const motDePasse = document.getElementById('new_password').value;
    const confirmation = document.getElementById('confirm_password').value;

    erreur.classList.remove('visible');

    if (motDePasse.length < 8) {
      erreur.textContent = 'Le mot de passe doit contenir au moins 8 caractères.';
      erreur.classList.add('visible');
      return;
    }

    if (motDePasse !== confirmation) {
      erreur.textContent = 'Les deux mots de passe ne sont pas identiques.';
      erreur.classList.add('visible');
      return;
    }

    document.getElementById('resetBtn').disabled = true;
    succes.classList.add('visible');
    setTimeout(() => {
      window.location.href = 'connexion.html';
    }, 1500);
  });
}


/* ---------- Afficher / masquer mot de passe ---------- */
function initTogglePassword() {
  const buttons = document.querySelectorAll('.btn-toggle-pwd');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const icon = btn.querySelector('i');
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.setAttribute('aria-label', isPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe');

      if (icon) {
        icon.classList.toggle('bi-eye', !isPassword);
        icon.classList.toggle('bi-eye-slash', isPassword);
      }
    });
  });
}
