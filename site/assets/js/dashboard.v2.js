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
  } catch(e) { console.error("Erreur d'initialisation du dashboard:", e); }
}

async function showStudentsForGroup(groupCode) {
  const panelBody = document.getElementById('panel-body');
  panelBody.innerHTML = 'Chargement des élèves...';
  const students = await (await fetchWithAuth(`/groups/${groupCode}/students`)).json();
  const tableHtml = `
    <table class="table">
      <thead><tr><th>Nom</th><th>Prénom</th><th>Bilan</th></tr></thead>
      <tbody>
        ${students.map(s => `
          <tr>
            <td>${s.last_name || 'N/A'}</td>
            <td>${s.first_name || 'N/A'}</td>
            <td><a href="#" class="btn-primary" data-email="${s.email}" data-fullname="${s.first_name || ''} ${s.last_name || ''}">Voir bilan</a></td>
          </tr>`).join('')}
      </tbody>
    </table>`;
  panelBody.innerHTML = tableHtml;

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
      const bilanHtml = `
        <div class="bilan-box">
          <h3>Bilan de ${studentBilan.nom_prenom || studentBilan.eleve}</h3>
          <p>Score: ${studentBilan.note || studentBilan.note_finale} / ${studentBilan.bareme || 20}</p>
          <div class="questions-list">
            ${(studentBilan.questions || []).map(q => `
              <div class="question-item ${q.note > 0 ? 'correct' : 'incorrect'}">
                <strong>${q.question}</strong>
                <p>Note: ${q.note} / ${q.bareme}</p>
                <p>${q.remarque}</p>
              </div>`).join('')}
          </div>
        </div>
        <a href="#" id="back-to-students" class="btn-secondary">Retour à la liste</a>`;
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
