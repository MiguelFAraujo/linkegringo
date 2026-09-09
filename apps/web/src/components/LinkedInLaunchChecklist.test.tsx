import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { LinkedInLaunchChecklist } from './LinkedInLaunchChecklist';
import * as fileUtils from '@/lib/file-utils';

vi.mock('@/lib/file-utils', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(true),
}));

describe('LinkedInLaunchChecklist Component', () => {
  it('renders all 6 launch steps with 0 / 6 completed counter', () => {
    render(<LinkedInLaunchChecklist primaryRole="Senior Backend Engineer" />);

    expect(screen.getByText(/Passos para atualizar o LinkedIn/i)).toBeDefined();
    expect(screen.getByText('0 / 6 concluídos')).toBeDefined();

    expect(screen.getByText(/1\. Atualize Headline e About no LinkedIn/i)).toBeDefined();
    expect(screen.getByText(/2\. Atualize os Bullets das Experiências/i)).toBeDefined();
    expect(screen.getByText(/3\. Ative "Open to Work" Invisível/i)).toBeDefined();
    expect(screen.getByText(/4\. Crie o Perfil Secundário em Inglês/i)).toBeDefined();
    expect(screen.getByText(/5\. Vincule experiências às Páginas Oficiais/i)).toBeDefined();
    expect(screen.getByText(/6\. Configure Seção em Destaque & Top Skills/i)).toBeDefined();
  });

  it('displays 5 strategic Open to Work titles and allows 1-click copy', async () => {
    const customTitles = [
      'Senior Backend Engineer',
      'Senior Software Engineer',
      'Distributed Systems Engineer',
      'Backend Tech Lead',
      'Senior Systems Engineer',
    ];

    render(
      <LinkedInLaunchChecklist
        primaryRole="Senior Backend Engineer"
        openToWorkTitles={customTitles}
      />,
    );

    expect(screen.getByText(/5 Títulos Estratégicos para o "Open to Work"/i)).toBeDefined();
    expect(screen.getByText('Distributed Systems Engineer')).toBeDefined();

    const copyBtn = screen.getByText(/Copiar 5 títulos/i);
    fireEvent.click(copyBtn);

    expect(fileUtils.copyToClipboard).toHaveBeenCalledWith(customTitles.join('\n'));
    await waitFor(() => {
      expect(screen.getByText(/5 títulos copiados!/i)).toBeDefined();
    });
  });

  it('toggles completion status and displays celebration message at 6/6', () => {
    render(<LinkedInLaunchChecklist primaryRole="Senior Backend Engineer" />);

    const steps = [
      /1\. Atualize Headline e About no LinkedIn/i,
      /2\. Atualize os Bullets das Experiências/i,
      /3\. Ative "Open to Work" Invisível/i,
      /4\. Crie o Perfil Secundário em Inglês/i,
      /5\. Vincule experiências às Páginas Oficiais/i,
      /6\. Configure Seção em Destaque & Top Skills/i,
    ];

    steps.forEach((stepRegex) => {
      const el = screen.getByText(stepRegex);
      fireEvent.click(el);
    });

    expect(screen.getByText('6 / 6 concluídos')).toBeDefined();
    expect(screen.getByText(/Perfil 100% lançado para o mercado dos EUA!/i)).toBeDefined();
  });

  it('tops up to exactly 5 titles if fewer than 5 titles are provided', () => {
    render(
      <LinkedInLaunchChecklist
        primaryRole="Senior Mobile Engineer"
        openToWorkTitles={['Senior Mobile Engineer', 'iOS Engineer']}
      />,
    );
    expect(screen.getByText(/#1/i)).toBeDefined();
    expect(screen.getByText(/#2/i)).toBeDefined();
    expect(screen.getByText(/#3/i)).toBeDefined();
    expect(screen.getByText(/#4/i)).toBeDefined();
    expect(screen.getByText(/#5/i)).toBeDefined();
  });
});
