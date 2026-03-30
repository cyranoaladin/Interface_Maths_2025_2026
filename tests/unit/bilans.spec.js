import { describe, it, expect } from 'vitest';
import { canonicalizeName, findStudentBilan, escapeHtml } from '../../site/assets/js/bilans.js';

describe('Bilans Utils', () => {
  it('canonicalizeName should format names correctly', () => {
    expect(canonicalizeName('Jean Dupont')).toBe('DUPONT JEAN');
    expect(canonicalizeName('Jean-Pierre Dupont-Martin')).toBe('DUPONT-MARTIN JEAN-PIERRE');
    expect(canonicalizeName('  extra   spaces  ')).toBe('SPACES EXTRA');
  });

  it('escapeHtml should escape special characters', () => {
    expect(escapeHtml('<div>"hello" & \'world\'</div>')).toBe('&lt;div&gt;&quot;hello&quot; &amp; &#39;world&#39;&lt;/div&gt;');
  });

  it('findStudentBilan should match exact email', () => {
    const data = [
      { email: 'student@test.com', nom_prenom: 'STUDENT', note_finale: 15 }
    ];
    const me = { email: 'student@test.com', last_name: 'Other', first_name: 'Name' };
    const res = findStudentBilan(data, me);
    expect(res.note_finale).toBe(15);
  });

  it('findStudentBilan should match fuzzy name if no email match', () => {
    const data = [
      { email: 'wrong@test.com', nom_prenom: 'DUPONT JEAN', note_finale: 12 }
    ];
    const me = { email: 'student@test.com', last_name: 'Dupont', first_name: 'Jean' };
    const res = findStudentBilan(data, me);
    expect(res.note_finale).toBe(12);
  });
});
