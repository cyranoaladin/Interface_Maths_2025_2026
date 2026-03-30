import { clearToken, fetchWithAuth } from './auth.js';
import { findStudentBilan, renderBilan, escapeHtml, canonicalizeName } from './bilans.js';

function withBase(path) { return (location.pathname.startsWith('/content/') ? '/content' : '') + path; }

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
          const res = await fetchWithAuth('/api/v1/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ new_password: val }) });
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
      const res = await fetchWithAuth('/api/v1/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ new_password: pwd }) });
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






