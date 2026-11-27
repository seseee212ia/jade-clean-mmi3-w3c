'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'jadeCleanAdminUseCasesV2';
    const JC_HOTELS_KEY = 'jc-hotels';

    const FORMULA_PRICES = {
        Essentiel: 1890,
        Signature: 3450,
        Prestige: 5200,
    };

    const INITIAL_STATE = {
        clients: [
            {
                id: 'h-prestige',
                hotel: 'Hôtel Le Prestige',
                standing: '5 étoiles • 48 chambres',
                referent: 'Marie Laurent',
                formula: 'Prestige',
                access: 'Badges nominatifs à la réception — Accès service dès 06h30',
            },
            {
                id: 'CL-02',
                hotel: 'Maison Saint-Honoré',
                standing: 'Boutique-Hôtel • 32 chambres',
                referent: 'Marc Delacroix',
                formula: 'Signature',
                access: 'Code ascenseur personnel : 4820# — Lingerie dédiée niveau -1',
            },
        ],
        agents: [
            {
                id: 'AG-01',
                name: 'Sofia Benali (Gouvernante)',
                specialty: 'Remise à blanc & nettoyage quotidien',
                available: true,
                assignedTo: '',
            },
            {
                id: 'AG-02',
                name: 'Nadia Laurent',
                specialty: 'Traitement des textiles & salles de bain',
                available: true,
                assignedTo: '',
            },
            {
                id: 'AG-03',
                name: 'Karim Haddad',
                specialty: 'Nettoyage des vitres & parties communes',
                available: false,
                assignedTo: 'Hôtel Le Prestige',
            },
            {
                id: 'AG-04',
                name: 'Inès Mansouri',
                specialty: 'Entretien sanitaire & rangements',
                available: true,
                assignedTo: '',
            },
        ],
        demandes: [
            {
                id: 'DM-01',
                hotel: 'Hôtel Palais Vendôme',
                standing: '5 étoiles • 52 chambres',
                contact: 'Julien Mercier — direction@palaisvendome.fr',
                formula: 'Signature',
                serviceName: 'Nettoyage quotidien & remise à blanc',
                summary:
                    'Demande pour abonnement annuel Signature (52 chambres)',
                date: '24 nov. 2026',
                assignedAgentId: '',
                status: 'nouvelles',
                conversionType: '',
            },
            {
                id: 'DM-02',
                hotel: 'Villa Montaigne',
                standing: 'Boutique-Hôtel • 24 suites',
                contact: 'Sonia Bernard — s.bernard@villamontaigne.fr',
                formula: 'Prestation ponctuelle',
                serviceName: 'Remise à blanc',
                summary: 'Remise à blanc complète de 12 suites après événement',
                date: '23 nov. 2026',
                assignedAgentId: 'AG-02',
                status: 'nouvelles',
                conversionType: '',
            },
        ],
        interventions: [
            {
                id: 'IN-01',
                clientId: 'h-prestige',
                agentId: 'AG-03',
                service: 'Nettoyage quotidien',
                date: '2026-11-28',
                slot: 'Matin (7h - 12h)',
                zone: 'Étages 1 à 4',
                status: 'confirmee',
                amountHT: 350,
                invoiced: false,
            },
            {
                id: 'IN-02',
                clientId: 'CL-02',
                agentId: 'AG-02',
                service: 'Traitement des textiles',
                date: '2026-11-29',
                slot: 'Après-midi (12h - 18h)',
                zone: 'Suites panoramiques',
                status: 'a-confirmer',
                amountHT: 380,
                invoiced: false,
            },
            {
                id: 'IN-03',
                clientId: 'h-prestige',
                agentId: 'AG-01',
                service: 'Remise à blanc',
                date: '2026-11-21',
                slot: 'Matin (7h - 12h)',
                zone: 'Étage 5 (8 chambres)',
                status: 'terminee',
                amountHT: 450,
                invoiced: true,
            },
        ],
        contracts: [
            {
                id: 'AB-2026-01',
                clientId: 'h-prestige',
                formula: 'Prestige',
                monthlyHT: 2450,
                startDate: '2026-01-01',
                renewalDate: '2026-12-31',
                status: 'actif',
            },
            {
                id: 'AB-2026-02',
                clientId: 'CL-02',
                formula: 'Signature',
                monthlyHT: 3450,
                startDate: '2026-03-01',
                renewalDate: '2027-03-01',
                status: 'actif',
            },
        ],
        invoices: [
            {
                id: 'FAC-2026-041',
                clientId: 'h-prestige',
                label: 'Abonnement annuel — mois en cours',
                dueDate: '30 déc. 2026',
                amountHT: 2450,
                status: 'en-attente',
            },
            {
                id: 'FAC-2026-036',
                clientId: 'CL-02',
                label: 'Abonnement Signature — Octobre 2026',
                dueDate: '30 nov. 2026',
                amountHT: 3450,
                status: 'payee',
            },
        ],
        activity: [
            {
                text: 'Intervention IN-01 confirmée — Hôtel Le Prestige',
                time: 'Aujourd’hui',
            },
            {
                text: 'Demande de devis reçue — Hôtel Palais Vendôme',
                time: '24 nov.',
            },
            {
                text: 'Contrat AB-2026-02 établi — Maison Saint-Honoré',
                time: '20 nov.',
            },
        ],
    };

    const loadState = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : structuredClone(INITIAL_STATE);
        } catch {
            return structuredClone(INITIAL_STATE);
        }
    };

    let state = loadState();
    let demandeFilter = 'nouvelles';
    let interventionFilter = 'a-confirmer';
    let financeFilter = 'contrats';

    const saveState = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {
            /* ignore */
        }
    };

    /* Synchronisation miroir vers l'espace client (jc-hotels) */
    const syncToClientPortal = (clientId, type, payload) => {
        try {
            const hotels = JSON.parse(
                localStorage.getItem(JC_HOTELS_KEY) || '{}',
            );
            const target = hotels[clientId];
            if (!target || !target.data) return;

            if (type === 'prestation') {
                target.data.prestations.unshift({
                    id: Date.now(),
                    t: payload.service,
                    d: payload.date,
                    h: payload.slot,
                    z: payload.zone,
                    s: 'Planifiée',
                    price: payload.amountHT,
                });
            } else if (type === 'facture') {
                target.data.factures.unshift({
                    id: Date.now(),
                    r: payload.id,
                    t: payload.label,
                    m: payload.amountHT,
                    x: new Date(Date.now() + 30 * 86400000)
                        .toISOString()
                        .slice(0, 10),
                    s: 'En attente',
                });
            }
            localStorage.setItem(JC_HOTELS_KEY, JSON.stringify(hotels));
        } catch {
            /* ignore */
        }
    };

    const addActivity = (text) => {
        state.activity.unshift({ text, time: 'À l’instant' });
        state.activity = state.activity.slice(0, 6);
    };

    const notify = (msg) => {
        const banner = document.getElementById('adminNotice');
        if (!banner) return;
        banner.textContent = msg;
        banner.hidden = false;
    };

    const escapeHtml = (val) =>
        String(val ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;');

    const formatHT = (n) => `${Number(n || 0).toLocaleString('fr-FR')} € HT`;
    const getClient = (id) =>
        state.clients.find((c) => c.id === id) || {
            hotel: 'Établissement client',
        };
    const getAgent = (id) => state.agents.find((a) => a.id === id) || null;

    const switchTab = (tabName) => {
        document.querySelectorAll('.admin-tab').forEach((tab) => {
            const active = tab.dataset.tab === tabName;
            tab.classList.toggle('active', active);
            tab.setAttribute('aria-selected', String(active));
        });
        document.querySelectorAll('.admin-panel').forEach((panel) => {
            const match = panel.id === `panel-${tabName}`;
            panel.classList.toggle('active', match);
            panel.hidden = !match;
        });
        renderAll();
    };

    document.querySelectorAll('.admin-tab').forEach((tab) => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    document.querySelectorAll('[data-jump-tab]').forEach((btn) => {
        btn.addEventListener('click', () => switchTab(btn.dataset.jumpTab));
    });

    document.querySelectorAll('.admin-subfilters').forEach((groupEl) => {
        const group = groupEl.dataset.group;
        groupEl.querySelectorAll('.subfilter-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                groupEl
                    .querySelectorAll('.subfilter-btn')
                    .forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                const val = btn.dataset.filter;
                if (group === 'demandes') {
                    demandeFilter = val;
                    renderDemandes();
                } else if (group === 'interventions') {
                    interventionFilter = val;
                    renderInterventions();
                } else if (group === 'finance') {
                    financeFilter = val;
                    renderFinance();
                }
            });
        });
    });

    const renderApercu = () => {
        const kpiGrid = document.getElementById('adminKpiGrid');
        const feedList = document.getElementById('adminActivityList');
        if (!kpiGrid || !feedList) return;

        const demandesNouvelles = state.demandes.filter(
            (d) => d.status === 'nouvelles',
        ).length;
        const intAConfirmer = state.interventions.filter(
            (i) => i.status === 'a-confirmer',
        ).length;
        const agentsDispos = state.agents.filter((a) => a.available).length;
        const facturesAPayer = state.invoices.filter(
            (f) => f.status === 'en-attente',
        ).length;

        kpiGrid.innerHTML = `
            <div class="kpi-card"><span class="kpi-number">${demandesNouvelles}</span><span class="kpi-label">DEMANDES DE DEVIS</span></div>
            <div class="kpi-card"><span class="kpi-number">${intAConfirmer}</span><span class="kpi-label">INTERVENTIONS À CONFIRMER</span></div>
            <div class="kpi-card"><span class="kpi-number">${agentsDispos} / ${state.agents.length}</span><span class="kpi-label">AGENTS DISPONIBLES</span></div>
            <div class="kpi-card"><span class="kpi-number">${facturesAPayer}</span><span class="kpi-label">FACTURES À PAYER</span></div>
        `;

        feedList.innerHTML = state.activity
            .map(
                (item) =>
                    `<li class="admin-feed-item"><span><strong>${escapeHtml(item.text)}</strong></span><span>${escapeHtml(item.time)}</span></li>`,
            )
            .join('');
    };

    const renderDemandes = () => {
        const container = document.getElementById('adminDemandesList');
        if (!container) return;

        const list = state.demandes.filter(
            (d) => demandeFilter === 'toutes' || d.status === demandeFilter,
        );
        if (list.length === 0) {
            container.innerHTML =
                '<div class="admin-empty-card">Aucune demande de devis dans cette catégorie.</div>';
            return;
        }

        container.innerHTML = list
            .map((d) => {
                const assignedAgent = d.assignedAgentId
                    ? getAgent(d.assignedAgentId)
                    : null;
                const availableAgents = state.agents.filter(
                    (a) => a.available || a.id === d.assignedAgentId,
                );

                return `
            <article class="admin-item-card">
                <div class="admin-item-top">
                    <div>
                        <span class="admin-item-meta-tag">${escapeHtml(d.standing)} • ${escapeHtml(d.date)}</span>
                        <h3 class="admin-item-title">${escapeHtml(d.hotel)} — ${escapeHtml(d.formula)}</h3>
                    </div>
                    <span class="admin-badge">${d.status === 'nouvelles' ? 'NOUVELLE DEMANDE' : escapeHtml(d.conversionType)}</span>
                </div>
                <div class="admin-item-details">
                    <span>${escapeHtml(d.summary)}</span>
                    <span>Contact : ${escapeHtml(d.contact)}</span>
                    <span>Agent affecté : <strong>${assignedAgent ? escapeHtml(assignedAgent.name) : 'Non affecté'}</strong></span>
                </div>
                ${
                    d.status === 'nouvelles'
                        ? `
                <div class="admin-item-footer">
                    <label class="admin-status-label">
                        <span>AGENT :</span>
                        <select class="admin-select" data-assign-demande="${escapeHtml(d.id)}" aria-label="Affecter un agent disponible">
                            <option value="">-- Choisir un agent --</option>
                            ${availableAgents.map((ag) => `<option value="${escapeHtml(ag.id)}" ${d.assignedAgentId === ag.id ? 'selected' : ''}>${escapeHtml(ag.name)}</option>`).join('')}
                        </select>
                    </label>
                    <div class="admin-actions-row compact">
                        <button type="button" class="btn-admin-primary" data-convert-regulier="${escapeHtml(d.id)}">Convertir en contrat annuel</button>
                        <button type="button" class="btn-admin-secondary" data-convert-ponctuel="${escapeHtml(d.id)}">Convertir en prestation ponctuelle</button>
                    </div>
                </div>`
                        : ''
                }
            </article>`;
            })
            .join('');

        container
            .querySelectorAll('[data-assign-demande]')
            .forEach((select) => {
                select.addEventListener('change', (e) => {
                    const demande = state.demandes.find(
                        (d) => d.id === e.target.dataset.assignDemande,
                    );
                    if (!demande) return;
                    demande.assignedAgentId = e.target.value;
                    const agent = getAgent(e.target.value);
                    if (agent) {
                        agent.assignedTo = demande.hotel;
                        addActivity(
                            `Agent ${agent.name} affecté à la demande de ${demande.hotel}`,
                        );
                    }
                    saveState();
                    renderAll();
                });
            });

        container.querySelectorAll('[data-convert-regulier]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const demande = state.demandes.find(
                    (d) => d.id === btn.dataset.convertRegulier,
                );
                if (!demande) return;

                let client = state.clients.find(
                    (c) =>
                        c.hotel.toLowerCase() === demande.hotel.toLowerCase(),
                );
                if (!client) {
                    client = {
                        id: `CL-${Date.now().toString().slice(-4)}`,
                        hotel: demande.hotel,
                        standing: demande.standing,
                        referent: demande.contact,
                        formula:
                            demande.formula === 'Prestation ponctuelle'
                                ? 'Signature'
                                : demande.formula,
                        access: 'À renseigner dans le profil client',
                    };
                    state.clients.unshift(client);
                }

                const chosenFormula = FORMULA_PRICES[demande.formula]
                    ? demande.formula
                    : 'Signature';
                const contractId = `AB-2026-${Date.now().toString().slice(-3)}`;
                state.contracts.unshift({
                    id: contractId,
                    clientId: client.id,
                    formula: chosenFormula,
                    monthlyHT: FORMULA_PRICES[chosenFormula],
                    startDate: '2026-12-01',
                    renewalDate: '2027-12-01',
                    status: 'actif',
                });

                demande.status = 'converties';
                demande.conversionType = 'CONTRAT ANNUEL';
                addActivity(
                    `Demande de ${demande.hotel} convertie en contrat annuel (${contractId})`,
                );
                saveState();
                populateSelects();
                renderAll();
                notify(
                    `Demande convertie en contrat annuel ${contractId} pour ${demande.hotel}.`,
                );
            });
        });

        container.querySelectorAll('[data-convert-ponctuel]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const demande = state.demandes.find(
                    (d) => d.id === btn.dataset.convertPonctuel,
                );
                if (!demande) return;

                let client = state.clients.find(
                    (c) =>
                        c.hotel.toLowerCase() === demande.hotel.toLowerCase(),
                );
                if (!client) {
                    client = {
                        id: `CL-${Date.now().toString().slice(-4)}`,
                        hotel: demande.hotel,
                        standing: demande.standing,
                        referent: demande.contact,
                        formula: 'Prestation ponctuelle',
                        access: 'À renseigner dans le profil client',
                    };
                    state.clients.unshift(client);
                }

                const defaultAgent =
                    demande.assignedAgentId ||
                    state.agents.find((a) => a.available)?.id ||
                    state.agents[0]?.id ||
                    '';
                const intId = `IN-${Date.now().toString().slice(-3)}`;
                state.interventions.unshift({
                    id: intId,
                    clientId: client.id,
                    agentId: defaultAgent,
                    service: demande.serviceName || 'Remise à blanc',
                    date: '2026-11-29',
                    slot: 'Matin (7h - 12h)',
                    zone: 'Selon devis client',
                    status: 'a-confirmer',
                    amountHT: 450,
                    invoiced: false,
                });

                demande.status = 'converties';
                demande.conversionType = 'PRESTATION PONCTUELLE';
                addActivity(
                    `Demande de ${demande.hotel} convertie en prestation ponctuelle (${intId})`,
                );
                saveState();
                populateSelects();
                renderAll();
                notify(
                    `Demande convertie en intervention ponctuelle ${intId} (à confirmer).`,
                );
            });
        });
    };

    const clientForm = document.getElementById('adminClientForm');
    const clientFormTitle = document.getElementById('clientFormTitle');
    const clientEditIdInput = document.getElementById('clientEditId');

    const openClientForm = (client = null) => {
        if (!clientForm) return;
        if (client) {
            clientFormTitle.textContent = `Modifier le profil client — ${client.hotel}`;
            clientEditIdInput.value = client.id;
            document.getElementById('clientHotelInput').value = client.hotel;
            document.getElementById('clientStandingInput').value =
                client.standing;
            document.getElementById('clientReferentInput').value =
                client.referent;
            document.getElementById('clientFormulaSelect').value =
                client.formula;
            document.getElementById('clientAccessInput').value = client.access;
        } else {
            clientFormTitle.textContent = 'Créer le profil client';
            clientEditIdInput.value = '';
            clientForm.reset();
        }
        clientForm.hidden = false;
        document.getElementById('clientHotelInput')?.focus();
    };

    const renderClients = () => {
        const container = document.getElementById('adminClientsList');
        if (!container) return;

        container.innerHTML = state.clients
            .map(
                (client) => `
            <article class="admin-item-card">
                <div class="admin-item-top">
                    <div>
                        <span class="admin-item-meta-tag">${escapeHtml(client.standing)}</span>
                        <h3 class="admin-item-title">${escapeHtml(client.hotel)}</h3>
                    </div>
                    <span class="admin-badge">${escapeHtml(client.formula)}</span>
                </div>
                <div class="admin-item-details"><span>Référent : ${escapeHtml(client.referent)}</span></div>
                <p class="admin-item-note">${escapeHtml(client.access)}</p>
                <div class="admin-item-footer">
                    <button type="button" class="btn-admin-secondary" data-edit-client="${escapeHtml(client.id)}">Modifier le profil client</button>
                </div>
            </article>
        `,
            )
            .join('');

        container.querySelectorAll('[data-edit-client]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const target = state.clients.find(
                    (c) => c.id === btn.dataset.editClient,
                );
                if (target) openClientForm(target);
            });
        });
    };

    document
        .getElementById('btnShowClientForm')
        ?.addEventListener('click', () => openClientForm(null));
    document
        .getElementById('btnCancelClientForm')
        ?.addEventListener('click', () => {
            if (clientForm) {
                clientForm.reset();
                clientEditIdInput.value = '';
                clientForm.hidden = true;
            }
        });

    clientForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = clientEditIdInput?.value;
        const hotel = document.getElementById('clientHotelInput')?.value.trim();
        const standing = document
            .getElementById('clientStandingInput')
            ?.value.trim();
        const referent = document
            .getElementById('clientReferentInput')
            ?.value.trim();
        const formula =
            document.getElementById('clientFormulaSelect')?.value ||
            'Signature';
        const access = document
            .getElementById('clientAccessInput')
            ?.value.trim();
        if (!hotel || !standing || !referent || !access) return;

        if (editId) {
            const existing = state.clients.find((c) => c.id === editId);
            if (existing) {
                Object.assign(existing, {
                    hotel,
                    standing,
                    referent,
                    formula,
                    access,
                });
                addActivity(`Profil client modifié : ${hotel}`);
                notify(`Le profil client « ${hotel} » a été mis à jour.`);
            }
        } else {
            state.clients.unshift({
                id: `CL-${Date.now().toString().slice(-4)}`,
                hotel,
                standing,
                referent,
                formula,
                access,
            });
            addActivity(`Profil client créé : ${hotel}`);
            notify(`Le profil client « ${hotel} » a été créé.`);
        }

        saveState();
        populateSelects();
        renderAll();
        clientForm.reset();
        clientEditIdInput.value = '';
        clientForm.hidden = true;
    });

    const renderInterventions = () => {
        const container = document.getElementById('adminInterventionsList');
        if (!container) return;

        const filtered = state.interventions.filter(
            (i) => i.status === interventionFilter,
        );
        if (filtered.length === 0) {
            container.innerHTML =
                '<div class="admin-empty-card">Aucune intervention dans cette catégorie.</div>';
            return;
        }

        container.innerHTML = filtered
            .map((item) => {
                const client = getClient(item.clientId);
                const agent = getAgent(item.agentId);
                return `
            <article class="admin-item-card">
                <div class="admin-item-top">
                    <div>
                        <span class="admin-item-meta-tag">${escapeHtml(client.hotel)}</span>
                        <h3 class="admin-item-title">${escapeHtml(item.service)}</h3>
                    </div>
                    <span class="admin-badge">${formatHT(item.amountHT)}</span>
                </div>
                <div class="admin-item-details">
                    <span>${escapeHtml(item.date)}</span>
                    <span>${escapeHtml(item.slot)}</span>
                    <span>${escapeHtml(item.zone)}</span>
                    <span>Agent : ${agent ? escapeHtml(agent.name) : 'Non affecté'}</span>
                </div>
                <div class="admin-item-footer">
                    <label class="admin-status-label">
                        <span>STATUT :</span>
                        <select class="admin-select" data-int-status="${escapeHtml(item.id)}" aria-label="Statut de l’intervention">
                            <option value="a-confirmer" ${item.status === 'a-confirmer' ? 'selected' : ''}>À confirmer</option>
                            <option value="confirmee" ${item.status === 'confirmee' ? 'selected' : ''}>Confirmée / En cours</option>
                            <option value="terminee" ${item.status === 'terminee' ? 'selected' : ''}>Terminée</option>
                        </select>
                    </label>
                    ${item.status === 'a-confirmer' ? `<button type="button" class="btn-admin-primary" data-confirm-int="${escapeHtml(item.id)}">Confirmer l’intervention</button>` : ''}
                    ${item.status === 'terminee' && !item.invoiced ? `<button type="button" class="btn-admin-primary" data-invoice-int="${escapeHtml(item.id)}">Établir la facture</button>` : item.invoiced ? '<span class="admin-toolbar-text">Facture établie</span>' : ''}
                </div>
            </article>`;
            })
            .join('');

        container.querySelectorAll('[data-confirm-int]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const item = state.interventions.find(
                    (i) => i.id === btn.dataset.confirmInt,
                );
                if (!item) return;
                item.status = 'confirmee';
                syncToClientPortal(item.clientId, 'prestation', item);
                addActivity(
                    `Intervention confirmée — ${getClient(item.clientId).hotel}`,
                );
                saveState();
                renderAll();
                notify(`L’intervention « ${item.service} » est confirmée.`);
            });
        });

        container.querySelectorAll('[data-int-status]').forEach((select) => {
            select.addEventListener('change', (e) => {
                const item = state.interventions.find(
                    (i) => i.id === e.target.dataset.intStatus,
                );
                if (!item) return;
                item.status = e.target.value;
                addActivity(`Intervention ${item.service} (${item.status})`);
                saveState();
                renderAll();
            });
        });

        container.querySelectorAll('[data-invoice-int]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const item = state.interventions.find(
                    (i) => i.id === btn.dataset.invoiceInt,
                );
                if (!item || item.invoiced) return;
                const invoice = {
                    id: `FAC-2026-${Date.now().toString().slice(-3)}`,
                    clientId: item.clientId,
                    label: `${item.service} — ${item.date}`,
                    dueDate: '30 jours fin de mois',
                    amountHT: item.amountHT,
                    status: 'en-attente',
                };
                state.invoices.unshift(invoice);
                item.invoiced = true;
                syncToClientPortal(item.clientId, 'facture', invoice);
                addActivity(
                    `Facture ${invoice.id} établie pour ${getClient(item.clientId).hotel}`,
                );
                saveState();
                renderAll();
                notify(
                    `Facture ${invoice.id} (${formatHT(item.amountHT)}) établie.`,
                );
            });
        });
    };

    const intForm = document.getElementById('adminInterventionForm');
    document
        .getElementById('btnShowInterventionForm')
        ?.addEventListener('click', () => {
            populateSelects();
            if (intForm) intForm.hidden = false;
        });
    document
        .getElementById('btnCancelInterventionForm')
        ?.addEventListener('click', () => {
            if (intForm) {
                intForm.reset();
                intForm.hidden = true;
            }
        });
    intForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const clientId = document.getElementById('intClientSelect')?.value;
        const agentId = document.getElementById('intAgentSelect')?.value;
        const [service, amount] = (
            document.getElementById('intServiceSelect')?.value ||
            'Nettoyage quotidien|350'
        ).split('|');
        const date =
            document.getElementById('intDateInput')?.value || '2026-11-28';
        const slot =
            document.getElementById('intSlotInput')?.value.trim() ||
            'Matin (7h - 12h)';
        const zone = document.getElementById('intZoneInput')?.value.trim();
        if (!clientId || !agentId || !zone) return;

        const client = getClient(clientId);
        const agent = getAgent(agentId);
        if (agent) {
            agent.available = false;
            agent.assignedTo = client.hotel;
        }

        const newInt = {
            id: `IN-${Date.now().toString().slice(-3)}`,
            clientId,
            agentId,
            service,
            date,
            slot,
            zone,
            status: 'confirmee',
            amountHT: Number(amount) || 350,
            invoiced: false,
        };
        state.interventions.unshift(newInt);
        syncToClientPortal(clientId, 'prestation', newInt);
        addActivity(`Intervention planifiée et confirmée — ${client.hotel}`);
        saveState();
        populateSelects();
        renderAll();
        intForm.reset();
        intForm.hidden = true;
        notify(
            `Intervention « ${service} » planifiée et confirmée pour ${client.hotel}.`,
        );
    });

    const renderAgents = () => {
        const container = document.getElementById('adminAgentsList');
        if (!container) return;

        container.innerHTML = state.agents
            .map(
                (ag) => `
            <article class="admin-item-card">
                <div class="admin-item-top">
                    <div>
                        <span class="admin-item-meta-tag">${escapeHtml(ag.specialty)}</span>
                        <h3 class="admin-item-title">${escapeHtml(ag.name)}</h3>
                    </div>
                    <span class="admin-badge">${ag.available ? 'DISPONIBLE' : 'AFFECTÉ'}</span>
                </div>
                <div class="admin-item-details"><span>Affectation : ${ag.assignedTo ? escapeHtml(ag.assignedTo) : 'Aucune mission en cours'}</span></div>
                <div class="admin-item-footer">
                    <label class="admin-status-label">
                        <span>AFFECTER À :</span>
                        <select class="admin-select" data-agent-client="${escapeHtml(ag.id)}" aria-label="Affecter l’agent à un établissement">
                            <option value="">-- Libre (disponible) --</option>
                            ${state.clients.map((cl) => `<option value="${escapeHtml(cl.hotel)}" ${ag.assignedTo === cl.hotel ? 'selected' : ''}>${escapeHtml(cl.hotel)}</option>`).join('')}
                        </select>
                    </label>
                </div>
            </article>
        `,
            )
            .join('');

        container.querySelectorAll('[data-agent-client]').forEach((select) => {
            select.addEventListener('change', (e) => {
                const agent = getAgent(e.target.dataset.agentClient);
                if (!agent) return;
                const hotelName = e.target.value;
                agent.assignedTo = hotelName;
                agent.available = !hotelName;
                addActivity(
                    hotelName
                        ? `${agent.name} affecté à ${hotelName}`
                        : `${agent.name} remis disponible`,
                );
                saveState();
                populateSelects();
                renderAll();
            });
        });
    };

    const renderFinance = () => {
        const contractsEl = document.getElementById('adminContractsList');
        const invoicesEl = document.getElementById('adminInvoicesList');
        if (!contractsEl || !invoicesEl) return;

        contractsEl.hidden = financeFilter !== 'contrats';
        invoicesEl.hidden = financeFilter !== 'factures';

        contractsEl.innerHTML = state.contracts
            .map(
                (ctr) => `
            <article class="admin-item-card">
                <div class="admin-item-top">
                    <div>
                        <span class="admin-item-meta-tag">${escapeHtml(ctr.id)} • Contrat d’abonnement</span>
                        <h3 class="admin-item-title">${escapeHtml(getClient(ctr.clientId).hotel)} — ${escapeHtml(ctr.formula)}</h3>
                    </div>
                    <span class="admin-badge">ACTIF</span>
                </div>
                <div class="admin-item-details">
                    <span>Mensualité : <strong>${formatHT(ctr.monthlyHT)}</strong></span>
                    <span>Début : ${escapeHtml(ctr.startDate)}</span>
                    <span>Échéance : ${escapeHtml(ctr.renewalDate)}</span>
                </div>
                <div class="admin-item-footer">
                    <button type="button" class="btn-admin-secondary" data-bill-contract="${escapeHtml(ctr.id)}">Établir la facture mensuelle</button>
                </div>
            </article>
        `,
            )
            .join('');

        contractsEl.querySelectorAll('[data-bill-contract]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const ctr = state.contracts.find(
                    (c) => c.id === btn.dataset.billContract,
                );
                if (!ctr) return;
                const invoice = {
                    id: `FAC-2026-${Date.now().toString().slice(-3)}`,
                    clientId: ctr.clientId,
                    label: `Abonnement ${ctr.formula} (${ctr.id})`,
                    dueDate: '30 jours fin de mois',
                    amountHT: ctr.monthlyHT,
                    status: 'en-attente',
                };
                state.invoices.unshift(invoice);
                syncToClientPortal(ctr.clientId, 'facture', invoice);
                addActivity(
                    `Facture ${invoice.id} établie depuis le contrat ${ctr.id}`,
                );
                saveState();
                renderAll();
                notify(
                    `Facture ${invoice.id} (${formatHT(ctr.monthlyHT)}) établie.`,
                );
            });
        });

        invoicesEl.innerHTML = state.invoices
            .map(
                (inv) => `
            <article class="admin-item-card">
                <div class="admin-item-top">
                    <div>
                        <span class="admin-item-meta-tag">${escapeHtml(inv.id)} • ${escapeHtml(getClient(inv.clientId).hotel)}</span>
                        <h3 class="admin-item-title">${escapeHtml(inv.label)}</h3>
                    </div>
                    <span class="admin-badge">${inv.status === 'payee' ? 'PAYÉE' : 'À PAYER'}</span>
                </div>
                <div class="admin-item-details">
                    <span>Montant : <strong>${formatHT(inv.amountHT)}</strong></span>
                    <span>Échéance : ${escapeHtml(inv.dueDate)}</span>
                </div>
                ${inv.status === 'en-attente' ? `<div class="admin-item-footer"><button type="button" class="btn-admin-primary" data-pay-invoice="${escapeHtml(inv.id)}">Marquer comme payée</button></div>` : ''}
            </article>
        `,
            )
            .join('');

        invoicesEl.querySelectorAll('[data-pay-invoice]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const inv = state.invoices.find(
                    (i) => i.id === btn.dataset.payInvoice,
                );
                if (!inv) return;
                inv.status = 'payee';
                addActivity(`Facture ${inv.id} payée`);
                saveState();
                renderAll();
            });
        });
    };

    const contractForm = document.getElementById('adminContractForm');
    const invoiceForm = document.getElementById('adminInvoiceForm');

    document
        .getElementById('btnShowContractForm')
        ?.addEventListener('click', () => {
            populateSelects();
            if (invoiceForm) invoiceForm.hidden = true;
            if (contractForm) contractForm.hidden = false;
        });
    document
        .getElementById('btnCancelContractForm')
        ?.addEventListener('click', () => {
            if (contractForm) {
                contractForm.reset();
                contractForm.hidden = true;
            }
        });
    contractForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const clientId = document.getElementById('ctrClientSelect')?.value;
        const [formula, price] = (
            document.getElementById('ctrFormulaSelect')?.value ||
            'Signature|3450'
        ).split('|');
        const startDate =
            document.getElementById('ctrStartDate')?.value || '2026-12-01';
        const renewalDate =
            document.getElementById('ctrEndDate')?.value || '2027-12-01';
        if (!clientId) return;

        const contractId = `AB-2026-${Date.now().toString().slice(-3)}`;
        state.contracts.unshift({
            id: contractId,
            clientId,
            formula,
            monthlyHT: Number(price) || 3450,
            startDate,
            renewalDate,
            status: 'actif',
        });
        addActivity(
            `Contrat ${contractId} établi — ${getClient(clientId).hotel}`,
        );
        saveState();
        renderAll();
        contractForm.reset();
        contractForm.hidden = true;
        notify(`Contrat d’abonnement ${contractId} établi.`);
    });

    document
        .getElementById('btnShowInvoiceForm')
        ?.addEventListener('click', () => {
            populateSelects();
            if (contractForm) contractForm.hidden = true;
            if (invoiceForm) invoiceForm.hidden = false;
        });
    document
        .getElementById('btnCancelInvoiceForm')
        ?.addEventListener('click', () => {
            if (invoiceForm) {
                invoiceForm.reset();
                invoiceForm.hidden = true;
            }
        });
    invoiceForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const clientId = document.getElementById('invClientSelect')?.value;
        const label = document.getElementById('invLabelInput')?.value.trim();
        const amountHT = Number(
            document.getElementById('invAmountInput')?.value || 0,
        );
        const dueDate =
            document.getElementById('invDueInput')?.value.trim() ||
            '30 jours fin de mois';
        if (!clientId || !label || amountHT <= 0) return;

        const invoice = {
            id: `FAC-2026-${Date.now().toString().slice(-3)}`,
            clientId,
            label,
            dueDate,
            amountHT,
            status: 'en-attente',
        };
        state.invoices.unshift(invoice);
        syncToClientPortal(clientId, 'facture', invoice);
        financeFilter = 'factures';
        document
            .querySelectorAll(
                '.admin-subfilters[data-group="finance"] .subfilter-btn',
            )
            .forEach((b) => {
                b.classList.toggle('active', b.dataset.filter === 'factures');
            });
        addActivity(
            `Facture ${invoice.id} établie — ${getClient(clientId).hotel}`,
        );
        saveState();
        renderAll();
        invoiceForm.reset();
        invoiceForm.hidden = true;
        notify(`Facture ${invoice.id} (${formatHT(amountHT)}) établie.`);
    });

    const populateSelects = () => {
        const clientOptions = state.clients
            .map(
                (c) =>
                    `<option value="${escapeHtml(c.id)}">${escapeHtml(c.hotel)}</option>`,
            )
            .join('');
        ['intClientSelect', 'ctrClientSelect', 'invClientSelect'].forEach(
            (id) => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = clientOptions;
            },
        );

        const agentSel = document.getElementById('intAgentSelect');
        if (agentSel) {
            agentSel.innerHTML = state.agents
                .map(
                    (ag) =>
                        `<option value="${escapeHtml(ag.id)}">${escapeHtml(ag.name)} — ${ag.available ? 'Disponible' : 'Affecté'}</option>`,
                )
                .join('');
        }
    };

    const renderAll = () => {
        renderApercu();
        renderDemandes();
        renderClients();
        renderInterventions();
        renderAgents();
        renderFinance();
    };

    populateSelects();
    renderAll();
});
