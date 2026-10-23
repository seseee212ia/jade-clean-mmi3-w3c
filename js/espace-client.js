const DONNEES_DEFAUT = [
  {
    id: 1,
    client: "Hôtel",
    service: "Nettoyage quotidien",
    date: "2026-10-22",
    slot: "Matin (7h - 12h)",
    rooms: "14 chambres, étage 3",
    status: "planifiee",
    agent: "Élodie T."
  },
  {
    id: 2,
    client: "Hôtel",
    service: "Remise à blanc",
    date: "2026-10-24",
    slot: "Après-midi (12h - 18h)",
    rooms: "Suite",
    status: "en_cours",
    agent: "Sarah M. (Gouvernante)"
  },
  {
    id: 3,
    client: "Hôtel",
    service: "Traitement des textiles",
    date: "2026-10-26",
    slot: "Matin (7h - 12h)",
    rooms: "Linge de suite & rideaux",
    status: "demandee",
    agent: "Non assigné"
  },
  {
    id: 4,
    client: "Hôtel",
    service: "Nettoyage des vitres",
    date: "2026-10-15",
    slot: "Matin (7h - 12h)",
    rooms: "Baies vitrées Lobby & RDC",
    status: "terminee",
    agent: "Karim B."
  },
  {
    id: 5,
    client: "Hôtel",
    service: "Entretien sanitaire",
    date: "2026-10-10",
    slot: "Matin (7h - 12h)",
    rooms: "Sanitaires communs",
    status: "terminee",
    agent: "Lucas D."
  }
];

let dateCalendrierActuelle = new Date(2026, 9, 1);

function chargerPrestations() {
  const stock = localStorage.getItem('jadeInterventions');
  if (stock) {
    try {
      const donnees = JSON.parse(stock);
      if (Array.isArray(donnees) && donnees.length > 0) {
        return donnees;
      }
    } catch (e) {}
  }
  localStorage.setItem('jadeInterventions', JSON.stringify(DONNEES_DEFAUT));
  return DONNEES_DEFAUT;
}

function enregistrerPrestations(liste) {
  localStorage.setItem('jadeInterventions', JSON.stringify(liste));
}

document.addEventListener('DOMContentLoaded', () => {
  verifierConnexion();
  initialiserOnglets();
  actualiserStats();
  afficherProchaines();
  initialiserCalendrier();
  initialiserFiltresHistorique();
  initialiserFormulaireDemande();
  initialiserDeconnexion();
});

function verifierConnexion() {
  if (localStorage.getItem('jadeLoggedIn') !== 'true') {
    localStorage.setItem('jadeLoggedIn', 'true');
    localStorage.setItem('jadeUserRole', 'client');
  }

  const role = localStorage.getItem('jadeUserRole');
  const lienInterne = document.getElementById('lienConsoleInterne');
  if (lienInterne && role === 'interne') {
    lienInterne.classList.remove('d-none');
    lienInterne.classList.add('d-inline-flex');
  }
}

function initialiserDeconnexion() {
  document.querySelectorAll('.btn-logout').forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.removeItem('jadeLoggedIn');
      localStorage.removeItem('jadeUserRole');
      window.location.href = 'connexion.html';
    });
  });
}

function initialiserOnglets() {
  const onglets = document.querySelectorAll('.onglet');
  const panneaux = document.querySelectorAll('.panneau');

  onglets.forEach(onglet => {
    onglet.addEventListener('click', () => {
      const cible = onglet.getAttribute('data-panneau');
      onglets.forEach(o => o.classList.remove('actif'));
      panneaux.forEach(p => p.classList.remove('actif'));

      onglet.classList.add('actif');
      const panneauCible = document.getElementById(cible);
      if (panneauCible) panneauCible.classList.add('actif');
    });
  });
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

function afficherProchaines() {
  const conteneur = document.getElementById('listeProchaines');
  if (!conteneur) return;

  const liste = chargerPrestations()
    .filter(i => i.status === 'planifiee' || i.status === 'en_cours' || i.status === 'demandee')
    .slice(0, 4);

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

function initialiserCalendrier() {
  afficherCalendrier();

  const btnPrecedent = document.getElementById('calPrecedent');
  const btnSuivant = document.getElementById('calSuivant');

  if (btnPrecedent) {
    btnPrecedent.addEventListener('click', () => {
      dateCalendrierActuelle.setMonth(dateCalendrierActuelle.getMonth() - 1);
      afficherCalendrier();
    });
  }
  if (btnSuivant) {
    btnSuivant.addEventListener('click', () => {
      dateCalendrierActuelle.setMonth(dateCalendrierActuelle.getMonth() + 1);
      afficherCalendrier();
    });
  }
}

function afficherCalendrier() {
  const grille = document.getElementById('calGrille');
  const titreMois = document.getElementById('calMoisTitre');
  if (!grille || !titreMois) return;

  const annee = dateCalendrierActuelle.getFullYear();
  const mois = dateCalendrierActuelle.getMonth();

  const nomsMois = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  titreMois.textContent = `${nomsMois[mois]} ${annee}`;

  grille.innerHTML = '';

  const joursSemaine = ["L", "M", "M", "J", "V", "S", "D"];
  joursSemaine.forEach(j => {
    const lbl = document.createElement('div');
    lbl.className = 'cal-jour-nom';
    lbl.textContent = j;
    grille.appendChild(lbl);
  });

  const premierJour = new Date(annee, mois, 1).getDay();
  const decalage = (premierJour + 6) % 7;
  const joursDansMois = new Date(annee, mois + 1, 0).getDate();

  for (let i = 0; i < decalage; i++) {
    const vide = document.createElement('div');
    grille.appendChild(vide);
  }

  const liste = chargerPrestations().filter(i => i.status === 'planifiee' || i.status === 'en_cours' || i.status === 'terminee');
  const datesOccupees = liste.map(item => item.date);

  for (let d = 1; d <= joursDansMois; d++) {
    const dateStr = `${annee}-${String(mois + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cal-jour';
    btn.textContent = d;

    if (datesOccupees.includes(dateStr)) {
      btn.classList.add('avec-evenement');
      const point = document.createElement('span');
      point.className = 'cal-point';
      btn.appendChild(point);
    }

    btn.addEventListener('click', () => {
      document.querySelectorAll('.cal-jour').forEach(b => b.classList.remove('selectionne'));
      btn.classList.add('selectionne');
      afficherDetailJour(dateStr);
    });

    grille.appendChild(btn);
  }
}

function afficherDetailJour(dateStr) {
  const boite = document.getElementById('boiteDetailJour');
  const dateLbl = document.getElementById('detailJourDate');
  const contenu = document.getElementById('detailJourContenu');
  if (!boite || !dateLbl || !contenu) return;

  const liste = chargerPrestations().filter(i => i.status === 'planifiee' || i.status === 'en_cours' || i.status === 'terminee');
  const elements = liste.filter(item => item.date === dateStr);
  const dateObj = new Date(dateStr + "T00:00:00");
  dateLbl.textContent = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (!elements.length) {
    contenu.innerHTML = '<p class="text-jade-grey small mb-0">Aucune intervention programmée à cette date.</p>';
  } else {
    contenu.innerHTML = elements.map(item => creerCarteHtml(item)).join('');
  }
  boite.classList.remove('d-none');
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
    btn.addEventListener('click', () => {
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
      <h3 class="titre-prestation">${item.service}</h3>
      <div class="meta-prestation">
        <span><i class="bi bi-calendar3"></i> ${item.date}</span>
        ${item.slot ? `<span><i class="bi bi-clock"></i> ${item.slot}</span>` : ''}
        ${item.rooms ? `<span><i class="bi bi-door-open"></i> ${item.rooms}</span>` : ''}
        ${item.agent ? `<span><i class="bi bi-person-check"></i> ${item.agent}</span>` : ''}
      </div>
    </div>
  `;
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
      client: "Hôtel",
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
