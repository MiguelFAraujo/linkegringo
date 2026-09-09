import { Type, type Schema } from '@google/genai';

export const yearMonthResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    year: { type: Type.INTEGER },
    month: { type: Type.INTEGER },
  },
  required: ['year'],
};

export const dateRangeResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    start: yearMonthResponseSchema,
    end: yearMonthResponseSchema,
  },
};

export const experienceResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    companyName: { type: Type.STRING },
    employmentType: { type: Type.STRING },
    workplaceType: {
      type: Type.STRING,
      enum: ['remote', 'hybrid', 'onsite'],
    },
    location: { type: Type.STRING },
    startDate: yearMonthResponseSchema,
    endDate: yearMonthResponseSchema,
    current: { type: Type.BOOLEAN },
    dateRangeText: { type: Type.STRING },
    durationText: { type: Type.STRING },
    description: {
      type: Type.STRING,
      description:
        'Full verbatim original description and bullet points from the document for this position. Do NOT summarize or omit. If none exists, provide an empty string.',
    },
  },
  required: ['title', 'companyName', 'description'],
};

export const educationResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    schoolName: { type: Type.STRING },
    degreeName: { type: Type.STRING },
    fieldOfStudy: { type: Type.STRING },
    grade: { type: Type.STRING },
    description: { type: Type.STRING },
    dateRange: dateRangeResponseSchema,
  },
  required: ['schoolName'],
};

export const skillResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    endorsementCount: { type: Type.INTEGER },
  },
  required: ['name'],
};

export const certificationResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    issuer: { type: Type.STRING },
    credentialId: { type: Type.STRING },
    url: { type: Type.STRING },
  },
  required: ['name'],
};

export const projectResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    url: { type: Type.STRING },
    dateRange: dateRangeResponseSchema,
  },
  required: ['name'],
};

export const languageResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    proficiency: { type: Type.STRING },
  },
  required: ['name'],
};

export const honorResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    issuer: { type: Type.STRING },
    description: { type: Type.STRING },
  },
  required: ['title'],
};

export const profileResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    publicId: { type: Type.STRING },
    firstName: { type: Type.STRING },
    lastName: { type: Type.STRING },
    headline: { type: Type.STRING },
    location: { type: Type.STRING },
    summary: { type: Type.STRING },
    experiences: {
      type: Type.ARRAY,
      items: experienceResponseSchema,
    },
    education: {
      type: Type.ARRAY,
      items: educationResponseSchema,
    },
    skills: {
      type: Type.ARRAY,
      items: skillResponseSchema,
    },
    certifications: {
      type: Type.ARRAY,
      items: certificationResponseSchema,
    },
    projects: {
      type: Type.ARRAY,
      items: projectResponseSchema,
    },
    languages: {
      type: Type.ARRAY,
      items: languageResponseSchema,
    },
    honors: {
      type: Type.ARRAY,
      items: honorResponseSchema,
    },
  },
  required: [
    'publicId',
    'firstName',
    'lastName',
    'headline',
    'location',
    'summary',
    'experiences',
    'education',
    'skills',
    'certifications',
    'languages',
  ],
};

// ---------------------------------------------------------------------------
// 1. parseProfile CoT Schema
// ---------------------------------------------------------------------------

export const parseProfileReasoningSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    detectedLanguage: {
      type: Type.STRING,
      enum: ['pt', 'en', 'es'],
    },
    sectionBoundaries: {
      type: Type.OBJECT,
      properties: {
        header: { type: Type.STRING },
        about: { type: Type.STRING },
        experience: { type: Type.STRING },
        education: { type: Type.STRING },
        skills: { type: Type.STRING },
      },
      required: ['header', 'about', 'experience', 'education', 'skills'],
    },
    chronologyAndCompanyAudit: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          company: { type: Type.STRING },
          isGroupedRoles: { type: Type.BOOLEAN },
          roleDetected: { type: Type.STRING },
          period: { type: Type.STRING },
          isCurrent: { type: Type.BOOLEAN },
        },
        required: ['company', 'isGroupedRoles', 'roleDetected', 'period', 'isCurrent'],
      },
    },
    textArtifactCleanupsApplied: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    'detectedLanguage',
    'sectionBoundaries',
    'chronologyAndCompanyAudit',
    'textArtifactCleanupsApplied',
  ],
};

export const geminiParseProfileSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    reasoning: parseProfileReasoningSchema,
    profile: profileResponseSchema,
  },
  required: ['reasoning', 'profile'],
};

export const parseProfileSchema: Schema = geminiParseProfileSchema;

// ---------------------------------------------------------------------------
// 2. diagnoseProfile CoT Schema
// ---------------------------------------------------------------------------

export const profileScoresResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    searchRelevance: { type: Type.INTEGER },
    humanVoice: { type: Type.INTEGER },
    credibility: { type: Type.INTEGER },
    positioningClarity: { type: Type.INTEGER },
    evidenceCoverage: { type: Type.INTEGER },
  },
  required: [
    'searchRelevance',
    'humanVoice',
    'credibility',
    'positioningClarity',
    'evidenceCoverage',
  ],
};

export const profileDirectionResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    positioning: { type: Type.STRING },
    primaryRole: { type: Type.STRING },
    alternativeRoles: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    openToWorkTitles: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '5 high-conversion target titles for the LinkedIn Open to Work spotlight filter',
    },
    rationale: { type: Type.STRING },
  },
  required: ['positioning', 'primaryRole', 'rationale'],
};

export const sectionCritiqueResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    section: { type: Type.STRING },
    assessment: { type: Type.STRING },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    issues: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    severity: {
      type: Type.STRING,
      enum: ['high', 'medium', 'low'],
    },
  },
  required: ['section', 'assessment', 'strengths', 'issues', 'severity'],
};

export const scoreExplanationsResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    searchRelevance: { type: Type.STRING },
    humanVoice: { type: Type.STRING },
    credibility: { type: Type.STRING },
    positioningClarity: { type: Type.STRING },
    evidenceCoverage: { type: Type.STRING },
  },
  required: [
    'searchRelevance',
    'humanVoice',
    'credibility',
    'positioningClarity',
    'evidenceCoverage',
  ],
};

export const profileReviewResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    targetMarket: { type: Type.STRING },
    language: { type: Type.STRING },
    overallScore: { type: Type.INTEGER },
    scores: profileScoresResponseSchema,
    scoreExplanations: scoreExplanationsResponseSchema,
    executiveSummary: { type: Type.STRING },
    profileDirection: profileDirectionResponseSchema,
    critique: {
      type: Type.ARRAY,
      items: sectionCritiqueResponseSchema,
    },
    triageBottlenecks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        'Critical disqualifiers that cause US tech recruiters to discard the profile during the initial 6-second triage scan.',
    },
  },
  required: [
    'targetMarket',
    'language',
    'overallScore',
    'scores',
    'scoreExplanations',
    'executiveSummary',
    'profileDirection',
    'critique',
    'triageBottlenecks',
  ],
};

export const diagnoseProfileReasoningSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    evidenceInventory: {
      type: Type.OBJECT,
      properties: {
        detectedLanguage: { type: Type.STRING },
        headlineAnalysis: { type: Type.STRING },
        quantifiableMetricsCount: { type: Type.INTEGER },
        qualitativeClaims: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        recentStintsUnderOneYear: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        pdfSkillsLimitationNoticed: { type: Type.BOOLEAN },
      },
      required: [
        'detectedLanguage',
        'headlineAnalysis',
        'quantifiableMetricsCount',
        'qualitativeClaims',
        'recentStintsUnderOneYear',
        'pdfSkillsLimitationNoticed',
      ],
    },
    rubricAuditAndDeductions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          pillar: {
            type: Type.STRING,
            enum: [
              'searchRelevance',
              'humanVoice',
              'credibility',
              'positioningClarity',
              'evidenceCoverage',
            ],
          },
          startingScore: { type: Type.INTEGER },
          deductions: { type: Type.INTEGER },
          rationale: { type: Type.STRING },
        },
        required: ['pillar', 'startingScore', 'deductions', 'rationale'],
      },
    },
    calculatedScores: {
      type: Type.OBJECT,
      properties: {
        searchRelevance: { type: Type.INTEGER },
        humanVoice: { type: Type.INTEGER },
        credibility: { type: Type.INTEGER },
        positioningClarity: { type: Type.INTEGER },
        evidenceCoverage: { type: Type.INTEGER },
        overallScore: { type: Type.INTEGER },
      },
      required: [
        'searchRelevance',
        'humanVoice',
        'credibility',
        'positioningClarity',
        'evidenceCoverage',
        'overallScore',
      ],
    },
  },
  required: ['evidenceInventory', 'rubricAuditAndDeductions', 'calculatedScores'],
};

export const geminiDiagnoseProfileSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    reasoning: diagnoseProfileReasoningSchema,
    review: profileReviewResponseSchema,
  },
  required: ['reasoning', 'review'],
};

export const diagnoseProfileSchema: Schema = geminiDiagnoseProfileSchema;

export const parseAndDiagnoseReasoningSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    // Phase 1: Physical Inventory & Count N
    physicalInventory: {
      type: Type.OBJECT,
      properties: {
        companyCountN: { type: Type.INTEGER },
        companiesEnumerated: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ['companyCountN', 'companiesEnumerated'],
    },
    // Phase 2: Spatial Separation & Column Stitching
    spatialSeparationAndStitching: {
      type: Type.OBJECT,
      properties: {
        sidebarElementsIdentified: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        pageBreakContinuationsStitched: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ['sidebarElementsIdentified', 'pageBreakContinuationsStitched'],
    },
    // Phase 3: Deterministic Rubric Deduction
    rubricAuditAndDeductions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          pillar: {
            type: Type.STRING,
            enum: [
              'searchRelevance',
              'humanVoice',
              'credibility',
              'positioningClarity',
              'evidenceCoverage',
            ],
          },
          startingScore: { type: Type.INTEGER },
          deductions: { type: Type.INTEGER },
          rationale: { type: Type.STRING },
        },
        required: ['pillar', 'startingScore', 'deductions', 'rationale'],
      },
    },
    calculatedScores: {
      type: Type.OBJECT,
      properties: {
        searchRelevance: { type: Type.INTEGER },
        humanVoice: { type: Type.INTEGER },
        credibility: { type: Type.INTEGER },
        positioningClarity: { type: Type.INTEGER },
        evidenceCoverage: { type: Type.INTEGER },
        overallScore: { type: Type.INTEGER },
      },
      required: [
        'searchRelevance',
        'humanVoice',
        'credibility',
        'positioningClarity',
        'evidenceCoverage',
        'overallScore',
      ],
    },
    // Phase 4: Output Invariant Check
    outputInvariantCheck: {
      type: Type.OBJECT,
      properties: {
        inventoryCountN: { type: Type.INTEGER },
        extractedExperiencesCount: { type: Type.INTEGER },
        invariantSatisfied: { type: Type.BOOLEAN },
      },
      required: ['inventoryCountN', 'extractedExperiencesCount', 'invariantSatisfied'],
    },
  },
  required: [
    'physicalInventory',
    'spatialSeparationAndStitching',
    'rubricAuditAndDeductions',
    'calculatedScores',
    'outputInvariantCheck',
  ],
};

export const geminiParseAndDiagnoseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    reasoning: parseAndDiagnoseReasoningSchema,
    profile: profileResponseSchema,
    review: profileReviewResponseSchema,
  },
  required: ['reasoning', 'profile', 'review'],
};

/**
 * @deprecated Legacy composite schema kept for backward compatibility.
 */
export const parseAndDiagnoseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    profile: profileResponseSchema,
    review: profileReviewResponseSchema,
  },
  required: ['profile', 'review'],
};

// ---------------------------------------------------------------------------
// 3. generateInterview CoT Schema
// ---------------------------------------------------------------------------

export const interviewQuestionResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    category: {
      type: Type.STRING,
      enum: [
        'direction',
        'responsibility',
        'technical-depth',
        'impact',
        'scale',
        'leadership',
        'preference',
        'market',
        'credibility',
        'differentiation',
      ],
    },
    question: { type: Type.STRING },
    reason: { type: Type.STRING },
    placeholderExample: { type: Type.STRING },
    relatedExperience: { type: Type.STRING },
    answerType: {
      type: Type.STRING,
      enum: ['short-text', 'long-text', 'single-choice', 'yes-no'],
    },
    options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    required: { type: Type.BOOLEAN },
  },
  required: ['id', 'category', 'question', 'reason', 'answerType'],
};

export const interviewPlanReasoningSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    diagnosticGapsIdentified: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    questionStrategy: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          targetTopic: { type: Type.STRING },
          usRecruiterRationale: { type: Type.STRING },
          memoryTrigger: { type: Type.STRING },
          draftedPlaceholder: { type: Type.STRING },
        },
        required: ['targetTopic', 'usRecruiterRationale', 'memoryTrigger', 'draftedPlaceholder'],
      },
    },
  },
  required: ['diagnosticGapsIdentified', 'questionStrategy'],
};

export const geminiInterviewPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    reasoning: interviewPlanReasoningSchema,
    questions: {
      type: Type.ARRAY,
      items: interviewQuestionResponseSchema,
    },
  },
  required: ['reasoning', 'questions'],
};

export const interviewPlanSchema: Schema = geminiInterviewPlanSchema;

// ---------------------------------------------------------------------------
// 4. evaluateProgress CoT Schema
// ---------------------------------------------------------------------------

export const confirmedFactResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    statement: { type: Type.STRING },
    source: {
      type: Type.STRING,
      enum: ['linkedin-profile', 'interview'],
    },
    sourceReference: { type: Type.STRING },
    confirmed: { type: Type.BOOLEAN },
  },
  required: ['id', 'statement', 'source', 'sourceReference', 'confirmed'],
};

export const interviewProgressReasoningSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    answerSubstanceAudit: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionId: { type: Type.STRING },
          candidateProvidedMetrics: { type: Type.BOOLEAN },
          extractedMetrics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          technicalDepthScore: { type: Type.STRING },
        },
        required: [
          'questionId',
          'candidateProvidedMetrics',
          'extractedMetrics',
          'technicalDepthScore',
        ],
      },
    },
    generationReadinessDeliberation: { type: Type.STRING },
    factsExtractionPlan: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    'answerSubstanceAudit',
    'generationReadinessDeliberation',
    'factsExtractionPlan',
  ],
};

export const interviewProgressContentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    readyForGeneration: { type: Type.BOOLEAN },
    rationale: { type: Type.STRING },
    questions: {
      type: Type.ARRAY,
      items: interviewQuestionResponseSchema,
    },
    facts: {
      type: Type.ARRAY,
      items: confirmedFactResponseSchema,
    },
  },
  required: ['readyForGeneration', 'rationale', 'questions', 'facts'],
};

export const geminiInterviewProgressSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    reasoning: interviewProgressReasoningSchema,
    progress: interviewProgressContentSchema,
  },
  required: ['reasoning', 'progress'],
};

export const interviewProgressSchema: Schema = geminiInterviewProgressSchema;

// ---------------------------------------------------------------------------
// 5. generateRewrittenProfile CoT Schema
// ---------------------------------------------------------------------------

export const rewrittenExperienceResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    companyName: { type: Type.STRING },
    bullets: {
      type: Type.ARRAY,
      description:
        'Array of 3 to 5 Google XYZ bullets for recent roles (up to 5 to 7 bullets for broad end-to-end scope roles across front/back/infra; 2 to 4 for earlier roles). Accomplished [X], measured by [Y], by doing [Z]. Preserve all original responsibilities and integrate confirmed interview facts.',
      items: {
        type: Type.STRING,
        description: '100% Google XYZ bullet: Accomplished [X], measured by [Y], by doing [Z]',
      },
    },
  },
  required: ['title', 'companyName', 'bullets'],
};

export const rewrittenContentResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    headline: {
      type: Type.STRING,
      description: 'Max 160 characters: [Role Anchor] | [3-4 Core Techs] | [System Scale] | [US Remote / Seniority]',
    },
    summary: {
      type: Type.STRING,
      description: 'About section with opening hook under 250 characters visible before fold',
    },
    experiences: {
      type: Type.ARRAY,
      items: rewrittenExperienceResponseSchema,
    },
    skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    openToWorkTitles: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '5 high-conversion target titles for the LinkedIn Open to Work spotlight filter',
    },
    cardConversionBadges: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '3 conversion badges (e.g., Cargo semântico, Stack de alta busca, Senioridade clara)',
    },
    cardConversionReasons: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Reasons explaining why the rewritten card converts US technical recruiters',
    },
  },
  required: ['headline', 'summary', 'experiences', 'skills'],
};

export const profileAnalysisContentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    targetMarket: { type: Type.STRING },
    language: { type: Type.STRING },
    initialScore: { type: Type.INTEGER },
    overallScore: { type: Type.INTEGER },
    scores: profileScoresResponseSchema,
    scoreExplanations: scoreExplanationsResponseSchema,
    executiveSummary: { type: Type.STRING },
    profileDirection: profileDirectionResponseSchema,
    critique: {
      type: Type.ARRAY,
      items: sectionCritiqueResponseSchema,
    },
    triageBottlenecks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        'Critical disqualifiers that cause US tech recruiters to discard the profile during the initial 6-second triage scan.',
    },
    rewritten: rewrittenContentResponseSchema,
  },
  required: [
    'targetMarket',
    'language',
    'overallScore',
    'scores',
    'executiveSummary',
    'profileDirection',
    'critique',
    'triageBottlenecks',
    'rewritten',
  ],
};

export const rewrittenProfileReasoningSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    positioningArchetype: { type: Type.STRING },
    headlineFormulation: {
      type: Type.STRING,
      description: 'Formula-compliant headline craft (max 160 characters: [Role Anchor] | [3-4 Core Techs] | [System Scale] | [US Remote / Seniority])',
    },
    aboutSectionBlueprint: {
      type: Type.OBJECT,
      properties: {
        hookSentence: {
          type: Type.STRING,
          description: 'High-impact opening hook strictly under 250 characters visible before LinkedIn See more cutoff',
        },
        architectureParagraph: { type: Type.STRING },
        categorizedStack: { type: Type.STRING },
      },
      required: ['hookSentence', 'architectureParagraph', 'categorizedStack'],
    },
    experienceFactMapping: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          company: { type: Type.STRING },
          assignedFacts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          xyzBulletsDraft: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
              description: '100% Google XYZ bullet: Accomplished [X], measured by [Y], by doing [Z]',
            },
          },
        },
        required: ['company', 'assignedFacts', 'xyzBulletsDraft'],
      },
    },
    scoreImprovementAudit: { type: Type.STRING },
  },
  required: [
    'positioningArchetype',
    'headlineFormulation',
    'aboutSectionBlueprint',
    'experienceFactMapping',
    'scoreImprovementAudit',
  ],
};

export const geminiRewrittenProfileSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    reasoning: rewrittenProfileReasoningSchema,
    analysis: profileAnalysisContentSchema,
  },
  required: ['reasoning', 'analysis'],
};

export const rewrittenProfileSchema: Schema = geminiRewrittenProfileSchema;
export const profileAnalysisSchema: Schema = geminiRewrittenProfileSchema;

export const geminiMicroIntegrationProposalSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    status: {
      type: Type.STRING,
      enum: ['ready', 'blocked'],
      description: 'ready if the integration is safe and factual; blocked if candidate denied or lack of evidence.',
    },
    patchKind: {
      type: Type.STRING,
      enum: ['headline_replace', 'about_insert', 'experience_rewrite', 'skill_add', 'no_safe_change'],
    },
    term: { type: Type.STRING },
    target: {
      type: Type.OBJECT,
      properties: {
        section: {
          type: Type.STRING,
          enum: ['headline', 'about', 'experience', 'skills'],
        },
        experienceId: { type: Type.STRING },
        bulletIndex: { type: Type.INTEGER },
      },
      required: ['section'],
    },
    before: {
      type: Type.STRING,
      description: 'Exact verbatim string being replaced from the current profile block.',
    },
    after: {
      type: Type.STRING,
      description: 'Exact replacement text incorporating the target term naturally without hallucination.',
    },
    rationale: {
      type: Type.STRING,
      description: 'Concise explanation of why this patch converts and adheres to Google XYZ standards.',
    },
    matchedEvidence: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    warnings: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ['status', 'patchKind', 'term', 'target', 'before', 'rationale'],
};
