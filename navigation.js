/**
 * Foresight Associates — Header, Navigation & Mobile Drawer
 */

export function initNavigation() {
  const header = document.querySelector('.site-header');
  const toggleBtn = document.querySelector('.mobile-menu-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

  // 1. Header scroll state
  function handleScroll() {
    if (!header) return;
    if (window.scrollY > 40) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Initial check

  // 2. Active link state
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/index.html';
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const cleanHref = href.replace(/^\.\//, '').replace(/^\.\.\//, '');
    if (
      (currentPath.endsWith(cleanHref) && cleanHref !== '') ||
      (currentPath.endsWith('/') && cleanHref === 'index.html') ||
      (currentPath.endsWith('index.html') && cleanHref === 'index.html') ||
      (currentPath.includes('/projects/') && cleanHref === 'projects.html')
    ) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });

  // 3. Mobile drawer toggle
  if (toggleBtn && drawer) {
    function toggleDrawer(open) {
      const isOpen = open !== undefined ? open : !drawer.classList.contains('is-open');
      drawer.classList.toggle('is-open', isOpen);
      toggleBtn.classList.toggle('is-open', isOpen);
      toggleBtn.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';

      if (isOpen) {
        drawer.querySelector('a')?.focus();
      } else {
        toggleBtn.focus();
      }
    }

    toggleBtn.addEventListener('click', () => toggleDrawer());

    // Close when clicking a nav link inside drawer
    drawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => toggleDrawer(false));
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        toggleDrawer(false);
      }
    });
  }
}
