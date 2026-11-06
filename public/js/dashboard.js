/**
 * SkillSpring - Dashboard Page Controller
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    renderDashboard();

    // Subscribe to state updates
    if (window.SkillSpringStore) {
      window.SkillSpringStore.subscribe(() => {
        renderDashboard();
      });
    }
  });

  function renderDashboard() {
    if (!window.SkillSpringStore) return;

    const profile = window.SkillSpringStore.getProfile();
    const currentCareer = window.SkillSpringStore.getCurrentCareer();
    const gap = window.SkillSpringStore.calculateSkillGap(currentCareer.id);
    const roadmapStats = window.SkillSpringStore.getRoadmapStats(currentCareer.id);

    // Welcome Headline
    const greetingEl = document.getElementById('dash-greeting-name');
    if (greetingEl) {
      greetingEl.textContent = profile.name ? profile.name.split(' ')[0] : 'Student';
    }

    // Stats Cards
    const matchScoreEl = document.getElementById('dash-match-score');
    if (matchScoreEl) matchScoreEl.textContent = `${gap.matchPercentage}%`;

    const matchScoreBar = document.getElementById('dash-match-score-bar');
    if (matchScoreBar) matchScoreBar.style.width = `${gap.matchPercentage}%`;

    const completedTasksEl = document.getElementById('dash-completed-tasks');
    if (completedTasksEl) {
      completedTasksEl.textContent = `${roadmapStats.completedTasks} / ${roadmapStats.totalTasks}`;
    }

    const streakEl = document.getElementById('dash-streak-count');
    if (streakEl) streakEl.textContent = `${profile.currentStreakDays || 6} Days`;

    const studyHoursEl = document.getElementById('dash-study-hours');
    if (studyHoursEl) studyHoursEl.textContent = `${profile.weeklyHours || 12} hrs/wk`;

    // Career Goal Card
    const targetTitleEl = document.getElementById('dash-target-title');
    const targetDescEl = document.getElementById('dash-target-desc');
    const targetSalaryEl = document.getElementById('dash-target-salary');
    const targetBadgeEl = document.getElementById('dash-target-badge');

    if (targetTitleEl) targetTitleEl.textContent = currentCareer.title;
    if (targetDescEl) targetDescEl.textContent = currentCareer.description;
    if (targetSalaryEl) targetSalaryEl.textContent = currentCareer.avgSalary;
    if (targetBadgeEl) targetBadgeEl.textContent = currentCareer.level;

    // Current Acquired Skills Chips
    const acquiredContainer = document.getElementById('dash-acquired-skills');
    if (acquiredContainer) {
      acquiredContainer.innerHTML = '';
      if (gap.acquired.length === 0 && gap.improvable.length === 0) {
        acquiredContainer.innerHTML = `<span class="text-muted text-sm">No matched skills yet. Complete your profile to see matches.</span>`;
      } else {
        [...gap.acquired, ...gap.improvable].forEach(s => {
          const chip = document.createElement('span');
          chip.className = 'badge badge-emerald';
          chip.style.cssText = 'padding: 0.35rem 0.75rem; font-size: 0.8125rem;';
          chip.innerHTML = `✓ ${s.name} (${s.userProficiency}%)`;
          acquiredContainer.appendChild(chip);
        });
      }
    }

    // Missing / Target Skills Chips
    const missingContainer = document.getElementById('dash-missing-skills');
    if (missingContainer) {
      missingContainer.innerHTML = '';
      if (gap.missing.length === 0) {
        missingContainer.innerHTML = `<span class="badge badge-emerald">All core skills acquired! Great job!</span>`;
      } else {
        gap.missing.forEach(s => {
          const chip = document.createElement('span');
          chip.className = s.importance === 'Critical' ? 'badge badge-rose' : 'badge badge-amber';
          chip.style.cssText = 'padding: 0.35rem 0.75rem; font-size: 0.8125rem;';
          chip.innerHTML = `+ ${s.name} <span style="opacity:0.75; font-size:0.7rem;">(${s.importance})</span>`;
          missingContainer.appendChild(chip);
        });
      }
    }

    // Recommended Projects Preview
    const projectsContainer = document.getElementById('dash-recommended-projects');
    if (projectsContainer) {
      const recs = window.SkillSpringStore.getRecommendations();
      projectsContainer.innerHTML = '';
      recs.recommendedProjects.slice(0, 2).forEach(p => {
        const item = document.createElement('div');
        item.className = 'card card-hover';
        item.style.cssText = 'padding: 1.25rem; margin-bottom: 1rem; border-left: 4px solid var(--primary);';
        item.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 0.5rem;">
            <h4 style="font-size: 1.05rem; font-weight:600;">${p.title}</h4>
            <span class="badge badge-indigo">${p.difficulty}</span>
          </div>
          <p style="font-size: 0.875rem; color:var(--text-muted); margin-bottom: 0.75rem;">${p.description}</p>
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
              ${p.skillsTargeted.map(t => `<span class="badge badge-slate">${t}</span>`).join('')}
            </div>
            <a href="roadmap.html" class="btn btn-outline-primary btn-sm">Explore in Roadmap →</a>
          </div>
        `;
        projectsContainer.appendChild(item);
      });
    }

    // Current Week Roadmap Focus
    const roadmapFocusContainer = document.getElementById('dash-current-week-focus');
    if (roadmapFocusContainer) {
      const roadmap = window.SkillSpringStore.getRoadmap(currentCareer.id);
      const activeWeek = roadmap.find(w => w.status === 'in-progress') || roadmap[0];
      if (activeWeek) {
        roadmapFocusContainer.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <div>
              <span class="badge badge-indigo" style="margin-bottom:0.25rem;">Week ${activeWeek.week} Objective</span>
              <h4 style="font-size: 1.1rem; margin-top:0.25rem;">${activeWeek.title}</h4>
            </div>
            <span class="text-sm text-muted">Est. ${activeWeek.hours}</span>
          </div>
          <p class="text-sm text-muted" style="margin-bottom: 1rem;">Project milestone: <strong>${activeWeek.project}</strong></p>
          <div style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom: 1.25rem;">
            ${activeWeek.tasks.map(t => `
              <div style="display:flex; align-items:center; gap:0.6rem; font-size:0.875rem;">
                <span style="color: ${t.completed ? 'var(--success)' : 'var(--text-light)'}">${t.completed ? '✓' : '○'}</span>
                <span style="${t.completed ? 'text-decoration:line-through; color:var(--text-muted);' : ''}">${t.text}</span>
              </div>
            `).join('')}
          </div>
          <a href="roadmap.html" class="btn btn-primary btn-sm" style="width:100%;">Continue Roadmap →</a>
        `;
      }
    }
  }

})();
