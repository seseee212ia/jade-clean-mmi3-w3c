document.addEventListener('DOMContentLoaded', () => {
    const burgerBtn = document.getElementById('burgerBtn');
    const mainNav = document.getElementById('mainNav');
    const themeToggle = document.getElementById('themeToggle');
    const mobileThemeFab = document.getElementById('mobileThemeFab');

    // Menu mobile
    if (burgerBtn && mainNav) {
        burgerBtn.addEventListener('click', () => {
            const isOpen = mainNav.classList.toggle('active');
            burgerBtn.classList.toggle('active', isOpen);
            burgerBtn.setAttribute('aria-expanded', String(isOpen));
        });

        mainNav.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('active');
                burgerBtn.classList.remove('active');
                burgerBtn.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Gestion du thème clair / sombre
    const applyTheme = (isLight) => {
        document.body.classList.toggle('light-mode', isLight);
        if (themeToggle) themeToggle.checked = isLight;
        if (mobileThemeFab) mobileThemeFab.textContent = isLight ? '☀' : '☾';
        localStorage.setItem('jadeCleanTheme', isLight ? 'light' : 'dark');
    };

    const savedTheme = localStorage.getItem('jadeCleanTheme') === 'light';
    applyTheme(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('change', (e) =>
            applyTheme(e.target.checked),
        );
    }

    if (mobileThemeFab) {
        mobileThemeFab.addEventListener('click', () => {
            applyTheme(!document.body.classList.contains('light-mode'));
        });

        const toggleFabVisibility = () => {
            mobileThemeFab.classList.toggle('visible', window.scrollY > 180);
        };

        window.addEventListener('scroll', toggleFabVisibility, {
            passive: true,
        });
        toggleFabVisibility();
    }

    // Mémoriser la formule choisie lors du clic sur "Demander un devis"
    document.querySelectorAll('[data-formule]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const formule = btn.getAttribute('data-formule');
            if (formule) {
                localStorage.setItem('jadeCleanFormule', formule);
            }
            if (btn.getAttribute('href') === '#devis') {
                e.preventDefault();
                window.location.href =
                    'connexion.html?formule=' +
                    encodeURIComponent(formule || '');
            }
        });
    });
});
