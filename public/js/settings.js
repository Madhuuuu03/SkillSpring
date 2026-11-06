/**
 * SkillSpring - Settings Page Controller
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initSettingsTabs();
    loadCurrentSettings();
    initSaveForms();
    initDangerZone();

    if (window.SkillSpringStore && typeof window.SkillSpringStore.subscribe === 'function') {
      window.SkillSpringStore.subscribe((snapshot) => {
        const profile = snapshot?.profile || window.SkillSpringStore.getProfile();
        populateCareerOptions(profile);
      });
    }
  });

  function populateCareerOptions(profile) {
    const careerSelect = document.getElementById('settings-career-goal');
    if (!careerSelect || !window.SkillSpringStore) return;

    const careers = window.SkillSpringStore.getCareers();
    const previousValue = careerSelect.value;

    careerSelect.innerHTML = '';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select a career';
    careerSelect.appendChild(placeholder);

    careers.forEach(career => {
      const option = document.createElement('option');
      option.value = career.id;
      option.textContent = career.title;
      careerSelect.appendChild(option);
    });

    const validPrevious = careers.some(career => career.id === previousValue);
    const selectedCareer = careers.find(career => career.id === profile?.careerId);

    careerSelect.value = validPrevious
      ? previousValue
      : (selectedCareer?.id || '');
  }

  function initSettingsTabs() {
    const tabs = document.querySelectorAll('.settings-tab-btn');
    const sections = document.querySelectorAll('.settings-section-pane');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-target');

        tabs.forEach(t => t.classList.remove('active'));
        sections.forEach(s => {
          s.classList.remove('active');
          s.style.display = 'none';
        });

        tab.classList.add('active');
        const activeSection = document.getElementById(targetId);
        if (activeSection) {
          activeSection.classList.add('active');
          activeSection.style.display = 'block';
        }
      });
    });
  }

  function loadCurrentSettings() {
    if (!window.SkillSpringStore) return;

    const profile = window.SkillSpringStore.getProfile();

    // Profile Settings
    setVal('settings-fullname', profile.name);
    setVal('settings-email', profile.email);
    setVal('settings-college', profile.college);
    setVal('settings-branch', profile.branch);
    setVal('settings-year', profile.academicYear);

    // Career Preferences
    populateCareerOptions(profile);

    // Learning Goals
    setVal('settings-weekly-hours', profile.weeklyHours || 12);
    setVal('settings-daily-target', 2);
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el && val !== undefined) {
      el.value = val;
    }
  }

  function initSaveForms() {
    // Profile save
    const profileForm = document.getElementById('settings-profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const updated = {
          name: document.getElementById('settings-fullname')?.value.trim(),
          email: document.getElementById('settings-email')?.value.trim(),
          college: document.getElementById('settings-college')?.value.trim(),
          branch: document.getElementById('settings-branch')?.value.trim(),
          academicYear: document.getElementById('settings-year')?.value
        };

        window.SkillSpringStore.saveProfile(updated);
        if (window.SkillSpringToast) {
          window.SkillSpringToast.show('Personal details saved successfully!', 'success');
        }
      });
    }

    // Career preferences save
    const careerForm = document.getElementById('settings-career-form');
    if (careerForm) {
      careerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const careerId = document.getElementById('settings-career-goal')?.value;
        const career = window.SkillSpringStore.getCareers()
          .find(item => item.id === careerId);

        if (!career) {
          if (window.SkillSpringToast) {
            window.SkillSpringToast.show('Please select a valid target career.', 'warning');
          }
          return;
        }

        window.SkillSpringStore.saveProfile({
          careerId: career.id,
          careerGoal: career.title
        });

        if (window.SkillSpringToast) {
          window.SkillSpringToast.show(`Target career updated to "${career.title}"!`, 'success');
        }
      });
    }

    // Learning goals save
    const goalsForm = document.getElementById('settings-goals-form');
    if (goalsForm) {
      goalsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const hours = parseInt(document.getElementById('settings-weekly-hours')?.value || '12', 10);
        window.SkillSpringStore.saveProfile({
          weeklyHours: hours
        });

        if (window.SkillSpringToast) {
          window.SkillSpringToast.show('Learning goals and study schedule saved!', 'success');
        }
      });
    }

    // Notifications save
    const notifForm = document.getElementById('settings-notif-form');
    if (notifForm) {
      notifForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (window.SkillSpringToast) {
          window.SkillSpringToast.show('Notification preferences updated!', 'success');
        }
      });
    }
  }

  function initDangerZone() {
    const resetBtn = document.getElementById('reset-demo-data-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all demo roadmap checkboxes and profile values to default?')) {
          window.SkillSpringStore.resetProfile();
          if (window.SkillSpringToast) {
            window.SkillSpringToast.show('Demo data reset to default successfully!', 'info');
          }
          setTimeout(() => {
            window.location.reload();
          }, 600);
        }
      });
    }
  }

})();
