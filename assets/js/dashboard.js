import { fetchWithAuth } from './auth.js';
function withBase(path) { return (location.pathname.startsWith('/content/') ? '/content' : '') + path; }
let lastGroup = null;

async function init() {
  // Fetch profile
  const meRes = await fetchWithAuth('/api/v1/session');
  const me = await meRes.json();
  if (me.role === 'student') { location.href = withBase('/student.html'); return; }
  const sub = document.getElementById('user-subtitle');
  if (sub) sub.textContent = `${me.full_name || me.email} — ${me.role === 'teacher' ? 'Enseignant' : 'Élève'}`;

  // Role-based menu
  const teacherBox = document.getElementById('teacher-groups');
  if (me.role === 'teacher' && teacherBox) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `<h3 class="small" style="margin:10px 0">Groupes</h3>`;
    teacherBox.appendChild(wrap);
    try {
      const gr = await fetchWithAuth('/groups/');
      const groups = await gr.json();
      const list = document.createElement('div');
      groups.forEach(g => {
        const a = document.createElement('a');
        a.href = withBase(`#grp:${g.code}`);
        a.textContent = `${g.name}`;
        a.addEventListener('click', (ev) => {
          ev.preventDefault();
          loadGroup(g.code, g.name);
        });
        list.appendChild(a);
      });
      teacherBox.appendChild(list);
    } catch (_) { /* ignore */ }
  }

  // Default panel
  document.getElementById('lnk-overview')?.addEventListener('click', (e) => {
    e.preventDefault();
    setPanel('Aperçu', `<p>Bienvenue dans votre espace.</p>`);
  });
}

async function loadGroup(code, name) {
  setPanel(name, `<p>Chargement des élèves…</p>`);
  lastGroup = { code, name };
  try {
    const res = await fetchWithAuth(`/groups/${encodeURIComponent(code)}/students`);
    const students = await res.json();
    const html = [
      `<table class="table-simple"><thead><tr><th>Nom</th><th>Email</th><th>Actions</th></tr></thead><tbody>`
    ];
    students.forEach((s, idx) => {
      const fullName = normalizeName(s.full_name || '');
      const email = String(s.email || '');
      const row = [
        '<tr>',
        `<td>${escapeHtml(fullName)}</td>`,
        `<td>${escapeHtml(email)}</td>`,
        `<td>` +
        `<a href="#" class="bilan-btn" data-email="${escapeHtml(email)}" data-name="${escapeHtml(fullName)}">Voir bilan</a>` +
        ` &nbsp; ` +
        `<button type="button" class="reset-btn" data-email="${escapeHtml(email)}">Réinitialiser</button>` +
        `</td>`,
        '</tr>'
      ].join('');
      html.push(row);
    });
    html.push('</tbody></table>');
    setPanel(name, html.join(''));
    // Attacher les actions
    const body = document.getElementById('panel-body');
    body?.querySelectorAll('a.bilan-btn').forEach(a => {
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        const email = a.getAttribute('data-email') || '';
        const fullName = a.getAttribute('data-name') || '';
        showBilanForStudent(email, fullName, name);
      });
    });
    body?.querySelectorAll('button.reset-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const email = btn.getAttribute('data-email') || '';
        await resetStudentPassword(email);
      });
    });
  } catch (_) { setPanel(name, `<p>Erreur de chargement.</p>`); }
}

function setPanel(title, bodyHtml) {
  const t = document.getElementById('panel-title'); if (t) t.textContent = title;
  const b = document.getElementById('panel-body'); if (b) b.innerHTML = bodyHtml;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]));
}

function normalizeName(name) {
  // Remove leading non-alphanumeric (including leading '*') and trim
  return String(name || '').replace(/^[^0-9A-Za-zÀ-ÖØ-öø-ÿ]+/, '').trim();
}

// ====== Bilans (enseignant) ======
// Copie utilitaires depuis student.js pour le rapprochement et rendu
function canonicalizeName(input) {
  const s = String(input || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .replace(/[^\p{L}\p{N}\s'-]+/gu, ' ')
    .trim()
    .toLowerCase();
  if (!s) return '';
  const tokens = s.split(/\s+/g).filter(Boolean);
  tokens.sort();
  return tokens.join(' ');
}

function findStudentBilan(data, me) {
  if (!data || !me) return null;
  const email = (me.email || '').trim().toLowerCase();
  const full = (me.full_name || '').trim();
  const normFull = canonicalizeName(full);
  if (Array.isArray(data)) {
    const emailKeys = ['email', 'mail', 'adresse e-mail', 'Adresse E-mail', 'Email'];
    let rec = data.find(d => emailKeys.some(k => String((d && d[k]) || '').trim().toLowerCase() === email));
    if (rec) return rec;
    const nameKeys = ['nom_prenom', 'Nom', 'nom', 'full_name'];
    rec = data.find(d => {
      const candidate = canonicalizeName(String((d && (d.nom_prenom || d.Nom || d.nom || d.full_name)) || ''));
      return candidate && candidate === normFull;
    });
    if (rec) return rec;
    rec = data.find(d => {
      const s = canonicalizeName(JSON.stringify(d || {}));
      return s.includes(normFull);
    });
    return rec || null;
  }
  if (typeof data === 'object' && data) {
    if (data[email]) return data[email];
    const students = Array.isArray(data.students) ? data.students : [];
    const rec = students.find(d => String((d && (d.email || d.mail)) || '').trim().toLowerCase() === email);
    if (rec) return rec;
  }
  return null;
}

function renderBilan(b) {
  const nom = escapeHtml(b.nom_prenom || '');
  const note = typeof b.note_finale === 'number' ? String(b.note_finale) : escapeHtml(b.note_finale || '');
  const mention = escapeHtml(b.mention || '');
  const pers = b.bilan_personnalise || {};
  const pf = Array.isArray(pers.points_forts) ? pers.points_forts : [];
  const ax = Array.isArray(pers.axes_amelioration) ? pers.axes_amelioration : [];
  const conseils = Array.isArray(pers.conseils) ? pers.conseils : [];
  const appreciation = String(pers.appreciation_finale || '');
  const recap = Array.isArray(b.recapitulatif_exercices) ? b.recapitulatif_exercices : [];

  const tag = mention ? `<span class="badge">${mention}</span>` : '';
  const head = `
    <div class="card" style="border:1px solid var(--border); border-radius:16px; overflow:hidden">
      <div style="display:flex; justify-content:space-between; align-items:center; padding:16px 18px; background:var(--panel);">
        <div>
          <h3 style="margin:0; font-size:1.25rem">${nom}</h3>
          <div style="opacity:.8; margin-top:4px">Évaluation n°1 — Fonctions de second degré et forme canonique</div>
          <div style="opacity:.7; margin-top:2px">le 26/09/2025</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:2rem; font-weight:800; line-height:1">${note}/20</div>
          ${tag}
        </div>
      </div>
  `;
  const list = (title, items, color) => {
    if (!items.length) return '';
    const lis = items.map(it => `<li>${escapeHtml(String(it))}</li>`).join('');
    return `
      <div class="card" style="margin-top:12px; border:1px solid var(--border); border-radius:14px;">
        <div style="padding:12px 16px; font-weight:700; color:${color}">${escapeHtml(title)}</div>
        <div style="padding:0 16px 12px">
          <ul style="margin:8px 0 0 18px;">${lis}</ul>
        </div>
      </div>
    `;
  };
  const appreciationBox = appreciation ? `
    <div class="card" style="margin-top:12px; border:1px solid var(--border); border-radius:14px;">
      <div style="padding:12px 16px; font-weight:700; color:var(--accent)">Appréciation finale</div>
      <div style="padding:0 16px 16px">${escapeHtml(appreciation)}</div>
    </div>
  ` : '';

  const table = recap.length ? `
    <div class="card" style="margin-top:12px; border:1px solid var(--border); border-radius:14px; overflow:hidden">
      <div style="padding:12px 16px; font-weight:700;">Récapitulatif des exercices</div>
      <div style="padding:0 16px 16px">
        <table class="table-simple">
          <thead><tr><th>Exercice</th><th>Barème</th><th>Note</th><th>Commentaire</th></tr></thead>
          <tbody>
            ${recap.map(r => `
              <tr>
                <td>${escapeHtml(String(r.exercice || ''))}</td>
                <td>${escapeHtml(String(r.bareme ?? ''))}</td>
                <td>${escapeHtml(String(r.note ?? ''))}</td>
                <td>${escapeHtml(String(r.commentaire || ''))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  ` : '';

  const body = `
    <div style="padding:14px 18px;">
      ${list('Points forts', pf, 'var(--success)')}
      ${list('Axes d’amélioration', ax, 'var(--warning)')}
      ${list('Conseils', conseils, 'var(--muted)')}
      ${appreciationBox}
      ${table}
    </div>
  `;
  return head + body + '</div>';
}

// ====== Toast util ======
function ensureToastContainer() {
  let el = document.getElementById('toast-container');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'toast-container';
  el.style.position = 'fixed';
  el.style.top = '12px';
  el.style.right = '12px';
  el.style.zIndex = '9999';
  el.style.display = 'flex';
  el.style.flexDirection = 'column';
  el.style.gap = '8px';
  document.body.appendChild(el);
  return el;
}

function showToast(message, type) {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  toast.textContent = String(message || '');
  toast.style.padding = '10px 12px';
  toast.style.borderRadius = '10px';
  toast.style.background = type === 'success' ? 'rgba(46, 204, 113, 0.95)' : type === 'error' ? 'rgba(231, 76, 60, 0.95)' : 'rgba(52, 152, 219, 0.95)';
  toast.style.color = '#fff';
  toast.style.boxShadow = '0 6px 24px rgba(0,0,0,.15)';
  container.appendChild(toast);
  setTimeout(() => { toast.style.transition = 'opacity .3s'; toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2200);
}

document.addEventListener('DOMContentLoaded', init);

// ====== Actions (enseignant)
async function resetStudentPassword(email) {
  if (!email) { alert('Email invalide'); return; }
  const sure = confirm(`Réinitialiser le mot de passe pour\n${email}\nvers "password123" ?`);
  if (!sure) return;
  try {
    const res = await fetchWithAuth('/auth/reset-student-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
    });
    if (!res.ok) {
      let msg = 'Échec de réinitialisation.';
      try { const err = await res.json(); if (err && err.detail) msg = String(err.detail); } catch {}
      showToast(msg, 'error');
      return;
    }
    showToast('Mot de passe réinitialisé à password123.', 'success');
  } catch {
    showToast('Erreur réseau.', 'error');
  }
}

// ====== Bilans (enseignant) ======
async function showBilanForStudent(email, fullName, groupTitle) {
  try {
    const data = await loadSecondDegreBilans();
    const meLike = { email, full_name: fullName };
    const studentBilan = findStudentBilan(data, meLike);
    if (!studentBilan) {
      const back = `<p><a href="#" id="back-to-group">← Retour</a></p>`;
      setPanel(`Bilan — ${groupTitle}`, back + '<p>Aucun bilan correspondant pour cet élève.</p>');
      document.getElementById('back-to-group')?.addEventListener('click', (e) => { e.preventDefault(); if (lastGroup) loadGroup(lastGroup.code, lastGroup.name); });
      return;
    }
    const html = renderBilan(studentBilan);
    const back = `<p style="margin:0 0 10px 0"><a href="#" id="back-to-group">← Retour</a></p>`;
    setPanel('Bilan — Évaluation n°1 sur les fonctions de second degré et forme canonique', back + html);
    document.getElementById('back-to-group')?.addEventListener('click', (e) => { e.preventDefault(); if (lastGroup) loadGroup(lastGroup.code, lastGroup.name); });
  } catch {
    const back = `<p><a href="#" id="back-to-group">← Retour</a></p>`;
    setPanel('Bilans', back + '<p>Aucun bilan disponible pour ce niveau.</p>');
    document.getElementById('back-to-group')?.addEventListener('click', (e) => { e.preventDefault(); if (lastGroup) loadGroup(lastGroup.code, lastGroup.name); });
  }
}

async function loadSecondDegreBilans() {
  // Try the checked file first, then fallback
  const checked = withBase('/EDS_premiere/Second_Degre/bilans_eval1second_degre.checked.json');
  const raw = withBase('/EDS_premiere/Second_Degre/bilans_eval1second_degre.json');
  try {
    const r1 = await fetch(checked);
    if (r1.ok) return await r1.json();
  } catch {}
  const r2 = await fetch(raw);
  if (!r2.ok) throw new Error('not found');
  return await r2.json();
}
