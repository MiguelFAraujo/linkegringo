import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  CheckCircle2,
  ShieldCheck,
  Plus,
  ArrowRight,
  Sparkles,
  FileCheck2,
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
      sourceReference: 'Adicionado Manualmente',
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
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <Card className="border-slate-800 bg-slate-900/80 shadow-2xl">
        <CardHeader className="space-y-2">
          <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Passo 4: Garantia Anti-Alucinação
          </div>
          <CardTitle className="text-2xl font-black text-white">
            Confirme os Fatos Técnicos do seu Perfil
          </CardTitle>
          <CardDescription className="text-slate-300">
            A IA nunca inventará empresas ou métricas falsas. Apenas os fatos marcados como verdadeiros abaixo serão usados na reescrita final em inglês.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status summary banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>
                <strong className="text-white font-mono">{confirmedCount}</strong> de {factsList.length} fatos selecionados para compor o perfil.
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

          {/* Facts list with checkboxes */}
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {factsList.map((fact) => {
              const isChecked = fact.confirmed;
              return (
                <div
                  key={fact.id}
                  onClick={() => handleToggle(fact.id)}
                  className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                    isChecked
                      ? 'border-emerald-500/50 bg-emerald-950/20 text-slate-100'
                      : 'border-slate-800/80 bg-slate-950/40 text-slate-400 opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // Handled by parent div
                    className="mt-0.5 h-4 w-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                  />

                  <div className="flex-1 space-y-1">
                    <p className="text-xs sm:text-sm leading-relaxed">{fact.statement}</p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <Badge
                        variant={fact.source === 'interview' ? 'info' : 'secondary'}
                        className="text-[10px] py-0 px-1.5"
                      >
                        {fact.source === 'interview' ? 'Entrevista' : 'PDF LinkedIn'}
                      </Badge>
                      <span className="text-[11px] text-slate-500">
                        {fact.sourceReference}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add custom fact */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Lembrou de mais algum fato técnico ou métrica de impacto?
            </label>
            <div className="flex gap-2">
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
                className="text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddFact}
                className="text-xs flex-shrink-0 gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </Button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="default"
              size="lg"
              disabled={confirmedCount === 0 || isLoading}
              onClick={handleSubmit}
              className="w-full sm:w-auto font-bold gap-2 text-sm shadow-xl shadow-emerald-950/60"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Gerando Perfil em Inglês Nativo...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Gerar Perfil Otimizado (Hub de Ação)</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
