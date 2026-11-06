/**
 * SkillSpring - Progress Tracker Page Controller
 */

(function () {
  'use strict';

  let viewMode = 'active'; // 'active' or 'empty'

  document.addEventListener('DOMContentLoaded', () => {
    initViewModeToggle();
    renderProgress();
  });

  function initViewModeToggle() {
    const toggleBtns = document.querySelectorAll('.progress-mode-btn');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        viewMode = btn.getAttribute('data-mode');
        renderProgress();
      });
    });
  }

  function renderProgress() {
    const activeView = document.getElementById('progress-active-view');
    const emptyView = document.getElementById('progress-empty-view');

    if (!activeView || !emptyView) return;

    if (viewMode === 'empty') {
      activeView.style.display = 'none';
      emptyView.style.display = 'block';
      return;
    }

    activeView.style.display = 'block';
    emptyView.style.display = 'none';

    if (!window.SkillSpringStore) return;

    const profile = window.SkillSpringStore.getProfile();
    const currentCareer = window.SkillSpringStore.getCurrentCareer();
    const stats = window.SkillSpringStore.getRoadmapStats(currentCareer.id);
    const roadmap = window.SkillSpringStore.getRoadmap(currentCareer.id);
    const activity = window.SkillSpringStore.getActivity();

    // Top metrics
    const overallPctEl = document.getElementById('progress-overall-pct');
    const overallBar = document.getElementById('progress-overall-bar');
    const completedTasksEl = document.getElementById('progress-completed-tasks');
    const totalHoursEl = document.getElementById('progress-total-hours');
    const streakDaysEl = document.getElementById('progress-streak-days');

    if (overallPctEl) overallPctEl.textContent = `${stats.percentage}%`;
    if (overallBar) overallBar.style.width = `${stats.percentage}%`;
    if (completedTasksEl) completedTasksEl.textContent = `${stats.completedTasks} / ${stats.totalTasks}`;
    if (totalHoursEl) totalHoursEl.textContent = `${profile.totalStudyHoursLogged || 42} hrs`;
    if (streakDaysEl) streakDaysEl.textContent = `${profile.currentStreakDays || 6} days`;

    // Render Weekly Activity Bar Chart (CSS-based bar visualization)
    const chartContainer = document.getElementById('progress-activity-chart');
    if (chartContainer) {
      chartContainer.innerHTML = '';
      const maxHours = 4; // reference max scale

      activity.forEach(act => {
        const heightPct = Math.min(100, Math.round((act.hours / maxHours) * 100));
        const col = document.createElement('div');
        col.style.cssText = 'flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; height: 160px; justify-content: flex-end;';

        col.innerHTML = `
          <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">${act.hours}h</span>
          <div style="width: 100%; max-width: 42px; height: 120px; background: var(--bg-card-subtle); border-radius: var(--radius-sm); position: relative; overflow: hidden; display: flex; align-items: flex-end;">
            <div style="width: 100%; height: ${heightPct}%; background: ${act.hours > 0 ? 'var(--primary)' : 'transparent'}; border-radius: var(--radius-sm); transition: height 0.6s ease;"></div>
          </div>
          <span style="font-size: 0.8125rem; font-weight: 600; color: var(--text-main);">${act.day}</span>
        `;
        chartContainer.appendChild(col);
      });
    }

    // Render Completed Topics List
    const completedList = document.getElementById('progress-completed-list');
    if (completedList) {
      completedList.innerHTML = '';
      const completedWeeks = roadmap.filter(w => w.status === 'completed');

      if (completedWeeks.length === 0) {
        completedList.innerHTML = `<p class="text-muted text-sm">No topics fully completed yet. Check off tasks in your Roadmap!</p>`;
      } else {
        completedWeeks.forEach(w => {
          const item = document.createElement('div');
          item.className = 'card';
          item.style.cssText = 'padding: 1rem 1.25rem; margin-bottom: 0.75rem; border-left: 3px solid var(--success);';
          item.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
              <strong style="font-size:0.9375rem; color:var(--text-main);">Week ${w.week}: ${w.title}</strong>
              <span class="badge badge-emerald">100% Complete</span>
            </div>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-top:0.4rem;">
              ${w.topics.map(t => `<span class="badge badge-slate" style="font-size:0.75rem;">${t}</span>`).join('')}
            </div>
          `;
          completedList.appendChild(item);
        });
      }
    }

    // Render Pending Goals List
    const pendingList = document.getElementById('progress-pending-list');
    if (pendingList) {
      pendingList.innerHTML = '';
      const pendingWeeks = roadmap.filter(w => w.status !== 'completed');

      pendingWeeks.forEach(w => {
        const completedCount = w.tasks.filter(t => t.completed).length;
        const totalCount = w.tasks.length;
        const pct = Math.round((completedCount / totalCount) * 100);

        const item = document.createElement('div');
        item.className = 'card';
        item.style.cssText = 'padding: 1rem 1.25rem; margin-bottom: 0.75rem; border-left: 3px solid var(--warning);';
        item.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
            <strong style="font-size:0.9375rem; color:var(--text-main);">Week ${w.week}: ${w.title}</strong>
            <span class="badge badge-amber">${pct}% (${completedCount}/${totalCount})</span>
          </div>
          <div class="progress-track" style="height:6px; margin: 0.5rem 0;">
            <div class="progress-fill warning" style="width: ${pct}%;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.75rem; color:var(--text-muted);">Deliverable: ${w.project}</span>
            <a href="roadmap.html" class="btn btn-outline-primary btn-sm" style="padding:0.2rem 0.5rem; font-size:0.75rem;">Resume →</a>
          </div>
        `;
        pendingList.appendChild(item);
      });
    }
  }

})();
