/**
 * Foresight Associates — Utility Functions
 */

export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function debounce(func, wait = 100) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function getSlug() {
  const path = window.location.pathname;
  const match = path.match(/\/projects\/([^/.]+)(?:\.html)?$/);
  if (match) return match[1];
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('project') || '';
}

export function getBasePath() {
  const isSubdir = window.location.pathname.includes('/projects/');
  return isSubdir ? '../' : './';
}
