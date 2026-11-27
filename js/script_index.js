document.addEventListener('DOMContentLoaded', function() {

    // Assure que les événements tactiles sont lus pour forcer le déclenchement des états
    document.addEventListener("touchstart", function() {}, {passive: true});

    const header = document.querySelector('.site-header');
    const mobileThemeBtn = document.getElementById('mobileThemeBtn');
    const themeToggleLabel = document.getElementById('themeToggle');

    // Garantit l'affichage des icônes icons-lune et icons-soleil sur toutes les pages
    if (themeToggleLabel) {
        const track = themeToggleLabel.querySelector('.switch-track');
        if (track && !track.querySelector('.theme-icon-img')) {
            track.innerHTML = `
                <span class="icon-moon">
                    <img src="images/icons-lune.png" alt="Mode sombre" class="theme-icon-img" onerror="this.onerror=null; this.src='images/icons-lune.svg';">
                </span>
                <span class="icon-sun">
                    <img src="images/icons-soleil.png" alt="Mode clair" class="theme-icon-img" onerror="this.onerror=null; this.src='images/icons-soleil.svg';">
                </span>
                <div class="switch-thumb"></div>
            `;
        }
    }

    if (mobileThemeBtn) {
        mobileThemeBtn.setAttribute('role', 'switch');
        mobileThemeBtn.classList.add('visible');
        if (!mobileThemeBtn.querySelector('.mini-icon-moon')) {
            mobileThemeBtn.innerHTML = `
                <span class="mini-toggle-track">
                    <span class="mini-icon-moon">
                        <img src="images/icons-lune.png" alt="Mode sombre" class="theme-icon-img" onerror="this.onerror=null; this.src='images/icons-lune.svg';">
                    </span>
                    <span class="mini-icon-sun">
                        <img src="images/icons-soleil.png" alt="Mode clair" class="theme-icon-img" onerror="this.onerror=null; this.src='images/icons-soleil.svg';">
                    </span>
                    <span class="mini-toggle-thumb"></span>
                </span>
            `;
        }
    }

    // Gestion du menu Burger Responsive Mobile plein écran
    const burgerMenu = document.querySelector('.burger-menu');
    const mainNav = document.querySelector('.main-nav');
    const navLinks = document.querySelectorAll('.main-nav a');

    if (burgerMenu && mainNav) {
        burgerMenu.addEventListener('click', function() {
            burgerMenu.classList.toggle('active');
            mainNav.classList.toggle('active');
            const isMenuOpen = mainNav.classList.contains('active');
            document.body.style.overflow = isMenuOpen ? 'hidden' : '';
            if (mobileThemeBtn) {
                mobileThemeBtn.classList.toggle('hidden-menu', isMenuOpen);
            }
        });

        // Fermeture automatique du menu au clic sur un lien
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                burgerMenu.classList.remove('active');
                mainNav.classList.remove('active');
                document.body.style.overflow = '';
                if (mobileThemeBtn) {
                    mobileThemeBtn.classList.remove('hidden-menu');
                }
            });
        });

        // Fermeture avec la touche Échap ou passage en mode ordinateur
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mainNav.classList.contains('active')) {
                burgerMenu.classList.remove('active');
                mainNav.classList.remove('active');
                document.body.style.overflow = '';
                if (mobileThemeBtn) mobileThemeBtn.classList.remove('hidden-menu');
            }
        });

        window.matchMedia('(min-width: 992px)').addEventListener('change', (e) => {
            if (e.matches && mainNav.classList.contains('active')) {
                burgerMenu.classList.remove('active');
                mainNav.classList.remove('active');
                document.body.style.overflow = '';
                if (mobileThemeBtn) mobileThemeBtn.classList.remove('hidden-menu');
            }
        });
    }

    // Barre fine de progression de lecture en haut de page (identique à Bootstrap)
    if (header && !document.querySelector('.barre-lecture')) {
        const barreLecture = document.createElement('div');
        barreLecture.className = 'barre-lecture';
        document.body.prepend(barreLecture);

        const majBarreLecture = () => {
            const hauteur = document.documentElement.scrollHeight - window.innerHeight;
            barreLecture.style.width = hauteur > 0 ? `${(window.scrollY / hauteur) * 100}%` : '0';
        };

        window.addEventListener('scroll', majBarreLecture, { passive: true });
        window.addEventListener('resize', majBarreLecture);
        majBarreLecture();
    }

    // Affichage / Masquage automatique de la barre de navigation au défilement + ombre
    let lastScroll = window.scrollY || 0;
    const seuilScroll = 10;

    function handleScroll() {
        const currentScroll = window.scrollY || document.documentElement.scrollTop;

        if (header) {
            if (currentScroll > 30) {
                const isLight = document.body.classList.contains('light-mode');
                header.style.boxShadow = isLight
                    ? '0 4px 20px rgba(28, 18, 26, 0.12)'
                    : '0 4px 20px rgba(0, 0, 0, 0.5)';
            } else {
                header.style.boxShadow = 'none';
            }

            if (!(mainNav && mainNav.classList.contains('active'))) {
                if (currentScroll <= 20) {
                    header.classList.remove('nav-hidden');
                    lastScroll = 0;
                } else if (Math.abs(currentScroll - lastScroll) > seuilScroll) {
                    if (currentScroll > lastScroll) {
                        header.classList.add('nav-hidden');
                    } else {
                        header.classList.remove('nav-hidden');
                    }
                    lastScroll = currentScroll;
                }
            }
        }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Défilement fluide pour les liens d'ancrage et l'indicateur de scroll
    const anchorLinks = document.querySelectorAll('.main-nav a, .hero-buttons a, .footer-col a');

    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');

            if (targetId && targetId.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(targetId);

                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    const scrollIndicator = document.querySelector('.page-accueil .scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', function() {
            const targetSection = document.querySelector('.stats-bar') || document.querySelector('#presentation');
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // Rendre chaque carte de prestation entièrement cliquable (comme <a class="carte-service"> en Bootstrap)
    document.querySelectorAll('.page-accueil .service-card-img').forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.closest('a')) return;
            const link = this.querySelector('.arrow-link');
            if (link && link.getAttribute('href')) {
                window.location.assign(link.getAttribute('href'));
            }
        });
    });

    // Animation d'apparition au défilement (.reveal) identique à Bootstrap
    if (document.body.classList.contains('page-accueil')) {
        const revealGroups = [
            { selector: '.about-images', delay: '' },
            { selector: '.about-text', delay: 'reveal-d1' },
            { selector: '.services-section > .section-tag, .services-section > .section-title, .services-section > .section-desc', delay: '' },
            { selector: '.services-grid-new .service-card-img:nth-child(1)', delay: '' },
            { selector: '.services-grid-new .service-card-img:nth-child(2)', delay: 'reveal-d1' },
            { selector: '.services-grid-new .service-card-img:nth-child(3)', delay: 'reveal-d2' },
            { selector: '.services-grid-new .service-card-img:nth-child(4)', delay: 'reveal-d3' },
            { selector: '.promises-section > .section-tag, .promises-section > .section-title', delay: '' },
            { selector: '.promises-container .promise-col:nth-child(1)', delay: '' },
            { selector: '.promises-container .promise-col:nth-child(2)', delay: 'reveal-d1' },
            { selector: '.promises-container .promise-col:nth-child(3)', delay: 'reveal-d2' },
            { selector: '.pricing-section > .section-tag, .pricing-section > .section-title, .pricing-section > .section-desc', delay: '' },
            { selector: '.pricing-grid .pricing-card:nth-child(1)', delay: '' },
            { selector: '.pricing-grid .pricing-card:nth-child(2)', delay: 'reveal-d1' },
            { selector: '.pricing-grid .pricing-card:nth-child(3)', delay: 'reveal-d2' },
            { selector: '.cta-banner', delay: '' }
        ];

        revealGroups.forEach(group => {
            document.querySelectorAll(group.selector).forEach(el => {
                el.classList.add('reveal');
                if (group.delay) el.classList.add(group.delay);
            });
        });

        const revealElements = document.querySelectorAll('.reveal');
        if ('IntersectionObserver' in window) {
            const observateur = new IntersectionObserver((entrees) => {
                entrees.forEach(entree => {
                    if (entree.isIntersecting) {
                        entree.target.classList.add('visible');
                        observateur.unobserve(entree.target);
                    }
                });
            }, { threshold: 0.12 });

            revealElements.forEach(el => observateur.observe(el));
        } else {
            revealElements.forEach(el => el.classList.add('visible'));
        }
    }

    // Simulation interactive des boutons de demande de devis / abonnements
    const pricingButtons = document.querySelectorAll('.pricing-card .btn-primary, .pricing-card .btn-outline');

    pricingButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const card = this.closest('.pricing-card');
            if (card) {
                const planTitle = card.querySelector('h3').textContent;

                if (this.getAttribute('href') === '#contact') {
                    e.preventDefault();
                    alert(`Formule sélectionnée : "${planTitle}". \nVous allez être redirigé vers le formulaire de personnalisation et de contact hôtelier.`);
                }
            }
        });
    });

    // Gestion du toggle mode sombre / clair (Desktop + Mobile)
    const themeCheckbox = document.getElementById('themeCheckbox');
    const body = document.body;

    function applySavedTheme() {
        const isLight = localStorage.getItem('theme') === 'light';

        if (isLight) {
            body.classList.add('light-mode');
        } else {
            body.classList.remove('light-mode');
        }

        if (themeCheckbox) {
            themeCheckbox.checked = isLight;
        }

        if (mobileThemeBtn) {
            mobileThemeBtn.setAttribute('aria-checked', isLight ? 'true' : 'false');
        }

        handleScroll();
    }

    applySavedTheme();
    window.addEventListener('pageshow', applySavedTheme);

    if (themeCheckbox) {
        themeCheckbox.addEventListener('change', function() {
            localStorage.setItem('theme', this.checked ? 'light' : 'dark');
            applySavedTheme();
        });
    }

    if (mobileThemeBtn) {
        mobileThemeBtn.addEventListener('click', function() {
            const nextTheme = body.classList.contains('light-mode') ? 'dark' : 'light';
            localStorage.setItem('theme', nextTheme);
            applySavedTheme();
        });
    }
});
