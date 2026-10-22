document.addEventListener('DOMContentLoaded', () => {
  initForfaitsSlider();
});

function initForfaitsSlider() {
  const slider = document.getElementById('forfaitsSlider') || document.querySelector('#forfaits .row');
  if (!slider) return;

  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;
  let hasDragged = false;

  slider.addEventListener('mousedown', (e) => {
    isDown = true;
    hasDragged = false;
    slider.classList.add('grabbing');
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
  });

  window.addEventListener('mouseup', () => {
    if (isDown) {
      isDown = false;
      slider.classList.remove('grabbing');
    }
  });

  slider.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    hasDragged = true;
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 1.5;
    slider.scrollLeft = scrollLeft - walk;
  });

  slider.addEventListener('click', (e) => {
    if (hasDragged) {
      e.preventDefault();
    }
  });

  const dots = document.querySelectorAll('.forfait-dot');
  if (dots.length) {
    const updateDots = () => {
      const cardWidth = slider.firstElementChild ? slider.firstElementChild.offsetWidth : slider.scrollWidth / 3;
      const index = Math.min(2, Math.max(0, Math.round(slider.scrollLeft / cardWidth)));
      dots.forEach((dot, i) => {
        dot.classList.toggle('actif', i === index);
      });
    };

    slider.addEventListener('scroll', updateDots, { passive: true });

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        const cards = slider.querySelectorAll('[class*="col-"]');
        if (cards[i]) {
          cards[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      });
    });
  }
}
