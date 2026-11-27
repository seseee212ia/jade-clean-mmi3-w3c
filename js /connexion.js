(function () {
    function initConnexionPage() {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;

        // Verrou anti-doublon si script.js et connexion.js sont exécutés ensemble
        if (window.__JC_CONNEXION_INIT__) return;
        window.__JC_CONNEXION_INIT__ = true;

        // Fonctionnalité redirection immédiate si une session client est déjà active
        if (typeof JCAuth !== 'undefined' && JCAuth.session()) {
            window.location.replace('espace_client.html');
            return;
        }

        // Fonctionnalité message si la session a expiré après 30 min d'inactivité (?expired=1)
        if (new URLSearchParams(window.location.search).get('expired')) {
            const expiredMsg = document.createElement('p');
            expiredMsg.className = 'form-status ko';
            expiredMsg.setAttribute('role', 'status');
            expiredMsg.setAttribute('aria-live', 'polite');
            expiredMsg.style.cssText = 'margin-bottom: 14px; text-align: center; font-size: 0.9rem;';
            expiredMsg.textContent = 'Votre session a expiré après 30 minutes d’inactivité. Reconnectez-vous.';
            loginForm.prepend(expiredMsg);
        }

        // Gestion du toggle thème clair / sombre (Desktop, Tablette & Mobile)
        const themeCheckbox = document.getElementById('themeCheckbox');
        const mobileThemeFab = document.getElementById('mobileThemeFab') || document.getElementById('mobileThemeBtn');

        function applyTheme(isLight) {
            document.body.classList.toggle('light-mode', isLight);
            try {
                localStorage.setItem('theme', isLight ? 'light' : 'dark');
            } catch (e) { /* ignore */ }
            if (themeCheckbox) {
                themeCheckbox.checked = isLight;
            }
            if (mobileThemeFab) {
                mobileThemeFab.setAttribute('aria-checked', String(isLight));
            }
        }

        if (themeCheckbox) {
            themeCheckbox.checked = document.body.classList.contains('light-mode');
            themeCheckbox.addEventListener('change', function () {
                applyTheme(this.checked);
            });
        }

        if (mobileThemeFab) {
            mobileThemeFab.setAttribute('aria-checked', String(document.body.classList.contains('light-mode')));
            mobileThemeFab.addEventListener('click', function () {
                const isCurrentlyLight = document.body.classList.contains('light-mode');
                applyTheme(!isCurrentlyLight);
            });
        }

        const btnClient = document.getElementById('btnClient');
        const btnInterne = document.getElementById('btnInterne');
        const forgotLink = document.querySelector('.forgot-link');
        const signupLink = document.querySelector('.signup-text a');
        const loginBox = document.querySelector('.login-box');

        let currentRole = 'CLIENT';

        // Gestion de la bascule Client / Interne
        if (btnClient && btnInterne) {
            btnClient.addEventListener('click', function () {
                btnClient.classList.add('active');
                btnInterne.classList.remove('active');
                currentRole = 'CLIENT';
            });

            btnInterne.addEventListener('click', function () {
                btnInterne.classList.add('active');
                btnClient.classList.remove('active');
                currentRole = 'INTERNE';
            });
        }

        // Gestion de l'affichage / masquage du mot de passe
        const togglePassword = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('password');

        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('click', function () {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);

                if (type === 'text') {
                    togglePassword.innerHTML = `
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                    `;
                } else {
                    togglePassword.innerHTML = `
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    `;
                }
            });
        }

        // Synchronise un éventuel mot de passe réinitialisé avec JCAuth
        async function syncResetPassword(email, pw) {
            try {
                const rawUsers = localStorage.getItem('jc-users');
                if (!rawUsers) return;
                const users = JSON.parse(rawUsers);
                const normEmail = String(email).trim().toLowerCase();
                const existing = users.find(function (u) { return u.email === normEmail; });
                if (!existing) return;

                const s = 'jade-clean:' + normEmail + ':' + pw;
                if (window.crypto && window.crypto.subtle) {
                    const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
                    existing.hash = Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
                } else {
                    let h = 5381;
                    for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
                    existing.hash = 'x' + (h >>> 0).toString(16);
                }
                localStorage.setItem('jc-users', JSON.stringify(users));
            } catch (e) { /* ignore */ }
        }

        // Connexion avec vérification de sécurité + support JCAuth (copine)
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const btnSubmit = loginForm.querySelector('.btn-submit');

            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            const savedPassword = localStorage.getItem('user_custom_password');

            if (savedPassword && password === savedPassword) {
                await syncResetPassword(email, password);
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

            setTimeout(function () {
                alert(`Connexion réussie (${currentRole}) !\nBienvenue ${email}`);
                btnSubmit.textContent = 'SE CONNECTER';
                btnSubmit.style.opacity = '1';

                if (currentRole === 'CLIENT') {
                    window.location.href = 'espace_client.html';
                } else {
                    window.location.href = 'espace-interne.html';
                }
            }, 1200);
        });

        // Formulaire "MOT DE PASSE OUBLIÉ ?" avec icônes œils intégrées
        if (forgotLink && loginBox) {
            forgotLink.addEventListener('click', function (e) {
                e.preventDefault();

                loginBox.innerHTML = `
                    <h2 class="login-title" style="text-transform: uppercase; letter-spacing: 1px;">MOT DE PASSE OUBLIÉ ?</h2>
                    <p class="login-subtitle">Réinitialisez votre mot de passe ici</p>
                    <div class="form-card">
                        <form id="resetPasswordForm">
                            <div class="input-field">
                                <label for="new-password">Nouveau mot de passe</label>
                                <div class="input-wrapper">
                                    <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                    <input type="password" id="new-password" required placeholder="••••••••" style="padding-right: 40px;">
                                    <button type="button" id="toggleNewPassword" class="toggle-password" title="Afficher / Masquer">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div class="input-field">
                                <label for="confirm-password">Confirmer mot de passe</label>
                                <div class="input-wrapper">
                                    <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                    <input type="password" id="confirm-password" required placeholder="••••••••" style="padding-right: 40px;">
                                    <button type="button" id="toggleConfirmPassword" class="toggle-password" title="Afficher / Masquer">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <button type="submit" class="btn-submit" style="text-transform: uppercase;">RÉINITIALISEZ MOT DE PASSE</button>
                        </form>
                    </div>
                    <p class="signup-text" style="margin-top:20px;">
                        Vous avez un compte ? <a href="connexion.html" style="color: var(--primary-hover);">Connectez vous ici</a>
                    </p>
                `;

                const toggleNewPassword = document.getElementById('toggleNewPassword');
                const newPasswordInput = document.getElementById('new-password');
                if (toggleNewPassword && newPasswordInput) {
                    toggleNewPassword.addEventListener('click', function () {
                        const type = newPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                        newPasswordInput.setAttribute('type', type);

                        if (type === 'text') {
                            toggleNewPassword.innerHTML = `
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                </svg>
                            `;
                        } else {
                            toggleNewPassword.innerHTML = `
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            `;
                        }
                    });
                }

                const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
                const confirmPasswordInput = document.getElementById('confirm-password');
                if (toggleConfirmPassword && confirmPasswordInput) {
                    toggleConfirmPassword.addEventListener('click', function () {
                        const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                        confirmPasswordInput.setAttribute('type', type);

                        if (type === 'text') {
                            toggleConfirmPassword.innerHTML = `
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                </svg>
                            `;
                        } else {
                            toggleConfirmPassword.innerHTML = `
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            `;
                        }
                    });
                }

                const resetForm = document.getElementById('resetPasswordForm');
                resetForm.addEventListener('submit', function (ev) {
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

        // Fonctionnalité "Créer un compte" avec support JCAuth
        if (signupLink && loginBox) {
            signupLink.addEventListener('click', function (e) {
                e.preventDefault();

                loginBox.innerHTML = `
                    <h2 class="login-title">Inscription</h2>
                    <p class="login-subtitle">Rejoignez Jade Clean</p>
                    <div class="form-card">
                        <form id="signupForm">
                            <div class="input-field">
                                <label>Nom de l'établissement</label>
                                <div class="input-wrapper">
                                    <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                    </svg>
                                    <input type="text" id="su-hotel" required placeholder="Palace Example">
                                </div>
                            </div>
                            <div class="input-field">
                                <label>Email professionnel</label>
                                <div class="input-wrapper">
                                    <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                        <polyline points="22,6 12,13 2,6"></polyline>
                                    </svg>
                                    <input type="email" id="su-email" required placeholder="direction@hotel.com">
                                </div>
                            </div>
                            <div class="input-field">
                                <label>Mot de passe</label>
                                <div class="input-wrapper">
                                    <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                    <input type="password" id="su-password" required placeholder="••••••••">
                                </div>
                            </div>
                            <button type="submit" class="btn-submit">S'INSCRIRE</button>
                        </form>
                    </div>
                    <p class="back-home" style="margin-top:20px;">
                        <a href="connexion.html" id="backToLogin">← Retour à la connexion</a>
                    </p>
                `;

                const signupForm = document.getElementById('signupForm');
                signupForm.addEventListener('submit', async function (ev) {
                    ev.preventDefault();
                    const etab = document.getElementById('su-hotel').value.trim();
                    const email = document.getElementById('su-email').value.trim();
                    const pw = document.getElementById('su-password').value;
                    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

                    if (!passwordRegex.test(pw)) {
                        alert("Sécurité requise : Le mot de passe doit contenir au moins 8 caractères, incluant au moins une majuscule, une minuscule et un chiffre.");
                        return;
                    }

                    if (typeof JCAuth !== 'undefined') {
                        const res = await JCAuth.signup({ etab: etab, nom: etab, email: email, tel: '', pw: pw });
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
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initConnexionPage);
    } else {
        initConnexionPage();
    }
})();
