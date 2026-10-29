/**
 * Foresight Associates — Project Grid Rendering & Category Filtering
 */

import { projects } from './project-data.js';
import { escapeHtml, getBasePath } from './utilities.js';
import { observeElement } from './animations.js';

export function renderProjects(filterCategory = 'all', containerSelector = '[data-project-list]') {
  const containers = document.querySelectorAll(containerSelector);
  if (!containers.length) return;

  const base = getBasePath();

  containers.forEach(container => {
    const isFeaturedOnly = container.dataset.projectList === 'featured';
    
    // If container already contains static cards, observe them and avoid wiping out
    if (isFeaturedOnly && container.children.length > 0) {
      container.querySelectorAll('.reveal').forEach(card => {
        observeElement(card);
      });
      return;
    }

    let filtered = projects;
    if (isFeaturedOnly) {
      filtered = filtered.filter(p => p.featured);
    } else if (filterCategory !== 'all') {
      filtered = filtered.filter(p => p.category.toLowerCase() === filterCategory.toLowerCase());
    }

    if (!filtered.length) {
      container.innerHTML = `
        <div class="empty-state">
          <p class="eyebrow">No projects found</p>
          <h3>Currently curating work in this category.</h3>
          <p>Please select another category or contact our studio directly for private portfolio viewings.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(item => `
      <article class="project-card reveal is-visible">
        <a class="project-card-link" href="${base}projects/${escapeHtml(item.slug)}.html">
          <div class="project-card-media">
            <img 
              src="${base}${escapeHtml(item.thumbnail)}" 
              alt="${escapeHtml(item.title)} — ${escapeHtml(item.categoryLabel)} in ${escapeHtml(item.location)}"
              loading="lazy"
              width="800"
              height="550"
            >
          </div>
          <div class="project-card-meta">
            <span>${escapeHtml(item.category)} · ${escapeHtml(item.city)}</span>
            <span>${escapeHtml(item.year)}</span>
          </div>
          <h3 class="project-card-title">${escapeHtml(item.title)}</h3>
          <p class="project-card-tagline">${escapeHtml(item.tagline)}</p>
          <div class="project-card-action">
            <span>View Project</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
          </div>
        </a>
      </article>
    `).join('');

    // Ensure all newly mounted cards are visible and observed
    container.querySelectorAll('.reveal').forEach(card => {
      card.classList.add('is-visible');
      observeElement(card);
    });
  });
}

export function initProjectFilters() {
  const filterNav = document.querySelector('.filter-nav');
  if (!filterNav) return;

  const filterButtons = filterNav.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.filter || 'all';
      filterButtons.forEach(b => {
        b.classList.remove('is-active');
        b.removeAttribute('aria-current');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-current', 'true');

      renderProjects(category, '[data-project-list="portfolio"]');
    });
  });
}
