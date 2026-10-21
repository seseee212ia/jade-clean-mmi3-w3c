document.addEventListener('DOMContentLoaded', () => {
  initConnexion();
  initInscription();
  initMotDePasseOublie();
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
    boutonClient.classList.toggle('active', role === 'client');
    boutonInterne.classList.toggle('active', role === 'interne');
  };

  boutonClient.addEventListener('click', () => choisir('client'));
  boutonInterne.addEventListener('click', () => choisir('interne'));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // Démo sans serveur : n'importe quel email / mot de passe est accepté
    sessionStorage.setItem('jadeclean-role', role);
    window.location.href = role === 'interne' ? 'espace-interne.html' : 'espace-client.html';
  });
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
