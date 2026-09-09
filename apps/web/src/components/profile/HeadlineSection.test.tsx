import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { HeadlineSection } from './HeadlineSection';

describe('HeadlineSection Component', () => {
  it('renders Antes vs Depois comparison when headline is unoptimized', () => {
    const onCopy = vi.fn();
    const originalHeadline = 'Desenvolvedor Full Stack apaixonado por novos desafios';
    const rewrittenHeadline = 'Senior Full Stack Engineer | Node.js, React | Cloud Scale';

    render(
      <HeadlineSection
        originalHeadline={originalHeadline}
        rewrittenHeadline={rewrittenHeadline}
        onCopy={onCopy}
        copiedKey={null}
      />,
    );

    expect(screen.getByText('Headline / Título estratégico')).toBeDefined();
    expect(screen.getByText(/caracteres/i)).toBeDefined();
    expect(screen.queryByText(/220/)).toBeNull(); // Never display operational 220 limit
    expect(screen.getByText('Antes (LinkedIn Original)')).toBeDefined();
    expect(screen.getByText('Depois (Versão dos EUA)')).toBeDefined();
    expect(screen.getByText(originalHeadline)).toBeDefined();

    const copyBtn = screen.getByRole('button', { name: /copiar headline/i });
    fireEvent.click(copyBtn);
    expect(onCopy).toHaveBeenCalledWith(rewrittenHeadline, 'headline');
  });

  it('renders single unified card when headline is already Recruiter-Ready', () => {
    const onCopy = vi.fn();
    const optimizedHeadline =
      'Senior Backend Engineer | Java, Spring Boot, Kafka | Distributed Systems | AWS';

    render(
      <HeadlineSection
        originalHeadline={optimizedHeadline}
        rewrittenHeadline={optimizedHeadline}
        onCopy={onCopy}
        copiedKey={null}
      />,
    );

    // Single card checks
    expect(screen.getByText('Headline Recruiter-Ready')).toBeDefined();
    expect(screen.getByText('Recruiter-Ready')).toBeDefined();
    expect(
      screen.getByText(/Sua headline original já segue a estrutura recomendada para tech recruiters dos EUA/i),
    ).toBeDefined();

    // Must NOT show split comparison
    expect(screen.queryByText('Antes (LinkedIn Original)')).toBeNull();
    expect(screen.queryByText('Depois (Versão dos EUA)')).toBeNull();
    expect(screen.queryByText(/220/)).toBeNull();
  });

  it('shows Copiado! feedback when copiedKey matches headline', () => {
    render(
      <HeadlineSection
        originalHeadline="Engineer"
        rewrittenHeadline="Senior Engineer | Go, Kubernetes"
        onCopy={vi.fn()}
        copiedKey="headline"
      />,
    );

    expect(screen.getByText(/copiado!/i)).toBeDefined();
  });
});
