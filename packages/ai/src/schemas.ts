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
    description: { type: Type.STRING },
  },
  required: ['title', 'companyName'],
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

export const profileReviewResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    targetMarket: { type: Type.STRING },
    language: { type: Type.STRING },
    overallScore: { type: Type.INTEGER },
    scores: profileScoresResponseSchema,
    executiveSummary: { type: Type.STRING },
    profileDirection: profileDirectionResponseSchema,
    critique: {
      type: Type.ARRAY,
      items: sectionCritiqueResponseSchema,
    },
  },
  required: [
    'targetMarket',
    'language',
    'overallScore',
    'scores',
    'executiveSummary',
    'profileDirection',
    'critique',
  ],
};

export const parseAndDiagnoseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    profile: profileResponseSchema,
    review: profileReviewResponseSchema,
  },
  required: ['profile', 'review'],
};

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

export const interviewPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: interviewQuestionResponseSchema,
    },
  },
  required: ['questions'],
};

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

export const interviewProgressSchema: Schema = {
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

export const rewrittenExperienceResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    companyName: { type: Type.STRING },
    bullets: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ['title', 'companyName', 'bullets'],
};

export const rewrittenContentResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING },
    summary: { type: Type.STRING },
    experiences: {
      type: Type.ARRAY,
      items: rewrittenExperienceResponseSchema,
    },
    skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ['headline', 'summary', 'experiences', 'skills'],
};

export const rewrittenProfileSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    targetMarket: { type: Type.STRING },
    language: { type: Type.STRING },
    initialScore: { type: Type.INTEGER },
    overallScore: { type: Type.INTEGER },
    scores: profileScoresResponseSchema,
    executiveSummary: { type: Type.STRING },
    profileDirection: profileDirectionResponseSchema,
    critique: {
      type: Type.ARRAY,
      items: sectionCritiqueResponseSchema,
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
    'rewritten',
  ],
};

export const profileAnalysisSchema: Schema = rewrittenProfileSchema;
