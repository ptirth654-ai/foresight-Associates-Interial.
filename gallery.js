/**
 * Foresight Associates — Lightbox Gallery & Image Viewer
 */

export function initGallery() {
  const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
  if (!galleryItems.length) return;

  // Create or select lightbox modal element
  let modal = document.querySelector('.lightbox-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'lightbox-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Project photograph preview');
    modal.innerHTML = `
      <button class="lightbox-close" type="button" aria-label="Close image viewer">✕</button>
      <button class="lightbox-prev" type="button" aria-label="Previous photograph">‹</button>
      <button class="lightbox-next" type="button" aria-label="Next photograph">›</button>
      <div class="lightbox-dialog">
        <img class="lightbox-image" src="" alt="">
        <p class="lightbox-caption"></p>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const modalImg = modal.querySelector('.lightbox-image');
  const modalCaption = modal.querySelector('.lightbox-caption');
  const closeBtn = modal.querySelector('.lightbox-close');
  const prevBtn = modal.querySelector('.lightbox-prev');
  const nextBtn = modal.querySelector('.lightbox-next');

  let currentIndex = 0;
  let lastActiveElement = null;

  // Extract images info from gallery items
  const itemsData = galleryItems.map(item => {
    const img = item.querySelector('img');
    const captionEl = item.querySelector('.gallery-item-caption') || item.querySelector('.gallery-caption');
    return {
      src: img?.getAttribute('src') || '',
      alt: img?.getAttribute('alt') || '',
      caption: captionEl?.textContent?.trim() || img?.getAttribute('alt') || ''
    };
  });

  function updateModal(index) {
    currentIndex = (index + itemsData.length) % itemsData.length;
    const item = itemsData[currentIndex];
    modalImg.src = item.src;
    modalImg.alt = item.alt;
    modalCaption.textContent = item.caption;
  }

  function openModal(index, triggerElement) {
    lastActiveElement = triggerElement;
    updateModal(index);
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeModal() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastActiveElement) {
      lastActiveElement.focus();
    }
  }

  // Attach event listeners to gallery items
  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => openModal(index, item));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(index, item);
      }
    });
  });

  closeBtn.addEventListener('click', closeModal);
  prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    updateModal(currentIndex - 1);
  });
  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    updateModal(currentIndex + 1);
  });

  // Click outside dialog to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      closeModal();
    } else if (e.key === 'ArrowLeft') {
      updateModal(currentIndex - 1);
    } else if (e.key === 'ArrowRight') {
      updateModal(currentIndex + 1);
    }
  });
}
