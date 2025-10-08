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
    const initials = `${(s.first_name || '').charAt(0)}${(s.last_name || '').charAt(0)}`.toUpperCase() || '∑';
    const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || (s.full_name || s.email);
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
    const res = await fetch(`/content/EDS_premiere/Second_Degre/bilans_eval1second_degre.checked.json`);
    if (!res.ok) throw new Error('Fichier bilan non trouvé');
    const bilans = await res.json();
    const studentBilan = bilans.find(b => (b.eleve || '').toLowerCase() === email.toLowerCase() || (b.nom_prenom || '').toLowerCase() === fullName.trim().toLowerCase());

    if (studentBilan) {
      const got = Number(studentBilan.note || studentBilan.note_finale || 0);
      const total = Number(studentBilan.bareme || 20);
      const pct = Math.max(0, Math.min(100, Math.round((got / (total || 20)) * 100)));
      const donut = `
        <svg class="donut" viewBox="0 0 36 36" aria-label="Score ${pct}%">
          <path style="fill:none; stroke:#2D3748; stroke-width:3.8" d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          <path style="fill:none; stroke:#4FD1C5; stroke-width:3.8; stroke-linecap:round; stroke-dasharray:${pct}, 100" d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          <text x="18" y="20.35" style="fill:#E2E8F0" font-size="8" text-anchor="middle">${got}/${total}</text>
        </svg>`;
      const questionsHtml = (studentBilan.questions || []).map(q => `
        <details class="question-item ${q.note > 0 ? 'correct' : 'incorrect'}">
          <summary>${q.question}</summary>
          <div>Note: ${q.note} / ${q.bareme}</div>
          <div>${q.remarque || ''}</div>
        </details>`).join('');
      const bilanHtml = `
        <div class="bilan-box fade-in">
          <div style="display:flex;gap:16px;align-items:center;margin-bottom:12px">
            ${donut}
            <div>
              <h3 style="margin:0">Bilan de ${studentBilan.nom_prenom || studentBilan.eleve}</h3>
              <div class="muted">Score ${pct}%</div>
            </div>
          </div>
          <div class="questions-list">${questionsHtml || '<div>Détail des questions non disponible</div>'}</div>
        </div>
        <a href="#" id="back-to-students" class="btn-secondary" style="margin-top:12px;display:inline-block">Retour à la liste</a>`;
      panelBody.innerHTML = bilanHtml;
      document.getElementById('back-to-students').addEventListener('click', e => {
        e.preventDefault();
        document.querySelector('.group-item.active').click();
      });
    } else {
      panelBody.innerHTML = `<p>Bilan non trouvé pour l'élève ${fullName} (${email}).</p><a href="#" id="back-to-students" class="btn-secondary">Retour à la liste</a>`;
      document.getElementById('back-to-students').addEventListener('click', e => {
        e.preventDefault();
        document.querySelector('.group-item.active').click();
      });
    }
  } catch (error) {
    panelBody.innerHTML = `<p>Erreur: ${error.message}</p>`;
  }
}
