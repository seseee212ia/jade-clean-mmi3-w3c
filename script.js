
    // On sélectionne le bouton burger et le menu
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile_menu');

    // On ajoute un écouteur d'événement au clic
    menuBtn.addEventListener('click', () => {
        // Ajoute ou enlève la classe 'open' au bouton (pour faire la croix)
        menuBtn.classList.toggle('open');
        
        // Ajoute ou enlève la classe 'open' au menu (pour le faire glisser)
        mobileMenu.classList.toggle('open');
        
        // Accessibilité W3C
        const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
        menuBtn.setAttribute('aria-expanded', !isExpanded);
        
        // Bloque le défilement de la page quand le menu est ouvert
        if (!isExpanded) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    });