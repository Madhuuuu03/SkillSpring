/**
 * SkillSpring - AI Career Roadmap Advisor Page Controller
 * Includes live AI advisory, loading skeleton, empty state, and error states.
 * Connects to POST /api/ai/roadmap-advisor with verified offline fallback.
 */

(function () {
  'use strict';

  let currentState = 'live'; // 'live', 'loading', 'empty', 'error'
  let currentCareerId = 'python-dev';
  let cachedAdvisory = null;
  let advisoryProvider = null;
  let advisoryNotice = null;
  let careerTitle = null;
  let readinessPercentage = null;
  let currentRecommendedProjects = [];
  let currentWeeklyStudyPlan = [];
  let currentWeeklyHours = 12;
  let savedProjectsMap = {};

  document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const paramCareer = params.get('career');
    const profile = window.SkillSpringStore ? window.SkillSpringStore.getProfile() : {};

    currentCareerId = paramCareer || profile.careerId || 'python-dev';

    initCareerSelector();
    initStateSwitcher();
    loadLiveAdvisory(currentCareerId);
  });

  function initCareerSelector() {
    const select = document.getElementById('recommendations-career-select');
    if (!select || !window.SkillSpringStore) return;

    const careers = window.SkillSpringStore.getCareers();
    select.innerHTML = '';
    careers.forEach(c => {
      const option = document.createElement('option');
      option.value = c.id;
      option.textContent = `${c.title}`;
      if (c.id === currentCareerId) option.selected = true;
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      currentCareerId = e.target.value;
      loadLiveAdvisory(currentCareerId, true);
    });
  }

  function initStateSwitcher() {
    const btns = document.querySelectorAll('.state-toggle-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentState = btn.getAttribute('data-state');
        renderContent();
      });
    });

    const refreshBtn = document.getElementById('refresh-ai-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        loadLiveAdvisory(currentCareerId, true);
      });
    }
  }

  async function loadLiveAdvisory(targetCareerId, isUserRefresh = false) {
    currentState = 'loading';
    renderContent();
    updateStateSwitcherUI('loading');

    const cid = targetCareerId || currentCareerId;

    try {
      const res = await fetch('/api/ai/roadmap-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ career_id: cid })
      });

      if (!res.ok) {
        throw new Error(`Advisor API returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.advisory) {
        cachedAdvisory = data.advisory;
        advisoryProvider = data.provider;
        advisoryNotice = data.notice;
        careerTitle = data.career_title;
        readinessPercentage = data.readiness_percentage;
        currentWeeklyHours = (data.student && data.student.weekly_hours) ? data.student.weekly_hours : 12;
        currentState = 'live';
      } else {
        throw new Error(data.error || 'Failed to load advisor data');
      }
    } catch (err) {
      console.warn('Backend advisor unavailable, using deterministic store fallback:', err);
      if (window.SkillSpringStore) {
        const fallback = window.SkillSpringStore.getRecommendations();
        cachedAdvisory = {
          summary: fallback.summary,
          confidence_score: fallback.confidenceScore || '78% Readiness',
          key_strengths: fallback.topStrengths || [],
          priority_gaps: fallback.priorityGaps || [],
          recommended_projects: fallback.recommendedProjects || [],
          weekly_study_plan: fallback.weeklyStudyPlan || [],
          milestone_guidance: []
        };
        careerTitle = fallback.careerPath || 'Python Developer';
        currentWeeklyHours = 12;
        advisoryProvider = 'heuristic_fallback';
        currentState = 'live';
      } else {
        currentState = 'error';
      }
    }

    currentRecommendedProjects = cachedAdvisory ? (cachedAdvisory.recommended_projects || []) : [];
    currentWeeklyStudyPlan = cachedAdvisory ? (cachedAdvisory.weekly_study_plan || []) : [];

    await fetchSavedProjectsForCareer(cid);

    renderContent();
    updateStateSwitcherUI('live');
    initSyncStudyPlanButton();
    checkStudyPlanSyncStatus(cid);

    if (isUserRefresh && window.SkillSpringToast) {
      window.SkillSpringToast.show(`AI Roadmap insights refreshed for ${careerTitle || 'selected track'}!`, 'success');
    }
  }

  function updateStateSwitcherUI(state) {
    document.querySelectorAll('.state-toggle-btn').forEach(btn => {
      if (btn.getAttribute('data-state') === state) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function renderContent() {
    const liveContainer = document.getElementById('ai-state-live');
    const loadingContainer = document.getElementById('ai-state-loading');
    const emptyContainer = document.getElementById('ai-state-empty');
    const errorContainer = document.getElementById('ai-state-error');

    if (!liveContainer || !loadingContainer || !emptyContainer || !errorContainer) return;

    // Hide all
    liveContainer.style.display = 'none';
    loadingContainer.style.display = 'none';
    emptyContainer.style.display = 'none';
    errorContainer.style.display = 'none';

    if (currentState === 'loading') {
      loadingContainer.style.display = 'block';
    } else if (currentState === 'empty') {
      emptyContainer.style.display = 'block';
    } else if (currentState === 'error') {
      errorContainer.style.display = 'block';
    } else {
      liveContainer.style.display = 'block';
      renderLiveRecommendations();
    }
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str || '');
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderLiveRecommendations() {
    if (!cachedAdvisory && window.SkillSpringStore) {
      cachedAdvisory = window.SkillSpringStore.getRecommendations();
      careerTitle = cachedAdvisory.careerPath || 'Python Developer';
    }
    if (!cachedAdvisory) return;

    const recs = cachedAdvisory;

    // Model Provider Banner / Tag update
    const providerBadge = document.querySelector('.page-header .badge');
    if (providerBadge && advisoryProvider) {
      if (advisoryProvider.toLowerCase().includes('gemini')) {
        providerBadge.textContent = '✨ Gemini AI Roadmap Advisor';
        providerBadge.className = 'badge badge-emerald';
      } else {
        providerBadge.textContent = 'Deterministic Heuristic Engine • Verified V2';
        providerBadge.className = 'badge badge-indigo';
      }
    }

    // Transparency Notice update
    const noticeEl = document.querySelector('.alert.alert-ai div:last-child');
    if (noticeEl && advisoryProvider) {
      if (advisoryProvider.toLowerCase().includes('gemini')) {
        noticeEl.innerHTML = `<strong>AI Mode Active:</strong> Personalized insights and study roadmap are generated via Google Gemini using your verified profile and curriculum milestones.`;
      } else {
        noticeEl.innerHTML = `<strong>Heuristic Mode:</strong> Personalized insights are synthesized by SkillSpring's verified curriculum heuristics engine based on your profile and roadmap progress.`;
      }
    }

    // Summary block
    const summaryEl = document.getElementById('ai-summary-text');
    const targetCareerEl = document.getElementById('ai-target-career');
    const confidenceScoreEl = document.getElementById('ai-confidence-score');

    if (summaryEl) summaryEl.textContent = recs.summary || '';
    if (targetCareerEl) targetCareerEl.textContent = careerTitle || recs.careerPath || 'Engineering Career';
    if (confidenceScoreEl) {
      confidenceScoreEl.textContent = recs.confidence_score || `${readinessPercentage || 75}% Readiness`;
    }

    // Top Strengths
    const strengthsContainer = document.getElementById('ai-strengths-list');
    if (strengthsContainer) {
      strengthsContainer.innerHTML = '';
      const strengths = recs.key_strengths || recs.topStrengths || [];
      if (strengths.length === 0) {
        strengthsContainer.innerHTML = `<span class="text-xs text-muted">Complete initial roadmap tasks to log verified strengths.</span>`;
      } else {
        strengths.forEach(s => {
          const item = document.createElement('div');
          item.style.cssText = 'display:flex; align-items:flex-start; gap:0.6rem; font-size:0.875rem; margin-bottom:0.6rem;';
          item.innerHTML = `
            <span style="color:var(--success); font-weight:bold;">✓</span>
            <span>${escapeHtml(s)}</span>
          `;
          strengthsContainer.appendChild(item);
        });
      }
    }

    // Priority Gaps
    const gapsContainer = document.getElementById('ai-gaps-list');
    if (gapsContainer) {
      gapsContainer.innerHTML = '';
      const gaps = recs.priority_gaps || recs.priorityGaps || [];
      if (gaps.length === 0) {
        gapsContainer.innerHTML = `<span class="text-xs text-muted">All foundational prerequisites met! Ready for capstone work.</span>`;
      } else {
        gaps.forEach(g => {
          const card = document.createElement('div');
          card.style.cssText = 'padding: 0.85rem; border:1px solid var(--border-light); border-radius: var(--radius-md); margin-bottom: 0.6rem; background: #FFFFFF;';
          const urgency = g.urgency || 'High';
          card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
              <strong style="font-size:0.9rem; color:var(--text-main);">${escapeHtml(g.skill)}</strong>
              <span class="badge ${urgency === 'Critical' || urgency === 'High' ? 'badge-rose' : 'badge-amber'}">${escapeHtml(urgency)} Urgency</span>
            </div>
            <p style="font-size:0.8125rem; color:var(--text-muted);">${escapeHtml(g.why)}</p>
          `;
          gapsContainer.appendChild(card);
        });
      }
    }

    // Recommended Projects
    const projectsContainer = document.getElementById('ai-projects-list');
    if (projectsContainer) {
      projectsContainer.innerHTML = '';
      const projects = currentRecommendedProjects || [];
      projects.forEach((p, idx) => {
        const card = document.createElement('div');
        card.className = 'card card-hover';
        card.style.cssText = 'padding: 1.5rem; margin-bottom: 1.25rem; border-left: 4px solid var(--primary);';
        const skillsList = p.skills_targeted || p.skillsTargeted || [];
        const isSaved = Boolean(savedProjectsMap[p.title]);

        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 0.5rem;">
            <div>
              <span class="badge badge-indigo" style="margin-bottom:0.35rem;">AI Portfolio Match</span>
              <h3 style="font-size: 1.15rem; font-weight:700;">${escapeHtml(p.title)}</h3>
            </div>
            <div style="display:flex; gap:0.4rem; align-items:center;">
              <span class="badge badge-slate">${escapeHtml(p.difficulty || 'Intermediate')}</span>
              <span class="badge badge-emerald">${escapeHtml(p.duration || '2 Weeks')}</span>
            </div>
          </div>
          <p style="font-size: 0.9rem; color:var(--text-body); margin-bottom: 1rem; line-height: 1.5;">${escapeHtml(p.description)}</p>
          <div style="background:var(--bg-card-subtle); padding:0.75rem 1rem; border-radius:var(--radius-md); margin-bottom: 1rem; font-size:0.8125rem;">
            <strong style="color:var(--text-main);">Resume / Portfolio Impact:</strong>
            <span style="color:var(--text-muted);">${escapeHtml(p.portfolio_impact || p.portfolioImpact || 'Proves production engineering competence')}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
              ${skillsList.map(t => `<span class="badge badge-slate">${escapeHtml(t)}</span>`).join('')}
            </div>
            <div>
              <button type="button" class="btn ${isSaved ? 'btn-success' : 'btn-outline-primary'} btn-sm btn-add-project" 
                      data-project-idx="${idx}" ${isSaved ? 'disabled' : ''}>
                ${isSaved ? '✓ Added to Roadmap' : '+ Add to Learning Roadmap'}
              </button>
            </div>
          </div>
        `;
        projectsContainer.appendChild(card);
      });

      // Attach click handlers to project addition buttons
      const addBtns = projectsContainer.querySelectorAll('.btn-add-project');
      addBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
          const idx = parseInt(btn.getAttribute('data-project-idx'), 10);
          const proj = currentRecommendedProjects[idx];
          if (!proj) return;

          btn.disabled = true;
          const originalText = btn.textContent;
          btn.textContent = 'Adding to Roadmap...';

          try {
            const res = await fetch('/api/roadmap/projects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                career_id: currentCareerId,
                title: proj.title,
                description: proj.description || '',
                skills_targeted: proj.skills_targeted || proj.skillsTargeted || [],
                duration: proj.duration || '2 Weeks',
                difficulty: proj.difficulty || 'Intermediate',
                portfolio_impact: proj.portfolio_impact || proj.portfolioImpact || ''
              })
            });

            const data = await res.json();
            if (res.status === 201 && data.success) {
              btn.textContent = '✓ Added to Roadmap';
              btn.className = 'btn btn-success btn-sm btn-add-project';
              savedProjectsMap[proj.title] = true;
              if (window.SkillSpringToast) {
                window.SkillSpringToast.show('Project added to your learning roadmap! 🎉', 'success');
              }
            } else if (res.status === 409) {
              btn.textContent = '✓ In Roadmap';
              btn.className = 'btn btn-success btn-sm btn-add-project';
              savedProjectsMap[proj.title] = true;
              if (window.SkillSpringToast) {
                window.SkillSpringToast.show('This project has already been added to your roadmap.', 'info');
              }
            } else {
              btn.disabled = false;
              btn.textContent = originalText;
              if (window.SkillSpringToast) {
                window.SkillSpringToast.show(data.error || 'Failed to add project to roadmap.', 'error');
              }
            }
          } catch (err) {
            console.error('Error adding project:', err);
            btn.disabled = false;
            btn.textContent = originalText;
            if (window.SkillSpringToast) {
              window.SkillSpringToast.show('Connection error while saving project.', 'error');
            }
          }
        });
      });
    }

    // Weekly Study Plan
    const studyPlanContainer = document.getElementById('ai-study-plan-list');
    if (studyPlanContainer) {
      studyPlanContainer.innerHTML = '';
      const studyPlan = currentWeeklyStudyPlan || [];
      studyPlan.forEach(plan => {
        const item = document.createElement('div');
        item.style.cssText = 'padding: 0.85rem 1rem; border-bottom: 1px solid var(--border-light); display: flex; align-items: center; justify-content: space-between;';
        item.innerHTML = `
          <div>
            <strong style="font-size:0.875rem; color:var(--text-main);">${escapeHtml(plan.day)}</strong>
            <p style="font-size:0.8125rem; color:var(--text-muted); margin-top:0.15rem;">${escapeHtml(plan.focus)}</p>
          </div>
          <span class="badge badge-indigo">Scheduled</span>
        `;
        studyPlanContainer.appendChild(item);
      });
    }

    // Setup Sync button & View link
    initSyncStudyPlanButton();
  }

  async function fetchSavedProjectsForCareer(cid) {
    try {
      const res = await fetch(`/api/roadmap/projects?career_id=${encodeURIComponent(cid)}`);
      if (res.ok) {
        const data = await res.json();
        savedProjectsMap = {};
        if (data.projects) {
          data.projects.forEach(p => {
            savedProjectsMap[p.title] = true;
          });
        }
      }
    } catch (e) {
      console.warn('Failed to prefetch saved roadmap projects:', e);
    }
  }

  async function checkStudyPlanSyncStatus(cid) {
    const syncBtnText = document.getElementById('btn-sync-study-plan-text');
    if (!syncBtnText) return;
    try {
      const res = await fetch(`/api/roadmap/study-plan?career_id=${encodeURIComponent(cid)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.synced && data.study_plan) {
          syncBtnText.textContent = '✓ Synced with Roadmap';
        } else {
          syncBtnText.textContent = '🔄 Sync with Roadmap';
        }
      }
    } catch (e) {
      syncBtnText.textContent = '🔄 Sync with Roadmap';
    }
  }

  function initSyncStudyPlanButton() {
    const syncBtn = document.getElementById('btn-sync-study-plan');
    const syncBtnText = document.getElementById('btn-sync-study-plan-text');
    const viewLink = document.getElementById('link-view-roadmap');

    if (viewLink) {
      viewLink.href = `roadmap.html?career=${encodeURIComponent(currentCareerId)}`;
    }

    if (!syncBtn) return;

    syncBtn.onclick = async () => {
      if (!currentWeeklyStudyPlan || currentWeeklyStudyPlan.length === 0) {
        if (window.SkillSpringToast) {
          window.SkillSpringToast.show('No study plan loaded yet. Please wait for advisory.', 'warning');
        }
        return;
      }

      syncBtn.disabled = true;
      if (syncBtnText) syncBtnText.textContent = '⏳ Syncing...';

      try {
        const res = await fetch('/api/roadmap/study-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            career_id: currentCareerId,
            study_plan: currentWeeklyStudyPlan,
            weekly_hours: currentWeeklyHours
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          if (syncBtnText) syncBtnText.textContent = '✓ Synced with Roadmap';
          syncBtn.className = 'btn btn-success btn-sm';
          if (window.SkillSpringToast) {
            window.SkillSpringToast.show('Adaptive study plan synchronized with your roadmap! 🎉', 'success');
          }
          setTimeout(() => {
            syncBtn.disabled = false;
          }, 800);
        } else {
          syncBtn.disabled = false;
          if (syncBtnText) syncBtnText.textContent = '🔄 Sync with Roadmap';
          if (window.SkillSpringToast) {
            window.SkillSpringToast.show(data.error || 'Failed to sync study plan.', 'error');
          }
        }
      } catch (err) {
        console.error('Error syncing study plan:', err);
        syncBtn.disabled = false;
        if (syncBtnText) syncBtnText.textContent = '🔄 Sync with Roadmap';
        if (window.SkillSpringToast) {
          window.SkillSpringToast.show('Connection error while syncing study plan.', 'error');
        }
      }
    };
  }

})();
