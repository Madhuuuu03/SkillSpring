/**
 * SkillSpring - Auth Page Controller (Login & Signup)
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initPasswordToggle();
    initLoginForm();
    initSignupForm();
  });

  // Password visibility toggle
  function initPasswordToggle() {
    const toggleBtns = document.querySelectorAll('.toggle-password-btn');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.closest('.input-wrapper').querySelector('input');
        if (!input) return;

        if (input.type === 'password') {
          input.type = 'text';
          btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>`;
        } else {
          input.type = 'password';
          btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;
        }
      });
    });
  }

  // Handle Login Validation
  function initLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const emailInput = document.getElementById('login-email');
      const passwordInput = document.getElementById('login-password');
      let isValid = true;

      // Email validation
      if (!validateEmail(emailInput.value.trim())) {
        showError(emailInput, 'Please enter a valid academic or personal email address.');
        isValid = false;
      } else {
        clearError(emailInput);
      }

      // Password validation
      if (!passwordInput.value || passwordInput.value.length < 6) {
        showError(passwordInput, 'Password must be at least 6 characters long.');
        isValid = false;
      } else {
        clearError(passwordInput);
      }

      if (isValid) {
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Signing in...</span>`;

        fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailInput.value.trim(),
            password: passwordInput.value,
            remember: document.getElementById('remember-me')?.checked ?? true
          })
        })
        .then(res => res.json())
        .then(async data => {
          if (data.success) {
            if (window.SkillSpringStore) {
              await window.SkillSpringStore.syncWithBackend();
            }
            if (window.SkillSpringToast) {
              window.SkillSpringToast.show('Welcome back! Loading your career dashboard...', 'success');
            }
            setTimeout(() => {
              window.location.href = 'dashboard.html';
            }, 600);
          } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>Sign In to Dashboard</span>`;
            showError(passwordInput, data.error || 'Invalid credentials');
            if (window.SkillSpringToast) {
              window.SkillSpringToast.show(data.error || 'Failed to sign in', 'error');
            }
          }
        })
        .catch(err => {
          console.warn('Backend unavailable, continuing in offline demo mode', err);
          if (window.SkillSpringToast) {
            window.SkillSpringToast.show('Welcome back! Loading your career dashboard...', 'success');
          }
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 800);
        });
      }
    });
  }

  // Handle Signup Validation
  function initSignupForm() {
    const form = document.getElementById('signup-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('signup-name');
      const emailInput = document.getElementById('signup-email');
      const passwordInput = document.getElementById('signup-password');
      const confirmInput = document.getElementById('signup-confirm-password');
      const termsInput = document.getElementById('signup-terms');

      let isValid = true;

      // Name validation
      if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
        showError(nameInput, 'Please provide your full student name.');
        isValid = false;
      } else {
        clearError(nameInput);
      }

      // Email validation
      if (!validateEmail(emailInput.value.trim())) {
        showError(emailInput, 'Please enter a valid email address.');
        isValid = false;
      } else {
        clearError(emailInput);
      }

      // Password validation
      if (!passwordInput.value || passwordInput.value.length < 8) {
        showError(passwordInput, 'Password must be at least 8 characters with numbers or symbols.');
        isValid = false;
      } else {
        clearError(passwordInput);
      }

      // Confirm Password
      if (confirmInput.value !== passwordInput.value) {
        showError(confirmInput, 'Passwords do not match.');
        isValid = false;
      } else {
        clearError(confirmInput);
      }

      // Terms agreement
      if (termsInput && !termsInput.checked) {
        alert('Please agree to the Terms of Service and Privacy Policy to proceed.');
        isValid = false;
      }

      if (isValid) {
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Creating Student Account...</span>`;

        fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            password: passwordInput.value
          })
        })
        .then(res => res.json())
        .then(async data => {
          if (data.success) {
            if (window.SkillSpringStore) {
              await window.SkillSpringStore.syncWithBackend();
            }
            if (window.SkillSpringToast) {
              window.SkillSpringToast.show("Account created! Let's setup your student profile.", 'success');
            }
            setTimeout(() => {
              window.location.href = 'profile.html';
            }, 600);
          } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>Create Free Student Account</span>`;
            showError(emailInput, data.error || 'Registration failed');
            if (window.SkillSpringToast) {
              window.SkillSpringToast.show(data.error || 'Registration failed', 'error');
            }
          }
        })
        .catch(err => {
          console.warn('Backend unavailable, continuing in offline demo mode', err);
          if (window.SkillSpringStore) {
            window.SkillSpringStore.saveProfile({
              name: nameInput.value.trim(),
              email: emailInput.value.trim()
            });
          }
          if (window.SkillSpringToast) {
            window.SkillSpringToast.show("Account created! Let's setup your student profile.", 'success');
          }
          setTimeout(() => {
            window.location.href = 'profile.html';
          }, 800);
        });
      }
    });
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function showError(input, message) {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    const group = input.closest('.form-group');
    if (!group) return;
    let feedback = group.querySelector('.form-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'form-feedback is-error';
      group.appendChild(feedback);
    }
    feedback.className = 'form-feedback is-error';
    feedback.innerHTML = `
      <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
      <span>${message}</span>
    `;
  }

  function clearError(input) {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    const group = input.closest('.form-group');
    if (!group) return;
    const feedback = group.querySelector('.form-feedback');
    if (feedback) {
      feedback.className = 'form-feedback';
      feedback.innerHTML = '';
    }
  }

})();
