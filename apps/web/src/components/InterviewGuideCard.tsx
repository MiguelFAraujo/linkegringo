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
    <Card className="border border-[#1E293B] bg-[#0F1623]/80 shadow-xl overflow-hidden">
      <CardHeader
        className="cursor-pointer select-none p-6 pb-4 flex flex-row items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-medium text-blue-400 border-blue-500/30 bg-blue-500/10">
              <Sparkles className="w-3 h-3 mr-1 text-blue-400" />
              Guia de Preparação Técnica
            </Badge>
            <span className="text-xs text-slate-400 hidden sm:inline">Estrutura para entrevistas nos EUA</span>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Preparação para Entrevistas nos EUA
          </CardTitle>
          <CardDescription className="text-slate-300 text-xs sm:text-sm leading-relaxed">
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
        <CardContent className="space-y-6 pt-2 pb-6 px-6">
          {/* Section 1: English Demystification */}
          <div className="p-4 rounded-xl bg-[#090D14]/80 border border-[#1E293B] space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
              <Compass className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>1. Clareza e concisão no inglês técnico</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              <strong className="text-slate-100 font-medium">Seu inglês não precisa ser nativo; ele precisa ser claro, estruturado e focado na arquitetura.</strong> Recrutadores e gestores de engenharia americanos avaliam a clareza de raciocínio, trade-offs técnicos e capacidade de resolver problemas de escala. Explicar decisões com firmeza é o grande diferencial.
            </p>
          </div>

          {/* Section 2: Framework (Contexto, Problema, Ação e Resultado) */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-300">
              2. Estrutura para entrevistas (Contexto, Problema, Ação e Resultado)
            </div>
            <p className="text-xs text-slate-400">
              Evite narrativas prolixas. Estruture cada resposta técnica em no máximo 2 minutos utilizando o framework:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-[#1E293B] bg-[#090D14]/60 space-y-1.5">
                <span className="text-xs font-bold text-blue-400 block">1. Context</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Em 1 frase: Sistema e volumetria (&ldquo;At Fintech X, we managed a core payments service handling 2M requests/day&rdquo;).
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#1E293B] bg-[#090D14]/60 space-y-1.5">
                <span className="text-xs font-bold text-amber-400 block">2. Problem</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O gargalo ou desafio técnico (&ldquo;During peak volume, connection contention pushed p99 latency past 2 seconds&rdquo;).
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#1E293B] bg-[#090D14]/60 space-y-1.5">
                <span className="text-xs font-bold text-teal-400 block">3. Action</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O que você desenhou e implementou (&ldquo;I designed an asynchronous event-driven pipeline using Kafka with idempotent consumer groups&rdquo;).
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#1E293B] bg-[#090D14]/60 space-y-1.5">
                <span className="text-xs font-bold text-emerald-400 block">4. Result</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O impacto quantificado entregue (&ldquo;We dropped p99 latency to 85ms and had zero payment timeouts during peak periods&rdquo;).
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Universal Questions */}
          <div className="space-y-3 pt-3 border-t border-[#1E293B]">
            <div className="text-xs font-semibold text-slate-300">
              3. Roteiro para perguntas frequentes
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-[#1E293B] bg-[#090D14]/50 space-y-2">
                <h5 className="font-semibold text-xs sm:text-sm text-white flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  &ldquo;Tell me about yourself&rdquo; (Pitch executivo de 60 segundos)
                </h5>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  &ldquo;I&apos;m a Senior Backend Engineer specializing in distributed systems and event-driven architectures. Most recently at Fintech X, I focused on scaling mission-critical microservices. Today, I&apos;m targeting high-scale US remote teams where I can drive backend architecture and operational resilience.&rdquo;
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#1E293B] bg-[#090D14]/50 space-y-2">
                <h5 className="font-semibold text-xs sm:text-sm text-white flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  &ldquo;Tell me about a time you had a technical disagreement&rdquo;
                </h5>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  &ldquo;We debated between RabbitMQ and Kafka. Instead of debating opinions, I created a benchmark comparing message persistence guarantees under our estimated throughput. The data showed Kafka was necessary for our durability requirements, aligning the entire team.&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Questions for the Interviewer */}
          <div className="space-y-2.5 pt-3 border-t border-[#1E293B]">
            <div className="text-xs font-semibold text-slate-300">
              4. Perguntas de alto sinal para você fazer ao entrevistador
            </div>
            <p className="text-xs text-slate-400">
              Demonstre senioridade e visão arquitetural fazendo perguntas estratégicas:
            </p>

            <ul className="space-y-2 pt-1 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2.5 bg-[#090D14]/60 p-3 rounded-lg border border-[#1E293B]">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="italic text-slate-200">&ldquo;What does success look like for this role in the first 90 days?&rdquo;</span>
              </li>
              <li className="flex items-start gap-2.5 bg-[#090D14]/60 p-3 rounded-lg border border-[#1E293B]">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="italic text-slate-200">&ldquo;What is the biggest architectural challenge or bottleneck the team is currently tackling?&rdquo;</span>
              </li>
              <li className="flex items-start gap-2.5 bg-[#090D14]/60 p-3 rounded-lg border border-[#1E293B]">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="italic text-slate-200">&ldquo;How are technical decisions and architecture trade-offs debated and documented across the team?&rdquo;</span>
              </li>
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
