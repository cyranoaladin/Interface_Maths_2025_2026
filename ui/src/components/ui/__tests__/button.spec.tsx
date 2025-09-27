import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('rend le variant primary', () => {
    const { getByText } = render(<Button variant="primary">Texte</Button>);
    const el = getByText('Texte');
    expect(el.className).toContain('from-blue-600');
  });
});
