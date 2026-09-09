import type { ProfileScores } from '../domain/analysis.js';

export const weakProfileScores: ProfileScores = {
  searchRelevance: 35,
  positioningClarity: 40,
  evidenceCoverage: 30,
  credibility: 45,
  humanVoice: 50,
};

export const strongProfileScores: ProfileScores = {
  searchRelevance: 95,
  positioningClarity: 90,
  evidenceCoverage: 88,
  credibility: 92,
  humanVoice: 90,
};

export const boundaryProfileScores: ProfileScores = {
  searchRelevance: 80,
  positioningClarity: 65,
  evidenceCoverage: 75,
  credibility: 60,
  humanVoice: 70,
};
