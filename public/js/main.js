/**
 * SkillSpring - Main Shared UI Utilities & Navigation Handler
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initNavigationHighlight();
    initMobileNav();
    initAppSidebar();
    syncUserHeader();
  });

  // Highlight active navigation items based on current page URL
  function initNavigationHighlight() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    // Public Navbar
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href === currentPath || (currentPath === '' && href === 'index.html'))) {
        link.classList.add('active');
      }
    });

    // App Sidebar Items
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
      const href = item.getAttribute('href');
      if (href && href === currentPath) {
        item.classList.add('active');
      }
    });
  }

  // Public Landing Page Mobile Hamburger Menu Toggle
  function initMobileNav() {
    const toggleBtn = document.querySelector('.nav-toggle-btn');
    const mobileMenu = document.querySelector('.mobile-nav-menu');

    if (toggleBtn && mobileMenu) {
      toggleBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('is-open');
        const isOpen = mobileMenu.classList.contains('is-open');
        toggleBtn.setAttribute('aria-expanded', isOpen);
      });

      // Close when clicking outside
      document.addEventListener('click', (e) => {
        if (!toggleBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
          mobileMenu.classList.remove('is-open');
        }
      });
    }
  }

  // App Layout Sidebar Mobile Toggle
  function initAppSidebar() {
    const sidebarToggleBtn = document.querySelector('.sidebar-toggle-btn');
    const sidebar = document.querySelector('.app-sidebar');

    if (sidebarToggleBtn && sidebar) {
      sidebarToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('is-open');
      });

      // Close when clicking outside on mobile
      document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && sidebar.classList.contains('is-open')) {
          if (!sidebar.contains(e.target) && !sidebarToggleBtn.contains(e.target)) {
            sidebar.classList.remove('is-open');
          }
        }
      });
    }
  }

  // Sync user profile info into the sidebar / header
  function syncUserHeader() {
    if (!window.SkillSpringStore) return;

    const profile = window.SkillSpringStore.getProfile();
    const nameEls = document.querySelectorAll('.sync-user-name');
    const roleEls = document.querySelectorAll('.sync-user-role');
    const collegeEls = document.querySelectorAll('.sync-user-college');
    const avatarEls = document.querySelectorAll('.sync-user-avatar');

    const initials = profile.name
      ? profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : 'SS';

    nameEls.forEach(el => el.textContent = profile.name || 'Student');
    roleEls.forEach(el => el.textContent = profile.careerGoal || 'Career Explorer');
    collegeEls.forEach(el => el.textContent = profile.college || 'Engineering College');
    avatarEls.forEach(el => el.textContent = initials);
  }

  // Helper for tab switching
  window.initTabSwitching = function (containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const tabs = container.querySelectorAll('.tab-btn');
    const panels = container.querySelectorAll('.tab-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-tab');

        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const targetPanel = container.querySelector(`#${targetId}`);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      });
    });
  };

  // Global helper for fast demo login
  window.demoLogin = async function () {
    if (window.SkillSpringToast) {
      window.SkillSpringToast.show('Logging in with demo profile...', 'info');
    }
    try {
      const res = await fetch('/api/auth/demo-login', { method: 'POST' });
      if (res.ok && window.SkillSpringStore) {
        await window.SkillSpringStore.syncWithBackend();
      }
    } catch (e) {
      console.warn('Demo login offline fallback', e);
    }
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 400);
  };

  // Global helper for logout
  window.demoLogout = async function () {
    if (confirm('Are you sure you want to log out?')) {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (e) {
        console.warn('Logout offline fallback', e);
      }
      if (window.SkillSpringToast) {
        window.SkillSpringToast.show('Signed out successfully', 'info');
      }
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 300);
    }
  };

})();
