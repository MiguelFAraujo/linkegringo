import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import {
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Compass,
} from 'lucide-react';

export function InterviewGuideCard() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card className="border border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden">
      <CardHeader
        className="cursor-pointer select-none p-6 pb-4 flex flex-row items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold text-blue-400 border-blue-500/30 bg-blue-500/10">
              <Sparkles className="w-3 h-3 mr-1 text-blue-400" /> Guia de Preparação Técnica
            </Badge>
            <span className="text-xs text-slate-400 hidden sm:inline">Estrutura para Entrevistas nos EUA</span>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-white">
            Preparação para Entrevistas nos EUA
          </CardTitle>
          <CardDescription className="text-slate-300 text-xs sm:text-sm">
            Estrutura técnica para transformar conversas com recrutadores americanos em propostas de trabalho.
          </CardDescription>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label={isOpen ? 'Recolher guia' : 'Expandir guia'}
        >
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-6 pt-2 pb-6">
          {/* Section 1: English Demystification */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider">
              <Compass className="w-4 h-4 text-blue-400" />
              1. Clareza e Concisão no Inglês Técnico
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              <strong>Seu inglês não precisa ser nativo; ele precisa ser claro, estruturado e focado na arquitetura.</strong> Recrutadores e engineering managers americanos contratam engenheiros pela clareza de raciocínio, trade-offs e capacidade de resolver problemas de escala. Explicar decisões com firmeza é o diferencial.
            </p>
          </div>

          {/* Section 2: Framework (Contexto, Ação e Resultado) */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              2. Estrutura para entrevistas (Contexto, Ação e Resultado)
            </div>
            <p className="text-xs text-slate-400">
              Evite narrativas longas e prolixas. Estruture cada resposta técnica em no máximo 2 minutos:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
                <span className="text-xs font-bold font-mono text-blue-400 uppercase">1. Context</span>
                <p className="text-xs text-slate-300">
                  Em 1 frase: Sistema e volumetria ("At Fintech X, we managed a core payments service handling 2M requests/day").
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
                <span className="text-xs font-bold font-mono text-amber-400 uppercase">2. Problem</span>
                <p className="text-xs text-slate-300">
                  O desafio ou limitação técnica ("During peak volume, connection contention pushed p99 latency past 2 seconds").
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
                <span className="text-xs font-bold font-mono text-teal-400 uppercase">3. Action</span>
                <p className="text-xs text-slate-300">
                  O que VOCÊ arquitetou e executou ("I designed an asynchronous event-driven pipeline using Kafka with idempotent consumer groups").
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
                <span className="text-xs font-bold font-mono text-emerald-400 uppercase">4. Result</span>
                <p className="text-xs text-slate-300">
                  O impacto quantificado entregue ("We dropped p99 latency to 85ms and had zero payment timeouts during peak periods").
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Universal Questions */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              3. Roteiro para Perguntas Frequentes
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50 space-y-1.5">
                <h5 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                  "Tell me about yourself" (Pitch de 60 segundos)
                </h5>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Foque diretamente no seu arquétipo técnico e escala:
                  <em> "I'm a Senior Backend Engineer specializing in distributed systems and event-driven architectures. Most recently at Fintech X, I focused on scaling mission-critical microservices. Today, I'm targeting high-scale US remote teams where I can drive backend architecture and operational resilience."</em>
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50 space-y-1.5">
                <h5 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                  "Tell me about a time you had a technical disagreement"
                </h5>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Demonstre foco em dados e produto, nunca em ego: <em>"We debated between RabbitMQ and Kafka. Instead of debating opinions, I created a benchmark comparing message persistence guarantees under our estimated throughput. The data showed Kafka was necessary for our durability requirements, aligning the entire team."</em>
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Questions for the Interviewer */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              4. Perguntas de Alto Sinal para Você Fazer ao Entrevistador
            </div>
            <p className="text-xs text-slate-400">
              Demonstre senioridade e visão arquitetural fazendo perguntas estratégicas:
            </p>

            <ul className="space-y-2 pt-1 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span><em>"What does success look like for this role in the first 90 days?"</em></span>
              </li>
              <li className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span><em>"What is the biggest architectural challenge or bottleneck the team is currently tackling?"</em></span>
              </li>
              <li className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span><em>"How are technical decisions and architecture trade-offs debated and documented across the team?"</em></span>
              </li>
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
