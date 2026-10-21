// Signale au CSS que le JavaScript fonctionne (active les animations .reveal)
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  initMenuMobile();
  initBarreLecture();
  initReveal();
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
