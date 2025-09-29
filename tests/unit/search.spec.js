import { describe, expect, it } from 'vitest';
import { normalize } from '../../site/assets/js/search-utils.js';

describe('normalize', () => {
  it('retire accents et met en minuscule', () => {
    expect(normalize('Dérivation')).toBe('derivation');
    expect(normalize('Suites')).toBe('suites');
  });
})
