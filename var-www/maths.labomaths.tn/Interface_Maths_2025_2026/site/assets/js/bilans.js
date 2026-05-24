export function canonicalizeName(input) {
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

export function findStudentBilan(data, me) {
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

export function escapeHtml(unsafe) {
  return String(unsafe).replace(/[&<"'>]/g, function (match) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[match];
  });
}

export function renderBilan(b) {
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
