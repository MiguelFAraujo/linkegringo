import { describe, expect, it } from 'vitest';
import { handleAuditProfile } from '../src/tools/audit-profile.js';
import { handleSimulateRecruiterSearch } from '../src/tools/recruiter-simulator.js';
import { handleConvertToXyzBullet, formatGoogleXyzBullet } from '../src/tools/xyz-bullet-converter.js';
import { handleGenerateHeadline } from '../src/tools/headline-generator.js';
import { createLinkeGringoMcpServer } from '../src/server.js';

describe('LinkeGringo MCP Tools Suite', () => {
  it('instantiates McpServer with all registered tools', () => {
    const server = createLinkeGringoMcpServer();
    expect(server).toBeDefined();
    expect((server as any).server).toBeDefined();
  });

  describe('audit_profile', () => {
    it('audits profile text deterministically without external API keys', async () => {
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
      expect(result.content[0].text).toContain('Relatório de Diagnóstico Inbound (LinkeGringo)');
      expect(result.structuredData).toBeDefined();
      expect(result.structuredData.score).toBeGreaterThanOrEqual(15);
      expect(result.structuredData.score).toBeLessThanOrEqual(100);
    });

    it('identifies sparse experiences and calculates rubric deductions', async () => {
      const result = await handleAuditProfile({
        headline: 'Software Engineer',
        experiences: [
          {
            company: 'Startup A',
            title: 'Fullstack Dev',
            bullets: ['Fixed bugs in web app.'],
          },
        ],
        targetRole: 'Senior Fullstack Engineer',
      });

      expect(result.structuredData.sparseExperiences.length).toBe(1);
      expect(result.structuredData.triageBottlenecks.length).toBeGreaterThan(0);
      expect(result.structuredData.score).toBeLessThan(100);
    });
  });

  describe('simulate_recruiter_search', () => {
    it('returns match status and 3x weight when keywords appear in headline and skills', async () => {
      const result = await handleSimulateRecruiterSearch({
        headline: 'Senior Backend Engineer | Go • Kubernetes • Microservices | US Remote',
        skills: ['Go', 'Kubernetes', 'Cloud Architecture'],
        summary: 'Experienced software engineer',
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
    it('analyzes passive bullet and generates 3 calibrated Google XYZ proposals', async () => {
      const result = await handleConvertToXyzBullet({
        rawBullet: 'Desenvolvi microsserviços de pagamento usando Go e PostgreSQL',
        roleContext: 'Fintech Pagamentos',
      });

      expect(result.content[0].text).toContain('Análise de Fórmula Google XYZ');
      expect(result.structuredData.proposals).toHaveLength(3);
      for (const p of result.structuredData.proposals) {
        expect(p).toContain('measured by');
        expect(p).toContain('by');
      }
    });

    it('formats explicitly provided X, Y, Z parts into official formula', async () => {
      const result = await handleConvertToXyzBullet({
        rawBullet: 'Original bullet text',
        action: 'Architected and deployed distributed services',
        metric: 'reducing p99 latency by 35%',
        method: 'by redesigning queue architecture',
      });

      expect(result.structuredData.formattedBullet).toBe(
        'Architected and deployed distributed services, measured by reducing p99 latency by 35%, by redesigning queue architecture.',
      );
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
