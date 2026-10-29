/**
 * Foresight Associates — Main Application Entry Point
 */

import { initNavigation } from './navigation.js';
import { initAnimations } from './animations.js';
import { renderProjects, initProjectFilters } from './project-filters.js';
import { initGallery } from './gallery.js';
import { initContactForm } from './contact-form.js';
import { getBasePath } from './utilities.js';

// Component loader for static HTML files
async function loadComponents() {
  const base = getBasePath();
  const headerMount = document.querySelector('[data-include="header"]');
  const footerMount = document.querySelector('[data-include="footer"]');

  if (headerMount && headerMount.children.length === 0) {
    try {
      const res = await fetch(`${base}components/header.html`);
      if (res.ok) {
        let html = await res.text();
        if (base === '../') {
          html = html.replace(/href="([^"#:]+\.html)"/g, 'href="../$1"')
                     .replace(/href="#/g, 'href="../index.html#');
        }
        headerMount.innerHTML = html;
      }
    } catch (e) {
      console.warn('Component fetch failed (likely file:// protocol):', e);
    }
  }

  if (footerMount && footerMount.children.length === 0) {
    try {
      const res = await fetch(`${base}components/footer.html`);
      if (res.ok) {
        let html = await res.text();
        if (base === '../') {
          html = html.replace(/href="([^"#:]+\.html)"/g, 'href="../$1"');
        }
        footerMount.innerHTML = html;
      }
    } catch (e) {
      console.warn('Component fetch failed (likely file:// protocol):', e);
    }
  }
}

// Update copyright years dynamically
function updateCopyright() {
  const yearElements = document.querySelectorAll('[data-current-year]');
  const currentYear = new Date().getFullYear();
  yearElements.forEach(el => {
    el.textContent = String(currentYear);
  });
}

// Global initialization
async function init() {
  await loadComponents();
  initNavigation();
  updateCopyright();

  const page = document.body.dataset.page || '';

  if (page === 'projects') {
    renderProjects('all', '[data-project-list="portfolio"]');
    initProjectFilters();
  } else if (page === 'project-detail') {
    initGallery();
  } else if (page === 'contact') {
    initContactForm();
  }

  // Initialize animations after page layout is fully established
  initAnimations();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
