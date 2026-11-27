const DONNEES_DEFAUT = [
  {
    id: 1,
    client: "Hôtel Le Prestige",
    service: "Nettoyage quotidien",
    date: "2026-10-22",
    slot: "Matin (7h - 12h)",
    rooms: "14 chambres, étage 3",
    status: "en_cours",
    agent: "Élodie T."
  },
  {
    id: 2,
    client: "Hôtel Le Prestige",
    service: "Remise à blanc",
    date: "2026-10-24",
    slot: "Après-midi (12h - 18h)",
    rooms: "Suite Royale",
    status: "planifiee",
    agent: "Sarah M. (Gouvernante)"
  },
  {
    id: 3,
    client: "Hôtel Le Prestige",
    service: "Entretien des parties communes",
    date: "2026-10-25",
    slot: "Matin (7h - 12h)",
    rooms: "Lobby, salons & escalier d'honneur",
    status: "planifiee",
    agent: "Karim B."
  },
  {
    id: 4,
    client: "Hôtel Le Prestige",
    service: "Nettoyage quotidien",
    date: "2026-10-26",
    slot: "Matin (7h - 12h)",
    rooms: "20 chambres, étages 1 & 2",
    status: "planifiee",
    agent: "Élodie T."
  },
  {
    id: 5,
    client: "Hôtel Le Prestige",
    service: "Lustrage des marbres",
    date: "2026-10-28",
    slot: "Après-midi (12h - 18h)",
    rooms: "Spa & réception",
    status: "planifiee",
    agent: "Lucas D."
  },
  {
    id: 6,
    client: "Hôtel Le Prestige",
    service: "Traitement des textiles",
    date: "2026-10-29",
    slot: "Matin (7h - 12h)",
    rooms: "Linge de suite & rideaux",
    status: "demandee",
    agent: "Non assigné"
  },
  {
    id: 7,
    client: "Hôtel Le Prestige",
    service: "Nettoyage des vitres",
    date: "2026-10-15",
    slot: "Matin (7h - 12h)",
    rooms: "Baies vitrées Lobby & RDC",
    status: "terminee",
    agent: "Karim B."
  },
  {
    id: 8,
    client: "Hôtel Le Prestige",
    service: "Entretien sanitaire",
    date: "2026-10-10",
    slot: "Matin (7h - 12h)",
    rooms: "Sanitaires communs",
    status: "terminee",
    agent: "Lucas D."
  }
];

const DEVIS_DEFAUT = [
  {
    id: "DEV-2026-042",
    titre: "Abonnement Annuel Signature",
    prix: "3 450 €",
    periode: "/ mois",
    date: "Émis le 15 octobre 2026",
    resume: "Prestations 6j/7 · Chambres, suites et parties communes · Référent dédié.",
    statut: "a_valider"
  },
  {
    id: "DEV-2026-045",
    titre: "Remise à blanc — Suites Présidentielles",
    prix: "1 280 €",
    periode: "prestation ponctuelle",
    date: "Émis le 20 octobre 2026",
    resume: "Intervention complète après événement VIP : lustrage marbres, vapeur textiles et contrôle qualité.",
    statut: "a_valider"
  }
];

const FACTURES_DEFAUT = [
  {
    id: "FAC-2026-102",
    titre: "Prestations d'Octobre 2026",
    prix: "3 450 €",
    date: "Émis le 15 octobre 2026 · Échéance : 15 novembre 2026",
    statut: "a_regler"
  },
  {
    id: "FAC-2026-101",
    titre: "Prestations de Septembre 2026",
    prix: "3 450 €",
    date: "Émis le 30 septembre 2026 · Échéance : 30 octobre 2026",
    statut: "a_regler"
  }
];

const RAPPORTS_DEFAUT = [
  {
    id: "RAP-2026-089",
    titre: "Audit Qualité Mensuel — Chambres & Suites",
    score: "98,5 %",
    date: "Émis le 12 octobre 2026",
    resume: "Contrôle effectué sur 24 chambres et 3 suites. Dressage du linge, désinfection des sanitaires et dépoussiérage conformes aux standards.",
    statut: "non_lu"
  },
  {
    id: "RAP-2026-074",
    titre: "Rapport de Remise à Blanc — Suite Royale",
    score: "99,2 %",
    date: "Émis le 28 septembre 2026",
    resume: "Intervention complète après départ : lustrage des marbres, traitement vapeur des rideaux et contrôle qualité certifié.",
    statut: "lu"
  }
];

function chargerListe(cle, defaut) {
  const stock = localStorage.getItem(cle);
  if (stock) {
    try {
      const donnees = JSON.parse(stock);
      if (Array.isArray(donnees) && donnees.length > 0) {
        return donnees;
      }
    } catch (e) {}
  }
  localStorage.setItem(cle, JSON.stringify(defaut));
  return JSON.parse(JSON.stringify(defaut));
}

function enregistrerListe(cle, liste) {
  localStorage.setItem(cle, JSON.stringify(liste));
}

function chargerPrestations() {
  return chargerListe('jadeInterventionsV2', DONNEES_DEFAUT);
}

function enregistrerPrestations(liste) {
  enregistrerListe('jadeInterventionsV2', liste);
}

document.addEventListener('DOMContentLoaded', () => {
  verifierConnexion();
  initialiserOnglets();
  initialiserActionsAFaire();
  actualiserStats();
  afficherProchaines();
  initialiserFiltresHistorique();
  afficherDevis();
  afficherFactures();
  afficherRapports();
  actualiserBadgesEtAFaire();
  initialiserFormulaireDemande();
  initialiserDeconnexion();
});

function verifierConnexion() {
  const nom = (typeof lireDonneeSession === 'function') ? lireDonneeSession('jadeUserName') : localStorage.getItem('jadeUserName');
  const infoEl = document.getElementById('infoUtilisateur');
  if (infoEl && nom) {
    infoEl.textContent = `Connecté · ${nom} (Directeur)`;
  }
}

function initialiserDeconnexion() {
  // Géré globalement par initSessionGlobale() dans js/global.js avec popin de confirmation
}

function activerOnglet(cible) {
  const onglets = document.querySelectorAll('.onglet');
  const panneaux = document.querySelectorAll('.panneau');

  onglets.forEach(o => {
    o.classList.toggle('actif', o.getAttribute('data-panneau') === cible);
  });
  panneaux.forEach(p => {
    p.classList.toggle('actif', p.id === cible);
  });
}

function initialiserOnglets() {
  document.querySelectorAll('.onglet').forEach(onglet => {
    onglet.addEventListener('click', () => {
      activerOnglet(onglet.getAttribute('data-panneau'));
    });
  });
}

function initialiserActionsAFaire() {
  document.querySelectorAll('.ligne-a-faire').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const cible = btn.getAttribute('data-cible-onglet');
      if (cible) {
        activerOnglet(cible);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

function actualiserBadgesEtAFaire() {
  const devis = chargerListe('jadeClientDevis', DEVIS_DEFAUT);
  const factures = chargerListe('jadeClientFactures', FACTURES_DEFAUT);
  const rapports = chargerListe('jadeClientRapports', RAPPORTS_DEFAUT);

  const nbDevis = devis.filter(d => d.statut === 'a_valider').length;
  const nbFactures = factures.filter(f => f.statut === 'a_regler').length;
  const nbRapports = rapports.filter(r => r.statut === 'non_lu').length;

  const majBadge = (id, count) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = count;
    el.classList.toggle('vide', count === 0);
  };

  majBadge('badgeDevis', nbDevis);
  majBadge('badgeFactures', nbFactures);
  majBadge('badgeRapports', nbRapports);

  const majLigneAFaire = (ligneId, texteId, count, singulier, pluriel) => {
    const ligne = document.getElementById(ligneId);
    const texte = document.getElementById(texteId);
    if (!ligne || !texte) return;
    if (count === 0) {
      ligne.classList.add('d-none');
    } else {
      ligne.classList.remove('d-none');
      texte.textContent = `${count} ${count > 1 ? pluriel : singulier}`;
    }
  };

  majLigneAFaire('actionDevis', 'texteActionDevis', nbDevis, 'devis à valider', 'devis à valider');
  majLigneAFaire('actionRapports', 'texteActionRapports', nbRapports, 'rapport à consulter', 'rapports à consulter');
  majLigneAFaire('actionFactures', 'texteActionFactures', nbFactures, 'facture à régler', 'factures à régler');

  const blocAFaire = document.getElementById('blocAFaire');
  if (blocAFaire) {
    blocAFaire.classList.toggle('d-none', nbDevis + nbFactures + nbRapports === 0);
  }
}

function actualiserStats() {
  const liste = chargerPrestations();

  const planifiees = liste.filter(i => i.status === 'planifiee').length;
  const demandees = liste.filter(i => i.status === 'demandee').length;
  const enCours = liste.filter(i => i.status === 'en_cours').length;
  const terminees = liste.filter(i => i.status === 'terminee').length;

  const statPlanifiee = document.getElementById('statPlanifiee');
  const statDemandee = document.getElementById('statDemandee');
  const statEnCours = document.getElementById('statEnCours');
  const statTerminee = document.getElementById('statTerminee');

  if (statPlanifiee) statPlanifiee.textContent = planifiees;
  if (statDemandee) statDemandee.textContent = demandees;
  if (statEnCours) statEnCours.textContent = enCours;
  if (statTerminee) statTerminee.textContent = terminees;
}

function badgeStatutIntervention(status) {
  const map = {
    en_cours: { label: 'En cours', cls: 'en-cours' },
    planifiee: { label: 'Planifiée', cls: '' },
    demandee: { label: 'En attente', cls: 'urgent' },
    terminee: { label: 'Terminée', cls: 'valide' }
  };
  const info = map[status] || { label: status, cls: '' };
  return `<span class="badge-statut ${info.cls}">${info.label}</span>`;
}

function afficherProchaines() {
  const conteneur = document.getElementById('listeProchaines');
  if (!conteneur) return;

  const liste = chargerPrestations()
    .filter(i => i.status === 'en_cours' || i.status === 'planifiee' || i.status === 'demandee')
    .slice(0, 5);

  if (liste.length === 0) {
    conteneur.innerHTML = `
      <div class="encart-vide">
        <i class="bi bi-calendar-check fs-2 text-jade-rose mb-2 d-block"></i>
        Aucune intervention programmée pour le moment.
      </div>
    `;
    return;
  }

  conteneur.innerHTML = liste.map(item => creerCarteHtml(item)).join('');
}

function initialiserFiltresHistorique() {
  const boutonsFiltre = document.querySelectorAll('.btn-filtre');
  const conteneurHistorique = document.getElementById('listeHistorique');
  if (!boutonsFiltre.length || !conteneurHistorique) return;

  const filtrer = (filtre) => {
    const liste = chargerPrestations();
    let resultat = [];

    if (filtre === 'a_venir') {
      resultat = liste.filter(i => ['demandee', 'planifiee'].includes(i.status));
    } else if (filtre === 'en_cours') {
      resultat = liste.filter(i => i.status === 'en_cours');
    } else {
      resultat = liste.filter(i => ['terminee', 'annulee'].includes(i.status));
    }

    if (!resultat.length) {
      conteneurHistorique.innerHTML = '<div class="encart-vide">Aucune prestation dans cette catégorie.</div>';
    } else {
      conteneurHistorique.innerHTML = resultat.map(item => creerCarteHtml(item)).join('');
    }
  };

  boutonsFiltre.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      boutonsFiltre.forEach(b => b.classList.remove('actif'));
      btn.classList.add('actif');
      filtrer(btn.getAttribute('data-filtre'));
    });
  });

  filtrer('a_venir');
}

function creerCarteHtml(item) {
  return `
    <div class="carte-prestation">
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <h3 class="titre-prestation">${item.service}</h3>
        ${badgeStatutIntervention(item.status)}
      </div>
      <div class="meta-prestation">
        <span><i class="bi bi-calendar3"></i> ${item.date}</span>
        ${item.slot ? `<span><i class="bi bi-clock"></i> ${item.slot}</span>` : ''}
        ${item.rooms ? `<span><i class="bi bi-door-open"></i> ${item.rooms}</span>` : ''}
        ${item.agent ? `<span><i class="bi bi-person-check"></i> ${item.agent}</span>` : ''}
      </div>
    </div>
  `;
}

function afficherDevis() {
  const conteneur = document.getElementById('listeDevis');
  if (!conteneur) return;

  const liste = chargerListe('jadeClientDevis', DEVIS_DEFAUT);
  conteneur.innerHTML = liste.map(d => {
    const aValider = d.statut === 'a_valider';
    return `
      <div class="carte-prestation">
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-2">
          <div>
            <span class="text-jade-grey small text-uppercase tracking-wider">${d.id}</span>
            <h3 class="titre-prestation mt-1">${d.titre}</h3>
          </div>
          <span class="badge-statut ${aValider ? 'urgent' : 'valide'}">${aValider ? 'À valider' : 'Validé'}</span>
        </div>
        <div class="prix">
          ${d.prix} <span class="periode">${d.periode}</span>
        </div>
        <div class="mt-2 text-jade-grey small">
          <i class="bi bi-calendar3 me-1 text-jade-rose"></i> ${d.date}
        </div>
        <div class="resume-doc mt-3">${d.resume}</div>
        ${aValider ? `
          <div class="mt-3 d-flex justify-content-end">
            <button type="button" class="bouton-primaire btn-valider-devis" data-id="${d.id}">
              Valider ce devis
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  conteneur.querySelectorAll('.btn-valider-devis').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.getAttribute('data-id');
      const maj = chargerListe('jadeClientDevis', DEVIS_DEFAUT).map(d =>
        d.id === id ? { ...d, statut: 'valide' } : d
      );
      enregistrerListe('jadeClientDevis', maj);
      afficherDevis();
      actualiserBadgesEtAFaire();
      afficherNotification(`Le devis ${id} a été validé.`);
    });
  });
}

function afficherFactures() {
  const conteneur = document.getElementById('listeFactures');
  if (!conteneur) return;

  const liste = chargerListe('jadeClientFactures', FACTURES_DEFAUT);
  conteneur.innerHTML = liste.map(f => {
    const aRegler = f.statut === 'a_regler';
    return `
      <div class="carte-prestation">
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-2">
          <div>
            <span class="text-jade-grey small text-uppercase tracking-wider">${f.id}</span>
            <h3 class="titre-prestation mt-1">${f.titre}</h3>
          </div>
          <span class="badge-statut ${aRegler ? 'urgent' : 'valide'}">${aRegler ? 'À régler' : 'Réglée'}</span>
        </div>
        <div class="prix">${f.prix}</div>
        <div class="mt-2 text-jade-grey small">
          <i class="bi bi-calendar3 me-1 text-jade-rose"></i> ${f.date}
        </div>
        ${aRegler ? `
          <div class="mt-3 d-flex justify-content-end">
            <button type="button" class="bouton-primaire btn-regler-facture" data-id="${f.id}">
              Régler la facture
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  conteneur.querySelectorAll('.btn-regler-facture').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.getAttribute('data-id');
      const maj = chargerListe('jadeClientFactures', FACTURES_DEFAUT).map(f =>
        f.id === id ? { ...f, statut: 'reglee' } : f
      );
      enregistrerListe('jadeClientFactures', maj);
      afficherFactures();
      actualiserBadgesEtAFaire();
      afficherNotification(`La facture ${id} a été marquée comme réglée.`);
    });
  });
}

function afficherRapports() {
  const conteneur = document.getElementById('listeRapports');
  if (!conteneur) return;

  const liste = chargerListe('jadeClientRapports', RAPPORTS_DEFAUT);
  conteneur.innerHTML = liste.map(r => {
    const nonLu = r.statut === 'non_lu';
    return `
      <div class="carte-prestation">
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-2">
          <div>
            <span class="text-jade-grey small text-uppercase tracking-wider">${r.id}</span>
            <h3 class="titre-prestation mt-1">${r.titre}</h3>
          </div>
          <span class="badge-statut ${nonLu ? 'urgent' : 'valide'}">${nonLu ? 'À consulter' : 'Consulté'}</span>
        </div>
        <div class="prix">
          ${r.score} <span class="periode">indice de conformité</span>
        </div>
        <div class="mt-2 text-jade-grey small">
          <i class="bi bi-calendar3 me-1 text-jade-rose"></i> ${r.date}
        </div>
        <div class="resume-doc mt-3">${r.resume}</div>
        ${nonLu ? `
          <div class="mt-3 d-flex justify-content-end">
            <button type="button" class="bouton-secondaire btn-lire-rapport" data-id="${r.id}">
              Marquer comme consulté
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  conteneur.querySelectorAll('.btn-lire-rapport').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.getAttribute('data-id');
      const maj = chargerListe('jadeClientRapports', RAPPORTS_DEFAUT).map(r =>
        r.id === id ? { ...r, statut: 'lu' } : r
      );
      enregistrerListe('jadeClientRapports', maj);
      afficherRapports();
      actualiserBadgesEtAFaire();
      afficherNotification(`Le rapport ${id} a été marqué comme consulté.`);
    });
  });
}

function initialiserFormulaireDemande() {
  const formulaire = document.getElementById('formDemande');
  if (!formulaire) return;

  const dateInput = document.getElementById('demandeDate');
  if (dateInput) {
    const aujourdhui = new Date().toISOString().split('T')[0];
    dateInput.value = aujourdhui;
  }

  formulaire.addEventListener('submit', (e) => {
    e.preventDefault();
    const service = document.getElementById('demandePrestation').value;
    const date = document.getElementById('demandeDate').value;
    const slot = document.getElementById('demandeCreneau').value;
    const rooms = document.getElementById('demandeZones').value;
    const notes = document.getElementById('demandeNotes')?.value || '';

    const nouvelleIntervention = {
      id: Date.now(),
      client: "Hôtel Le Prestige",
      service,
      date,
      slot,
      rooms,
      notes,
      agent: "Non assigné",
      status: "demandee"
    };

    const liste = chargerPrestations();
    liste.unshift(nouvelleIntervention);
    enregistrerPrestations(liste);

    const modalEl = document.getElementById('modalDemande');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    actualiserStats();
    afficherProchaines();
    initialiserFiltresHistorique();

    formulaire.reset();
    afficherNotification("Votre demande d'intervention a été transmise.");
  });
}

function afficherNotification(message) {
  let toast = document.getElementById('toastNotification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotification';
    toast.className = 'notification-toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<i class="bi bi-check2 text-jade-rose fs-5"></i> <span>${message}</span>`;
  toast.style.display = 'flex';
  toast.style.opacity = '1';

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.style.display = 'none'; }, 300);
  }, 3500);
}
