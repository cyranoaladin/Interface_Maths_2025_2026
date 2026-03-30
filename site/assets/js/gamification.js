(function () {
  'use strict';

  const LEVELS = [
    { min: 0, label: 'Débutant', icon: '\ud83c\udf31', color: '#a2b0d6' },
    { min: 20, label: 'Curieux', icon: '\ud83d\udd0d', color: '#6aa6ff' },
    { min: 40, label: 'Explorateur', icon: '\ud83e\udded', color: '#22d3ee' },
    { min: 60, label: 'Confirmé', icon: '\u2b50', color: '#f59e0b' },
    { min: 80, label: 'Expert', icon: '\ud83c\udfc6', color: '#22c55e' }
  ];

  const BADGES = {
    first_course: { label: 'Premier cours consulté', icon: '\ud83c\udfc5', desc: 'Tu as ouvert ton premier cours !' },
    first_qcm: { label: 'Premier QCM', icon: '\ud83c\udfaf', desc: 'Tu as complété ton premier QCM !' },
    perfect_qcm: { label: 'QCM parfait', icon: '\ud83d\udcaf', desc: 'Score parfait à un QCM !' },
    five_chapters: { label: '5 chapitres', icon: '\ud83d\udcca', desc: '5 chapitres consultés !' },
    flashcard_master: { label: 'Maître des flashcards', icon: '\ud83c\udccf', desc: 'Toutes les flashcards maîtrisées !' }
  };

  function getGroupCode() {
    try {
      const u = JSON.parse(localStorage.getItem('maths_user') || '{}');
      return u.group_code || 'default';
    } catch { return 'default'; }
  }

  function getProgress() {
    const key = 'mathsProgress_' + getGroupCode();
    try { return JSON.parse(localStorage.getItem(key) || 'null') || defaultProgress(); }
    catch { return defaultProgress(); }
  }

  function saveProgress(p) {
    const key = 'mathsProgress_' + getGroupCode();
    localStorage.setItem(key, JSON.stringify(p));
  }

  function defaultProgress() {
    return { chaptersViewed: [], qcmCompleted: {}, badges: [], xp: 0 };
  }

  function getLevel(xp) {
    let level = LEVELS[0];
    for (const l of LEVELS) { if (xp >= l.min) level = l; }
    return level;
  }

  function trackPageVisit() {
    const path = location.pathname;
    const p = getProgress();

    // Track chapter visits
    const chapterMatch = path.match(/\/([^/]+)\/cours_/);
    if (chapterMatch) {
      const ch = chapterMatch[1].toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (!p.chaptersViewed.includes(ch)) {
        p.chaptersViewed.push(ch);
        p.xp = Math.min(100, p.xp + 5);
        if (!p.badges.includes('first_course')) {
          p.badges.push('first_course');
          showBadgeNotification(BADGES.first_course);
        }
        if (p.chaptersViewed.length >= 5 && !p.badges.includes('five_chapters')) {
          p.badges.push('five_chapters');
          showBadgeNotification(BADGES.five_chapters);
        }
        saveProgress(p);
      }
    }
  }

  // Public API for QCM and flashcards to call
  window.mathsGamification = {
    recordQCM: function (chapterSlug, score, total) {
      const p = getProgress();
      p.qcmCompleted[chapterSlug] = { score: score, total: total, date: new Date().toISOString().slice(0, 10) };
      p.xp = Math.min(100, p.xp + 10);
      if (!p.badges.includes('first_qcm')) {
        p.badges.push('first_qcm');
        showBadgeNotification(BADGES.first_qcm);
      }
      if (score === total && !p.badges.includes('perfect_qcm')) {
        p.badges.push('perfect_qcm');
        showBadgeNotification(BADGES.perfect_qcm);
      }
      saveProgress(p);
    },
    recordFlashcards: function (mastered, total) {
      const p = getProgress();
      p.xp = Math.min(100, p.xp + 5);
      if (mastered === total && !p.badges.includes('flashcard_master')) {
        p.badges.push('flashcard_master');
        showBadgeNotification(BADGES.flashcard_master);
      }
      saveProgress(p);
    },
    getProgress: getProgress
  };

  function showBadgeNotification(badge) {
    const el = document.createElement('div');
    el.className = 'badge-notification';
    el.innerHTML = '<span class="badge-notif-icon">' + badge.icon + '</span>' +
      '<div><strong>' + badge.label + '</strong><br><small>' + badge.desc + '</small></div>';
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('visible'); });
    setTimeout(function () {
      el.classList.remove('visible');
      setTimeout(function () { el.remove(); }, 400);
    }, 3500);
    launchConfetti();
  }

  function launchConfetti() {
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99999';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    var particles = [];
    var colors = ['#6aa6ff', '#22d3ee', '#22c55e', '#f59e0b', '#ef4444', '#b495ff'];
    for (var i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10 - Math.random() * 40,
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 4,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * 360,
        vr: (Math.random() - 0.5) * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1
      });
    }
    var start = performance.now();
    function frame(now) {
      var elapsed = now - start;
      if (elapsed > 2500) { canvas.remove(); return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.rot += p.vr;
        p.life = Math.max(0, 1 - elapsed / 2500);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * Math.PI / 180);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function injectXPBar() {
    // Only inject on progression pages or pages with #timeline
    var target = document.getElementById('timeline') || document.getElementById('main');
    if (!target) return;

    var p = getProgress();
    var level = getLevel(p.xp);
    var nextLevel = LEVELS[LEVELS.indexOf(level) + 1] || level;

    var bar = document.createElement('div');
    bar.className = 'xp-bar-container';
    bar.innerHTML =
      '<div class="xp-header">' +
        '<span class="xp-level">' + level.icon + ' Niveau : <strong>' + level.label + '</strong></span>' +
        '<span class="xp-pct">' + p.xp + '%</span>' +
      '</div>' +
      '<div class="xp-track">' +
        '<div class="xp-fill" style="width:' + p.xp + '%;background:linear-gradient(90deg,' + level.color + ',' + (nextLevel.color || level.color) + ')"></div>' +
      '</div>' +
      '<div class="xp-badges">' +
        p.badges.map(function (b) {
          var badge = BADGES[b];
          return badge ? '<span class="xp-badge" title="' + badge.desc + '">' + badge.icon + ' ' + badge.label + '</span>' : '';
        }).join('') +
        (p.badges.length === 0 ? '<span class="xp-badge-empty">Aucun badge pour le moment — explore les cours et QCM !</span>' : '') +
      '</div>';

    target.parentNode.insertBefore(bar, target);
  }

  function injectStyles() {
    var style = document.createElement('style');
    style.textContent =
      '.xp-bar-container{background:var(--card,#151b34);border:1px solid var(--border,#28314f);border-radius:16px;padding:18px 20px;margin:16px 0 24px}' +
      '.xp-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}' +
      '.xp-level{font-size:1rem;color:var(--text,#eef2ff)}' +
      '.xp-pct{font-family:monospace;font-size:1.1rem;color:var(--accent,#22d3ee);font-weight:700}' +
      '.xp-track{height:14px;background:var(--bg2,#11162a);border-radius:10px;overflow:hidden}' +
      '.xp-fill{height:100%;border-radius:10px;transition:width 1s ease-out}' +
      '.xp-badges{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}' +
      '.xp-badge{display:inline-flex;align-items:center;gap:4px;background:var(--bg2,#11162a);border:1px solid var(--border,#28314f);border-radius:20px;padding:4px 12px;font-size:.82rem;color:var(--text,#eef2ff)}' +
      '.xp-badge-empty{font-size:.85rem;color:var(--muted,#a2b0d6);font-style:italic}' +
      '.badge-notification{position:fixed;bottom:80px;right:24px;background:var(--card,#151b34);border:1px solid var(--accent,#22d3ee);border-radius:16px;padding:14px 20px;display:flex;align-items:center;gap:12px;z-index:10000;transform:translateX(120%);transition:transform .4s cubic-bezier(.17,.67,.3,1.2);box-shadow:0 8px 32px rgba(0,0,0,.4)}' +
      '.badge-notification.visible{transform:translateX(0)}' +
      '.badge-notif-icon{font-size:2rem}';
    document.head.appendChild(style);
  }

  function init() {
    injectStyles();
    trackPageVisit();
    injectXPBar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
