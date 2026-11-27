document.addEventListener('DOMContentLoaded', () => {
  const nom = (typeof lireDonneeSession === 'function') ? lireDonneeSession('jadeUserName') : localStorage.getItem('jadeUserName');
  const infoEl = document.getElementById('infoUtilisateurInterne');
  if (infoEl && nom) {
    infoEl.textContent = `Connecté · ${nom} (Administration)`;
  }
  initEspaceInterne();
});

/* =========================================================
   Données de démonstration
   En attendant une base de données, tout est gardé dans le
   localStorage du navigateur et régénéré chaque jour.
   ========================================================= */
const CLE_STOCKAGE = 'jadeclean-interne';

const CLIENTS = ['Hôtel Le Grand Royal', 'Palais Lumière', 'Maison des Lys', 'Hôtel Rive Gauche'];
const CRENEAUX = ['Matin (7h - 12h)', 'Après-midi (12h - 18h)', 'Soirée (18h - 22h)'];

const STATUTS = {
  demandee: 'Demandée',
  planifiee: 'Planifiée',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée'
};

const PRIORITES = {
  haute: { libelle: 'Urgente', classe: 'plein', ordre: 0 },
  normale: { libelle: 'Normale', classe: '', ordre: 1 },
  basse: { libelle: 'Basse', classe: 'gris', ordre: 2 }
};

const TYPES_DOCUMENT = {
  contrat: { libelle: 'Contrat', prefixe: 'CTR', statuts: ['Actif', 'À renouveler', 'Résilié'] },
  devis: { libelle: 'Devis', prefixe: 'DEV', statuts: ['En attente', 'Accepté', 'Refusé'] },
  facture: { libelle: 'Facture', prefixe: 'FAC', statuts: ['À payer', 'Payée'] }
};

// Couleur du badge selon le statut
const CLASSES_STATUT = {
  demandee: 'orange', planifiee: '', en_cours: 'plein', terminee: 'vert', annulee: 'gris',
  nouvelle: 'plein', planifiee_demande: 'vert', refusee: 'gris',
  'À payer': 'orange', 'Payée': 'vert', 'Actif': 'vert', 'Accepté': 'vert',
  'Résilié': 'gris', 'Refusé': 'gris', 'En attente': '', 'À renouveler': ''
};

let donnees = null;

/* ---------- Dates ---------- */
function dateDans(nbJours) {
  const d = new Date();
  d.setDate(d.getDate() + nbJours);
  // Format AAAA-MM-JJ en heure locale (toISOString passerait en UTC)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function aujourdhui() {
  return dateDans(0);
}

function dateLongue(date) {
  return new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/* ---------- Outils ---------- */
// Échappe le texte saisi avant de l'insérer dans la page
function echapper(texte) {
  return String(texte ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function badge(texte, cle) {
  return `<span class="statut ${CLASSES_STATUT[cle] ?? ''}">${echapper(texte)}</span>`;
}

function prochainId(liste) {
  return liste.reduce((max, element) => Math.max(max, element.id), 0) + 1;
}

function trierParDate(a, b) {
  return a.date.localeCompare(b.date) || CRENEAUX.indexOf(a.creneau) - CRENEAUX.indexOf(b.creneau);
}

function notifier(message) {
  document.getElementById('texteNotification').textContent = message;
  bootstrap.Toast.getOrCreateInstance(document.getElementById('notification'), { delay: 3000 }).show();
}

/* ---------- Données de départ ---------- */
function donneesDeDepart() {
  const intervention = (id, client, jours, prestation, creneau, zone, statut, avancement) => ({
    id, client, date: dateDans(jours), prestation, creneau: CRENEAUX[creneau], zone, statut,
    avancement: avancement ?? (statut === 'terminee' ? 100 : 0)
  });

  return {
    genereLe: aujourdhui(),
    demandes: [
      { id: 1, client: CLIENTS[0], recue: dateDans(0), souhaitee: dateDans(2), prestation: 'Remise à blanc', creneau: CRENEAUX[0], zone: 'Suite 512, après départ VIP', priorite: 'haute', etat: 'nouvelle', note: '' },
      { id: 2, client: CLIENTS[1], recue: dateDans(0), souhaitee: dateDans(4), prestation: 'Nettoyage des vitres', creneau: CRENEAUX[1], zone: 'Verrière du restaurant', priorite: 'normale', etat: 'nouvelle', note: '' },
      { id: 3, client: CLIENTS[3], recue: dateDans(-1), souhaitee: dateDans(3), prestation: 'Traitement des textiles', creneau: CRENEAUX[0], zone: 'Rideaux de la salle de bal', priorite: 'normale', etat: 'nouvelle', note: 'Événement le lendemain soir.' },
      { id: 4, client: CLIENTS[2], recue: dateDans(-2), souhaitee: dateDans(1), prestation: 'Nettoyage quotidien', creneau: CRENEAUX[0], zone: 'Aile est', priorite: 'basse', etat: 'planifiee', note: '' },
      { id: 5, client: CLIENTS[1], recue: dateDans(-3), souhaitee: dateDans(-1), prestation: 'Rangements', creneau: CRENEAUX[1], zone: 'Dressings des suites', priorite: 'basse', etat: 'refusee', note: '' }
    ],
    interventions: [
      intervention(1, CLIENTS[0], 0, 'Nettoyage quotidien', 0, 'Étages 1 à 4', 'en_cours', 60),
      intervention(2, CLIENTS[1], 0, 'Salles de bain', 0, 'Suites, étage 3', 'en_cours', 35),
      intervention(3, CLIENTS[2], 0, 'Entretien sanitaire', 0, 'Spa et vestiaires', 'terminee'),
      intervention(4, CLIENTS[1], 0, 'Remise à blanc', 1, '12 chambres, étage 4', 'planifiee'),
      intervention(5, CLIENTS[3], 0, 'Nettoyage quotidien', 2, 'Étages 2 à 5', 'planifiee'),
      intervention(6, CLIENTS[0], 1, 'Rangements', 1, 'Dressings, étage 5', 'planifiee'),
      intervention(7, CLIENTS[1], 2, 'Traitement des textiles', 0, 'Linge du spa', 'demandee'),
      intervention(8, CLIENTS[0], 3, 'Remise à blanc', 0, '24 chambres, étage 2', 'planifiee'),
      intervention(9, CLIENTS[2], 4, 'Nettoyage des vitres', 1, 'Orangerie', 'demandee'),
      intervention(10, CLIENTS[3], 6, 'Rangements', 1, 'Lingerie centrale', 'demandee'),
      intervention(11, CLIENTS[0], -1, 'Nettoyage quotidien', 0, 'Étages 5 à 7', 'terminee'),
      intervention(12, CLIENTS[3], -1, 'Remise à blanc', 0, '8 chambres, étage 1', 'terminee')
    ],
    documents: [
      { id: 1, ref: 'CTR-2026-004', type: 'contrat', client: CLIENTS[0], titre: 'Abonnement annuel : Forfait Signature', montant: 3450, emis: dateDans(-14), statut: 'À renouveler' },
      { id: 2, ref: 'CTR-2026-007', type: 'contrat', client: CLIENTS[1], titre: 'Abonnement annuel : Forfait Prestige', montant: 5800, emis: dateDans(-60), statut: 'Actif' },
      { id: 3, ref: 'DEV-2026-018', type: 'devis', client: CLIENTS[0], titre: 'Remise à blanc — suites du 5e étage', montant: 1840, emis: dateDans(-10), statut: 'En attente' },
      { id: 4, ref: 'FAC-2026-104', type: 'facture', client: CLIENTS[0], titre: 'Abonnement Signature — mois en cours', montant: 3450, emis: dateDans(-2), statut: 'À payer' },
      { id: 5, ref: 'FAC-2026-103', type: 'facture', client: CLIENTS[1], titre: 'Abonnement Prestige — mois en cours', montant: 5800, emis: dateDans(-2), statut: 'À payer' },
      { id: 6, ref: 'FAC-2026-091', type: 'facture', client: CLIENTS[0], titre: 'Abonnement Signature — mois précédent', montant: 3450, emis: dateDans(-32), statut: 'Payée' }
    ]
  };
}

function chargerDonnees() {
  try {
    const sauvegarde = JSON.parse(localStorage.getItem(CLE_STOCKAGE));
    if (sauvegarde && sauvegarde.genereLe === aujourdhui()) return sauvegarde;
  } catch (e) {
    // localStorage indisponible : on repart des données de démonstration
  }
  return donneesDeDepart();
}

function sauvegarder(message) {
  try {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(donnees));
  } catch (e) {
    // pas grave : les données restent en mémoire jusqu'au rechargement
  }
  toutAfficher();
  if (message) notifier(message);
}

/* =========================================================
   Initialisation
   ========================================================= */
function initEspaceInterne() {
  if (!document.getElementById('ongletsInterne')) return;

  donnees = chargerDonnees();

  // Listes déroulantes
  const optionsClients = CLIENTS.map(c => `<option value="${c}">${c}</option>`).join('');
  document.getElementById('filtreClientDemandes').innerHTML = '<option value="">Tous les clients</option>' + optionsClients;
  document.getElementById('filtreClientInterventions').innerHTML = '<option value="">Tous les clients</option>' + optionsClients;
  document.getElementById('clientDocument').innerHTML = optionsClients;
  document.getElementById('creneauPlanifier').innerHTML = CRENEAUX.map(c => `<option>${c}</option>`).join('');

  initFiltres();
  initDemandes();
  initInterventions();
  initDocuments();
  toutAfficher();
}

function toutAfficher() {
  afficherApercu();
  afficherDemandes();
  afficherInterventions();
  afficherDocuments();
}

// Boutons de filtre (même principe que le choix Client / Interne de la connexion)
function initFiltres() {
  document.querySelectorAll('.toggle-group').forEach(groupe => {
    groupe.addEventListener('click', (e) => {
      const bouton = e.target.closest('.toggle-btn');
      if (!bouton) return;
      groupe.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      bouton.classList.add('active');
      toutAfficher();
    });
  });

  ['filtreClientDemandes', 'filtrePriorite', 'filtreClientInterventions'].forEach(id => {
    document.getElementById(id).addEventListener('change', toutAfficher);
  });
}

function filtreActif(idGroupe, attribut) {
  return document.querySelector(`#${idGroupe} .toggle-btn.active`).dataset[attribut];
}

/* =========================================================
   1. Aperçu — supervision de la journée
   ========================================================= */
function afficherApercu() {
  const chiffres = [
    [donnees.demandes.filter(d => d.etat === 'nouvelle').length, 'Demandes'],
    [donnees.interventions.filter(i => i.statut === 'demandee').length, 'Interventions à planifier'],
    [donnees.interventions.filter(i => i.statut === 'en_cours').length, 'Interventions en cours'],
    [donnees.documents.filter(d => d.type === 'facture' && d.statut === 'À payer').length, 'Factures à payer']
  ];

  document.getElementById('indicateurs').innerHTML = chiffres.map(([nombre, libelle]) => `
    <div class="col-6 col-lg-3">
      <div class="carte-espace indicateur">
        <div class="chiffre">${nombre}</div>
        <div class="libelle">${libelle}</div>
      </div>
    </div>`).join('');

  const missions = donnees.interventions
    .filter(i => i.date === aujourdhui() && i.statut !== 'annulee')
    .sort(trierParDate);

  const moyenne = missions.length
    ? Math.round(missions.reduce((total, i) => total + i.avancement, 0) / missions.length)
    : 0;
  document.getElementById('pourcentageGlobal').textContent = `${moyenne} %`;
  document.getElementById('barreGlobale').style.width = `${moyenne}%`;

  document.getElementById('missionsDuJour').innerHTML = missions.length
    ? missions.map(i => `
      <div class="mission">
        <div>
          <span class="client-nom">${echapper(i.client)}</span>
          <h3 class="titre-carte">${echapper(i.prestation)}</h3>
          <span class="detail">${echapper(i.creneau)} · ${echapper(i.zone)}</span>
        </div>
        <div class="suivi">
          <div class="d-flex justify-content-between align-items-center">
            ${badge(STATUTS[i.statut], i.statut)}
            <span class="label-mini">${i.avancement} %</span>
          </div>
          <div class="barre"><span style="width: ${i.avancement}%"></span></div>
        </div>
      </div>`).join('')
    : '<p class="vide">Aucune mission aujourd\'hui.</p>';
}

/* =========================================================
   2. Demandes — file d'attente avec filtres croisés
   ========================================================= */
let demandeEnCours = null;

function afficherDemandes() {
  const etat = filtreActif('filtreEtat', 'etat');
  const client = document.getElementById('filtreClientDemandes').value;
  const priorite = document.getElementById('filtrePriorite').value;

  const liste = donnees.demandes
    .filter(d => etat === 'toutes' || (etat === 'nouvelle' ? d.etat === 'nouvelle' : d.etat !== 'nouvelle'))
    .filter(d => !client || d.client === client)
    .filter(d => !priorite || d.priorite === priorite)
    .sort((a, b) => PRIORITES[a.priorite].ordre - PRIORITES[b.priorite].ordre || a.souhaitee.localeCompare(b.souhaitee));

  const conteneur = document.getElementById('listeDemandes');
  if (!liste.length) {
    conteneur.innerHTML = '<div class="carte-espace vide">Aucune demande dans cette catégorie.</div>';
    return;
  }

  const libellesEtat = { nouvelle: 'Nouvelle', planifiee: 'Planifiée', refusee: 'Refusée' };

  conteneur.innerHTML = liste.map(d => {
    const enRetard = d.etat === 'nouvelle' && d.souhaitee < aujourdhui();
    const actions = d.etat === 'nouvelle' ? `
      <div class="actions">
        <button type="button" class="bouton-secondaire" data-refuser="${d.id}">Refuser</button>
        <button type="button" class="bouton-principal" data-planifier="${d.id}">Planifier</button>
      </div>` : '';

    return `
      <article class="carte-espace">
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-2">
          <div>
            <h3 class="titre-carte">${echapper(d.prestation)}</h3>
            <span class="client-nom">${echapper(d.client)}</span>
          </div>
          <div class="d-flex gap-2">
            <span class="statut ${PRIORITES[d.priorite].classe}">${PRIORITES[d.priorite].libelle}</span>
            ${badge(libellesEtat[d.etat], d.etat === 'planifiee' ? 'planifiee_demande' : d.etat)}
          </div>
        </div>
        <div class="infos">
          <span class="${enRetard ? 'en-retard' : ''}">${dateLongue(d.souhaitee)}</span>
          <span>${echapper(d.creneau)}</span>
          <span>${echapper(d.zone)}</span>
        </div>
        ${d.note ? `<div class="note">${echapper(d.note)}</div>` : ''}
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-3">
          <span class="label-mini">Reçue le ${dateLongue(d.recue)}</span>
          ${actions}
        </div>
      </article>`;
  }).join('');
}

function initDemandes() {
  const modale = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalePlanifier'));

  document.getElementById('listeDemandes').addEventListener('click', (e) => {
    const boutonRefuser = e.target.closest('[data-refuser]');
    const boutonPlanifier = e.target.closest('[data-planifier]');

    if (boutonRefuser) {
      donnees.demandes.find(d => d.id === Number(boutonRefuser.dataset.refuser)).etat = 'refusee';
      sauvegarder('Demande refusée.');
    }

    if (boutonPlanifier) {
      demandeEnCours = donnees.demandes.find(d => d.id === Number(boutonPlanifier.dataset.planifier));
      document.getElementById('resumePlanifier').textContent =
        `${demandeEnCours.client} — ${demandeEnCours.prestation} · ${demandeEnCours.zone}`;
      const champDate = document.getElementById('datePlanifier');
      champDate.min = aujourdhui();
      champDate.value = demandeEnCours.souhaitee >= aujourdhui() ? demandeEnCours.souhaitee : aujourdhui();
      document.getElementById('creneauPlanifier').value = demandeEnCours.creneau;
      modale.show();
    }
  });

  // Planifier = créer l'intervention correspondante
  document.getElementById('formPlanifier').addEventListener('submit', (e) => {
    e.preventDefault();
    donnees.interventions.push({
      id: prochainId(donnees.interventions),
      client: demandeEnCours.client,
      date: document.getElementById('datePlanifier').value,
      prestation: demandeEnCours.prestation,
      creneau: document.getElementById('creneauPlanifier').value,
      zone: demandeEnCours.zone,
      statut: 'planifiee',
      avancement: 0
    });
    demandeEnCours.etat = 'planifiee';
    modale.hide();
    sauvegarder('Intervention planifiée.');
  });
}

/* =========================================================
   3. Interventions — changement de statut et d'avancement
   ========================================================= */
function afficherInterventions() {
  const periode = filtreActif('filtrePeriode', 'periode');
  const client = document.getElementById('filtreClientInterventions').value;

  const liste = donnees.interventions
    .filter(i => periode === 'toutes' || (periode === 'jour' ? i.date === aujourdhui() : i.date > aujourdhui()))
    .filter(i => !client || i.client === client)
    .sort(trierParDate);

  const conteneur = document.getElementById('listeInterventions');
  if (!liste.length) {
    conteneur.innerHTML = '<div class="carte-espace vide">Aucune intervention dans cette catégorie.</div>';
    return;
  }

  conteneur.innerHTML = liste.map(i => {
    const options = Object.entries(STATUTS)
      .map(([cle, libelle]) => `<option value="${cle}" ${cle === i.statut ? 'selected' : ''}>${libelle}</option>`)
      .join('');

    const curseur = i.statut === 'en_cours' ? `
      <label class="label-mini ms-sm-3" for="avancement-${i.id}">Avancement</label>
      <input type="range" class="form-range" id="avancement-${i.id}" data-avancement="${i.id}"
        min="0" max="100" step="10" value="${i.avancement}">
      <span class="label-mini" id="texte-avancement-${i.id}">${i.avancement} %</span>` : '';

    return `
      <article class="carte-espace">
        <h3 class="titre-carte">${echapper(i.prestation)}</h3>
        <span class="client-nom">${echapper(i.client)}</span>
        <div class="infos">
          <span>${dateLongue(i.date)}</span>
          <span>${echapper(i.creneau)}</span>
          <span>${echapper(i.zone)}</span>
        </div>
        <div class="d-flex flex-wrap align-items-center gap-3 mt-3">
          <label class="label-mini" for="statut-${i.id}">Statut :</label>
          <select class="select-statut" id="statut-${i.id}" data-statut="${i.id}">${options}</select>
          ${curseur}
        </div>
      </article>`;
  }).join('');
}

function initInterventions() {
  const conteneur = document.getElementById('listeInterventions');

  conteneur.addEventListener('change', (e) => {
    const menu = e.target.closest('[data-statut]');
    const curseur = e.target.closest('[data-avancement]');

    if (menu) {
      const intervention = donnees.interventions.find(i => i.id === Number(menu.dataset.statut));
      intervention.statut = menu.value;
      if (menu.value === 'terminee') intervention.avancement = 100;
      if (menu.value === 'planifiee' || menu.value === 'demandee') intervention.avancement = 0;
      sauvegarder(`Statut mis à jour : ${STATUTS[menu.value]}.`);
    }

    if (curseur) {
      const intervention = donnees.interventions.find(i => i.id === Number(curseur.dataset.avancement));
      intervention.avancement = Number(curseur.value);
      if (intervention.avancement === 100) intervention.statut = 'terminee';
      sauvegarder('Avancement enregistré.');
    }
  });

  // Affiche le pourcentage pendant qu'on fait glisser le curseur
  conteneur.addEventListener('input', (e) => {
    const curseur = e.target.closest('[data-avancement]');
    if (curseur) {
      document.getElementById(`texte-avancement-${curseur.dataset.avancement}`).textContent = `${curseur.value} %`;
    }
  });
}

/* =========================================================
   4. Documents — liste et création
   ========================================================= */
function afficherDocuments() {
  const liste = donnees.documents.slice().sort((a, b) => b.emis.localeCompare(a.emis));

  document.getElementById('listeDocuments').innerHTML = liste.map(d => {
    const type = TYPES_DOCUMENT[d.type];
    const options = type.statuts
      .map(s => `<option ${s === d.statut ? 'selected' : ''}>${s}</option>`)
      .join('');

    return `
      <article class="carte-espace">
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-2">
          <div>
            <h3 class="titre-carte">${echapper(d.titre)}</h3>
            <span class="client-nom">${echapper(d.ref)} · ${type.libelle}</span>
          </div>
          ${badge(d.statut, d.statut)}
        </div>
        <p class="texte-carte mt-2 mb-1">${echapper(d.client)}</p>
        <div class="d-flex flex-wrap align-items-center gap-3 gap-sm-5">
          <span>Émis le ${dateLongue(d.emis)}</span>
          <span>${Number(d.montant).toLocaleString('fr-FR')} €</span>
          <span class="d-flex align-items-center gap-2">
            <label class="label-mini" for="statut-doc-${d.id}">Statut :</label>
            <select class="select-statut" id="statut-doc-${d.id}" data-document="${d.id}">${options}</select>
          </span>
        </div>
      </article>`;
  }).join('');
}

function initDocuments() {
  const form = document.getElementById('formDocument');
  const modale = bootstrap.Modal.getOrCreateInstance(document.getElementById('modaleDocument'));
  const erreur = document.getElementById('erreurDocument');

  document.getElementById('listeDocuments').addEventListener('change', (e) => {
    const menu = e.target.closest('[data-document]');
    if (!menu) return;
    donnees.documents.find(d => d.id === Number(menu.dataset.document)).statut = menu.value;
    sauvegarder('Statut du document mis à jour.');
  });

  document.getElementById('modaleDocument').addEventListener('hidden.bs.modal', () => {
    form.reset();
    erreur.style.display = 'none';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const intitule = document.getElementById('intituleDocument').value.trim();
    const montant = document.getElementById('montantDocument').value;

    if (!intitule || montant === '') {
      erreur.textContent = 'Champs manquants.';
      erreur.style.display = 'block';
      return;
    }

    // Numéro suivant pour ce type : CTR-2026-005, DEV-2026-019…
    const type = document.getElementById('typeDocument').value;
    const prefixe = `${TYPES_DOCUMENT[type].prefixe}-${new Date().getFullYear()}-`;
    const numero = donnees.documents
      .filter(d => d.ref.startsWith(prefixe))
      .reduce((max, d) => Math.max(max, Number(d.ref.slice(prefixe.length))), 0) + 1;

    donnees.documents.push({
      id: prochainId(donnees.documents),
      ref: prefixe + String(numero).padStart(3, '0'),
      type,
      client: document.getElementById('clientDocument').value,
      titre: intitule,
      montant: Number(montant),
      emis: aujourdhui(),
      statut: TYPES_DOCUMENT[type].statuts[0]
    });

    modale.hide();
    sauvegarder('Document publié.');
  });
}
