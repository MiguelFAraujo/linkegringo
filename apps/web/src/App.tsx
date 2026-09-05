import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { OnboardingModal } from './components/OnboardingModal';
import { ApiKeyDialog } from './components/ApiKeyDialog';
import { FileUploadDropzone } from './components/FileUploadDropzone';
import { DiagnosticView } from './components/DiagnosticView';
import { ObjectiveForm } from './components/ObjectiveForm';
import { InterviewView } from './components/InterviewView';
import { FactsConfirmation } from './components/FactsConfirmation';
import { ActionHubView } from './components/ActionHubView';
import {
  getStoredApiKey,
  setStoredApiKey,
  clearStoredApiKey,
  getStoredProviderId,
  setStoredProviderId,
  getStoredSession,
  saveStoredSession,
  clearStoredSession,
  hasSeenOnboarding,
  setOnboardingSeen,
} from './lib/storage';
import { createAiProvider } from '@linkegringo/ai';
import type {
  CareerObjective,
  ConfirmedFact,
  InterviewAnswer,
  InterviewPlan,
  Profile,
  ProfileAnalysis,
  ProfileReview,
} from '@linkegringo/core';

export type FlowStep = 'upload' | 'diagnostic' | 'objective' | 'interview' | 'facts' | 'action-hub';

interface SessionState {
  step: FlowStep;
  profile?: Profile;
  review?: ProfileReview;
  objective?: CareerObjective;
  interviewPlan?: InterviewPlan;
  interviewAnswers?: InterviewAnswer[];
  facts?: ConfirmedFact[];
  analysis?: ProfileAnalysis;
}

export function App() {
  const [apiKey, setApiKey] = useState<string>(getStoredApiKey());
  const [providerId, setProviderId] = useState<string>(getStoredProviderId());

  const [step, setStep] = useState<FlowStep>('upload');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [review, setReview] = useState<ProfileReview | null>(null);
  const [objective, setObjective] = useState<CareerObjective | null>(null);
  const [interviewPlan, setInterviewPlan] = useState<InterviewPlan | null>(null);
  const [interviewAnswers, setInterviewAnswers] = useState<InterviewAnswer[]>([]);
  const [facts, setFacts] = useState<ConfirmedFact[]>([]);
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // Restore session on mount
  useEffect(() => {
    const saved = getStoredSession<SessionState>();
    if (saved && saved.step && saved.profile && saved.review) {
      setStep(saved.step);
      setProfile(saved.profile);
      setReview(saved.review);
      if (saved.objective) setObjective(saved.objective);
      if (saved.interviewPlan) setInterviewPlan(saved.interviewPlan);
      if (saved.interviewAnswers) setInterviewAnswers(saved.interviewAnswers);
      if (saved.facts) setFacts(saved.facts);
      if (saved.analysis) setAnalysis(saved.analysis);
    } else {
      // First time visitor check
      if (!hasSeenOnboarding()) {
        setOnboardingOpen(true);
        setOnboardingSeen(true);
      }
    }
  }, []);

  // Persist session changes
  useEffect(() => {
    if (profile && review) {
      const stateToSave: SessionState = {
        step,
        profile,
        review,
        objective: objective || undefined,
        interviewPlan: interviewPlan || undefined,
        interviewAnswers,
        facts,
        analysis: analysis || undefined,
      };
      saveStoredSession(stateToSave);
    }
  }, [step, profile, review, objective, interviewPlan, interviewAnswers, facts, analysis]);

  const getActiveProvider = () => {
    return createAiProvider(providerId, { apiKey });
  };

  // Step 1 ➔ Step 2: Upload and Diagnose
  const handleAnalyze = async (files: {
    pdfBase64: string;
    cvPdfBase64?: string;
    fileName: string;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const provider = getActiveProvider();
      const result = await provider.parseAndDiagnose({
        pdfBase64: files.pdfBase64,
        cvPdfBase64: files.cvPdfBase64,
      });

      setProfile(result.profile);
      setReview(result.review);
      setStep('diagnostic');
    } catch (err: any) {
      console.error('Erro na análise do perfil:', err);
      setErrorMessage(
        err?.message || 'Falha ao analisar o perfil com a IA. Verifique sua chave de API e tente novamente.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Instant Demo Mode
  const handleLoadDemo = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setProviderId('demo');
    setStoredProviderId('demo');

    try {
      const provider = createAiProvider('demo');
      const result = await provider.parseAndDiagnose({});
      setProfile(result.profile);
      setReview(result.review);
      setStep('diagnostic');
    } catch (err: any) {
      console.error('Erro no modo demo:', err);
      setErrorMessage('Erro ao carregar dados de demonstração.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 ➔ Step 3: From Raio-X to Objective
  const handleProceedToObjective = () => {
    setStep('objective');
  };

  // Step 3 ➔ Step 4: From Objective to Interview
  const handleSubmitObjective = async (newObjective: CareerObjective) => {
    if (!profile) return;
    setIsLoading(true);
    setErrorMessage(null);
    setObjective(newObjective);

    try {
      const provider = getActiveProvider();
      const plan = await provider.generateInterview({
        profile,
        objective: newObjective,
      });

      setInterviewPlan(plan);
      setStep('interview');
    } catch (err: any) {
      console.error('Erro ao gerar entrevista:', err);
      setErrorMessage(err?.message || 'Falha ao gerar perguntas da entrevista.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 4 ➔ Step 5: Submit Interview Answers to Facts
  const handleSubmitAnswers = async (answers: InterviewAnswer[]) => {
    if (!profile || !objective || !interviewPlan) return;
    setIsLoading(true);
    setErrorMessage(null);
    setInterviewAnswers(answers);

    try {
      const provider = getActiveProvider();
      const progress = await provider.evaluateProgress({
        profile,
        objective,
        plan: interviewPlan,
        answers,
        previousFacts: facts,
      });

      setFacts(progress.facts);
      setStep('facts');
    } catch (err: any) {
      console.error('Erro ao avaliar entrevista:', err);
      setErrorMessage(err?.message || 'Falha ao processar as respostas da entrevista.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 5 ➔ Step 6: Confirm Facts and Generate Action Hub Profile
  const handleConfirmFactsAndGenerate = async (confirmedFacts: ConfirmedFact[]) => {
    if (!profile || !objective) return;
    setIsLoading(true);
    setErrorMessage(null);
    setFacts(confirmedFacts);

    try {
      const provider = getActiveProvider();
      const finalAnalysis = await provider.generateRewrittenProfile({
        profile,
        objective,
        confirmedFacts,
        initialReview: review || undefined,
      });

      setAnalysis(finalAnalysis);
      setStep('action-hub');
    } catch (err: any) {
      console.error('Erro ao gerar perfil final:', err);
      setErrorMessage(err?.message || 'Falha ao gerar perfil otimizado.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Session
  const handleResetSession = () => {
    clearStoredSession();
    setStep('upload');
    setProfile(null);
    setReview(null);
    setObjective(null);
    setInterviewPlan(null);
    setInterviewAnswers([]);
    setFacts([]);
    setAnalysis(null);
    setErrorMessage(null);
  };

  // Toggle Demo Mode from Header
  const handleToggleDemoMode = () => {
    if (providerId === 'demo') {
      setProviderId('gemini');
      setStoredProviderId('gemini');
    } else {
      setProviderId('demo');
      setStoredProviderId('demo');
    }
  };

  // Save API Key & Provider from Dialog
  const handleSaveApiKey = (newKey: string, newProviderId: string) => {
    setApiKey(newKey);
    setStoredApiKey(newKey);
    setProviderId(newProviderId);
    setStoredProviderId(newProviderId);
  };

  const handleClearApiKey = () => {
    setApiKey('');
    clearStoredApiKey();
  };

  const hasActiveSession = Boolean(profile && review);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header
        apiKey={apiKey}
        providerId={providerId}
        onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)}
        onOpenOnboarding={() => setOnboardingOpen(true)}
        onToggleDemoMode={handleToggleDemoMode}
        onResetSession={handleResetSession}
        hasActiveSession={hasActiveSession}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="max-w-3xl mx-auto mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between gap-3 text-xs sm:text-sm">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white font-bold px-2 py-1"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Dynamic step view */}
        {step === 'upload' && (
          <FileUploadDropzone
            onAnalyze={handleAnalyze}
            onLoadDemo={handleLoadDemo}
            isLoading={isLoading}
            onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)}
            hasApiKey={Boolean(apiKey && apiKey.trim().length > 0)}
            isDemoMode={providerId === 'demo'}
          />
        )}

        {step === 'diagnostic' && profile && review && (
          <DiagnosticView
            profile={profile}
            review={review}
            onProceedToObjective={handleProceedToObjective}
          />
        )}

        {step === 'objective' && review && (
          <ObjectiveForm
            initialReview={review}
            onSubmitObjective={handleSubmitObjective}
            onBack={() => setStep('diagnostic')}
            isLoading={isLoading}
          />
        )}

        {step === 'interview' && interviewPlan && (
          <InterviewView
            plan={interviewPlan}
            onSubmitAnswers={handleSubmitAnswers}
            isLoading={isLoading}
          />
        )}

        {step === 'facts' && (
          <FactsConfirmation
            facts={facts}
            onConfirmAndGenerate={handleConfirmFactsAndGenerate}
            isLoading={isLoading}
          />
        )}

        {step === 'action-hub' && profile && analysis && (
          <ActionHubView
            originalProfile={profile}
            initialReview={review || undefined}
            analysis={analysis}
            onStartNew={handleResetSession}
          />
        )}
      </main>

      {/* Global Modals */}
      <OnboardingModal
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        onStartDemo={handleLoadDemo}
        onOpenApiKey={() => setApiKeyDialogOpen(true)}
      />

      <ApiKeyDialog
        open={apiKeyDialogOpen}
        onOpenChange={setApiKeyDialogOpen}
        apiKey={apiKey}
        providerId={providerId}
        onSave={handleSaveApiKey}
        onClear={handleClearApiKey}
      />
    </div>
  );
}

export default App;
