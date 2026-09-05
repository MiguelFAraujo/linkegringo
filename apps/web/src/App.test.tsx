import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { App } from './App';

describe('App Component', () => {
  it('renders the brand LinkeGringo and initial upload view', () => {
    render(<App />);
    const linkeElements = screen.getAllByText(/Linke/i);
    expect(linkeElements.length).toBeGreaterThanOrEqual(1);

    const gringoElements = screen.getAllByText(/Gringo/i);
    expect(gringoElements.length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText(/Destrave seu Perfil do LinkedIn/i)).toBeDefined();
  });
});
