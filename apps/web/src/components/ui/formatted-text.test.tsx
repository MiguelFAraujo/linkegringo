import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { FormattedText } from './formatted-text';

describe('FormattedText Component', () => {
  it('renders null when text is empty or null', () => {
    const { container } = render(<FormattedText text={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders plain text without markdown tokens', () => {
    render(<FormattedText text="Just regular text" />);
    expect(screen.getByText('Just regular text')).toBeDefined();
  });

  it('renders bold markdown (**bold**) as strong element', () => {
    const { container } = render(
      <FormattedText text="Este é um texto com **destaque em negrito** e mais texto." />,
    );
    const strong = container.querySelector('strong');
    expect(strong).not.toBeNull();
    expect(strong?.textContent).toBe('destaque em negrito');
    expect(container.textContent).toBe('Este é um texto com destaque em negrito e mais texto.');
  });

  it('renders italic markdown (*italic*) as em element', () => {
    const { container } = render(<FormattedText text="Texto com *ênfase em itálico*." />);
    const em = container.querySelector('em');
    expect(em).not.toBeNull();
    expect(em?.textContent).toBe('ênfase em itálico');
  });

  it('renders inline code (`code`) as code element', () => {
    const { container } = render(
      <FormattedText text="Reduziu a latência para `45ms` no p99." />,
    );
    const code = container.querySelector('code');
    expect(code).not.toBeNull();
    expect(code?.textContent).toBe('45ms');
  });

  it('handles multiple inline tokens and nested elements', () => {
    const { container } = render(
      <FormattedText text="O candidato domina **arquitetura `Kafka`** e *métricas XYZ*." />,
    );
    const strong = container.querySelector('strong');
    const code = container.querySelector('code');
    const em = container.querySelector('em');

    expect(strong).not.toBeNull();
    expect(code).not.toBeNull();
    expect(em).not.toBeNull();
    expect(strong?.textContent).toContain('Kafka');
    expect(em?.textContent).toBe('métricas XYZ');
  });

  it('renders unclosed markdown tokens as literal text without crashing', () => {
    const { container } = render(<FormattedText text="Este é um **texto não fechado" />);
    expect(container.querySelector('strong')).toBeNull();
    expect(container.textContent).toBe('Este é um **texto não fechado');
  });
});
