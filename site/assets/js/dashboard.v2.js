import { fetchWithAuth } from './auth.js';
let lastGroup = null;
document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    const me = await (await fetchWithAuth('/api/v1/session')).json();
    if (me.role === 'student') {
      location.href = '/content/student.html';
      return;
    }
    const sub = document.getElementById('user-subtitle');
    if (sub) sub.textContent = (me.full_name || me.email) + ' — Enseignant';

    const box = document.getElementById('teacher-groups');
    if (!box) return;

    const groups = await (await fetchWithAuth('/groups/my')).json();
    if (!groups || groups.length === 0) {
      box.innerHTML = '<h3>Groupes</h3><nav>Aucun groupe</nav>';
      return;
    }

    const listHtml = groups.map(g => `<a href="#" data-group-code="${g.code}" class="group-item">${g.name}</a>`).join('');
    box.innerHTML = `<h3>Groupes</h3><nav>${listHtml}</nav>`;

    box.addEventListener('click', async (e) => {
      e.preventDefault();
      const target = e.target.closest('a[data-group-code]');
      if (target) {
        document.querySelectorAll('.group-item').forEach(el => el.classList.remove('active'));
        target.classList.add('active');
        const groupCode = target.dataset.groupCode;
        if (lastGroup !== groupCode) {
          lastGroup = groupCode;
          document.getElementById('panel-title').textContent = groups.find(g => g.code === groupCode).name;
          await showStudentsForGroup(groupCode);
        }
      }
    });

    if (groups.length > 0) {
      box.querySelector(`a[data-group-code]`).click();
    }
  } catch (e) { console.error("Erreur d'initialisation du dashboard:", e); }
}

async function showStudentsForGroup(groupCode) {
  const panelBody = document.getElementById('panel-body');
  panelBody.innerHTML = 'Chargement des élèves...';
  const students = await (await fetchWithAuth(`/groups/${groupCode}/students`)).json();
  const cardsHtml = `
    <div class="students-grid fade-in">
      ${students.map(s => {
    const clean = (t) => String(t || '').replace(/^\*+/, '').replace(/\s+/g, ' ').trim();
    const first = clean(s.first_name);
    const last = clean(s.last_name);
    const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || '∑';
    const name = clean(`${first} ${last}`) || clean(s.full_name) || s.email;
    return `
          <div class="student-card">
            <div style="display:flex;align-items:center;margin-bottom:10px">
              <div class="student-initials">${initials}</div>
              <div class="student-name">${name}</div>
            </div>
            <a href="#" class="btn-primary" data-email="${s.email}" data-fullname="${name}">Voir bilan</a>
          </div>`;
  }).join('')}
    </div>`;
  panelBody.innerHTML = cardsHtml;

  panelBody.querySelectorAll('a[data-email]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const email = e.target.dataset.email;
      const fullName = e.target.dataset.fullname;
      showBilanForStudent(email, fullName);
    });
  });
}

async function showBilanForStudent(email, fullName) {
  const panelBody = document.getElementById('panel-body');
  panelBody.innerHTML = 'Chargement du bilan...';
  try {
    // Déterminer les fichiers bilans en fonction du groupe courant
    let candidateUrls = [];
    const lg = String(lastGroup || '');
    if (lg.startsWith('P-EDS')) {
      // Première: standard unique
      candidateUrls = [
        '/content/EDS_premiere/Second_Degre/bilans_eval1_second_degre.json',
      ];
    } else if (lg.startsWith('T-EDS')) {
      // Terminale: (ajouter si fichier disponible)
      candidateUrls = [];
    }

    // Charger en cascade les datasets existants
    let datasets = [];
    for (const url of candidateUrls) {
      try {
        const r = await fetch(url);
        if (r.ok) {
          const arr = await r.json();
          if (Array.isArray(arr)) datasets = datasets.concat(arr);
        }
      } catch (_) { /* ignore */ }
    }
    if (!datasets.length) throw new Error('Aucun fichier bilan disponible');

    // Normalisation robuste des noms (casse, accents, tirets, espaces)
    const norm = (s) => String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ') // keep letters/digits, collapse others to space
      .trim()
      .replace(/\s+/g, ' ');

    const emailLc = String(email || '').toLowerCase().trim();
    const fullNorm = norm(fullName);
    const parts = fullNorm.split(' ').filter(Boolean);
    const reversed = norm(parts.slice(1).concat(parts[0] || '').join(' '));
    const stripVowels = (s) => s.replace(/[aeiouy]/g, '');
    const lev1 = (a, b) => {
      a = String(a || ''); b = String(b || '');
      if (a === b) return true;
      if (Math.abs(a.length - b.length) > 1) return false;
      // simple edit distance <=1
      let i = 0, j = 0, edits = 0;
      while (i < a.length && j < b.length) {
        if (a[i] === b[j]) { i++; j++; continue; }
        edits++; if (edits > 1) return false;
        if (a.length > b.length) { i++; }
        else if (b.length > a.length) { j++; }
        else { i++; j++; }
      }
      edits += (a.length - i) + (b.length - j);
      return edits <= 1;
    };
    const tokenSimilar = (a, b) => {
      if (!a || !b) return false;
      if (a === b) return true;
      if (stripVowels(a) === stripVowels(b)) return true;
      if (lev1(a, b)) return true;
      return false;
    };

    const isMatch = (b) => {
      const bEmail = String(b.eleve || b.email || '').toLowerCase().trim();
      if (bEmail && bEmail === emailLc) return true;
      const bName = norm(b.nom_prenom || b.eleve || '');
      if (!bName) return false;
      const bTokens = bName.split(' ').filter(Boolean);
      const fTokens = parts.length ? parts : fullNorm.split(' ').filter(Boolean);
      // Exiger au moins 2 correspondances approximatives si possible
      let matches = 0;
      for (const t of fTokens) {
        if (bTokens.some(bt => tokenSimilar(t, bt))) matches++;
      }
      if (fTokens.length >= 2 && bTokens.length >= 2) return matches >= 2;
      return matches >= 1;
    };

    let studentBilan = datasets.find(isMatch);

    // Fallbacks si non trouvé: matching approximatif par similarité de tokens et préfixe d'email
    if (!studentBilan) {
      const emailUser = String(email || '').toLowerCase().trim();
      const emailUserId = emailUser.split('@')[0] || '';
      const tokensFull = new Set(fullNorm.split(' ').filter(Boolean));
      const jaccard = (a, b) => {
        const A = new Set(a); const B = new Set(b);
        let inter = 0; A.forEach(t => { if (B.has(t)) inter++; });
        const uni = new Set([...A, ...B]).size || 1;
        return inter / uni;
      };
      let best = { rec: null, score: 0 };
      for (const b of datasets) {
        const bName = norm(b.nom_prenom || b.eleve || '');
        const bTokens = bName.split(' ').filter(Boolean);
        const bNoSpace = bName.replace(/\s+/g, '');
        const fNoSpace = fullNorm.replace(/\s+/g, '');
        let simCount = 0;
        for (const t of parts) if (bTokens.some(bt => tokenSimilar(t, bt))) simCount++;
        let score = simCount / Math.max(1, parts.length, bTokens.length);
        if (emailUserId && bName.includes(emailUserId)) score += 0.2;
        if (bNoSpace === fNoSpace) score += 0.3;
        if (total > best.score) best = { rec: b, score: total };
      }
      if (best.rec && best.score >= 0.5) {
        studentBilan = best.rec;
      }
    }

    // Fallback "Absente" pour Première si toujours non trouvé
    if (!studentBilan && String(lastGroup || '').startsWith('P-EDS')) {
      studentBilan = {
        nom_prenom: fullName,
        eleve: email,
        email: email,
        note_finale: 0,
        mention: 'Absente',
        bilan_personnalise: {
          points_forts: [],
          axes_amelioration: [],
          conseils: [],
          appreciation_finale: ''
        },
        recapitulatif_exercices: [],
        _audit: { barreme_total: 20, notes_total: 0, issues: ['absence'] }
      };
    }

    if (studentBilan) {
      const toNumber = (v, def = 0) => {
        if (typeof v === 'number') return Number.isFinite(v) ? v : def;
        const n = parseFloat(String(v ?? '').replace(',', '.').trim());
        return Number.isFinite(n) ? n : def;
      };
      const got = toNumber(studentBilan.note_finale ?? studentBilan.note ?? 0, 0);
      const total = toNumber(studentBilan.bareme ?? (studentBilan._audit && studentBilan._audit.barreme_total) ?? 20, 20);
      const pct = Math.max(0, Math.min(100, Math.round((got / (total || 20)) * 100)));
      const donut = `
        <svg class="donut" viewBox="0 0 36 36" aria-label="Score ${pct}%">
          <path style="fill:none; stroke:#2D3748; stroke-width:3.8" d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          <path style="fill:none; stroke:#4FD1C5; stroke-width:3.8; stroke-linecap:round; stroke-dasharray:${pct}, 100" d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          <text x="18" y="20.35" style="fill:#E2E8F0" font-size="8" text-anchor="middle">${got}/${total}</text>
        </svg>`;
      const mapped = Array.isArray(studentBilan.recapitulatif_exercices)
        ? studentBilan.recapitulatif_exercices.map(e => ({
          question: e.exercice,
          note: toNumber(e.note, 0),
          bareme: toNumber(e.bareme, 0),
          remarque: e.commentaire || '',
        }))
        : Array.isArray(studentBilan.questions) ? studentBilan.questions : [];
      const questionsHtml = mapped.map(q => `
        <details class="question-item ${q.note > 0 ? 'correct' : 'incorrect'}">
          <summary>${q.question}</summary>
          <div>Note: ${q.note} / ${q.bareme}</div>
          <div>${q.remarque || ''}</div>
        </details>`).join('');
      const bp = studentBilan.bilan_personnalise || {};
      const pointsForts = Array.isArray(bp.points_forts) ? bp.points_forts : [];
      const axes = Array.isArray(bp.axes_amelioration) ? bp.axes_amelioration : [];
      const conseils = Array.isArray(bp.conseils) ? bp.conseils : [];
      const appreciation = bp.appreciation_finale || '';
      const mention = (studentBilan.mention || '').trim();
      const bilanHtml = `
        <div class="bilan-box fade-in">
          <div style="display:flex;gap:16px;align-items:center;margin-bottom:12px">
            ${donut}
            <div>
              <h3 style="margin:0">Bilan de ${studentBilan.nom_prenom || studentBilan.eleve}</h3>
              <div class="muted">Score ${pct}%${mention ? ` • ${mention}` : ''}</div>
            </div>
          </div>
          <div class="questions-list">${questionsHtml || '<div>Détail des questions non disponible</div>'}</div>
          <div class="bilan-sections" style="display:grid; gap:12px; margin-top:12px">
            ${pointsForts.length ? `<div class=\"card\"><h4><svg data-lucide=\"check-circle\" width=\"18\" height=\"18\"></svg> Points forts</h4><ul>${pointsForts.map(x => `<li>${x}</li>`).join('')}</ul></div>` : ''}
            ${axes.length ? `<div class=\"card\"><h4><svg data-lucide=\"x-circle\" width=\"18\" height=\"18\"></svg> Axes d'amélioration</h4><ul>${axes.map(x => `<li>${x}</li>`).join('')}</ul></div>` : ''}
            ${conseils.length ? `<div class=\"card\"><h4><svg data-lucide=\"info\" width=\"18\" height=\"18\"></svg> Conseils</h4><ul>${conseils.map(x => `<li>${x}</li>`).join('')}</ul></div>` : ''}
            ${appreciation ? `<div class=\"card\"><h4><svg data-lucide=\"quote\" width=\"18\" height=\"18\"></svg> Appréciation</h4><p>${appreciation}</p></div>` : ''}
          </div>
        </div>
        <a href=\"#\" id=\"back-to-students\" class=\"btn-secondary\" style=\"margin-top:12px;display:inline-block\">Retour à la liste</a>`;
      panelBody.innerHTML = bilanHtml;
      try { window.lucide && window.lucide.createIcons && window.lucide.createIcons(); } catch (_) {}
      const back1 = panelBody.querySelector('#back-to-students');
      if (back1) back1.addEventListener('click', async e => {
        e.preventDefault();
        if (lastGroup) {
          await showStudentsForGroup(lastGroup);
        } else {
          const active = document.querySelector('.group-item.active');
          if (active) active.click();
        }
      });
    } else {
      panelBody.innerHTML = `<p>Bilan non trouvé pour l'élève ${fullName} (${email}).</p><a href="#" id="back-to-students" class="btn-secondary">Retour à la liste</a>`;
      const back2 = panelBody.querySelector('#back-to-students');
      if (back2) back2.addEventListener('click', async e => {
        e.preventDefault();
        if (lastGroup) {
          await showStudentsForGroup(lastGroup);
        } else {
          const active = document.querySelector('.group-item.active');
          if (active) active.click();
        }
      });
    }
  } catch (error) {
    panelBody.innerHTML = `<p>Erreur: ${error.message}</p>`;
  }
}
