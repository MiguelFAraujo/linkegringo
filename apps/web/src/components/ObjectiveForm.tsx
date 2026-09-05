import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Target, ArrowRight, ArrowLeft, Ban, Sparkles, Briefcase } from 'lucide-react';
import type { CareerObjective, ProfileReview } from '@linkegringo/core';

interface ObjectiveFormProps {
  initialReview: ProfileReview;
  onSubmitObjective: (objective: CareerObjective) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

const COMMON_ROLES = [
  'Senior Backend Engineer',
  'Senior Fullstack Engineer',
  'Senior Frontend Engineer',
  'Staff Software Engineer',
  'DevOps / Platform Engineer',
  'Data / Machine Learning Engineer',
];

export function ObjectiveForm({
  initialReview,
  onSubmitObjective,
  onBack,
  isLoading,
}: ObjectiveFormProps) {
  const suggestedRole =
    initialReview.profileDirection?.primaryRole || 'Senior Backend Engineer';

  const [primaryRole, setPrimaryRole] = useState(suggestedRole);
  const [seniority, setSeniority] = useState('Senior');
  const [workPreference, setWorkPreference] = useState<'remote' | 'flexible'>('remote');
  const [excludedTechInput, setExcludedTechInput] = useState('');
  const [excludedTechnologies, setExcludedTechnologies] = useState<string[]>([]);

  const handleAddExcludedTech = () => {
    const trimmed = excludedTechInput.trim();
    if (trimmed && !excludedTechnologies.includes(trimmed)) {
      setExcludedTechnologies([...excludedTechnologies, trimmed]);
      setExcludedTechInput('');
    }
  };

  const handleRemoveExcludedTech = (tech: string) => {
    setExcludedTechnologies(excludedTechnologies.filter((t) => t !== tech));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryRole.trim()) return;

    await onSubmitObjective({
      targetMarket: 'United States',
      primaryRole: primaryRole.trim(),
      seniority,
      workPreference,
      excludedTechnologies,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <Card className="border-slate-800 bg-slate-900/70 shadow-2xl">
        <CardHeader className="space-y-2">
          <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Target className="w-4 h-4" /> Passo 2: Alinhamento de Carreira
          </div>
          <CardTitle className="text-2xl font-black text-white">
            Defina seu Cargo-Alvo para os EUA
          </CardTitle>
          <CardDescription className="text-slate-300">
            A IA adaptará todo o tom, palavras-chave e perguntas da entrevista com foco no papel que você deseja conquistar.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Target Role Input */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Cargo Alvo (Primary Role)
              </label>
              <Input
                type="text"
                value={primaryRole}
                onChange={(e) => setPrimaryRole(e.target.value)}
                placeholder="Ex: Senior Backend Engineer"
                required
                className="text-base font-medium"
              />

              {/* Suggestions Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 mr-1 self-center">Sugestões:</span>
                {COMMON_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setPrimaryRole(role)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      primaryRole === role
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-semibold'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Seniority & Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Nível de Senioridade
                </label>
                <select
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Senior">Senior (5+ anos)</option>
                  <option value="Staff / Principal">Staff / Principal (8+ anos)</option>
                  <option value="Tech Lead / Architect">Tech Lead / Architect</option>
                  <option value="Mid-Level">Mid-Level (3-5 anos)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Preferência de Trabalho
                </label>
                <select
                  value={workPreference}
                  onChange={(e) => setWorkPreference(e.target.value as any)}
                  className="w-full h-10 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="remote">100% Remoto (US / Global)</option>
                  <option value="flexible">Flexível / Aberto a Relocação</option>
                </select>
              </div>
            </div>

            {/* Excluded Technologies */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5 text-rose-400" />
                  Tecnologias para Excluir / Deixar de Fora
                </label>
                <span className="text-[11px] text-slate-500">Opcional</span>
              </div>
              <p className="text-xs text-slate-400">
                Tecnologias legadas com as quais você não quer mais trabalhar (a IA evitará destacá-las).
              </p>

              <div className="flex gap-2">
                <Input
                  type="text"
                  value={excludedTechInput}
                  onChange={(e) => setExcludedTechInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddExcludedTech();
                    }
                  }}
                  placeholder="Ex: PHP, AngularJS, Delphi..."
                  className="text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddExcludedTech}
                  className="text-xs flex-shrink-0"
                >
                  Adicionar
                </Button>
              </div>

              {excludedTechnologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {excludedTechnologies.map((tech) => (
                    <Badge
                      key={tech}
                      variant="destructive"
                      className="cursor-pointer gap-1 text-xs py-1"
                      onClick={() => handleRemoveExcludedTech(tech)}
                      title="Clique para remover"
                    >
                      <span>{tech}</span>
                      <span className="text-rose-300 font-bold">×</span>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onBack}
                disabled={isLoading}
                className="text-slate-400 hover:text-white text-xs gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Raio-X
              </Button>

              <Button
                type="submit"
                variant="default"
                size="lg"
                disabled={!primaryRole.trim() || isLoading}
                className="font-bold gap-2 text-sm shadow-lg shadow-emerald-950/50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Preparando Entrevista Adaptativa...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Iniciar Entrevista com Dicas de Coaching</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
