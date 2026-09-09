import type {
  Profile,
  ProfileReview,
  ProfileAnalysis,
  RewrittenProfile,
  RewrittenExperience,
  CareerObjective,
  ConfirmedFact,
  InterviewAnswer,
  InterviewPlan,
  InterviewProgress,
  AiProvider,
} from '@linkegringo/core';

export interface ParseAndDiagnoseInput {
  pdfBase64?: string;
  pdfText?: string;
  cvPdfBase64?: string;
  targetRole?: string;
  currentDate?: string;
  chatHistory?: unknown[];
}

export interface ParseAndDiagnoseResult {
  profile: Profile;
  review: ProfileReview;
}

// Minimal valid PDF string for test fixtures
export const MINIMAL_VALID_PDF = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 55 >> stream
BT /F1 12 Tf 100 700 Td (Alexandre Rocha - Senior Backend) Tj ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000348 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
434
%%EOF`;

export const MINIMAL_PDF_BASE64 = typeof btoa !== 'undefined'
  ? btoa(MINIMAL_VALID_PDF)
  : Buffer.from(MINIMAL_VALID_PDF).toString('base64');

export const SAMPLE_CANDIDATE_ALEXANDRE: Profile = {
  publicId: 'alexandre-rocha',
  firstName: 'Alexandre',
  lastName: 'Rocha',
  headline: 'Desenvolvedor Backend | Java | Spring Boot | Microserviços | Buscando desafios',
  location: 'São Paulo, Brasil',
  summary:
    'Desenvolvedor com mais de 6 anos de experiência em tecnologia. Apaixonado por código limpo, boas práticas e novas tecnologias. Tenho experiência com Java, Spring, Docker e bancos relacionais.',
  experiences: [
    {
      title: 'Engenheiro de Software Sênior',
      companyName: 'Fintech Pagamentos Brasil',
      current: true,
      dateRangeText: 'Mar 2022 - Presente',
      description:
        'Responsável pelo desenvolvimento de APIs REST em Spring Boot. Participei da migração de legado monolítico para microserviços. Atuei com PostgreSQL e mensageria Kafka.',
    },
    {
      title: 'Desenvolvedor Java Pleno',
      companyName: 'Varejo Online S.A.',
      current: false,
      dateRangeText: 'Jan 2019 - Fev 2022',
      description:
        'Desenvolvimento de funcionalidades no sistema de catálogo e checkout. Criação de testes unitários com JUnit e correção de bugs.',
    },
  ],
  education: [
    {
      schoolName: 'Universidade de São Paulo (USP)',
      degreeName: 'Bacharelado',
      fieldOfStudy: 'Sistemas de Informação',
    },
  ],
  skills: [
    { name: 'Java' },
    { name: 'Spring Boot' },
    { name: 'Apache Kafka' },
    { name: 'Docker' },
    { name: 'PostgreSQL' },
    { name: 'AWS' },
  ],
  certifications: [{ name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services' }],
  languages: [
    { name: 'Português', proficiency: 'Nativo' },
    { name: 'Inglês', proficiency: 'Intermediário Avançado' },
  ],
  projects: [],
  honors: [],
};

export const SAMPLE_CANDIDATE_MARIANA: Profile = {
  publicId: 'mariana-souza',
  firstName: 'Mariana',
  lastName: 'Souza',
  headline: 'Tech Lead | Engineering Manager | Distributed Systems & Cloud Architecture',
  location: 'Florianópolis, Brasil',
  summary:
    'Engineering leader with 15 years building scalable distributed platforms across LatAm fintech and e-commerce giants.',
  experiences: [
    {
      title: 'Head of Engineering / Tech Lead',
      companyName: 'CloudFintech Global',
      current: true,
      dateRangeText: '2022 - Present',
      description: 'Lead 4 engineering squads building payments gateway handling 50M daily requests.',
    },
    {
      title: 'Staff Distributed Systems Engineer',
      companyName: 'MegaLogistics Corp',
      current: false,
      dateRangeText: '2019 - 2022',
      description: 'Architected event-driven real-time tracking platform with Kafka and Go.',
    },
    {
      title: 'Senior Software Architect',
      companyName: 'E-commerce Brasil',
      current: false,
      dateRangeText: '2016 - 2019',
      description: 'Decomposed monolithic ERP into 35 high-availability microservices.',
    },
    {
      title: 'Lead Software Engineer',
      companyName: 'Telecom Networks S.A.',
      current: false,
      dateRangeText: '2013 - 2016',
      description: 'Built high-throughput VoIP billing mediation engine in Java and C++.',
    },
    {
      title: 'Software Engineer',
      companyName: 'Software Solutions Ltda',
      current: false,
      dateRangeText: '2011 - 2013',
      description: 'Full-stack enterprise application development with Spring and Oracle.',
    },
    {
      title: 'Junior Developer',
      companyName: 'Inovação Digital',
      current: false,
      dateRangeText: '2009 - 2011',
      description: 'Maintained legacy J2EE systems and automated reporting pipelines.',
    },
  ],
  education: [
    {
      schoolName: 'UFSC',
      degreeName: 'B.S.',
      fieldOfStudy: 'Computer Science',
    },
  ],
  skills: [
    { name: 'Distributed Systems' },
    { name: 'System Architecture' },
    { name: 'Apache Kafka' },
    { name: 'Golang' },
    { name: 'Kubernetes' },
    { name: 'AWS' },
  ],
  certifications: [],
  languages: [{ name: 'English', proficiency: 'Fluent' }],
  projects: [],
  honors: [],
};

export const SAMPLE_CANDIDATE_LUCAS_SELF_TAUGHT: Profile = {
  publicId: 'lucas-mendes',
  firstName: 'Lucas',
  lastName: 'Mendes',
  headline: 'Senior Systems Engineer | Rust, Go, Distributed Storage & Concurrency',
  location: 'Curitiba, Brasil',
  summary:
    'Self-taught systems engineer with 8 years building production databases, consensus engines (Raft/Paxos), and high-throughput networking services.',
  experiences: [
    {
      title: 'Principal Systems Architect',
      companyName: 'Distributed KV Labs',
      current: true,
      dateRangeText: '2021 - Present',
      description: 'Created Raft-based distributed key-value store serving 500k QPS at 3ms p99 latency in Rust.',
    },
    {
      title: 'Systems Software Engineer',
      companyName: 'CloudStorage Engine',
      current: false,
      dateRangeText: '2018 - 2021',
      description: 'Optimized LSM-tree storage engine throughput by 4x using lock-free data structures in Go.',
    },
  ],
  education: [], // Zero formal university education
  skills: [
    { name: 'Rust' },
    { name: 'Golang' },
    { name: 'Distributed Systems' },
    { name: 'Raft Consensus' },
    { name: 'LSM Trees' },
  ],
  certifications: [],
  languages: [{ name: 'English', proficiency: 'Professional' }],
  projects: [],
  honors: [],
};

export const SAMPLE_REVIEW_ALEXANDRE: ProfileReview = {
  targetMarket: 'United States',
  language: 'pt',
  overallScore: 42,
  scores: {
    searchRelevance: 48,
    humanVoice: 52,
    credibility: 38,
    positioningClarity: 35,
    evidenceCoverage: 37,
  },
  scoreExplanations: {
    searchRelevance: 'Missing US ATS boolean keywords for senior distributed systems.',
    humanVoice: 'Written in Portuguese; requires native idiomatic US technical voice.',
    credibility: 'Lacks quantifiable scale (RPS, p99 latency, cost savings).',
    positioningClarity: 'Passive headline with seeking cliché ("Buscando desafios").',
    evidenceCoverage: 'Bullets describe passive duties rather than measurable outcomes.',
  },
  executiveSummary:
    'Profile is currently invisible to US recruiters due to Portuguese language and lack of quantified metrics.',
  profileDirection: {
    positioning: 'Senior Distributed Systems & Backend Engineer',
    primaryRole: 'Senior Backend Engineer',
    alternativeRoles: ['Senior Systems Engineer', 'Platform Engineer'],
    rationale: 'Deep Java and Kafka experience in fintech qualifies for US senior roles.',
  },
  critique: [],
  triageBottlenecks: [
    'Perfil integralmente em português, invisível para busca booleana de recrutadores dos EUA.',
    'Ausência de métricas quantificáveis no framework XYZ (faltam %, $, latência em ms, throughput).',
    'Headline passiva com clichê "Buscando desafios" reduzindo sinal de senioridade.',
  ],
};

export const SAMPLE_OBJECTIVE: CareerObjective = {
  primaryRole: 'Senior Backend Engineer',
  targetMarket: 'United States',
  workPreference: 'remote',
  excludedTechnologies: [],
  seniority: 'Senior',
};

// Monotonic Invariant Verification Functions
export function verifyExperienceInvariant(
  originalExperiences: Array<{ companyName: string }>,
  rewrittenExperiences: Array<{ companyName: string }>,
): { passed: boolean; originalCount: number; rewrittenCount: number; missingCompanies: string[] } {
  const originalCompanies = originalExperiences.map((e) => e.companyName.trim().toLowerCase());
  const rewrittenCompanies = new Set(rewrittenExperiences.map((e) => e.companyName.trim().toLowerCase()));

  const missingCompanies = originalCompanies.filter((c) => !rewrittenCompanies.has(c));

  return {
    passed: missingCompanies.length === 0,
    originalCount: originalCompanies.length,
    rewrittenCount: rewrittenExperiences.length,
    missingCompanies,
  };
}

export function enforceExperienceRecovery(
  originalExperiences: Array<{ companyName: string; title?: string; description?: string }>,
  rewrittenExperiences: RewrittenExperience[],
): RewrittenExperience[] {
  const rewrittenCompanies = new Set(rewrittenExperiences.map((e) => e.companyName.trim().toLowerCase()));
  const recovered = [...rewrittenExperiences];

  for (const orig of originalExperiences) {
    const key = orig.companyName.trim().toLowerCase();
    if (!rewrittenCompanies.has(key)) {
      recovered.push({
        companyName: orig.companyName,
        title: orig.title || 'Software Engineer',
        bullets: orig.description
          ? orig.description.split('\n').filter((l) => l.trim().length > 0)
          : [`Delivered engineering initiatives at ${orig.companyName}.`],
      });
      rewrittenCompanies.add(key);
    }
  }

  return recovered;
}

export function verifyScoreMonotonicity(
  initialScores: Record<string, number>,
  finalScores: Record<string, number>,
): { passed: boolean; regressions: Array<{ pillar: string; initial: number; final: number }> } {
  const regressions: Array<{ pillar: string; initial: number; final: number }> = [];

  for (const [pillar, initVal] of Object.entries(initialScores)) {
    const finalVal = finalScores[pillar];
    if (typeof finalVal === 'number' && finalVal < initVal) {
      regressions.push({ pillar, initial: initVal, final: finalVal });
    }
  }

  return {
    passed: regressions.length === 0,
    regressions,
  };
}

export function enforceScoreMonotonicity(
  initialScores: { searchRelevance: number; humanVoice: number; credibility: number; positioningClarity: number; evidenceCoverage: number },
  finalScores: { searchRelevance: number; humanVoice: number; credibility: number; positioningClarity: number; evidenceCoverage: number },
): { searchRelevance: number; humanVoice: number; credibility: number; positioningClarity: number; evidenceCoverage: number } {
  return {
    searchRelevance: Math.max(finalScores.searchRelevance, initialScores.searchRelevance),
    humanVoice: Math.max(finalScores.humanVoice, initialScores.humanVoice),
    credibility: Math.max(finalScores.credibility, initialScores.credibility),
    positioningClarity: Math.max(finalScores.positioningClarity, initialScores.positioningClarity),
    evidenceCoverage: Math.max(finalScores.evidenceCoverage, initialScores.evidenceCoverage),
  };
}

export function verifyFactRetention(
  previousFacts: ConfirmedFact[],
  accumulatedFacts: ConfirmedFact[],
): { passed: boolean; retainedCount: number; expectedCount: number; lostFacts: string[] } {
  const getFactText = (f: ConfirmedFact): string => ((f as any).statement || (f as any).fact || '').trim().toLowerCase();
  const accumulatedSet = new Set(accumulatedFacts.map(getFactText));
  const lostFacts = previousFacts
    .filter((f) => !accumulatedSet.has(getFactText(f)))
    .map((f) => (f as any).statement || (f as any).fact || '');

  return {
    passed: lostFacts.length === 0,
    retainedCount: accumulatedFacts.length,
    expectedCount: previousFacts.length,
    lostFacts,
  };
}

export function verifyGoogleXyzFormat(bullet: string): boolean {
  // Verifies format: Accomplished [X], as measured by [Y], by doing [Z]
  // or active past tense verb + technical accomplishment / quantified metric
  const hasActionVerb = /^(Architected|Engineered|Designed|Implemented|Spearheaded|Decomposed|Scaled|Optimized|Accelerated|Automated|Migrated|Delivered|Built|Reduced|Increased|Instituted|Refactored|Mentored|Standardized)\b/i.test(
    bullet.trim(),
  );
  const hasSubstance = bullet.trim().length >= 30;
  return hasActionVerb && hasSubstance;
}

export function verifyHeadlineFormat(headline: string): {
  passed: boolean;
  length: number;
  segments: string[];
} {
  const segments = headline.split('|').map((s) => s.trim());
  const length = headline.length;
  // Standard format: [Target Role] | [Core Techs] | [Scale/Architecture] | [Seniority/Location]
  const passed = length <= 160 && segments.length >= 3;
  return { passed, length, segments };
}

export function verifyAboutHookFormat(about: string): {
  passed: boolean;
  first250Chars: string;
  hasSeniority: boolean;
  hasStack: boolean;
} {
  const first250 = about.slice(0, 250);
  const hasSeniority = /\b(Senior|Staff|Principal|Lead|Head|Architect)\b/i.test(first250);
  const hasStack = /\b(Java|Spring|Kafka|Rust|Go|Python|AWS|Kubernetes|Distributed|Cloud|React|TypeScript|Node|GraphQL)\b/i.test(first250);
  return {
    passed: hasSeniority && hasStack,
    first250Chars: first250,
    hasSeniority,
    hasStack,
  };
}

// Native file to base64 helper
export function nativeFileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export function cleanBase64Payload(dataUrl: string): string {
  const parts = dataUrl.split(',');
  const raw = parts.length > 1 ? parts[1] : parts[0];
  return raw.replace(/[\r\n\s]/g, '');
}
