document.addEventListener('DOMContentLoaded', function() {
    // Gestion du toggle thème clair / sombre (Desktop, Tablette & Mobile)
    const themeCheckbox = document.getElementById('themeCheckbox');
    const mobileThemeFab = document.getElementById('mobileThemeFab');

    function applyTheme(isLight) {
        document.body.classList.toggle('light-mode', isLight);
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        if (themeCheckbox) {
            themeCheckbox.checked = isLight;
        }
    }

    if (themeCheckbox) {
        themeCheckbox.checked = document.body.classList.contains('light-mode');
        themeCheckbox.addEventListener('change', function() {
            applyTheme(this.checked);
        });
    }

    if (mobileThemeFab) {
        mobileThemeFab.addEventListener('click', function() {
            const isCurrentlyLight = document.body.classList.contains('light-mode');
            applyTheme(!isCurrentlyLight);
        });
    }

    const btnClient = document.getElementById('btnClient');
    const btnInterne = document.getElementById('btnInterne');
    const loginForm = document.getElementById('loginForm');
    const forgotLink = document.querySelector('.forgot-link');
    const signupLink = document.querySelector('.signup-text a');
    const loginBox = document.querySelector('.login-box');
    
    let currentRole = 'CLIENT';

    function bindPasswordToggle(btnId, inputId) {
        const btn = document.getElementById(btnId);
        const input = document.getElementById(inputId);
        if (!btn || !input) return;

        btn.addEventListener('click', function() {
            const isPassword = input.getAttribute('type') === 'password';
            input.setAttribute('type', isPassword ? 'text' : 'password');
            btn.setAttribute('aria-label', isPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe');

            if (isPassword) {
                btn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                `;
            } else {
                btn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                `;
            }
        });
    }

    // Gestion de la bascule Client / Interne
    if (btnClient && btnInterne) {
        btnClient.addEventListener('click', function() {
            btnClient.classList.add('active');
            btnInterne.classList.remove('active');
            currentRole = 'CLIENT';
        });

        btnInterne.addEventListener('click', function() {
            btnInterne.classList.add('active');
            btnClient.classList.remove('active');
            currentRole = 'INTERNE';
        });
    }

    // Gestion de l'affichage / masquage du mot de passe
    bindPasswordToggle('togglePassword', 'password');

    // Simulation de connexion classique avec vérification de sécurité
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const btnSubmit = loginForm.querySelector('.btn-submit');

            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            const savedPassword = localStorage.getItem('user_custom_password');

            if (savedPassword && password === savedPassword) {
                // Mot de passe réinitialisé valide
            } else if (!passwordRegex.test(password)) {
                alert("Sécurité requise : Le mot de passe doit contenir au moins 8 caractères, incluant au moins une majuscule, une minuscule et un chiffre.");
                return;
            }

            if (currentRole === 'CLIENT' && typeof JCAuth !== 'undefined') {
                const res = await JCAuth.loginClient(email, password);
                if (!res.ok) {
                    alert(res.error);
                    return;
                }
            }

            btnSubmit.textContent = 'CONNEXION...';
            btnSubmit.style.opacity = '0.7';

            setTimeout(() => {
                alert(`Connexion réussie (${currentRole}) !\nBienvenue ${email}`);
                btnSubmit.textContent = 'Se connecter';
                btnSubmit.style.opacity = '1';

                if (currentRole === 'CLIENT') {
                    window.location.href = 'espace_client.html';
                } else {
                    window.location.href = 'espace-interne.html';
                }
            }, 1200);
        });
    }

    // Formulaire "MOT DE PASSE OUBLIÉ ?" avec icônes œils intégrées
    if (forgotLink) {
        forgotLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            loginBox.innerHTML = `
                <h2 class="login-title">MOT DE PASSE OUBLIÉ ?</h2>
                <p class="login-subtitle">Réinitialisez votre mot de passe ici</p>
                <div class="form-card">
                    <form id="resetPasswordForm">
                        <div class="input-field">
                            <label for="new-password">Nouveau mot de passe</label>
                            <div class="input-wrapper">
                                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                <input type="password" id="new-password" required placeholder="••••••••">
                                <button type="button" id="toggleNewPassword" class="toggle-password" aria-label="Afficher le nouveau mot de passe" title="Afficher / Masquer">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div class="input-field input-field-last">
                            <label for="confirm-password">Confirmer mot de passe</label>
                            <div class="input-wrapper">
                                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                <input type="password" id="confirm-password" required placeholder="••••••••">
                                <button type="button" id="toggleConfirmPassword" class="toggle-password" aria-label="Afficher la confirmation du mot de passe" title="Afficher / Masquer">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <button type="submit" class="btn-submit">Réinitialisez mot de passe</button>
                    </form>
                </div>
                <p class="signup-text">
                    Vous avez un compte ? <a href="connexion.html">Connectez-vous ici</a>
                </p>
                <p class="back-home">
                    <a href="connexion.html">← Retour à la connexion</a>
                </p>
            `;

            bindPasswordToggle('toggleNewPassword', 'new-password');
            bindPasswordToggle('toggleConfirmPassword', 'confirm-password');

            const resetForm = document.getElementById('resetPasswordForm');
            resetForm.addEventListener('submit', function(ev) {
                ev.preventDefault();
                
                const newPass = document.getElementById('new-password').value;
                const confirmPass = document.getElementById('confirm-password').value;
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

                if (newPass !== confirmPass) {
                    alert("Les mots de passe ne correspondent pas.");
                    return;
                }

                if (!passwordRegex.test(newPass)) {
                    alert("Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.");
                    return;
                }

                localStorage.setItem('user_custom_password', newPass);

                alert("Votre mot de passe a été réinitialisé avec succès ! Vous pouvez maintenant vous connecter.");
                window.location.reload();
            });
        });
    }

    // Fonctionnalité "Créer un compte"
    if (signupLink) {
        signupLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            loginBox.innerHTML = `
                <h2 class="login-title">INSCRIPTION</h2>
                <p class="login-subtitle">Inscrivez-vous à notre espace</p>
                <div class="form-card">
                    <form id="signupForm">
                        <div class="input-field">
                            <label for="su-hotel">Nom de l'établissement</label>
                            <div class="input-wrapper">
                                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                                <input type="text" id="su-hotel" required placeholder="Ex. Hôtel Le Bristol">
                            </div>
                        </div>
                        <div class="input-field">
                            <label for="su-email">Email professionnel</label>
                            <div class="input-wrapper">
                                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                                <input type="email" id="su-email" required placeholder="nom@hotel.com">
                            </div>
                        </div>
                        <div class="input-field input-field-last">
                            <label for="su-password">Mot de passe</label>
                            <div class="input-wrapper">
                                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                <input type="password" id="su-password" required placeholder="••••••••">
                                <button type="button" id="toggleSuPassword" class="toggle-password" aria-label="Afficher le mot de passe" title="Afficher / Masquer le mot de passe">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <button type="submit" class="btn-submit">S'inscrire</button>
                    </form>
                </div>
                <p class="signup-text">
                    Vous avez un compte ? <a href="connexion.html">Connectez-vous ici</a>
                </p>
                <p class="back-home">
                    <a href="connexion.html" id="backToLogin">← Retour à la connexion</a>
                </p>
            `;

            bindPasswordToggle('toggleSuPassword', 'su-password');

            const signupForm = document.getElementById('signupForm');
            signupForm.addEventListener('submit', async function (ev) {
                ev.preventDefault();
                const etab = document.getElementById('su-hotel').value.trim();
                const email = document.getElementById('su-email').value.trim();
                const pw = document.getElementById('su-password').value;

                if (typeof JCAuth !== 'undefined') {
                    const res = await JCAuth.signup({ etab, nom: etab, email, tel: '', pw });
                    if (!res.ok) {
                        alert(res.error);
                        return;
                    }
                    alert("Compte créé avec succès ! Bienvenue chez Jade Clean.");
                    window.location.href = 'espace_client.html';
                    return;
                }

                alert("Compte créé avec succès ! Bienvenue chez Jade Clean.");
                window.location.reload();
            });
        });
    }
});
