import { fetchWithAuth } from './auth.js';
function withBase(path) { return (location.pathname.startsWith('/content/') ? '/content' : '') + path; }

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
  try {
    const res = await fetchWithAuth(`/groups/${encodeURIComponent(code)}/students`);
    const students = await res.json();
    const html = [`<table class="table-simple"><thead><tr><th>Nom</th><th>Email</th></tr></thead><tbody>`];
    students.forEach(s => html.push(`<tr><td>${escapeHtml(normalizeName(s.full_name || ''))}</td><td>${escapeHtml(s.email)}</td></tr>`));
    html.push('</tbody></table>');
    setPanel(name, html.join(''));
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

document.addEventListener('DOMContentLoaded', init);
