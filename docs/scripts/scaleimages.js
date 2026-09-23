(() => {
  const init = () => {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const closeBtn = document.getElementById('modal-close');
    const backdrop = document.getElementById('modal-backdrop');
    if (!modal || !modalImg) return;

    const open = (src, alt) => {
      modalImg.src = src;
      modalImg.alt = alt || '';
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    };

    const close = () => {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
      setTimeout(() => { modalImg.src = ''; }, 300);
    };

    document.querySelectorAll('[data-zoomable]').forEach((img) => {
      img.addEventListener('click', () => open(img.src, img.alt));
    });

    closeBtn?.addEventListener('click', close);
    backdrop?.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  };

  window.MakeShopImageZoom = { init };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
