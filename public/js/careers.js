/**
 * SkillSpring - Career Explorer Page Controller
 */

(function () {
  'use strict';

  let currentCategory = 'all';
  let searchQuery = '';

  document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    initSearch();
    renderCareers();
  });

  function initFilters() {
    const filterPills = document.querySelectorAll('.category-filter-btn');
    filterPills.forEach(btn => {
      btn.addEventListener('click', () => {
        filterPills.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.getAttribute('data-category');
        renderCareers();
      });
    });
  }

  function initSearch() {
    const searchInput = document.getElementById('career-search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderCareers();
    });
  }

  function renderCareers() {
    if (!window.SkillSpringStore) return;

    const container = document.getElementById('careers-grid');
    if (!container) return;

    const allCareers = window.SkillSpringStore.getCareers();
    const currentTargetId = window.SkillSpringStore.getProfile().careerId;

    const filtered = allCareers.filter(career => {
      const matchesCategory = (currentCategory === 'all' || career.category.toLowerCase().includes(currentCategory.toLowerCase()));
      const matchesSearch = !searchQuery ||
        career.title.toLowerCase().includes(searchQuery) ||
        career.description.toLowerCase().includes(searchQuery) ||
        career.requiredSkills.some(s => s.name.toLowerCase().includes(searchQuery));

      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </div>
          <h3 class="empty-state-title">No careers match your query</h3>
          <p class="empty-state-desc">Try clearing the search query or selecting "All Categories" to view available tracks.</p>
          <button class="btn btn-outline-primary btn-sm" onclick="document.getElementById('career-search-input').value=''; document.querySelector('[data-category=\\'all\\']').click();">Reset Filters</button>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    filtered.forEach(career => {
      const gap = window.SkillSpringStore.calculateSkillGap(career.id);
      const isTarget = career.id === currentTargetId;

      const card = document.createElement('div');
      card.className = `card card-hover ${isTarget ? 'is-target' : ''}`;
      card.style.cssText = `position: relative; display: flex; flex-direction: column; justify-content: space-between; border-top: 4px solid ${isTarget ? 'var(--primary)' : 'transparent'};`;

      card.innerHTML = `
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 0.75rem;">
            <div>
              <span class="badge ${isTarget ? 'badge-indigo' : 'badge-slate'}" style="margin-bottom:0.35rem;">
                ${isTarget ? '★ Current Target' : career.category}
              </span>
              <h3 style="font-size: 1.25rem; font-weight:700; color:var(--text-main);">${career.title}</h3>
            </div>
            <div style="text-align:right;">
              <div style="font-size: 1.25rem; font-weight:700; color:var(--primary);">${gap.matchPercentage}%</div>
              <div style="font-size: 0.7rem; color:var(--text-muted); text-transform:uppercase;">Skill Match</div>
            </div>
          </div>

          <p style="font-size: 0.875rem; color:var(--text-body); margin-bottom: 1.25rem; line-height: 1.5;">
            ${career.description}
          </p>

          <div style="background-color: var(--bg-card-subtle); padding: 0.75rem 1rem; border-radius: var(--radius-md); margin-bottom: 1.25rem;">
            <div style="display:flex; justify-content:space-between; font-size:0.8125rem; margin-bottom: 0.25rem;">
              <span style="color:var(--text-muted);">Avg. Entry Salary:</span>
              <strong style="color:var(--text-main);">${career.avgSalary}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.8125rem;">
              <span style="color:var(--text-muted);">Market Demand:</span>
              <span class="badge badge-emerald" style="padding:0.15rem 0.5rem; font-size:0.75rem;">${career.growthRate}</span>
            </div>
          </div>

          <div style="margin-bottom: 1.5rem;">
            <div style="font-size: 0.8125rem; font-weight:600; color:var(--text-main); margin-bottom: 0.5rem;">
              Core Required Skills:
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:0.4rem;">
              ${career.requiredSkills.slice(0, 6).map(s => {
                const hasSkill = window.SkillSpringStore.getProfile().skills?.some(userS => userS.toLowerCase().includes(s.name.toLowerCase()));
                return `<span class="badge ${hasSkill ? 'badge-emerald' : 'badge-slate'}">${hasSkill ? '✓ ' : ''}${s.name}</span>`;
              }).join('')}
              ${career.requiredSkills.length > 6 ? `<span class="badge badge-slate">+${career.requiredSkills.length - 6} more</span>` : ''}
            </div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:0.6rem; padding-top: 1rem; border-top: 1px solid var(--border-light);">
          <div style="display:flex; gap:0.5rem;">
            <a href="roadmap.html?career=${career.id}" class="btn btn-outline-primary btn-sm" style="flex:1;">
              View Roadmap
            </a>
            <a href="skill-gap.html?career=${career.id}" class="btn btn-outline btn-sm" style="flex:1;">
              Analyze Gap
            </a>
          </div>
          ${!isTarget ? `
            <button class="btn btn-primary btn-sm select-target-btn" data-career="${career.id}">
              Set as Target Career Goal
            </button>
          ` : `
            <button class="btn btn-secondary btn-sm" disabled style="opacity:0.9;">
              ✓ Selected Target Path
            </button>
          `}
        </div>
      `;

      const selectBtn = card.querySelector('.select-target-btn');
      if (selectBtn) {
        selectBtn.addEventListener('click', () => {
          window.SkillSpringStore.setTargetCareer(career.id);
          if (window.SkillSpringToast) {
            window.SkillSpringToast.show(`Target career updated to "${career.title}"!`, 'success');
          }
          renderCareers();
        });
      }

      container.appendChild(card);
    });
  }

})();
