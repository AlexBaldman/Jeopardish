(function initLanding(documentRef, windowRef) {
  'use strict';

  if (!documentRef || !windowRef) {
    return;
  }

  function updateSignalProgress() {
    const bar = documentRef.getElementById('signalProgressBar');
    if (!bar) {
      return;
    }

    const travel = documentRef.documentElement.scrollHeight - windowRef.innerHeight;
    const progress = travel > 0 ? Math.min(1, Math.max(0, windowRef.scrollY / travel)) : 0;
    bar.style.width = `${progress * 100}%`;
  }

  function bindReveals() {
    const elements = documentRef.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in windowRef)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.08,
    });

    elements.forEach((element) => observer.observe(element));
  }

  function animateCounter(element) {
    const target = Number(element.dataset.count);
    if (!Number.isFinite(target)) {
      return;
    }

    const reducedMotion = windowRef.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      element.textContent = target.toLocaleString();
      return;
    }

    const duration = 900;
    const start = windowRef.performance.now();
    element.textContent = '0';

    function tick(now) {
      const ratio = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - ratio, 3);
      element.textContent = Math.round(target * eased).toLocaleString();
      if (ratio < 1) {
        windowRef.requestAnimationFrame(tick);
      }
    }

    windowRef.requestAnimationFrame(tick);
  }

  function bindCounters() {
    const counters = documentRef.querySelectorAll('[data-count]');
    if (!('IntersectionObserver' in windowRef)) {
      counters.forEach(animateCounter);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.42 });

    counters.forEach((counter) => observer.observe(counter));
  }

  function activateMode(tab) {
    const tabs = Array.from(documentRef.querySelectorAll('.format-tab'));
    const panels = Array.from(documentRef.querySelectorAll('.format-panel'));
    const mode = tab.dataset.mode;

    tabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });

    panels.forEach((panel) => {
      const active = panel.dataset.panel === mode;
      panel.classList.toggle('active', active);
      panel.hidden = !active;
    });
  }

  function bindModeSwitcher() {
    const tabs = Array.from(documentRef.querySelectorAll('.format-tab'));
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activateMode(tab));
      tab.addEventListener('keydown', (event) => {
        const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown'
          ? 1
          : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
        if (!direction) {
          return;
        }
        event.preventDefault();
        const target = tabs[(index + direction + tabs.length) % tabs.length];
        activateMode(target);
        target.focus();
      });
    });
  }

  function bindLaunchTriggers() {
    documentRef.querySelectorAll('[data-launch-game]').forEach((link) => {
      link.addEventListener('click', () => {
        windowRef.dispatchEvent(new CustomEvent('jeopardish:activate'));
      });
    });
  }

  documentRef.addEventListener('DOMContentLoaded', () => {
    bindReveals();
    bindCounters();
    bindModeSwitcher();
    bindLaunchTriggers();
    updateSignalProgress();
    windowRef.addEventListener('scroll', updateSignalProgress, { passive: true });
    windowRef.addEventListener('resize', updateSignalProgress);
  });
}(globalThis.document, globalThis));
