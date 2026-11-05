/**
 * SkillSpring - Skill Gap Analysis Page Controller
 * Connected to Flask Backend and Google Gemini AI Advisory API
 */

(function () {
  'use strict';

  let selectedCareerId = 'python-dev';
  let isFetchingAI = false;

  document.addEventListener('DOMContentLoaded', () => {
    // Check URL param if navigated from Career Explorer
    const params = new URLSearchParams(window.location.search);
    const paramCareer = params.get('career');
    const profile = window.SkillSpringStore.getProfile();
    
    selectedCareerId = paramCareer || profile.careerId || 'python-dev';

    initCareerSelector();
    initRefreshButton();
    renderGapAnalysis();
  });

  function initCareerSelector() {
    const select = document.getElementById('gap-career-select');
    if (!select || !window.SkillSpringStore) return;

    const careers = window.SkillSpringStore.getCareers();
    select.innerHTML = '';
    careers.forEach(c => {
      const option = document.createElement('option');
      option.value = c.id;
      option.textContent = `${c.title} (${c.category})`;
      if (c.id === selectedCareerId) option.selected = true;
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      selectedCareerId = e.target.value;
      renderGapAnalysis();
    });
  }

  function initRefreshButton() {
    const refreshBtn = document.getElementById('gap-refresh-ai-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        if (!isFetchingAI) {
          fetchAISkillGap(selectedCareerId, true);
        }
      });
    }
  }

  function renderGapAnalysis() {
    if (!window.SkillSpringStore) return;

    // 1. Initial optimistic render from local store for instant UI response
    const gap = window.SkillSpringStore.calculateSkillGap(selectedCareerId);
    renderLocalGapData(gap);

    // 2. Fetch live analysis and Gemini AI recommendations from backend
    fetchAISkillGap(selectedCareerId, false);
  }

  function renderLocalGapData(gap) {
    const scoreVal = document.getElementById('gap-match-score-val');
    const scoreDesc = document.getElementById('gap-match-desc');
    const scoreFill = document.getElementById('gap-match-progress-fill');
    const careerTitleEl = document.getElementById('gap-active-career-title');

    if (careerTitleEl) careerTitleEl.textContent = gap.career.title;
    if (scoreVal) scoreVal.textContent = `${gap.matchPercentage}%`;
    if (scoreFill) scoreFill.style.width = `${gap.matchPercentage}%`;
    if (scoreDesc) {
      if (gap.matchPercentage >= 75) {
        scoreDesc.textContent = `Strong match! You meet the majority of prerequisite skills for entry-level ${gap.career.title} roles.`;
      } else if (gap.matchPercentage >= 50) {
        scoreDesc.textContent = `Moderate match. You possess foundational skills but need hands-on project work in 2-3 key technologies.`;
      } else {
        scoreDesc.textContent = `Developing match. Focus on foundational tracks before pursuing advanced frameworks.`;
      }
    }

    const acquiredCountEl = document.getElementById('gap-acquired-count');
    const missingCountEl = document.getElementById('gap-missing-count');
    const improvableCountEl = document.getElementById('gap-improvable-count');

    if (acquiredCountEl) acquiredCountEl.textContent = gap.acquired.length;
    if (missingCountEl) missingCountEl.textContent = gap.missing.length;
    if (improvableCountEl) improvableCountEl.textContent = gap.improvable.length;

    renderComparisonTableFromLocal(gap);
    renderPrioritizedAreasFromLocal(gap);
  }

  async function fetchAISkillGap(careerId, isManualRefresh) {
    if (typeof fetch === 'undefined') return;
    isFetchingAI = true;

    const refreshBtn = document.getElementById('gap-refresh-ai-btn');
    const aiBadge = document.getElementById('gap-ai-provider-badge');
    const summaryText = document.getElementById('gap-ai-summary-text');

    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.innerHTML = `<span>⏳ Analyzing...</span>`;
    }
    if (aiBadge) aiBadge.textContent = 'Processing with AI...';
    if (summaryText) summaryText.textContent = 'Synthesizing verified skills against industry hiring criteria...';

    try {
      const response = await fetch('/api/ai/skill-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ career_id: careerId })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'AI analysis failed');
      }

      // Render verified metrics from SQLite backend
      renderMetricsFromServer(data);

      // Render Gemini AI recommendations
      renderAIRecommendations(data);

      if (isManualRefresh && window.SkillSpringToast) {
        window.SkillSpringToast.show('AI analysis refreshed successfully!', 'success');
      }
    } catch (err) {
      console.warn('Backend AI analysis unavailable, using client-side fallback:', err);
      renderLocalFallbackRecommendations(careerId);
      if (isManualRefresh && window.SkillSpringToast) {
        window.SkillSpringToast.show('Analysis loaded in offline heuristic mode', 'info');
      }
    } finally {
      isFetchingAI = false;
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = `↻ Regenerate AI Analysis`;
      }
    }
  }

  function renderMetricsFromServer(data) {
    const scoreVal = document.getElementById('gap-match-score-val');
    const scoreDesc = document.getElementById('gap-match-desc');
    const scoreFill = document.getElementById('gap-match-progress-fill');
    const careerTitleEl = document.getElementById('gap-active-career-title');

    if (careerTitleEl) careerTitleEl.textContent = data.career_title;
    if (scoreVal) scoreVal.textContent = `${data.readiness_percentage}%`;
    if (scoreFill) scoreFill.style.width = `${data.readiness_percentage}%`;

    if (scoreDesc) {
      if (data.readiness_percentage >= 75) {
        scoreDesc.textContent = `Strong match! You meet the majority of prerequisite skills for entry-level ${data.career_title} roles.`;
      } else if (data.readiness_percentage >= 50) {
        scoreDesc.textContent = `Moderate match. You possess foundational skills but need hands-on project work in 2-3 key technologies.`;
      } else {
        scoreDesc.textContent = `Developing match. Focus on foundational tracks before pursuing advanced frameworks.`;
      }
    }

    const acquiredCountEl = document.getElementById('gap-acquired-count');
    const missingCountEl = document.getElementById('gap-missing-count');
    const improvableCountEl = document.getElementById('gap-improvable-count');

    if (acquiredCountEl) acquiredCountEl.textContent = data.matched_skills.length;
    if (missingCountEl) missingCountEl.textContent = data.missing_skills.length;
    if (improvableCountEl) improvableCountEl.textContent = data.improving_skills.length;

    renderComparisonTableFromServer(data);
    renderPrioritizedAreasFromServer(data);
  }

  function renderComparisonTableFromServer(data) {
    const tbody = document.getElementById('gap-comparison-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const allSkills = [
      ...data.matched_skills,
      ...data.improving_skills,
      ...data.missing_skills
    ];

    allSkills.forEach(skill => {
      const tr = document.createElement('tr');
      const isMastered = skill.status === 'Mastered';
      const isImproving = skill.status === 'Needs Polish';
      const isMissing = skill.status === 'Missing';

      let statusBadge = '';
      let userProf = skill.user_proficiency || 0;

      if (isMastered) {
        statusBadge = `<span class="badge badge-emerald">✓ Acquired (${userProf}%)</span>`;
      } else if (isImproving) {
        statusBadge = `<span class="badge badge-amber">△ Needs Polish (${userProf}%)</span>`;
      } else {
        statusBadge = `<span class="badge badge-rose">✕ Missing</span>`;
      }

      tr.innerHTML = `
        <td style="font-weight:600; color:var(--text-main);">
          ${skill.name}
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">Weight: ${skill.weight}%</div>
        </td>
        <td>
          <span class="badge ${skill.importance === 'Critical' ? 'badge-rose' : skill.importance === 'High' ? 'badge-amber' : 'badge-slate'}">
            ${skill.importance}
          </span>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:0.5rem; width:140px;">
            <div class="progress-track" style="height:6px; flex:1;">
              <div class="progress-fill ${userProf >= 75 ? 'success' : userProf >= 40 ? 'warning' : ''}" style="width:${userProf}%;"></div>
            </div>
            <span style="font-size:0.75rem; color:var(--text-muted);">${userProf}%</span>
          </div>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:0.5rem; width:140px;">
            <div class="progress-track" style="height:6px; flex:1;">
              <div class="progress-fill" style="width:${skill.benchmark_proficiency || 80}%; background-color:var(--text-light);"></div>
            </div>
            <span style="font-size:0.75rem; color:var(--text-muted);">${skill.benchmark_proficiency || 80}%+</span>
          </div>
        </td>
        <td>${statusBadge}</td>
      `;

      tbody.appendChild(tr);
    });
  }

  function renderPrioritizedAreasFromServer(data) {
    const container = document.getElementById('gap-prioritized-list');
    if (!container) return;

    container.innerHTML = '';
    const gaps = data.prioritized_gaps || [];

    if (gaps.length === 0) {
      container.innerHTML = `<p class="text-muted text-sm">No critical gaps remaining! You are ready to apply for entry-level positions.</p>`;
      return;
    }

    gaps.slice(0, 4).forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.cssText = 'padding: 1rem 1.25rem; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;';

      const isMissing = item.status === 'Missing' || !item.user_proficiency;

      card.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.875rem;">
          <div style="width:28px; height:28px; border-radius:50%; background:var(--primary-50); color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.8125rem;">
            ${idx + 1}
          </div>
          <div>
            <h5 style="font-size:0.9375rem; margin-bottom:0.15rem;">${item.name}</h5>
            <p style="font-size:0.8125rem; color:var(--text-muted);">
              ${isMissing ? `Target prerequisite for ${data.career_title}` : `Current: ${item.user_proficiency}% — Benchmark Target: ${item.benchmark_proficiency || 80}%`}
            </p>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <span class="badge ${item.importance === 'Critical' ? 'badge-rose' : 'badge-amber'}">${item.importance} Priority</span>
          <a href="roadmap.html?career=${data.career_id}" class="btn btn-outline-primary btn-sm">Start Learning →</a>
        </div>
      `;

      container.appendChild(card);
    });
  }

  function renderAIRecommendations(data) {
    const recs = data.ai_recommendations || {};
    const aiBadge = document.getElementById('gap-ai-provider-badge');
    const summaryText = document.getElementById('gap-ai-summary-text');
    const guidanceText = document.getElementById('gap-ai-guidance');
    const topicsContainer = document.getElementById('gap-ai-topics-list');
    const projectsContainer = document.getElementById('gap-ai-projects-list');
    const stepsContainer = document.getElementById('gap-ai-steps-list');

    // Update AI Provider badge
    if (aiBadge) {
      if (data.ai_provider && data.ai_provider.includes('gemini')) {
        aiBadge.textContent = '✨ Powered by Google Gemini';
        aiBadge.className = 'badge badge-indigo';
      } else {
        aiBadge.textContent = '⚡ Verified Heuristic Engine';
        aiBadge.className = 'badge badge-slate';
      }
    }

    // Summary
    if (summaryText && recs.summary) {
      summaryText.textContent = recs.summary;
    }

    // Learning Guidance
    if (guidanceText && recs.learning_guidance) {
      guidanceText.textContent = recs.learning_guidance;
    }

    // Recommended Topics
    if (topicsContainer) {
      topicsContainer.innerHTML = '';
      const topics = recs.recommended_topics || [];
      if (topics.length === 0) {
        topicsContainer.innerHTML = `<span class="text-xs text-muted">Complete profile to see tailored topics.</span>`;
      } else {
        topics.forEach(t => {
          const row = document.createElement('div');
          row.style.cssText = 'display:flex; align-items:center; gap:0.6rem; font-size:0.875rem;';
          row.innerHTML = `
            <span style="color:var(--primary); font-weight:700;">•</span>
            <span style="color:var(--text-main); font-weight:500;">${t}</span>
          `;
          topicsContainer.appendChild(row);
        });
      }
    }

    // Recommended Projects
    if (projectsContainer) {
      projectsContainer.innerHTML = '';
      const projects = recs.practical_projects || [];
      projects.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card card-hover';
        card.style.cssText = 'padding: 1.25rem; display:flex; flex-direction:column; justify-content:space-between; border-left: 3px solid var(--primary);';

        card.innerHTML = `
          <div>
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 0.5rem;">
              <h5 style="font-size: 1rem; font-weight:700; color:var(--text-main);">${p.title}</h5>
              <span class="badge badge-emerald" style="font-size:0.75rem;">${p.difficulty}</span>
            </div>
            <div class="text-xs text-muted" style="margin-bottom:0.5rem;">⏱️ Est. ${p.duration || '2 Weeks'}</div>
            <p style="font-size: 0.8125rem; color:var(--text-body); margin-bottom: 0.75rem; line-height: 1.45;">
              ${p.description}
            </p>
            <div style="font-size: 0.75rem; color:var(--text-muted); margin-bottom: 0.75rem; background:var(--bg-card-subtle); padding:0.4rem 0.6rem; border-radius:var(--radius-sm);">
              <strong>Portfolio Impact:</strong> ${p.portfolio_impact}
            </div>
          </div>
          <div>
            <div style="display:flex; gap:0.35rem; flex-wrap:wrap; margin-bottom:0.75rem;">
              ${(p.skills_targeted || []).map(s => `<span class="badge badge-slate" style="font-size:0.7rem;">${s}</span>`).join('')}
            </div>
            <a href="roadmap.html?career=${data.career_id}" class="btn btn-outline-primary btn-sm" style="width:100%; text-align:center;">
              Add to Learning Roadmap →
            </a>
          </div>
        `;

        projectsContainer.appendChild(card);
      });
    }

    // Action Steps
    if (stepsContainer) {
      stepsContainer.innerHTML = '';
      const steps = recs.next_steps || [];
      steps.forEach((step, idx) => {
        const stepRow = document.createElement('div');
        stepRow.style.cssText = 'display:flex; align-items:flex-start; gap:0.75rem; font-size:0.875rem;';
        stepRow.innerHTML = `
          <div style="width:22px; height:22px; border-radius:50%; background:var(--primary); color:#FFF; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem; flex-shrink:0;">
            ${idx + 1}
          </div>
          <span style="color:var(--text-body); line-height:1.5;">${step}</span>
        `;
        stepsContainer.appendChild(stepRow);
      });
    }
  }

  function renderLocalFallbackRecommendations(careerId) {
    const aiBadge = document.getElementById('gap-ai-provider-badge');
    if (aiBadge) {
      aiBadge.textContent = '⚡ Offline Heuristics Mode';
      aiBadge.className = 'badge badge-slate';
    }
    const summaryText = document.getElementById('gap-ai-summary-text');
    if (summaryText && window.SkillSpringStore) {
      const recs = window.SkillSpringStore.getRecommendations();
      summaryText.textContent = recs.summary;
    }
  }

  function renderComparisonTableFromLocal(gap) {
    const tbody = document.getElementById('gap-comparison-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const profile = window.SkillSpringStore.getProfile();
    const userProficiencies = profile.skillProficiencies || {};

    gap.career.requiredSkills.forEach(req => {
      const tr = document.createElement('tr');
      const normalizedReq = req.name.toLowerCase();

      const userSkill = (profile.skills || []).find(
        s => s.toLowerCase() === normalizedReq ||
             normalizedReq.includes(s.toLowerCase()) ||
             s.toLowerCase().includes(normalizedReq)
      );

      let statusBadge = '';
      let userProf = 0;

      if (userSkill) {
        userProf = userProficiencies[userSkill] || 65;
        if (userProf >= 75) {
          statusBadge = `<span class="badge badge-emerald">✓ Acquired (${userProf}%)</span>`;
        } else {
          statusBadge = `<span class="badge badge-amber">△ Needs Polish (${userProf}%)</span>`;
        }
      } else {
        statusBadge = `<span class="badge badge-rose">✕ Missing</span>`;
      }

      tr.innerHTML = `
        <td style="font-weight:600; color:var(--text-main);">
          ${req.name}
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">Weight: ${req.weight}%</div>
        </td>
        <td>
          <span class="badge ${req.importance === 'Critical' ? 'badge-rose' : req.importance === 'High' ? 'badge-amber' : 'badge-slate'}">
            ${req.importance}
          </span>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:0.5rem; width:140px;">
            <div class="progress-track" style="height:6px; flex:1;">
              <div class="progress-fill ${userProf >= 75 ? 'success' : userProf >= 40 ? 'warning' : ''}" style="width:${userProf}%;"></div>
            </div>
            <span style="font-size:0.75rem; color:var(--text-muted);">${userProf}%</span>
          </div>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:0.5rem; width:140px;">
            <div class="progress-track" style="height:6px; flex:1;">
              <div class="progress-fill" style="width:80%; background-color:var(--text-light);"></div>
            </div>
            <span style="font-size:0.75rem; color:var(--text-muted);">80%+</span>
          </div>
        </td>
        <td>${statusBadge}</td>
      `;

      tbody.appendChild(tr);
    });
  }

  function renderPrioritizedAreasFromLocal(gap) {
    const container = document.getElementById('gap-prioritized-list');
    if (!container) return;

    container.innerHTML = '';
    if (gap.prioritizedGaps.length === 0) {
      container.innerHTML = `<p class="text-muted text-sm">No critical gaps remaining! You're ready to apply for positions.</p>`;
      return;
    }

    gap.prioritizedGaps.slice(0, 4).forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.cssText = 'padding: 1rem 1.25rem; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;';

      const isMissing = !item.userProficiency;

      card.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.875rem;">
          <div style="width:28px; height:28px; border-radius:50%; background:var(--primary-50); color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.8125rem;">
            ${idx + 1}
          </div>
          <div>
            <h5 style="font-size:0.9375rem; margin-bottom:0.15rem;">${item.name}</h5>
            <p style="font-size:0.8125rem; color:var(--text-muted);">
              ${isMissing ? `Target prerequisite for ${gap.career.title}` : `Current: ${item.userProficiency}% — Target: ${item.targetProficiency}%`}
            </p>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <span class="badge ${item.importance === 'Critical' ? 'badge-rose' : 'badge-amber'}">${item.importance} Priority</span>
          <a href="roadmap.html?career=${gap.career.id}" class="btn btn-outline-primary btn-sm">Start Learning →</a>
        </div>
      `;

      container.appendChild(card);
    });
  }

})();
