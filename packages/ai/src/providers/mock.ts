import type {
  AiProvider,
  CareerObjective,
  ConfirmedFact,
  InterviewAnswer,
  InterviewPlan,
  InterviewProgress,
  ParseAndDiagnoseInput,
  ParseAndDiagnoseResult,
  Profile,
  ProfileAnalysis,
  ProfileReview,
} from '@linkegringo/core';
import { enforceExperienceRecovery } from './gemini.js';

export const MOCK_PROFILE: Profile = {
  publicId: 'demo-candidate',
  firstName: 'Alexandre',
  lastName: 'Rocha',
  headline: 'Desenvolvedor Backend | Java | Spring Boot | Microserviços | Buscando desafios',
  location: 'São Paulo, Brasil',
  summary:
    'Desenvolvedor com mais de 6 anos de experiência em tecnologia. Apaixonado por código limpo, boas práticas e novas tecnologias. Tenho experiência com Java, Spring, Docker e bancos relacionais. Gosto de resolver problemas e aprender coisas novas todos os dias.',
  experiences: [
    {
      title: 'Engenheiro de Software Pleno/Sênior',
      companyName: 'Fintech Pagamentos Brasil',
      current: true,
      dateRangeText: 'Mar 2022 - Presente',
      description:
        'Responsável pelo desenvolvimento de APIs REST em Spring Boot. Participei da migração de legado monolítico para microserviços. Atuei com PostgreSQL e mensageria Kafka.',
    },
    {
      title: 'Desenvolvedor Java',
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
    { name: 'Microservices' },
    { name: 'Docker' },
    { name: 'PostgreSQL' },
    { name: 'Apache Kafka' },
    { name: 'AWS' },
  ],
  certifications: [{ name: 'AWS Certified Solutions Architect - Associate', issuer: 'Amazon Web Services' }],
  languages: [
    { name: 'Português', proficiency: 'Nativo' },
    { name: 'Inglês', proficiency: 'Profissional / Intermediário Avançado' },
  ],
  projects: [],
  honors: [],
};

export const MOCK_REVIEW: ProfileReview = {
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
    searchRelevance: 'Headline atual possui termos genéricos ("Buscando desafios") e falta direcionamento explícito para buscas booleanas nos EUA; faltam 52% para cobrir stack essencial e posicionamento sênior.',
    humanVoice: 'Tom amigável, porém redigido integralmente em português; faltam 48% em escrita técnica nativa e vocabulário assertivo de engenharia.',
    credibility: 'Experiência em fintech comprovada, mas faltam 62% em evidências de sistemas distribuídos de alta escala, métricas de produção e liderança técnica.',
    positioningClarity: 'Perfil oscila sem arquétipo claro; faltam 65% para estabelecer posicionamento focado em engenharia sênior para o mercado americano.',
    evidenceCoverage: 'Descrições de cargo passivas e sem resultados mensuráveis; faltam 63% para implementação integral do framework XYZ com métricas de impacto.',
  },
  executiveSummary:
    'Seu perfil atual é praticamente invisível para recrutadores nos EUA. O conteúdo está em português, seu título usa termos genéricos ("Buscando desafios") que reduzem sua credibilidade, e suas descrições focam em tarefas passivas ("Responsável por", "Participei") sem citar volume de transações, latência, redução de custos ou impacto arquitetural.',
  profileDirection: {
    positioning: 'Senior Distributed Systems & Backend Engineer',
    primaryRole: 'Senior Backend Engineer',
    alternativeRoles: ['Senior Systems Engineer', 'Platform Engineer'],
    rationale:
      'Sua vivência real com Java/Spring, mensageria distribuída com Kafka e migração para microsserviços em fintech te qualifica para posições sênior nos EUA, mas o perfil atual não comunica sua real envergadura técnica.',
  },
  critique: [
    {
      section: 'Headline',
      assessment: 'Título passivo com lista genérica de tecnologias e mensagem de procura que reduz autoridade.',
      strengths: ['Menciona tecnologias relevantes como Java e Spring Boot.'],
      issues: [
        'Uso de "Buscando desafios" diminui o sinal de senioridade.',
        'Falta um posicionamento de impacto (ex: Distributed Systems, High-Throughput APIs).',
      ],
      severity: 'high',
    },
    {
      section: 'About / Summary',
      assessment: 'Resumo clichê ("apaixonado por código limpo") em português, sem dados de impacto.',
      strengths: ['Tom profissional amigável.'],
      issues: [
        'Totalmente em português, impossibilitando busca orgânica de recrutadores americanos.',
        'Sem menção a métricas de escala, arquitetura ou liderança técnica.',
      ],
      severity: 'high',
    },
    {
      section: 'Experiences',
      assessment: 'Descrições curtas e passivas com foco em tarefas operacionais.',
      strengths: ['Experiência real em fintech com stack moderna.'],
      issues: [
        'Frases vagas como "participei da migração" sem esclarecer qual foi a SUA contribuição.',
        'Ausência de métricas (número de RPS, latência p99, volume financeiro processado).',
      ],
      severity: 'high',
    },
    {
      section: 'Skills',
      assessment: 'Poucas skills cadastradas e sem hierarquia de senioridade.',
      strengths: ['Habilidades alinhadas ao ecossistema backend moderno.'],
      issues: ['Faltam termos de arquitetura e computação distribuída (ex: Concurrency, Event-Driven Architecture).'],
      severity: 'medium',
    },
  ],
  triageBottlenecks: [
    'Perfil redigido em português inviabiliza indexação nas buscas ativas de tech recruiters nos EUA.',
    'Ausência total de métricas mensuráveis ($, %, RPS, latência) sob o framework Google XYZ.',
    'Headline com termos passivos ("Buscando desafios") que reduzem a autoridade técnica na triagem de 6 segundos.',
  ],
};

export class DemoAiProvider implements AiProvider {
  readonly id: string = 'demo';
  readonly name: string = 'Modo Demonstração (Offline Mock)';
  private chatHistory: unknown[] = [];

  getChatHistory(): unknown[] {
    return this.chatHistory;
  }

  restoreChatHistory(history: unknown[]): void {
    this.chatHistory = Array.isArray(history) ? [...history] : [];
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  async parseAndDiagnose(input: ParseAndDiagnoseInput = {}): Promise<ParseAndDiagnoseResult> {
    // Simulate short network delay for smooth UX feel
    await new Promise((resolve) => setTimeout(resolve, 100));

    const review = {
      ...MOCK_REVIEW,
      profileDirection: {
        ...MOCK_REVIEW.profileDirection,
        primaryRole: input?.targetRole || MOCK_REVIEW.profileDirection.primaryRole,
        positioning: input?.targetRole
          ? `Senior ${input.targetRole}`
          : MOCK_REVIEW.profileDirection.positioning,
      },
    };

    this.chatHistory = [
      {
        role: 'user',
        parts: [{ text: input.pdfText || (input.pdfBase64 ? 'PDF base64 data' : 'Parse profile') }],
      },
      {
        role: 'model',
        parts: [{ text: JSON.stringify({ profile: MOCK_PROFILE, review }) }],
      },
    ];

    return {
      profile: MOCK_PROFILE,
      review,
    };
  }

  async parseProfile(_input: { pdfText: string; currentDate?: string }): Promise<Profile> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return MOCK_PROFILE;
  }

  async diagnoseProfile(input: {
    profile: Profile;
    targetRole?: string;
    currentDate?: string;
  }): Promise<ProfileReview> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      ...MOCK_REVIEW,
      profileDirection: {
        ...MOCK_REVIEW.profileDirection,
        primaryRole: input.targetRole || MOCK_REVIEW.profileDirection.primaryRole,
        positioning: input.targetRole
          ? `Senior ${input.targetRole}`
          : MOCK_REVIEW.profileDirection.positioning,
      },
    };
  }

  async generateInterview(input: {
    profile: Profile;
    objective: CareerObjective;
    review?: ProfileReview;
  }): Promise<InterviewPlan> {
    await new Promise((resolve) => setTimeout(resolve, 700));

    const isElitePolishMode = (input.review?.overallScore ?? 0) >= 92;
    if (isElitePolishMode) {
      return {
        questions: [
          {
            id: 'polish-p99-latency',
            category: 'scale',
            question:
              'Em cenários de pico de tráfego, qual era a latência p99 tolerada e que estratégia de degradação graciosa foi adotada pelos microsserviços?',
            reason:
              'Critério dos recrutadores dos EUA: Avalia profundidade em resiliência operacional e comportamento sob estresse extremo.',
            relatedExperience: 'Fintech Pagamentos Brasil',
            answerType: 'long-text',
            required: false,
          },
          {
            id: 'polish-architectural-tradeoff',
            category: 'technical-depth',
            question:
              'Qual o trade-off arquitetural mais crítico entre consistência eventual e disponibilidade imediata na decomposição do monólito financeiro?',
            reason:
              'Critério dos recrutadores dos EUA: Valida capacidade de tomar decisões de arquitetura de alto impacto com embasamento técnico.',
            relatedExperience: 'Fintech Pagamentos Brasil',
            answerType: 'long-text',
            required: false,
          },
        ],
      };
    }

    return {
      questions: [
        {
          id: 'fintech-kafka-scale',
          category: 'scale',
          question:
            'Na Fintech Pagamentos, qual era a escala ou volume aproximado de eventos/transações processadas pelos microsserviços com Kafka?',
          reason:
            'Critério dos recrutadores dos EUA: Engenheiros sênior são contratados pela capacidade de lidar com volume e concorrência. Saber se eram milhares ou milhões de requisições define sua faixa salarial.',
          relatedExperience: 'Fintech Pagamentos Brasil',
          answerType: 'long-text',
          required: false,
        },
        {
          id: 'fintech-migration-tradeoff',
          category: 'technical-depth',
          question:
            'Durante a migração do monólito para microsserviços, qual foi a maior decisão técnica ou trade-off de arquitetura que você precisou resolver?',
          reason:
            'Critério dos recrutadores dos EUA: Engenheiro sênior não é quem apenas escreve código, mas quem toma decisões difíceis (ex: consistência eventual vs transações ACID, desacoplamento de banco de dados).',
          relatedExperience: 'Fintech Pagamentos Brasil',
          answerType: 'long-text',
          required: false,
        },
        {
          id: 'invisible-work-observability',
          category: 'responsibility',
          question:
            'Você realizou algum trabalho nos bastidores que não está no seu perfil, como criação de pipelines CI/CD, métricas de observabilidade (Prometheus/Datadog) ou redução de latência?',
          reason:
            'Critério dos recrutadores dos EUA: O trabalho invisível é o maior diferencial de um engenheiro sênior. Mostrar que você se importa com resiliência em produção gera credibilidade instantânea.',
          relatedExperience: 'Fintech Pagamentos Brasil',
          answerType: 'long-text',
          required: false,
        },
      ],
    };
  }

  async evaluateProgress(input: {
    profile: Profile;
    objective: CareerObjective;
    plan: InterviewPlan;
    answers: InterviewAnswer[];
    previousFacts: ConfirmedFact[];
    roundNumber?: number;
  }): Promise<InterviewProgress> {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const facts: ConfirmedFact[] = [
      {
        id: 'fact-1',
        statement: 'Desenvolveu e otimizou APIs REST distribuídas em Java e Spring Boot com alta disponibilidade.',
        source: 'linkedin-profile',
        sourceReference: 'Experiência: Fintech Pagamentos',
        confirmed: true,
      },
      {
        id: 'fact-2',
        statement:
          'Projetou pipelines orientados a eventos com Apache Kafka processando alto volume transacional com garantias de idempotência.',
        source: 'interview',
        sourceReference: 'Entrevista: Escala Kafka',
        confirmed: true,
      },
      {
        id: 'fact-3',
        statement:
          'Liderou a decomposição de módulos críticos do monólito financeiro para microsserviços desacoplados com PostgreSQL isolado.',
        source: 'interview',
        sourceReference: 'Entrevista: Migração Monólito',
        confirmed: true,
      },
      {
        id: 'fact-4',
        statement:
          'Implementou instrumentação com métricas de observabilidade e dashboards de alerta para monitoramento de SLA e latência p99.',
        source: 'interview',
        sourceReference: 'Entrevista: Trabalho Invisível',
        confirmed: true,
      },
    ];

    return {
      readyForGeneration: true,
      rationale:
        'Respostas coletadas forneceram evidências robustas de arquitetura, escala e impacto para um posicionamento sênior de alto nível no mercado dos EUA.',
      questions: [],
      facts,
    };
  }

  async generateRewrittenProfile(input: {
    profile: Profile;
    objective: CareerObjective;
    confirmedFacts: ConfirmedFact[];
    initialReview?: ProfileReview;
    currentDate?: string;
    interviewAnswers?: InterviewAnswer[];
  }): Promise<ProfileAnalysis> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const defaultExperiences = [
      {
        title: 'Senior Software Engineer',
        companyName: 'Fintech Pagamentos Brasil',
        bullets: [
          'Architected high-throughput event-driven microservices using Java 21, Spring Boot, and Apache Kafka, ensuring strict idempotency and sub-100ms response times.',
          'Spearheaded the incremental extraction of core payment services from a legacy monolith into decoupled microservices with isolated PostgreSQL databases.',
          'Instituted comprehensive observability practices with distributed tracing and metric dashboards, cutting production incident resolution time by 35%.',
        ],
      },
      {
        title: 'Software Engineer',
        companyName: 'Varejo Online S.A.',
        bullets: [
          'Engineered core catalog and checkout backend services, sustaining high concurrent traffic during seasonal promotion spikes.',
          'Refactored legacy query patterns and implemented caching layers, reducing database CPU load by 28%.',
          'Mentored junior engineers on clean architecture patterns, automated unit testing with JUnit, and code review standards.',
        ],
      },
    ];

    const rewrittenExperiences = input.profile?.experiences && Array.isArray(input.profile.experiences)
      ? enforceExperienceRecovery(input.profile.experiences, defaultExperiences)
      : defaultExperiences;

    let scores = {
      searchRelevance: 95,
      humanVoice: 92,
      credibility: 96,
      positioningClarity: 97,
      evidenceCoverage: 91,
    };
    let overallScore = 94;

    if (input.initialReview?.scores) {
      const init = input.initialReview.scores;
      scores = {
        searchRelevance: Math.max(scores.searchRelevance, init.searchRelevance ?? 0),
        humanVoice: Math.max(scores.humanVoice, init.humanVoice ?? 0),
        credibility: Math.max(scores.credibility, init.credibility ?? 0),
        positioningClarity: Math.max(scores.positioningClarity, init.positioningClarity ?? 0),
        evidenceCoverage: Math.max(scores.evidenceCoverage, init.evidenceCoverage ?? 0),
      };
    }

    if (typeof input.initialReview?.overallScore === 'number') {
      overallScore = Math.max(overallScore, input.initialReview.overallScore);
    }

    const triageBottlenecks =
      input.initialReview?.triageBottlenecks && input.initialReview.triageBottlenecks.length > 0
        ? [...input.initialReview.triageBottlenecks]
        : [...(MOCK_REVIEW.triageBottlenecks || [])];

    const analysis: ProfileAnalysis = {
      targetMarket: 'United States',
      language: 'en',
      initialScore: input.initialReview?.overallScore ?? 42,
      overallScore,
      scores,
      scoreExplanations: {
        searchRelevance: 'Headline otimizada com palavras-chave estratégicas e indexação ATS de alto sinal para recrutadores dos EUA.',
        humanVoice: 'Linguagem técnica natural em inglês americano, com narrativa executiva concisa e precisa.',
        credibility: 'Trajetória comprovada com arquitetura de sistemas distribuídos e impacto de engenharia evidente.',
        positioningClarity: 'Arquétipo sênior bem definido e alinhado diretamente com as expectativas de contratação remota.',
        evidenceCoverage: 'Todas as experiências descritas com o framework XYZ contendo métricas reais de impacto e escala.',
      },
      executiveSummary:
        'Transformação completa! Seu perfil agora está 100% em inglês americano nativo, com uma Headline de alto sinal focada em Sistemas Distribuídos e Backend Sênior. As experiências foram reescritas com o framework XYZ, destacando a arquitetura de microsserviços com Kafka, resiliência e métricas comprovadas.',
      profileDirection: {
        positioning: 'Senior Distributed Systems & Backend Engineer',
        primaryRole: input.objective.primaryRole || 'Senior Backend Engineer',
        alternativeRoles: ['Senior Systems Engineer', 'Platform Engineer'],
        rationale:
          'O novo perfil projeta senioridade inequívoca, articulando domínio de concorrência, consistência eventual e autonomia técnica.',
      },
      critique: [
        {
          section: 'Headline',
          assessment: 'Excelente alinhamento com buscas booleanas de recrutadores sênior nos EUA.',
          strengths: ['Sem termos amadores', 'Foco claro em valor técnico e escala'],
          issues: [],
          severity: 'low',
        },
      ],
      triageBottlenecks,
      rewritten: {
        headline: `${input.objective.primaryRole || 'Senior Backend Engineer'} | Java, Spring Boot, React | Distributed Systems & High-Throughput APIs | AWS, Docker`,
        summary:
          'Senior Backend Engineer with 6+ years of experience designing and scaling fault-tolerant distributed systems and mission-critical financial APIs. Proven track record in decoupling monoliths into resilient microservices, optimizing database throughput, and building event-driven pipelines handling millions of daily transactions.\n\nDeeply focused on operational excellence, observability (metrics, tracing, p99 latency reduction), and automated CI/CD workflows that enable engineering teams to ship safely at high velocity.\n\nCore Technologies: Java 21, Spring Boot, Apache Kafka, PostgreSQL, Docker, Kubernetes, AWS, Microservices Architecture, Distributed Systems.',
        experiences: rewrittenExperiences,
        skills: [
          'Java',
          'Spring Boot',
          'Distributed Systems',
          'Microservices Architecture',
          'Apache Kafka',
          'Event-Driven Architecture',
          'PostgreSQL',
          'Database Optimization',
          'Docker',
          'Kubernetes',
          'Amazon Web Services (AWS)',
          'RESTful APIs',
          'Observability & Distributed Tracing',
          'System Design',
          'CI/CD Pipelines',
        ],
      },
    };

    this.chatHistory.push(
      { role: 'user', parts: [{ text: 'Generate rewritten profile' }] },
      { role: 'model', parts: [{ text: JSON.stringify(analysis) }] },
    );

    return analysis;
  }
}

export class MockAiProvider extends DemoAiProvider {
  override readonly id = 'mock';
  override readonly name = 'Mock AI Provider';
}

