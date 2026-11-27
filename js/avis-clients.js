document.addEventListener('DOMContentLoaded', () => {
  initAvisClients();
});

/* =========================================================
   Avis d'exemple : rédigés pour la démonstration du projet,
   affichés avec l'étiquette « Exemple ». À remplacer par de
   vrais avis clients (ou par ceux d'une base de données).
   ========================================================= */
const AVIS_EXEMPLES = [
  { id: 'ex1', note: 5, fonction: 'Gouvernante générale', etablissement: 'Palace, Paris', prestation: 'Abonnement Prestige', date: '2026-09-18',
    commentaire: 'Des équipes ponctuelles et d\'une discrétion remarquable. Nos clients ne les croisent jamais, mais ils voient la différence.' },
  { id: 'ex2', note: 5, fonction: 'Directeur d\'hébergement', etablissement: 'Hôtel 5 étoiles, Côte d\'Azur', prestation: 'Abonnement Signature', date: '2026-09-02',
    commentaire: 'La remise à blanc après chaque départ est irréprochable. Le contrôle qualité documenté nous fait gagner un temps précieux.' },
  { id: 'ex3', note: 4, fonction: 'Responsable d\'étage', etablissement: 'Maison de caractère, Provence', prestation: 'Prestation ponctuelle', date: '2026-08-21',
    commentaire: 'Très bon traitement des textiles anciens. Un petit délai pour obtenir le devis, mais un résultat à la hauteur.' },
  { id: 'ex4', note: 5, fonction: 'Gérante', etablissement: 'Conciergerie, Marseille', prestation: 'Intervention d\'urgence', date: '2026-07-30',
    commentaire: 'Appel à 10 h, équipe sur place avant midi, appartement prêt pour l\'arrivée des clients. Exactement ce qu\'on attendait.' }
];

const CLE_AVIS = 'jadeclean-avis';

function lireAvisPublies() {
  try {
    return JSON.parse(localStorage.getItem(CLE_AVIS)) || [];
  } catch (e) {
    return [];
  }
}

function enregistrerAvis(liste) {
  try {
    localStorage.setItem(CLE_AVIS, JSON.stringify(liste));
  } catch (e) {
    // localStorage indisponible : l'avis reste affiché jusqu'au rechargement
  }
}

// Échappe le texte saisi avant de l'insérer dans la page
function echapper(texte) {
  return String(texte ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function etoiles(note) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += i <= Math.round(note)
      ? '<i class="bi bi-star-fill"></i>'
      : '<i class="bi bi-star vide"></i>';
  }
  return html;
}

// Date du jour au format AAAA-MM-JJ, en heure locale
function dateDuJour() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dateCourte(date) {
  return new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

/* =========================================================
   Page
   ========================================================= */
let avisAjoutes = [];

function initAvisClients() {
  const form = document.getElementById('avisForm');
  if (!form) return;

  avisAjoutes = lireAvisPublies();

  // Filtres par note
  document.getElementById('filtreNotes').addEventListener('click', (e) => {
    const bouton = e.target.closest('.toggle-btn');
    if (!bouton) return;
    document.querySelectorAll('#filtreNotes .toggle-btn').forEach(b => b.classList.remove('active'));
    bouton.classList.add('active');
    afficherAvis();
  });

  // Compteur de caractères
  const commentaire = document.getElementById('avis_commentaire');
  commentaire.addEventListener('input', () => {
    document.getElementById('compteurAvis').textContent = commentaire.value.length;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const erreur = document.getElementById('avisErreur');
    const noteChoisie = form.querySelector('input[name="note"]:checked');
    const etablissement = document.getElementById('avis_etablissement').value.trim();
    const fonction = document.getElementById('avis_fonction').value.trim();
    const texte = commentaire.value.trim();

    if (!etablissement || !fonction || !noteChoisie) {
      erreur.textContent = 'Champs manquants : indiquez votre établissement, votre fonction et une note.';
      erreur.style.display = 'block';
      return;
    }

    if (texte.length < 20) {
      erreur.textContent = 'Votre avis doit contenir au moins 20 caractères.';
      erreur.style.display = 'block';
      return;
    }

    erreur.style.display = 'none';

    avisAjoutes.unshift({
      id: Date.now(),
      note: Number(noteChoisie.value),
      fonction,
      etablissement,
      prestation: document.getElementById('avis_prestation').value,
      date: dateDuJour(),
      commentaire: texte,
      nouveau: true
    });
    enregistrerAvis(avisAjoutes);

    form.reset();
    document.getElementById('compteurAvis').textContent = '0';
    form.classList.add('d-none');
    document.getElementById('avisSucces').classList.remove('d-none');
    afficherTout();
  });

  document.getElementById('nouvelAvis').addEventListener('click', () => {
    document.getElementById('avisSucces').classList.add('d-none');
    form.classList.remove('d-none');
  });

  afficherTout();
}

function tousLesAvis() {
  return avisAjoutes.concat(AVIS_EXEMPLES);
}

function afficherTout() {
  afficherSynthese();
  afficherAvis();
}

/* ---------- Note moyenne et répartition ---------- */
function afficherSynthese() {
  const avis = tousLesAvis();
  const total = avis.length;
  const moyenne = total ? avis.reduce((somme, a) => somme + a.note, 0) / total : 0;

  document.getElementById('noteMoyenne').textContent = moyenne.toFixed(1).replace('.', ',');
  document.getElementById('etoilesMoyenne').innerHTML = etoiles(moyenne);
  document.getElementById('nombreAvis').textContent = `${total} avis`;

  for (let note = 1; note <= 5; note++) {
    const nombre = avis.filter(a => a.note === note).length;
    document.getElementById(`nombre${note}`).textContent = nombre;
    document.getElementById(`barre${note}`).style.width = total ? `${(nombre / total) * 100}%` : '0%';
  }
}

/* ---------- Liste des avis (cards) ---------- */
function afficherAvis() {
  const filtre = document.querySelector('#filtreNotes .toggle-btn.active').dataset.note;

  const liste = tousLesAvis().filter(a => {
    if (filtre === 'toutes') return true;
    if (filtre === '3') return a.note <= 3;
    return a.note === Number(filtre);
  });

  const conteneur = document.getElementById('listeAvis');

  if (!liste.length) {
    conteneur.innerHTML = '<div class="col-12"><p class="aucun-avis">Aucun avis pour cette note.</p></div>';
    return;
  }

  conteneur.innerHTML = liste.map(a => {
    const etiquette = a.nouveau
      ? '<span class="etiquette nouveau">Nouveau</span>'
      : (String(a.id).startsWith('ex') ? '<span class="etiquette">Exemple</span>' : '');

    return `
      <div class="col">
        <article class="card h-100 carte-avis">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center gap-2">
              <div class="etoiles" aria-label="${a.note} sur 5">${etoiles(a.note)}</div>
              ${etiquette}
            </div>
            <p class="citation">« ${echapper(a.commentaire)} »</p>
          </div>
          <div class="card-footer">
            <span class="auteur">${echapper(a.fonction)}</span>
            <span class="etablissement">${echapper(a.etablissement)} · ${echapper(a.prestation)} · ${dateCourte(a.date)}</span>
          </div>
        </article>
      </div>`;
  }).join('');
}
