import { describe, expect, it } from 'vitest';
import { handleAuditProfile } from '../src/tools/audit-profile.js';
import { handleSimulateRecruiterSearch } from '../src/tools/recruiter-simulator.js';
import { handleConvertToXyzBullet } from '../src/tools/xyz-bullet-converter.js';
import { handleGenerateHeadline } from '../src/tools/headline-generator.js';
import { createLinkeGringoMcpServer } from '../src/server.js';

describe('LinkeGringo MCP Tools Suite', () => {
  it('instantiates McpServer with all registered tools', () => {
    const server = createLinkeGringoMcpServer();
    expect(server).toBeDefined();
    expect((server as any).server).toBeDefined();
  });

  describe('audit_profile', () => {
    it('audits profile text in demo mode and returns structured diagnosis', async () => {
      const sampleText = `
        Lucas Silva
        Senior Backend Engineer
        Experienced in Go, Kubernetes, Microservices and AWS.
        Experience:
        Tech Lead at Fintech XYZ (2020 - Present)
        Engineered distributed transaction processing system handling 10k RPS.
      `;

      const result = await handleAuditProfile({
        profileText: sampleText,
        targetRole: 'Senior Backend Engineer',
      });

      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Diagnóstico de Perfil LinkeGringo');
      expect(result.structuredData).toBeDefined();
      expect(result.structuredData.score).toBeGreaterThanOrEqual(0);
      expect(result.structuredData.isDemo).toBe(true);
    });

    it('throws error when no profile input source is provided', async () => {
      await expect(
        handleAuditProfile({
          targetRole: 'Senior Backend Engineer',
        }),
      ).rejects.toThrow(/É necessário fornecer ao menos uma fonte de dados/);
    });
  });

  describe('simulate_recruiter_search', () => {
    it('returns match status and 3x weight when keywords appear in headline and skills', async () => {
      const result = await handleSimulateRecruiterSearch({
        headline: 'Senior Backend Engineer | Go • Kubernetes • Microservices | US Remote',
        skills: ['Go', 'Kubernetes', 'Cloud Architecture'],
        summary: 'Passionate software engineer',
        experienceBullets: ['Built APIs in Go'],
        targetRole: 'Senior Backend Engineer',
        requiredKeywords: ['Go', 'Kubernetes', 'Python'],
      });

      expect(result.content[0].text).toContain('Simulação de Busca do Recrutador');
      expect(result.structuredData.overallStatus).toBeDefined();
      expect(result.structuredData.matchCount).toBeGreaterThanOrEqual(2);
      expect(result.structuredData.missingCount).toBe(1); // Python missing
    });
  });

  describe('convert_to_xyz_bullet', () => {
    it('converts passive bullet into Google XYZ format', async () => {
      const result = await handleConvertToXyzBullet({
        rawBullet: 'Desenvolvi microsserviços de pagamento usando Go e PostgreSQL',
        roleContext: 'Fintech Pagamentos',
        metricsOrHints: 'redução de latência em 40% e 15k req/seg',
      });

      expect(result.content[0].text).toContain('Conversão para Bullet Google XYZ');
      expect(result.structuredData.formattedBullet).toContain('measured by');
      expect(result.structuredData.isDemo).toBe(true);
    });
  });

  describe('generate_headline_proposals', () => {
    it('generates 3 distinct proposals strictly within 160 character limit', async () => {
      const result = await handleGenerateHeadline({
        targetRole: 'Staff Distributed Systems Engineer',
        coreTechnologies: ['Go', 'Kubernetes', 'Kafka', 'AWS'],
        keyDifferentiator: 'Ultra-High Scale Event Streaming',
        seniorityOrScope: 'US Remote / B2B',
      });

      expect(result.structuredData.proposals).toHaveLength(3);
      for (const proposal of result.structuredData.proposals) {
        expect(proposal.headline.length).toBeLessThanOrEqual(160);
        expect(proposal.headline).toContain('Staff Distributed Systems Engineer');
      }
    });
  });
});
