import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { InboundFunnelView } from './InboundFunnelView';
import { MOCK_REVIEW } from '@linkegringo/ai';

describe('InboundFunnelView Component', () => {
  it('renders Inbound Recruiter Funnel hero with Inbound Readiness score percentage', () => {
    render(<InboundFunnelView review={MOCK_REVIEW} targetRole="Senior Backend Engineer" />);

    expect(screen.getByText(/Funil de Recrutamento Inbound \(EUA\)/i)).toBeDefined();
    expect(screen.getByText('42%')).toBeDefined();
    expect(screen.getByText(/Otimização Necessária/i)).toBeDefined();
  });

  it('renders all 4 stages of the inbound recruiter funnel pipeline', () => {
    render(<InboundFunnelView review={MOCK_REVIEW} targetRole="Senior Backend Engineer" />);

    expect(screen.getByText(/1\. Busca & Indexação/i)).toBeDefined();
    expect(screen.getByText(/2\. Card do Recrutador/i)).toBeDefined();
    expect(screen.getByText(/3\. Dossiê do Perfil/i)).toBeDefined();
    expect(screen.getByText(/4\. Conversão em InMail/i)).toBeDefined();
  });

  it('computes and displays InMail conversion tiers based on score', () => {
    const lowReview = { ...MOCK_REVIEW, overallScore: 45 };
    const { rerender } = render(<InboundFunnelView review={lowReview} />);
    expect(screen.getByText(/<1 InMail\/mês/i)).toBeDefined();
    expect(screen.getByText(/Funil bloqueado/i)).toBeDefined();

    const midReview = { ...MOCK_REVIEW, overallScore: 82 };
    rerender(<InboundFunnelView review={midReview} />);
    expect(screen.getByText(/3–6 InMails\/mês/i)).toBeDefined();

    const highReview = { ...MOCK_REVIEW, overallScore: 94 };
    rerender(<InboundFunnelView review={highReview} />);
    expect(screen.getByText(/7–12 InMails\/mês/i)).toBeDefined();
    expect(screen.getByText(/Inbound Ativo/i)).toBeDefined();
  });

  it('renders top 5 strategic inbound optimization opportunities', () => {
    render(<InboundFunnelView review={MOCK_REVIEW} targetRole="Staff Platform Engineer" />);

    expect(screen.getByText(/Principais Oportunidades do Funil \(Top 5\)/i)).toBeDefined();
    expect(screen.getByText(/Cargo semântico padronizado para os EUA/i)).toBeDefined();
    expect(screen.getByText(/Stack de alta busca nos primeiros 60 caracteres/i)).toBeDefined();
    expect(screen.getByText(/Ativação de 5 títulos estratégicos no Open to Work invisível/i)).toBeDefined();
    expect(screen.getByText(/Bullets de experiência no framework XYZ/i)).toBeDefined();
    expect(screen.getByText(/Perfil secundário em inglês americano nativo/i)).toBeDefined();
  });

  it('invokes onProceed callback when CTA button is clicked', () => {
    const handleProceed = vi.fn();
    render(<InboundFunnelView review={MOCK_REVIEW} onProceed={handleProceed} />);

    const ctaButton = screen.getByText(/Destravar Funil de Recrutamento/i);
    fireEvent.click(ctaButton);
    expect(handleProceed).toHaveBeenCalledTimes(1);
  });
});
