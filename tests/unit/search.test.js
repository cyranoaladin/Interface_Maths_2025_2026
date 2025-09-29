import { describe, it, expect } from 'vitest'
import { normalize } from '../../Interface_Maths_2025_2026/site/assets/js/search-utils.js'

describe('normalize', () => {
  it('retire accents et met en minuscule', () => {
    expect(normalize('Dérivation')).toBe('derivation')
    expect(normalize('Suites')).toBe('suites')
  })
})

