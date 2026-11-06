/**
 * SkillSpring - Student Profile Page Controller
 */

(function () {
  'use strict';

  const POPULAR_SKILLS = [
    'Python', 'JavaScript', 'React', 'SQL Basics', 'Git & GitHub',
    'Docker', 'Data Structures', 'Machine Learning', 'HTML5 & CSS3',
    'Node.js', 'C++', 'Java', 'AWS', 'TypeScript', 'Pandas & NumPy',
    'REST APIs', 'PostgreSQL', 'Tailwind CSS'
  ];

  let currentSelectedSkills = [];
  let skillProficiencies = {};
  let isFormDirty = false;

  document.addEventListener('DOMContentLoaded', () => {
    try { loadProfileData(); } catch (e) { console.error('Error loading profile data:', e); }
    try { initSkillChips(); } catch (e) { console.error('Error initializing skill chips:', e); }
    try { initCustomSkillInput(); } catch (e) { console.error('Error initializing custom skill input:', e); }
    try { initHoursSlider(); } catch (e) { console.error('Error initializing hours slider:', e); }
    try { initProfileForm(); } catch (e) { console.error('Error initializing profile form:', e); }
    try { updateCompletionIndicator(); } catch (e) { console.error('Error updating completion indicator:', e); }
    try { initStoreSubscription(); } catch (e) { console.error('Error initializing store subscription:', e); }
    try { markDirtyOnEdit(); } catch (e) {}
  });

  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str || '');
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function populateCareerOptions(profile) {
    const select = document.getElementById('profile-careerGoal');
    if (!select || !window.SkillSpringStore) return;

    const careers = window.SkillSpringStore.getCareers();

    select.innerHTML = '';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select a career';
    select.appendChild(placeholder);

    careers.forEach(career => {
      const option = document.createElement('option');
      option.value = career.id;
      option.textContent = career.title;
      select.appendChild(option);
    });

    const selectedCareer =
      careers.find(career => career.id === profile?.careerId) ||
      careers.find(career => career.title === profile?.careerGoal);

    select.value = selectedCareer ? selectedCareer.id : '';
  }

  function populateFormFields(profile) {
    if (!profile) return;

    // Populate standard form fields
    const fields = ['name', 'email', 'college', 'degree', 'branch', 'academicYear'];
    fields.forEach(field => {
      const el = document.getElementById(`profile-${field}`);
      if (el && profile[field] !== undefined && profile[field] !== null) {
        el.value = profile[field];
      }
    });

    // Populate weekly hours
    const hoursInput = document.getElementById('profile-hours');
    const hoursDisplay = document.getElementById('hours-val-display');
    if (hoursInput && profile.weeklyHours) {
      hoursInput.value = profile.weeklyHours;
      if (hoursDisplay) hoursDisplay.textContent = `${profile.weeklyHours} hrs/week`;
    }

    // Populate interests
    const interestsInput = document.getElementById('profile-interests');
    if (interestsInput && profile.interests) {
      interestsInput.value = Array.isArray(profile.interests)
        ? profile.interests.join(', ')
        : String(profile.interests);
    }
  }

  function loadProfileData() {
    if (!window.SkillSpringStore) return;

    const profile = window.SkillSpringStore.getProfile();
    populateCareerOptions(profile);
    populateFormFields(profile);

    // Skills
    currentSelectedSkills = [...(profile.skills || ['Python', 'Git & GitHub', 'SQL Basics'])];
    skillProficiencies = { ...(profile.skillProficiencies || {}) };

    renderSelectedSkillChips();
    renderProficiencySliders();
  }

  function initStoreSubscription() {
    if (!window.SkillSpringStore || typeof window.SkillSpringStore.subscribe !== 'function') return;

    window.SkillSpringStore.subscribe((snapshot) => {
      // Do not overwrite form fields if the user has already begun making manual edits
      if (isFormDirty) return;

      const profile = (snapshot && snapshot.profile) ? snapshot.profile : window.SkillSpringStore.getProfile();
      if (profile) {
        populateCareerOptions(profile);
        populateFormFields(profile);
        currentSelectedSkills = [...(profile.skills || ['Python', 'Git & GitHub', 'SQL Basics'])];
        skillProficiencies = { ...(profile.skillProficiencies || {}) };

        renderSelectedSkillChips();
        renderProficiencySliders();
        initSkillChips();
        updateCompletionIndicator();
      }
    });
  }

  function markDirtyOnEdit() {
    const form = document.getElementById('student-profile-form');
    if (!form) return;
    form.addEventListener('input', () => { isFormDirty = true; });
    form.addEventListener('change', () => { isFormDirty = true; });
  }

  function initSkillChips() {
    const popularContainer = document.getElementById('popular-skills-container');
    if (!popularContainer) return;

    popularContainer.innerHTML = '';
    POPULAR_SKILLS.forEach(skill => {
      const chip = document.createElement('button');
      chip.type = 'button';
      const isSelected = currentSelectedSkills.some(s => s.toLowerCase() === skill.toLowerCase());
      chip.className = `skill-chip ${isSelected ? 'selected' : ''}`;
      chip.textContent = skill;
      chip.addEventListener('click', () => {
        toggleSkill(skill);
      });
      popularContainer.appendChild(chip);
    });
  }

  function toggleSkill(skill) {
    isFormDirty = true;
    const index = currentSelectedSkills.findIndex(s => s.toLowerCase() === skill.toLowerCase());
    if (index > -1) {
      const removed = currentSelectedSkills.splice(index, 1)[0];
      delete skillProficiencies[removed];
      delete skillProficiencies[skill];
    } else {
      currentSelectedSkills.push(skill);
      if (!skillProficiencies[skill]) {
        skillProficiencies[skill] = 70; // default 70%
      }
    }

    renderSelectedSkillChips();
    renderProficiencySliders();
    initSkillChips();
    updateCompletionIndicator();
  }

  function initCustomSkillInput() {
    const input = document.getElementById('custom-skill-input');
    const addBtn = document.getElementById('add-custom-skill-btn');

    if (!input || !addBtn) return;

    const addCustom = () => {
      const val = input.value.trim();
      if (!val) return;

      // Case-insensitive duplicate check
      const alreadyExists = currentSelectedSkills.some(s => s.toLowerCase() === val.toLowerCase());
      if (alreadyExists) {
        if (window.SkillSpringToast) {
          window.SkillSpringToast.show(`"${val}" is already in your skills list.`, 'info');
        }
        input.value = '';
        return;
      }

      isFormDirty = true;
      currentSelectedSkills.push(val);
      if (!skillProficiencies[val]) {
        skillProficiencies[val] = 70;
      }
      input.value = '';
      renderSelectedSkillChips();
      renderProficiencySliders();
      initSkillChips();
      updateCompletionIndicator();
    };

    addBtn.addEventListener('click', addCustom);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCustom();
      }
    });
  }

  function renderSelectedSkillChips() {
    const container = document.getElementById('selected-skills-container');
    if (!container) return;

    if (currentSelectedSkills.length === 0) {
      container.innerHTML = `<span class="text-muted text-sm">No skills added yet. Click above or type to add.</span>`;
      return;
    }

    container.innerHTML = '';
    currentSelectedSkills.forEach(skill => {
      const chip = document.createElement('span');
      chip.className = 'skill-chip selected';
      chip.innerHTML = `
        <span>${escapeHtml(skill)}</span>
        <span class="chip-remove" title="Remove skill">&times;</span>
      `;
      chip.querySelector('.chip-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSkill(skill);
      });
      container.appendChild(chip);
    });
  }

  function renderProficiencySliders() {
    const container = document.getElementById('proficiency-sliders-container');
    if (!container) return;

    if (currentSelectedSkills.length === 0) {
      container.innerHTML = `<p class="text-muted text-sm">Add your skills above to set proficiency levels.</p>`;
      return;
    }

    container.innerHTML = '';
    currentSelectedSkills.forEach(skill => {
      const currentLevel = skillProficiencies[skill] || 70;
      const row = document.createElement('div');
      row.className = 'proficiency-row';
      row.style.cssText = 'margin-bottom: 1rem; padding: 0.75rem 1rem; background: #FFFFFF; border: 1px solid var(--border-light); border-radius: var(--radius-md);';

      row.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.4rem;">
          <strong style="font-size:0.9rem; color:var(--text-main);">${escapeHtml(skill)}</strong>
          <span class="badge ${currentLevel >= 75 ? 'badge-emerald' : currentLevel >= 50 ? 'badge-indigo' : 'badge-amber'}">
            ${currentLevel}% (${currentLevel >= 80 ? 'Advanced' : currentLevel >= 50 ? 'Intermediate' : 'Beginner'})
          </span>
        </div>
        <input type="range" min="10" max="100" step="5" value="${currentLevel}"
               class="prof-slider" style="width:100%; accent-color:var(--primary); cursor:pointer;">
      `;

      const slider = row.querySelector('.prof-slider');
      const badge = row.querySelector('.badge');

      if (slider && badge) {
        slider.addEventListener('input', (e) => {
          isFormDirty = true;
          const val = parseInt(e.target.value, 10);
          skillProficiencies[skill] = val;
          const levelName = val >= 80 ? 'Advanced' : val >= 50 ? 'Intermediate' : 'Beginner';
          badge.textContent = `${val}% (${levelName})`;
          badge.className = `badge ${val >= 75 ? 'badge-emerald' : val >= 50 ? 'badge-indigo' : 'badge-amber'}`;
        });
      }

      container.appendChild(row);
    });
  }

  function initHoursSlider() {
    const slider = document.getElementById('profile-hours');
    const display = document.getElementById('hours-val-display');
    if (!slider || !display) return;

    slider.addEventListener('input', (e) => {
      isFormDirty = true;
      display.textContent = `${e.target.value} hrs/week`;
      updateCompletionIndicator();
    });
  }

  function updateCompletionIndicator() {
    const indicator = document.getElementById('profile-completion-pct');
    const bar = document.getElementById('profile-completion-bar');
    if (!bar) return;

    let score = 20; // base score for starting
    const nameVal = document.getElementById('profile-name')?.value;
    const collegeVal = document.getElementById('profile-college')?.value;
    const goalVal = document.getElementById('profile-careerGoal')?.value;

    if (nameVal && nameVal.trim().length > 2) score += 15;
    if (collegeVal && collegeVal.trim().length > 2) score += 15;
    if (goalVal) score += 20;
    if (currentSelectedSkills.length >= 3) score += 20;
    if (currentSelectedSkills.length >= 6) score += 10;

    score = Math.min(100, score);
    if (indicator) indicator.textContent = `${score}%`;
    bar.style.width = `${score}%`;
  }

  function initProfileForm() {
    const form = document.getElementById('student-profile-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('profile-name')?.value.trim();
      const college = document.getElementById('profile-college')?.value.trim();
      const degree = document.getElementById('profile-degree')?.value;
      const branch = document.getElementById('profile-branch')?.value;
      const academicYear = document.getElementById('profile-academicYear')?.value;
      const careerId = document.getElementById('profile-careerGoal')?.value;
      const selectedCareer = window.SkillSpringStore?.getCareers()
        .find(career => career.id === careerId);

      if (!selectedCareer) {
        if (window.SkillSpringToast) {
          window.SkillSpringToast.show('Please select a valid target career.', 'warning');
        }
        return;
      }

      const careerGoal = selectedCareer.title;
      const weeklyHours = parseInt(document.getElementById('profile-hours')?.value || '12', 10);
      const interestsRaw = document.getElementById('profile-interests')?.value || '';

      const interests = interestsRaw.split(',').map(s => s.trim()).filter(Boolean);


      const updated = {
        name: name || 'Student',
        college: college || 'National Institute of Technology',
        degree: degree || 'B.Tech',
        branch: branch || 'Computer Science & Engineering',
        academicYear: academicYear || '3rd Year',
        careerGoal: careerGoal || 'Python Developer',
        careerId,
        skills: currentSelectedSkills,
        skillProficiencies,
        interests,
        weeklyHours
      };

      if (window.SkillSpringStore) {
        window.SkillSpringStore.saveProfile(updated);
      }

      isFormDirty = false;

      if (window.SkillSpringToast) {
        window.SkillSpringToast.show('Profile updated successfully! Recalculating your career roadmap...', 'success');
      }

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 700);
    });
  }

})();
