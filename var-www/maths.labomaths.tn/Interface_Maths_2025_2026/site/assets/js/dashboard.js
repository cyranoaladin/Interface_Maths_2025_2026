import { apiJson, logout, withBase } from './api-client.js';
import { renderBilan, escapeHtml } from './bilans.js';
let lastGroup = null;

async function init() {
  // Fetch profile
  const me = await apiJson('/auth/me');
  if (me.role === 'student') { location.href = withBase('/student.html'); return; }
  const sub = document.getElementById('user-subtitle');
  if (sub) sub.textContent = `${me.full_name || me.email} — ${me.role === 'admin' ? 'Administration' : 'Enseignant'}`;

  // Role-based menu
  const teacherBox = document.getElementById('teacher-groups');
  if ((me.role === 'teacher' || me.role === 'admin') && teacherBox) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `<h3 class="small" style="margin:10px 0">Groupes</h3>`;
    teacherBox.appendChild(wrap);
    try {
      const groups = await apiJson('/groups/');
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
    renderOverview(me);
  });
  await renderOverview(me);
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await logout();
    location.href = withBase('/index.html');
  });
}

async function loadGroup(code, name) {
  setPanel(name, `<p>Chargement des élèves…</p>`);
  lastGroup = { code, name };
  try {
    const students = await apiJson(`/groups/${encodeURIComponent(code)}/students`);
    const evaluations = await apiJson(`/teacher/groups/${encodeURIComponent(code)}/evaluations`);
    const html = [
      `<p class="small">${students.length} élève(s) · ${evaluations.length} évaluation(s)</p>`,
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
        `<a href="#" class="bilan-btn" data-id="${s.id}" data-email="${escapeHtml(email)}" data-name="${escapeHtml(fullName)}">Voir bilan</a>` +
        ` &nbsp; ` +
        `<button type="button" class="reset-btn" data-email="${escapeHtml(email)}" aria-label="Réinitialiser le mot de passe de ${escapeHtml(fullName)}">Réinitialiser</button>` +
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
        const studentId = a.getAttribute('data-id') || '';
        const fullName = a.getAttribute('data-name') || '';
        showBilanForStudent(studentId, fullName, name);
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



function normalizeName(name) {
  // Remove leading non-alphanumeric (including leading '*') and trim
  return String(name || '').replace(/^[^0-9A-Za-zÀ-ÖØ-öø-ÿ]+/, '').trim();
}

// ====== Bilans (enseignant) ======
// Copie utilitaires depuis student.js pour le rapprochement et rendu






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
  const sure = confirm(`Réinitialiser le mot de passe pour\n${email} ?`);
  if (!sure) return;
  try {
    const data = await apiJson('/auth/reset-student-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
    });
    prompt(`Mot de passe réinitialisé. Copiez le nouveau mot de passe temporaire :`, data.temp_password);
    showToast('Mot de passe réinitialisé.', 'success');
  } catch (error) {
    showToast(error.message || 'Erreur réseau.', 'error');
  }
}

// ====== Bilans (enseignant) ======
async function showBilanForStudent(studentId, fullName, groupTitle) {
  try {
    const reports = await apiJson(`/teacher/students/${encodeURIComponent(studentId)}/reports`);
    if (!reports.length) {
      const back = `<p><a href="#" id="back-to-group">← Retour</a></p>`;
      setPanel(`Bilan — ${groupTitle}`, back + '<p>Aucun bilan correspondant pour cet élève.</p>');
      document.getElementById('back-to-group')?.addEventListener('click', (e) => { e.preventDefault(); if (lastGroup) loadGroup(lastGroup.code, lastGroup.name); });
      return;
    }
    const report = reports[0];
    const html = renderBilan(report);
    const back = `<p style="margin:0 0 10px 0"><a href="#" id="back-to-group">← Retour</a></p>`;
    setPanel(`Bilan — ${escapeHtml(report.evaluation_title || fullName)}`, back + html);
    document.getElementById('back-to-group')?.addEventListener('click', (e) => { e.preventDefault(); if (lastGroup) loadGroup(lastGroup.code, lastGroup.name); });
  } catch {
    const back = `<p><a href="#" id="back-to-group">← Retour</a></p>`;
    setPanel('Bilans', back + '<p>Aucun bilan disponible pour ce niveau.</p>');
    document.getElementById('back-to-group')?.addEventListener('click', (e) => { e.preventDefault(); if (lastGroup) loadGroup(lastGroup.code, lastGroup.name); });
  }
}

async function renderOverview(me) {
  try {
    const groups = await apiJson('/groups/');
    const resources = await apiJson('/resources/my');
    setPanel('Aperçu', `
      <p>Bonjour ${escapeHtml(me.first_name || me.full_name || me.email)}.</p>
      <div class="cards">
        <div class="card"><strong>Rôle</strong><br>${escapeHtml(me.role)}</div>
        <div class="card"><strong>Groupes accessibles</strong><br>${groups.length}</div>
        <div class="card"><strong>Ressources visibles</strong><br>${resources.length}</div>
      </div>
      <p class="small">Les groupes, élèves et bilans sont filtrés par le backend.</p>
    `);
  } catch {
    setPanel('Aperçu', '<p>Bienvenue dans votre espace.</p>');
  }
}
