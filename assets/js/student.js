import { clearToken, fetchWithAuth } from './auth.js';

function withBase(path) { return (location.pathname.startsWith('/content/') ? '/content' : '') + path; }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c])); }
let currentUser = null;

async function init() {
  const sub = document.getElementById('student-subtitle');
  const meRes = await fetchWithAuth('/api/v1/session');
  const me = await meRes.json();
  currentUser = me;
  if (sub) sub.textContent = `${me.full_name || me.email} — Élève`;

  // Forcer changement de mot de passe à la première connexion (flag posé par auth.js)
  try {
    if (localStorage.getItem('first_login') === '1') {
      localStorage.removeItem('first_login');
      setPanel('Sécurité', `
        <p><strong>Veuillez changer votre mot de passe maintenant.</strong></p>
        <div style="display:flex; gap:8px; align-items:center">
          <input id="new-pw" class="input" type="password" placeholder="Nouveau mot de passe (8+)" style="max-width:280px" />
          <button id="do-change" class="btn">Valider</button>
        </div>
      `);
      document.getElementById('do-change')?.addEventListener('click', async () => {
        const field = document.getElementById('new-pw');
        const val = field && field.value ? String(field.value) : '';
        if (val.length < 8) { alert('Mot de passe trop court'); return; }
        try {
          const res = await fetchWithAuth('/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ new_password: val }) });
          if (!res.ok) throw new Error('Erreur');
          alert('Mot de passe mis à jour.');
          setPanel('Aperçu', `
            <p>Bienvenue dans votre espace. Retrouvez vos <strong>ressources</strong>, vos <strong>bilans</strong> et vos informations personnelles au même endroit.</p>
            <ul>
              <li>Consultez les supports de cours et exercices dans l’onglet Ressources</li>
              <li>Suivez vos évaluations et progressez grâce au bilan personnalisé</li>
              <li>Vous pouvez changer votre mot de passe à tout moment</li>
            </ul>
          `);
        } catch { alert('Échec de mise à jour.'); }
      });
    }
  } catch {}

  // Liens ressources
  document.getElementById('s-resources')?.addEventListener('click', async (e) => {
    e.preventDefault();
    // Pour Première EDS par défaut
    const links = [withBase('/EDS_premiere/index.html')];
    const body = ['<div class="cards">'];
    links.forEach(href => body.push(`<a class="card-link" href="${href}">Ressources — Première EDS</a>`));
    body.push('</div>');
    setPanel('Ressources', body.join(''));
  });

  // Bilans évaluations (Première EDS: JSON existant)
  try {
    const evalBox = document.getElementById('s-evals');
    if (evalBox) {
      const title = document.createElement('h3'); title.className = 'small'; title.textContent = 'Bilans évaluations'; evalBox.appendChild(title);
      const btn = document.createElement('a'); btn.href = '#'; btn.textContent = 'Voir mes bilans';
      btn.addEventListener('click', async (e) => { e.preventDefault(); await showBilans(); });
      evalBox.appendChild(btn);
    }
  } catch {}

  document.getElementById('s-overview')?.addEventListener('click', (e) => {
    e.preventDefault();
    setPanel('Aperçu', `
      <p>Bienvenue dans votre espace. Retrouvez vos <strong>ressources</strong>, vos <strong>bilans</strong> et vos informations personnelles au même endroit.</p>
      <ul>
        <li>Consultez les supports de cours et exercices dans l’onglet Ressources</li>
        <li>Suivez vos évaluations et progressez grâce au bilan personnalisé</li>
        <li>Vous pouvez changer votre mot de passe à tout moment</li>
      </ul>
    `);
  });

  // Changer mot de passe
  document.getElementById('change-pw-btn')?.addEventListener('click', async () => {
    const pwd = prompt('Nouveau mot de passe (8+ caractères)');
    if (!pwd || pwd.length < 8) { alert('Mot de passe trop court'); return; }
    try {
      const res = await fetchWithAuth('/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ new_password: pwd }) });
      if (!res.ok) throw new Error('Erreur');
      alert('Mot de passe mis à jour.');
    } catch { alert('Échec de mise à jour.'); }
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => { clearToken(); location.href = withBase('/index.html'); });
}

async function showResourcesForGroup(g) {
  // Simple: lister des liens directs selon code
  const links = [
    g.code.startsWith('P-EDS') ? withBase('/EDS_premiere/index.html') : null,
    g.code.startsWith('T-EDS') ? withBase('/EDS_terminale/index.html') : null,
    g.code.startsWith('MX') ? withBase('/Maths_expertes/index.html') : null,
  ].filter(Boolean);
  const body = ['<div class="cards">'];
  links.forEach(href => body.push(`<a class="card-link" href="${href}">Ressources ${escapeHtml(g.name)}</a>`));
  body.push('</div>');
  setPanel(g.name, body.join(''));
}

async function showBilans() {
  // Première EDS: charger JSON Second Degré si présent
  try {
    const data = await loadSecondDegreBilans();
    // Afficher directement le bilan (évite doublon carte + bilan)
    const studentBilan = findStudentBilan(data, currentUser);
    if (!studentBilan) {
      setPanel('Bilans', '<p>Aucun bilan correspondant à votre profil.</p>');
      return;
    }
    const html = renderBilan(studentBilan);
    setPanel('Bilan — Évaluation n°1 sur les fonctions de second degré et forme canonique', html);
  } catch {
    setPanel('Bilans', '<p>Aucun bilan disponible pour votre niveau.</p>');
  }
}

async function loadSecondDegreBilans() {
  const url = withBase('/EDS_premiere/Second_Degre/bilans_eval1_second_degre.json');
  const r = await fetch(url);
  if (!r.ok) throw new Error('not found');
  return await r.json();
}

function setPanel(title, html) {
  const t = document.getElementById('s-panel-title'); if (t) t.textContent = title;
  const b = document.getElementById('s-panel-body'); if (b) b.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', init);

function findStudentBilan(data, me) {
  if (!data || !me) return null;
  const email = (me.email || '').trim().toLowerCase();
  const full = (me.full_name || '').trim();
  const normFull = canonicalizeName(full);

  // cas: tableau de bilans
  if (Array.isArray(data)) {
    // 1) correspondance stricte par champs email potentiels
    const emailKeys = ['email', 'mail', 'adresse e-mail', 'Adresse E-mail', 'Email'];
    let rec = data.find(d => emailKeys.some(k => String((d && d[k]) || '').trim().toLowerCase() === email));
    if (rec) return rec;
    // 2) correspondance par nom complet normalisé vs champ nom_prenom (ou équivalents)
    const nameKeys = ['nom_prenom', 'Nom', 'nom', 'full_name'];
    rec = data.find(d => {
      const candidate = canonicalizeName(String((d && (d.nom_prenom || d.Nom || d.nom || d.full_name)) || ''));
      return candidate && candidate === normFull;
    });
    if (rec) return rec;
    // 3) fallback: recherche tokenisée dans l'objet entier
    rec = data.find(d => {
      const s = canonicalizeName(JSON.stringify(d || {}));
      return s.includes(normFull);
    });
    return rec || null;
  }
  // cas: dictionnaire par email
  if (typeof data === 'object' && data) {
    if (data[email]) return data[email];
    const students = Array.isArray(data.students) ? data.students : [];
    const rec = students.find(d => String((d && (d.email || d.mail)) || '').trim().toLowerCase() === email);
    if (rec) return rec;
  }
  return null;
}

function canonicalizeName(input) {
  const s = String(input || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .replace(/[^\p{L}\p{N}\s'-]+/gu, ' ')
    .trim()
    .toLowerCase();
  if (!s) return '';
  // éclater en tokens, trier pour ignorer l’ordre des noms composés
  const tokens = s.split(/\s+/g).filter(Boolean);
  tokens.sort();
  return tokens.join(' ');
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
