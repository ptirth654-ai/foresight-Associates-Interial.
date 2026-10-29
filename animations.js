/**
 * Foresight Associates — Scroll Reveal Animations
 */

let globalObserver = null;

export function observeElement(el) {
  if (!el) return;
  if (!globalObserver) {
    el.classList.add('is-visible');
    return;
  }
  globalObserver.observe(el);
}

export function initAnimations() {
  // Activate JS animation styling
  document.documentElement.classList.add('js-anim-ready');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    return;
  }

  globalObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '60px 0px -20px 0px',
    threshold: 0.05
  });

  const allReveals = document.querySelectorAll('.reveal');
  allReveals.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('is-visible');
    } else {
      globalObserver.observe(el);
    }
  });

  // Failsafe timer: make sure visible content is never trapped in opacity: 0
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 250) {
        el.classList.add('is-visible');
      }
    });
  }, 600);
}
