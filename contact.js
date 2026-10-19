document.addEventListener('DOMContentLoaded', () => {
  initContactPage();
});

function initContactPage() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const urlParams = new URLSearchParams(window.location.search);
  const forfaitParam = urlParams.get('forfait');
  const besoinParam = urlParams.get('besoin');

  if (forfaitParam) {
    const badge = document.getElementById('forfaitBadge');
    const badgeText = document.getElementById('forfaitBadgeText');
    if (badge && badgeText) {
      badgeText.textContent = forfaitParam;
      badge.classList.remove('d-none');
    }
  }

  if (besoinParam) {
    const needSelect = document.getElementById('need_type');
    if (needSelect) {
      const match = Array.from(needSelect.options).find(
        opt => opt.value.toLowerCase() === besoinParam.toLowerCase()
      );
      if (match) needSelect.value = match.value;
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const errorBox = document.getElementById('contactError');
    const hotelName = document.getElementById('hotel_name').value.trim();
    const contactName = document.getElementById('contact_name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!hotelName || !contactName) {
      if (errorBox) {
        errorBox.textContent = "Champs manquant.";
        errorBox.style.display = 'block';
      }
      return;
    }

    if (!phone && !email) {
      if (errorBox) {
        errorBox.textContent = "Champs manquant.";
        errorBox.style.display = 'block';
      }
      return;
    }

    if (errorBox) errorBox.style.display = 'none';

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Envoi en cours…';

    setTimeout(() => {
      form.classList.add('d-none');
      const successBox = document.getElementById('contactSuccess');
      if (successBox) successBox.classList.remove('d-none');
    }, 900);
  });
}