'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const PREFILL_STORAGE_KEY = 'jadeCleanDevisPrefill';

    const filterButtons = document.querySelectorAll('[data-freq-filter]');
    const mainRows = document.querySelectorAll(
        '#prestationsTableBody .prestation-main-row',
    );
    const detailRows = document.querySelectorAll(
        '#prestationsTableBody .prestation-detail-row',
    );

    const closeAllDetails = () => {
        mainRows.forEach((row) => {
            row.classList.remove('is-open');
            row.setAttribute('aria-expanded', 'false');
        });
        detailRows.forEach((detail) => {
            detail.hidden = true;
        });
    };

    filterButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.freqFilter;
            filterButtons.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            closeAllDetails();

            mainRows.forEach((row) => {
                const match = filter === 'all' || row.dataset.freq === filter;
                row.hidden = !match;
            });
        });
    });

    const toggleRowDetail = (row) => {
        const detailId = row.getAttribute('aria-controls');
        const detailRow = detailId ? document.getElementById(detailId) : null;
        if (!detailRow) return;

        const willOpen = detailRow.hidden;
        closeAllDetails();

        if (willOpen) {
            row.classList.add('is-open');
            row.setAttribute('aria-expanded', 'true');
            detailRow.hidden = false;
        }
    };

    mainRows.forEach((row) => {
        row.addEventListener('click', (e) => {
            if (
                e.target.closest('.prestation-checkbox') ||
                e.target.closest('.col-select')
            )
                return;
            toggleRowDetail(row);
        });

        row.addEventListener('keydown', (e) => {
            if (e.target.closest('.prestation-checkbox')) return;
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleRowDetail(row);
            }
        });
    });

    const checkboxes = document.querySelectorAll('.prestation-checkbox');
    const countText = document.getElementById('selectionCountText');
    const previewList = document.getElementById('selectionPreviewList');
    const btnDevisSelection = document.getElementById('btnDevisSelection');

    const updateSelectionBar = () => {
        const selected = Array.from(checkboxes)
            .filter((cb) => cb.checked)
            .map((cb) => cb.dataset.service);

        if (!countText || !previewList || !btnDevisSelection) return;

        if (selected.length === 0) {
            countText.textContent = '0 prestation sélectionnée';
            previewList.textContent =
                'Cochez une ou plusieurs lignes ci-dessus pour demander un devis groupé.';
            btnDevisSelection.disabled = true;
        } else {
            countText.textContent = `${selected.length} prestation${selected.length > 1 ? 's' : ''} sélectionnée${selected.length > 1 ? 's' : ''}`;
            previewList.textContent = selected.join(' • ');
            btnDevisSelection.disabled = false;
        }
    };

    checkboxes.forEach((cb) =>
        cb.addEventListener('change', updateSelectionBar),
    );

    const sendPrefillToContact = ({ besoin, projet }) => {
        try {
            sessionStorage.setItem(
                PREFILL_STORAGE_KEY,
                JSON.stringify({ besoin, projet }),
            );
        } catch {
            /* ignore */
        }
        const params = new URLSearchParams({ besoin, projet });
        window.location.href = `contact.html?${params.toString()}`;
    };

    btnDevisSelection?.addEventListener('click', () => {
        const selected = Array.from(checkboxes)
            .filter((cb) => cb.checked)
            .map((cb) => `- ${cb.dataset.service}`);

        if (selected.length === 0) return;

        const besoin = selected.length === 1 ? 'ponctuel' : 'forfait';
        const projet = `Demande de devis pour les prestations suivantes :\n${selected.join('\n')}`;
        sendPrefillToContact({ besoin, projet });
    });

    document.querySelectorAll('[data-formule]').forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const formule =
                link.getAttribute('data-formule') || 'Forfait Signature';
            const projet = `Bonjour, je souhaite obtenir un devis concernant le ${formule}.`;
            sendPrefillToContact({ besoin: 'abonnement', projet });
        });
    });

    updateSelectionBar();
});
