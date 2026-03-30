/**
 * Accessibility Widget — Portail Maths
 * Floating button + panel with 3 toggles:
 *   - Police Dyslexie (OpenDyslexic)
 *   - Contraste renforce
 *   - Taille de police +
 * Preferences persisted in localStorage key "maths_a11y".
 * Self-initializing (DOMContentLoaded). No external dependencies.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'maths_a11y';

  var OPTIONS = [
    { id: 'dyslexia',  label: 'Police Dyslexie',    bodyClass: 'a11y-dyslexia' },
    { id: 'contrast',  label: 'Contraste renforc\u00e9', bodyClass: 'a11y-contrast' },
    { id: 'large',     label: 'Taille de police +',  bodyClass: 'a11y-large' }
  ];

  /* ---- Persistence ---- */

  function loadPrefs() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (_) {
      return {};
    }
  }

  function savePrefs(prefs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (_) { /* quota exceeded — ignore */ }
  }

  function applyPrefs(prefs) {
    OPTIONS.forEach(function (opt) {
      document.body.classList.toggle(opt.bodyClass, !!prefs[opt.id]);
    });
  }

  /* ---- DOM helpers ---- */

  function css(el, styles) {
    Object.keys(styles).forEach(function (k) { el.style[k] = styles[k]; });
    return el;
  }

  /* ---- Build UI ---- */

  function createToggle(opt, prefs, onChange) {
    var row = document.createElement('label');
    css(row, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      padding: '10px 0',
      cursor: 'pointer',
      color: '#eef2ff',
      fontSize: '14px',
      borderBottom: '1px solid #28314f',
      userSelect: 'none'
    });

    var span = document.createElement('span');
    span.textContent = opt.label;

    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!prefs[opt.id];
    css(cb, {
      width: '18px',
      height: '18px',
      accentColor: '#22d3ee',
      cursor: 'pointer',
      flexShrink: '0'
    });

    cb.addEventListener('change', function () {
      prefs[opt.id] = cb.checked;
      savePrefs(prefs);
      applyPrefs(prefs);
      if (onChange) onChange();
    });

    row.appendChild(span);
    row.appendChild(cb);
    return row;
  }

  function createPanel(prefs) {
    var panel = document.createElement('div');
    panel.id = 'a11y-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Options d\u2019accessibilit\u00e9');
    css(panel, {
      position: 'fixed',
      bottom: '70px',
      right: '16px',
      width: '260px',
      background: '#151b34',
      border: '1px solid #28314f',
      borderRadius: '14px',
      padding: '16px',
      zIndex: '10000',
      boxShadow: '0 8px 28px rgba(0,0,0,.45)',
      display: 'none'
    });

    var title = document.createElement('div');
    css(title, {
      color: '#22d3ee',
      fontWeight: '600',
      fontSize: '15px',
      marginBottom: '8px'
    });
    title.textContent = '\u2699\ufe0f Accessibilit\u00e9';
    panel.appendChild(title);

    OPTIONS.forEach(function (opt) {
      panel.appendChild(createToggle(opt, prefs));
    });

    return panel;
  }

  function createButton() {
    var btn = document.createElement('button');
    btn.id = 'a11y-btn';
    btn.setAttribute('aria-label', 'Accessibilit\u00e9');
    btn.setAttribute('title', 'Accessibilit\u00e9');
    btn.textContent = '\u267f';
    css(btn, {
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      background: '#22d3ee',
      color: '#081016',
      border: 'none',
      fontSize: '22px',
      lineHeight: '48px',
      textAlign: 'center',
      cursor: 'pointer',
      zIndex: '10001',
      boxShadow: '0 4px 14px rgba(34,211,238,.4)',
      transition: 'transform .15s ease, box-shadow .15s ease'
    });

    btn.addEventListener('mouseenter', function () {
      btn.style.transform = 'scale(1.1)';
      btn.style.boxShadow = '0 6px 20px rgba(34,211,238,.55)';
    });
    btn.addEventListener('mouseleave', function () {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = '0 4px 14px rgba(34,211,238,.4)';
    });

    return btn;
  }

  /* ---- Init ---- */

  function init() {
    var prefs = loadPrefs();
    applyPrefs(prefs);

    var btn = createButton();
    var panel = createPanel(prefs);
    document.body.appendChild(panel);
    document.body.appendChild(btn);

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = panel.style.display === 'none';
      panel.style.display = open ? 'block' : 'none';
    });

    document.addEventListener('click', function (e) {
      if (panel.style.display !== 'none' && !panel.contains(e.target) && e.target !== btn) {
        panel.style.display = 'none';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
