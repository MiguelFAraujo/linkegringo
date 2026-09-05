import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  ShieldCheck,
  Plus,
  FileCheck2,
  Check,
} from 'lucide-react';
import type { ConfirmedFact } from '@linkegringo/core';

interface FactsConfirmationProps {
  facts: ConfirmedFact[];
  onConfirmAndGenerate: (confirmedFacts: ConfirmedFact[]) => Promise<void>;
  isLoading: boolean;
}

export function FactsConfirmation({
  facts: initialFacts,
  onConfirmAndGenerate,
  isLoading,
}: FactsConfirmationProps) {
  const [factsList, setFactsList] = useState<ConfirmedFact[]>(
    initialFacts.map((f) => ({ ...f, confirmed: true })),
  );
  const [newFactStatement, setNewFactStatement] = useState('');

  const handleToggle = (id: string) => {
    setFactsList(
      factsList.map((f) => (f.id === id ? { ...f, confirmed: !f.confirmed } : f)),
    );
  };

  const handleAddFact = () => {
    const trimmed = newFactStatement.trim();
    if (!trimmed) return;

    const newFact: ConfirmedFact = {
      id: `custom-fact-${Date.now()}`,
      statement: trimmed,
      source: 'interview',
      sourceReference: 'Adicionado manualmente',
      confirmed: true,
    };

    setFactsList([...factsList, newFact]);
    setNewFactStatement('');
  };

  const confirmedCount = factsList.filter((f) => f.confirmed).length;

  const handleSubmit = async () => {
    await onConfirmAndGenerate(factsList);
  };

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
      <Card className="border-[#1E293B] bg-[#0F1623]/80 shadow-2xl">
        <CardHeader className="space-y-2 p-6 sm:p-8 pb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#090D14] text-slate-300 text-xs font-medium border border-[#1E293B] w-fit">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Validação factual</span>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Confirmação de dados extraídos
          </CardTitle>
          <CardDescription className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Apenas os fatos técnicos confirmados abaixo serão incorporados na versão em inglês do seu perfil.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-6 sm:p-8 pt-0">
          {/* Status summary banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#090D14]/80 border border-[#1E293B]">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <FileCheck2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                <strong className="text-white font-semibold">{confirmedCount}</strong> de {factsList.length} fatos selecionados para compor o perfil.
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setFactsList(
                  factsList.map((f) => ({
                    ...f,
                    confirmed: confirmedCount < factsList.length,
                  })),
                )
              }
              className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
            >
              {confirmedCount === factsList.length ? 'Desmarcar todos' : 'Marcar todos'}
            </button>
          </div>

          {/* Facts list with tactile selection */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {factsList.map((fact) => {
              const isChecked = fact.confirmed;
              return (
                <div
                  key={fact.id}
                  role="checkbox"
                  aria-checked={isChecked}
                  tabIndex={0}
                  onClick={() => handleToggle(fact.id)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      handleToggle(fact.id);
                    }
                  }}
                  className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 ${
                    isChecked
                      ? 'border-emerald-500/40 bg-emerald-950/15 text-slate-100 shadow-sm'
                      : 'border-[#1E293B] bg-[#090D14]/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`mt-0.5 h-4 w-4 rounded flex items-center justify-center transition-colors flex-shrink-0 ${
                      isChecked
                        ? 'bg-emerald-500 text-white'
                        : 'border border-slate-700 bg-slate-900/80'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <p className="text-xs sm:text-sm leading-relaxed">{fact.statement}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#090D14] text-slate-400 border border-[#1E293B] font-medium">
                        {fact.source === 'interview' ? 'Entrevista' : 'LinkedIn PDF'}
                      </span>
                      {fact.sourceReference && (
                        <span className="text-[11px] text-slate-500">
                          {fact.sourceReference}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add custom fact */}
          <div className="space-y-2.5 pt-5 border-t border-[#1E293B]">
            <label className="block text-xs font-medium text-slate-300">
              Lembrou de mais algum fato técnico ou métrica de impacto?
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <Input
                type="text"
                value={newFactStatement}
                onChange={(e) => setNewFactStatement(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFact();
                  }
                }}
                placeholder="Ex: Otimizou queries SQL reduzindo tempo de execução de 40min para 3min..."
                className="text-xs sm:text-sm bg-[#090D14] border-[#1E293B] text-slate-200 placeholder:text-slate-500 focus:border-blue-500 h-10 px-3.5"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddFact}
                className="text-xs flex-shrink-0 gap-1.5 border-[#1E293B] hover:bg-slate-800 text-slate-200 h-10 px-4"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span>Adicionar</span>
              </Button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end pt-4 border-t border-[#1E293B]">
            <Button
              type="button"
              variant="default"
              size="lg"
              disabled={confirmedCount === 0 || isLoading}
              onClick={handleSubmit}
              className="w-full sm:w-auto font-semibold text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Gerando perfil em inglês...</span>
                </div>
              ) : (
                <span>Gerar perfil em inglês</span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
