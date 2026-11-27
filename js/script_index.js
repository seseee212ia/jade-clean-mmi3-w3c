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
    }
    
    // Effet d'ombre dynamique sur le header au défilement (Scroll)
    function handleScroll() {
        if (header) {
            if (window.scrollY > 30) {
                const isLight = document.body.classList.contains('light-mode');
                header.style.boxShadow = isLight 
                    ? '0 4px 20px rgba(28, 18, 26, 0.12)' 
                    : '0 4px 20px rgba(0, 0, 0, 0.5)';
                header.style.transition = 'box-shadow 0.3s ease';
            } else {
                header.style.boxShadow = 'none';
            }
        }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Navigation fluide pour les liens d'ancrage
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
