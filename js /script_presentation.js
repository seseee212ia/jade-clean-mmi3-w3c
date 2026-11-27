document.addEventListener('DOMContentLoaded', function() {
    
    // Forcer la lecture des états animations
    document.addEventListener("touchstart", function() {}, {passive: true});

    const header = document.querySelector('.site-header');
    const mobileThemeBtn = document.getElementById('mobileThemeBtn');
    const themeToggleLabel = document.getElementById('themeToggle');

    // Garantit l'affichage des icônes icons-lune et icons-soleil dans les toggles
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

    // Gestion du menu burger mobile
    const burgerMenu = document.querySelector('.burger-menu');
    const mainNav = document.querySelector('.main-nav');
    const navLinks = document.querySelectorAll('.main-nav a');

    if (burgerMenu && mainNav) {
        burgerMenu.addEventListener('click', function() {
            burgerMenu.classList.toggle('active');
            mainNav.classList.toggle('active');
            const isMenuOpen = mainNav.classList.contains('active');
            // Empêcher le scroll du fond quand le menu est ouvert
            document.body.style.overflow = isMenuOpen ? 'hidden' : '';
            if (mobileThemeBtn) {
                mobileThemeBtn.classList.toggle('hidden-menu', isMenuOpen);
            }
        });

        // Fermer le menu si on clique sur un lien
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

    // Ombre dynamique du header au défilement (scroll)
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

    // Animations légères sur les cartes Valeurs (Interactions avancées au clic)
    const valueCards = document.querySelectorAll('.value-card');
    valueCards.forEach(card => {
        card.addEventListener('click', function() {
            const title = this.querySelector('h3').textContent;
            console.log(`Valeur consultée : ${title}`);
        });
    });
    
    // Animation des clients au clic (Mobile / Tablette)
    const clientItems = document.querySelectorAll('.clients-list .client-item');
    clientItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // On bascule une classe 'mobile-open' pour ouvrir l'image au toucher
            this.classList.toggle('mobile-open');
            
            // Ferme les autres pour garder un affichage propre
            clientItems.forEach(otherItem => {
                if (otherItem !== this) {
                    otherItem.classList.remove('mobile-open');
                }
            });
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

        // Synchronise le switch du header (tablette/desktop)
        if (themeCheckbox) {
            themeCheckbox.checked = isLight;
        }

        // Synchronise l'état accessible du toggle flottant mobile
        if (mobileThemeBtn) {
            mobileThemeBtn.setAttribute('aria-checked', isLight ? 'true' : 'false');
        }

        // Met à jour l'ombre du header si la page est déjà scrollée
        handleScroll();
    }

    // Charger l'état enregistré au démarrage et lors du retour arrière navigateur
    applySavedTheme();
    window.addEventListener('pageshow', applySavedTheme);

    // Écouter le changement sur la checkbox (Tablette & Desktop)
    if (themeCheckbox) {
        themeCheckbox.addEventListener('change', function() {
            localStorage.setItem('theme', this.checked ? 'light' : 'dark');
            applySavedTheme();
        });
    }

    // Écouter le clic sur le toggle flottant (Mobile)
    if (mobileThemeBtn) {
        mobileThemeBtn.addEventListener('click', function() {
            const nextTheme = body.classList.contains('light-mode') ? 'dark' : 'light';
            localStorage.setItem('theme', nextTheme);
            applySavedTheme();
        });
    }
});
