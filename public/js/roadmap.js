/**
 * SkillSpring - Learning Roadmap Page Controller
 * Enriched with AI-Powered Career Roadmap Advisor milestone guidance.
 */

(function () {
  'use strict';

  let currentCareerId = 'python-dev';
  let activeFilter = 'all';
  let milestoneGuidanceMap = {};
  let advisorPacingText = null;

  document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const paramCareer = params.get('career');
    const profile = window.SkillSpringStore ? window.SkillSpringStore.getProfile() : {};

    currentCareerId = paramCareer || profile.careerId || 'python-dev';

    initCareerSelector();

    // Refresh the selector when the dynamic career catalogue changes
    if (window.SkillSpringStore &&
        typeof window.SkillSpringStore.subscribe === 'function') {
      window.SkillSpringStore.subscribe(() => {
        const select = document.getElementById('roadmap-career-select');
        if (!select) return;

        const careers = window.SkillSpringStore.getCareers();

        if (!careers.some(career => career.id === currentCareerId)) {
          const profile = window.SkillSpringStore.getProfile();
          currentCareerId = careers.some(career => career.id === profile.careerId)
            ? profile.careerId
            : (careers[0]?.id || '');
        }

        select.innerHTML = '';

        careers.forEach(career => {
          const option = document.createElement('option');
          option.value = career.id;
          option.textContent = `${career.title} Roadmap`;
          option.selected = career.id === currentCareerId;
          select.appendChild(option);
        });

        renderRoadmap();
      });
    }

    initFilterTabs();
    renderRoadmap();
    loadAdvisorGuidance();
    loadSyncedStudyPlan();
    loadSavedProjects();
  });

  async function generateCareerRoadmap(button, statusElement) {
    if (!button || button.disabled) return;

    const careerId = currentCareerId;
    button.disabled = true;
    button.textContent = 'Generating roadmap...';

    if (statusElement) {
      statusElement.textContent = 'Analyzing your skill gaps and preparing your learning plan...';
    }

    try {
      const response = await fetch('/api/ai/roadmap-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ career_id: careerId })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.notice || 'Unable to generate the roadmap.');
      }

      if (typeof window.SkillSpringStore.syncRoadmapProgress !== 'function') {
        throw new Error('Roadmap synchronization is unavailable. Please refresh the page.');
      }

      const syncSucceeded = await window.SkillSpringStore.syncRoadmapProgress(careerId);

      if (currentCareerId !== careerId) return;

      if (!syncSucceeded) {
        const message = data.already_exists
          ? 'Your existing roadmap is safe, but this page could not refresh it. Please refresh the page.'
          : 'Your roadmap was created successfully, but this page could not load it. Please refresh the page.';

        if (statusElement) {
          statusElement.textContent = message;
        }

        button.disabled = false;
        button.textContent = 'Try Again';

        if (window.SkillSpringToast) {
          window.SkillSpringToast.show(message, 'info');
        }

        return;
      }

      window.SkillSpringStore.notify();
      renderRoadmap();

      if (data.already_exists) {
        if (window.SkillSpringToast) {
          window.SkillSpringToast.show(
            data.notice || 'An existing roadmap was preserved.',
            'info'
          );
        }
      } else {
        if (window.SkillSpringToast) {
          window.SkillSpringToast.show(
            data.notice || 'Your AI career roadmap is ready!',
            'success'
          );
        }

        loadAdvisorGuidance();
      }
    } catch (error) {
      console.error('AI roadmap generation failed:', error);

      if (statusElement) {
        statusElement.textContent = error.message || 'Something went wrong. Please try again.';
      }

      if (window.SkillSpringToast) {
        window.SkillSpringToast.show(
          error.message || 'Roadmap generation failed.',
          'error'
        );
      }

      button.disabled = false;
      button.textContent = 'Try Again';
    }
  }

  async function loadAdvisorGuidance() {
    try {
      const res = await fetch('/api/ai/roadmap-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ career_id: currentCareerId })
      });

      if (!res.ok) return;

      const data = await res.json();
      if (data.success && data.advisory && data.advisory.milestone_guidance) {
        milestoneGuidanceMap = {};
        data.advisory.milestone_guidance.forEach(item => {
          milestoneGuidanceMap[item.week] = item;
        });

        const studentHours = data.student ? data.student.weekly_hours : 12;
        advisorPacingText = `✨ AI Advisor Active: Paced for your ${studentHours} hrs/week commitment.`;

        // Re-render roadmap with AI guidance annotations
        renderRoadmap();
      }
    } catch (e) {
      console.warn('AI Advisor guidance offline fallback:', e);
    }
  }

  function initCareerSelector() {
    const select = document.getElementById('roadmap-career-select');
    if (!select || !window.SkillSpringStore) return;

    const careers = window.SkillSpringStore.getCareers();
    const profile = window.SkillSpringStore.getProfile();

    if (!careers.some(career => career.id === currentCareerId)) {
      currentCareerId = careers.some(career => career.id === profile.careerId)
        ? profile.careerId
        : (careers[0]?.id || '');
    }

    select.innerHTML = '';
    careers.forEach(c => {
      const option = document.createElement('option');
      option.value = c.id;
      option.textContent = `${c.title} Roadmap`;
      option.selected = c.id === currentCareerId;
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      currentCareerId = e.target.value;
      milestoneGuidanceMap = {};
      renderRoadmap();
      loadAdvisorGuidance();
      loadSyncedStudyPlan();
      loadSavedProjects();
    });
  }

  function initFilterTabs() {
    const filterBtns = document.querySelectorAll('.roadmap-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.getAttribute('data-filter');
        renderRoadmap();
      });
    });
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str || '');
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderRoadmap() {
    if (!window.SkillSpringStore) return;

    const career = window.SkillSpringStore.getCareerById(currentCareerId);
    const weeks = window.SkillSpringStore.getRoadmap(currentCareerId);
    const roadmapSource = window.SkillSpringStore.getRoadmapSource(currentCareerId);
    const stats = window.SkillSpringStore.getRoadmapStats(currentCareerId);
    const profile = window.SkillSpringStore.getProfile();

    // Title & Stats
    const titleEl = document.getElementById('roadmap-career-title');
    const descEl = document.getElementById('roadmap-career-desc');
    const completionEl = document.getElementById('roadmap-completion-pct');
    const completionBar = document.getElementById('roadmap-completion-bar');
    const completedTasksEl = document.getElementById('roadmap-completed-count');

    if (titleEl) titleEl.textContent = `${career.title} Mastery Roadmap`;
    if (descEl) {
      descEl.textContent = advisorPacingText
        ? `A structured week-by-week curriculum tailored for ${profile.name || 'your profile'}. ${advisorPacingText}`
        : `A structured week-by-week curriculum tailored to transform your college foundations into industry-ready competence.`;
    }
    if (completionEl) completionEl.textContent = `${stats.percentage}%`;
    if (completionBar) completionBar.style.width = `${stats.percentage}%`;
    if (completedTasksEl) completedTasksEl.textContent = `${stats.completedTasks} of ${stats.totalTasks} milestones completed`;

    const container = document.getElementById('roadmap-weeks-container');
    if (!container) return;

    if (weeks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <span style="font-size: 1.8rem;">&#128218;</span>
          </div>
          <h3 class="empty-state-title">Roadmap Not Available Yet</h3>
          <p class="empty-state-desc">A learning roadmap for ${escapeHtml(career.title)} hasn't been added yet. Generate a personalized six-week roadmap based on your skill gaps and study hours.</p>
          <button type="button" id="generate-roadmap-btn" class="btn btn-primary" style="margin-top:1rem;">
            Generate AI Roadmap
          </button>
          <p id="roadmap-generator-status" class="text-sm text-muted" style="margin-top:0.75rem;" aria-live="polite"></p>
        </div>
      `;

      const generateButton = document.getElementById('generate-roadmap-btn');
      const statusElement = document.getElementById('roadmap-generator-status');

      if (generateButton) {
        generateButton.addEventListener('click', () => {
          generateCareerRoadmap(generateButton, statusElement);
        });
      }

      return;
    }
const filteredWeeks = weeks.filter(week => {
      if (activeFilter === 'completed') return week.status === 'completed';
      if (activeFilter === 'in-progress') return week.status === 'in-progress' || week.status === 'pending';
      return true;
    });

    if (filteredWeeks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          </div>
          <h3 class="empty-state-title">No weeks match this filter</h3>
          <p class="empty-state-desc">Try choosing "All Weeks" to see the full timeline.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';

    if (roadmapSource === 'shared_template') {
      const banner = document.createElement('div');
      banner.className = 'card';
      banner.style.cssText = 'padding:1.25rem 1.5rem; margin-bottom:1.5rem; border:1px solid var(--primary-200); background:var(--bg-card-subtle);';
      banner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
          <div>
            <strong style="color:var(--text-main);">Using a shared career roadmap</strong>
            <p class="text-sm text-muted" style="margin:0.35rem 0 0;">Create your own six-week learning plan based on your skills, gaps, and study hours. Your current roadmap and progress will remain unchanged.</p>
          </div>
          <div>
            <button type="button" id="generate-roadmap-btn" class="btn btn-primary">
              Create My Personalized Roadmap
            </button>
            <p id="roadmap-generator-status" class="text-sm text-muted" style="margin:0.5rem 0 0;" aria-live="polite"></p>
          </div>
        </div>
      `;

      container.appendChild(banner);

      const generateButton = banner.querySelector('#generate-roadmap-btn');
      const statusElement = banner.querySelector('#roadmap-generator-status');

      if (generateButton) {
        generateButton.addEventListener('click', () => {
          generateCareerRoadmap(generateButton, statusElement);
        });
      }
    }

    filteredWeeks.forEach(week => {
      const isCompleted = week.status === 'completed';
      const isInProgress = week.status === 'in-progress';
      const guide = milestoneGuidanceMap[week.week];

      // Badge color for AI Priority
      let aiBadgeClass = 'badge-indigo';
      if (guide && guide.priority_level) {
        const lvl = guide.priority_level.toLowerCase();
        if (lvl.includes('critical') || lvl.includes('gap')) aiBadgeClass = 'badge-rose';
        else if (lvl.includes('completed') || lvl.includes('mastered')) aiBadgeClass = 'badge-emerald';
        else if (lvl.includes('polish')) aiBadgeClass = 'badge-amber';
      }

      const weekEl = document.createElement('div');
      weekEl.className = `roadmap-week-block ${isInProgress ? 'is-current' : ''}`;

      weekEl.innerHTML = `
        <div class="roadmap-week-header">
          <div class="roadmap-week-title">
            <span class="badge ${isCompleted ? 'badge-emerald' : isInProgress ? 'badge-indigo' : 'badge-slate'}">
              ${isCompleted ? '✓ Completed' : isInProgress ? '● In Progress' : '○ Upcoming'}
            </span>
            <span>Week ${week.week}: ${escapeHtml(week.title)}</span>
          </div>
          <div style="display:flex; align-items:center; gap:1rem;">
            <span class="text-sm text-muted">Est. ${escapeHtml(week.hours)}</span>
          </div>
        </div>

        ${guide ? `
          <div style="background:var(--primary-50); border-bottom:1px solid var(--primary-100); padding:0.5rem 1.5rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem; font-size:0.8125rem;">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <span class="badge ${aiBadgeClass}">✨ AI: ${escapeHtml(guide.priority_level)}</span>
              <span style="color:var(--text-main); font-weight:500;">${escapeHtml(guide.custom_advice)}</span>
            </div>
            <span class="text-xs text-muted" style="white-space:nowrap;">⏱️ ${escapeHtml(guide.estimated_pacing || 'Standard pace')}</span>
          </div>
        ` : ''}

        <div style="padding: 1.25rem 1.5rem; background: #FFFFFF; border-bottom: 1px solid var(--border-light);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; margin-bottom: 1rem;">
            <div>
              <div style="font-size:0.8125rem; font-weight:600; color:var(--text-muted); text-transform:uppercase; margin-bottom:0.35rem;">
                Core Topics & Frameworks
              </div>
              <div style="display:flex; flex-wrap:wrap; gap:0.4rem;">
                ${week.topics.map(t => `<span class="badge badge-slate">${escapeHtml(t)}</span>`).join('')}
              </div>
            </div>
            <div>
              <div style="font-size:0.8125rem; font-weight:600; color:var(--text-muted); text-transform:uppercase; margin-bottom:0.35rem;">
                Hands-on Project Deliverable
              </div>
              <div style="font-size:0.875rem; font-weight:600; color:var(--primary); background:var(--primary-50); padding:0.3rem 0.75rem; border-radius:var(--radius-sm); border:1px solid var(--primary-200);">
                🛠️ ${escapeHtml(week.project)}
              </div>
            </div>
          </div>

          <div style="font-size:0.8125rem; font-weight:600; color:var(--text-main); margin-bottom:0.5rem;">
            Actionable Tasks & Checkpoints:
          </div>

          <div class="roadmap-tasks-list" style="padding:0; gap:0.6rem;">
            ${week.tasks.map(task => `
              <label class="roadmap-task-item ${task.completed ? 'completed' : ''}" style="cursor:pointer;">
                <input type="checkbox" class="task-checkbox" data-task-id="${escapeHtml(task.id)}" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                  <div class="task-name">${escapeHtml(task.text)}</div>
                  <div class="task-meta">
                    <span>Task ID: #${escapeHtml(task.id)}</span>
                    <span>•</span>
                    <span>Status: ${task.completed ? 'Done' : 'Pending Verification'}</span>
                  </div>
                </div>
              </label>
            `).join('')}
          </div>
        </div>
      `;

      // Checkbox event listeners
      const checkboxes = weekEl.querySelectorAll('.task-checkbox');
      checkboxes.forEach(cb => {
        cb.addEventListener('change', (e) => {
          const taskId = e.target.getAttribute('data-task-id');

          try {
            const result = window.SkillSpringStore.toggleRoadmapTask(
              currentCareerId,
              taskId
            );

            if (result && result.success) {
              if (window.SkillSpringToast) {
                window.SkillSpringToast.show(
                  e.target.checked
                    ? 'Milestone marked as complete!'
                    : 'Milestone reopened.',
                  'success'
                );
              }
            } else {
              if (window.SkillSpringToast) {
                window.SkillSpringToast.show(
                  'Unable to update this milestone. Please refresh and try again.',
                  'warning'
                );
              }
            }
          } catch (error) {
            console.error('Roadmap task update failed:', error);
            if (window.SkillSpringToast) {
              window.SkillSpringToast.show(
                'Something went wrong while updating this milestone.',
                'error'
              );
            }
          }

          renderRoadmap();
        });
      });

      container.appendChild(weekEl);
    });
  }

  async function loadSyncedStudyPlan() {
    const container = document.getElementById('roadmap-synced-study-plan-container');
    if (!container) return;

    try {
      const res = await fetch(`/api/roadmap/study-plan?career_id=${encodeURIComponent(currentCareerId)}`);
      if (!res.ok) {
        container.innerHTML = '';
        return;
      }

      const data = await res.json();
      if (data.success && data.synced && data.study_plan) {
        const plan = data.study_plan;
        const schedule = plan.study_plan || [];
        const hours = plan.weekly_hours || 12;
        const syncDate = plan.synced_at ? new Date(plan.synced_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Active';

        container.innerHTML = `
          <div class="card" style="border-left: 4px solid var(--emerald); padding: 1.5rem; background: #FFFFFF;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 1.25rem; flex-wrap:wrap; gap:0.75rem;">
              <div>
                <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.35rem;">
                  <span class="badge badge-emerald">● Active AI Study Schedule</span>
                  <span class="badge badge-indigo">${escapeHtml(hours)} hrs/week</span>
                </div>
                <h3 style="font-size: 1.2rem; font-weight:700; color:var(--text-main); margin:0;">
                  📅 Synced Adaptive Weekly Study Plan
                </h3>
                <p style="font-size:0.8125rem; color:var(--text-muted); margin-top:0.25rem;">
                  Synchronized with your AI Career Advisor on ${escapeHtml(syncDate)} • Paced for consistent weekly execution
                </p>
              </div>
              <div style="display:flex; gap:0.5rem; align-items:center;">
                <a href="recommendations.html?career=${encodeURIComponent(currentCareerId)}" class="btn btn-outline-primary btn-sm">
                  🔄 Update in Advisor
                </a>
              </div>
            </div>

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0.85rem;">
              ${schedule.map(item => `
                <div style="background:var(--bg-card-subtle); border:1px solid var(--border-light); border-radius:var(--radius-md); padding:1rem;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                    <strong style="font-size:0.875rem; color:var(--text-main);">${escapeHtml(item.day)}</strong>
                    <span class="badge badge-indigo" style="font-size:0.7rem;">Scheduled</span>
                  </div>
                  <p style="font-size:0.8125rem; color:var(--text-body); margin:0; line-height:1.45;">
                    ${escapeHtml(item.focus)}
                  </p>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="card" style="padding: 1.25rem 1.5rem; background: var(--bg-card-subtle); border: 1px dashed var(--primary-200); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
            <div style="display:flex; align-items:center; gap:0.85rem;">
              <div style="font-size:1.6rem; line-height:1;">📅</div>
              <div>
                <strong style="font-size:0.95rem; color:var(--text-main);">Sync Your AI Adaptive Weekly Study Plan</strong>
                <p style="font-size:0.8125rem; color:var(--text-muted); margin-top:0.15rem; margin-bottom:0;">
                  Generate a customized weekday & weekend study schedule matching your weekly availability.
                </p>
              </div>
            </div>
            <a href="recommendations.html?career=${encodeURIComponent(currentCareerId)}" class="btn btn-outline-primary btn-sm">
              ✨ Sync Study Plan →
            </a>
          </div>
        `;
      }
    } catch (err) {
      console.warn('Could not load synced study plan:', err);
      container.innerHTML = '';
    }
  }

  async function loadSavedProjects() {
    const listContainer = document.getElementById('roadmap-saved-projects-list');
    const browseBtn = document.getElementById('browse-ai-projects-btn');

    if (browseBtn) {
      browseBtn.href = `recommendations.html?career=${encodeURIComponent(currentCareerId)}`;
    }

    if (!listContainer) return;

    try {
      const res = await fetch(`/api/roadmap/projects?career_id=${encodeURIComponent(currentCareerId)}`);
      if (!res.ok) {
        listContainer.innerHTML = `<div class="text-sm text-muted">Unable to load recommended projects at this time.</div>`;
        return;
      }

      const data = await res.json();
      const projects = (data.success && data.projects) ? data.projects : [];

      if (projects.length === 0) {
        listContainer.innerHTML = `
          <div class="empty-state card" style="padding: 2.5rem; text-align:center; background:#FFFFFF;">
            <div class="empty-state-icon" style="margin: 0 auto 0.75rem;">
              <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            </div>
            <h3 class="empty-state-title" style="font-size:1.05rem; font-weight:600;">No recommended projects added yet</h3>
            <p class="empty-state-desc" style="font-size:0.85rem; color:var(--text-muted); max-width:480px; margin:0.35rem auto 1.25rem; line-height:1.5;">
              Explore AI Recommendations to discover industry-aligned capstone deliverables tailored to bridge your specific skill gaps and enhance your tech resume.
            </p>
            <a href="recommendations.html?career=${encodeURIComponent(currentCareerId)}" class="btn btn-outline-primary btn-sm">
              Explore Recommended Capstones →
            </a>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = '';
      projects.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card card-hover';
        card.style.cssText = 'padding: 1.5rem; margin-bottom: 1.25rem; border-left: 4px solid var(--primary); background: #FFFFFF;';
        const skillsList = p.skills_targeted || [];

        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 0.6rem; flex-wrap:wrap; gap:0.5rem;">
            <div>
              <div style="display:flex; align-items:center; gap:0.4rem; margin-bottom:0.35rem;">
                <span class="badge badge-indigo">Portfolio Capstone</span>
                <span class="badge badge-slate">${escapeHtml(p.difficulty || 'Intermediate')}</span>
              </div>
              <h3 style="font-size: 1.2rem; font-weight:700; color:var(--text-main); margin:0;">${escapeHtml(p.title)}</h3>
            </div>
            <div style="display:flex; align-items:center; gap:0.75rem;">
              <span class="badge badge-emerald">⏱️ ${escapeHtml(p.duration || '2 Weeks')}</span>
              <button type="button" class="btn btn-ghost btn-sm btn-remove-project" data-project-id="${p.id}" title="Remove from Roadmap" style="color:var(--rose); padding:0.25rem 0.5rem; font-size:0.8125rem;">
                🗑️ Remove
              </button>
            </div>
          </div>
          <p style="font-size: 0.9rem; color:var(--text-body); margin-bottom: 1rem; line-height: 1.5;">
            ${escapeHtml(p.description)}
          </p>
          ${p.portfolio_impact ? `
            <div style="background:var(--bg-card-subtle); padding:0.75rem 1rem; border-radius:var(--radius-md); margin-bottom: 1rem; font-size:0.8125rem;">
              <strong style="color:var(--text-main);">Resume / Portfolio Impact:</strong>
              <span style="color:var(--text-muted);">${escapeHtml(p.portfolio_impact)}</span>
            </div>
          ` : ''}
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center;">
              <span class="text-xs text-muted" style="font-weight:600;">Targeted Technologies:</span>
              ${skillsList.map(t => `<span class="badge badge-slate">${escapeHtml(t)}</span>`).join('')}
            </div>
            <span class="text-xs text-muted">Added from AI Career Advisor</span>
          </div>
        `;

        const removeBtn = card.querySelector('.btn-remove-project');
        if (removeBtn) {
          removeBtn.addEventListener('click', async () => {
            const projId = removeBtn.getAttribute('data-project-id');
            removeBtn.disabled = true;
            try {
              const delRes = await fetch(`/api/roadmap/projects/${projId}`, { method: 'DELETE' });
              const delData = await delRes.json();
              if (delRes.ok && delData.success) {
                if (window.SkillSpringToast) {
                  window.SkillSpringToast.show('Project removed from your learning roadmap.', 'info');
                }
                loadSavedProjects();
              } else {
                removeBtn.disabled = false;
                if (window.SkillSpringToast) {
                  window.SkillSpringToast.show(delData.error || 'Failed to remove project.', 'error');
                }
              }
            } catch (err) {
              console.error('Error removing project:', err);
              removeBtn.disabled = false;
              if (window.SkillSpringToast) {
                window.SkillSpringToast.show('Connection error while removing project.', 'error');
              }
            }
          });
        }

        listContainer.appendChild(card);
      });
    } catch (err) {
      console.warn('Could not load saved projects:', err);
      listContainer.innerHTML = `<div class="text-sm text-muted">Unable to load recommended projects at this time.</div>`;
    }
  }

})();
