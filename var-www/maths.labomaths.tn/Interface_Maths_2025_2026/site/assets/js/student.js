import { apiJson, logout, withBase } from './api-client.js';
import { renderBilan, escapeHtml } from './bilans.js';


let currentUser = null;

async function init() {
  const sub = document.getElementById('student-subtitle');
  const me = await apiJson('/auth/me');
  currentUser = me;
  if (me.role !== 'student') {
    location.href = withBase('/dashboard.html');
    return;
  }
  if (sub) sub.textContent = `${me.full_name || me.email} — Élève`;
  await renderOverview();

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
          await apiJson('/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ new_password: val }) });
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
    try {
      const resources = await apiJson('/resources/my');
      const body = ['<div class="cards">'];
      if (!resources.length) {
        body.push('<p>Aucune ressource disponible pour vos groupes.</p>');
      }
      for (const resource of resources) {
        body.push(`
          <a class="card-link" href="${withBase(resource.url || '#')}">
            <strong>${escapeHtml(resource.title)}</strong>
            <span class="small">${escapeHtml([resource.level, resource.chapter, resource.type].filter(Boolean).join(' · '))}</span>
          </a>
        `);
      }
      body.push('</div>');
      setPanel('Ressources', body.join(''));
    } catch (e) {
      setPanel('Ressources', '<p>Erreur de chargement des ressources.</p>');
    }
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
    renderOverview();
  });

  // Changer mot de passe (panel in-page, pas de prompt)
  document.getElementById('change-pw-btn')?.addEventListener('click', () => {
    setPanel('Changer le mot de passe', `
      <div style="max-width:400px">
        <label for="new-pw-1">Nouveau mot de passe (8+ caractères)</label>
        <input id="new-pw-1" class="input" type="password" placeholder="Nouveau mot de passe" style="width:100%;margin:6px 0" />
        <label for="new-pw-2">Confirmer le mot de passe</label>
        <input id="new-pw-2" class="input" type="password" placeholder="Confirmer" style="width:100%;margin:6px 0" />
        <div id="pw-feedback" style="min-height:24px;margin:6px 0;font-size:.9rem"></div>
        <button id="do-pw-change" class="btn" style="margin-top:6px">Valider</button>
      </div>
    `);
    document.getElementById('do-pw-change')?.addEventListener('click', async () => {
      const p1 = document.getElementById('new-pw-1')?.value || '';
      const p2 = document.getElementById('new-pw-2')?.value || '';
      const fb = document.getElementById('pw-feedback');
      if (p1.length < 8) { if (fb) fb.textContent = 'Mot de passe trop court (8 caractères minimum)'; return; }
      if (p1 !== p2) { if (fb) fb.textContent = 'Les mots de passe ne correspondent pas'; return; }
      try {
        await apiJson('/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ new_password: p1 }) });
        setPanel('Mot de passe', '<p style="color:#22c55e">Mot de passe mis à jour avec succès.</p>');
      } catch { if (fb) fb.textContent = 'Échec de mise à jour.'; }
    });
  });

  document.getElementById('logout-btn')?.addEventListener('click', async () => { await logout(); location.href = withBase('/index.html'); });
}

async function showBilans() {
  try {
    const evaluations = await apiJson('/evaluations/my');
    if (!evaluations.length) {
      setPanel('Bilans', '<p>Aucune évaluation disponible pour vos groupes.</p>');
      return;
    }
    const first = evaluations[0];
    const report = await apiJson(`/evaluations/${encodeURIComponent(first.id)}/my-report`);
    setPanel(`Bilan — ${escapeHtml(first.title)}`, renderBilan(report));
  } catch (error) {
    setPanel('Bilans', '<p>Aucun bilan disponible pour votre niveau.</p>');
  }
}

async function renderOverview() {
  try {
    const [groups, resources, evaluations] = await Promise.all([
      apiJson('/auth/me/groups'),
      apiJson('/resources/my'),
      apiJson('/evaluations/my'),
    ]);
    const groupText = groups.map(g => g.code).join(', ') || 'aucun groupe';
    setPanel('Aperçu', `
      <p>Bonjour ${escapeHtml(currentUser.first_name || currentUser.full_name || currentUser.email)}.</p>
      <div class="cards">
        <div class="card"><strong>Groupes</strong><br>${escapeHtml(groupText)}</div>
        <div class="card"><strong>Ressources</strong><br>${resources.length}</div>
        <div class="card"><strong>Évaluations</strong><br>${evaluations.length}</div>
      </div>
      <p class="small">Vos ressources et bilans sont filtrés par le serveur selon vos groupes.</p>
    `);
  } catch {
    setPanel('Aperçu', '<p>Bienvenue dans votre espace.</p>');
  }
}

function setPanel(title, html) {
  const t = document.getElementById('s-panel-title'); if (t) t.textContent = title;
  const b = document.getElementById('s-panel-body'); if (b) b.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', init);





