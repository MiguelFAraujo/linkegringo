import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import {
  Compass,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  CheckCircle2,
  Zap,
} from 'lucide-react';

export function InterviewGuideCard() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card className="border-emerald-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 shadow-2xl overflow-hidden">
      <CardHeader
        className="cursor-pointer select-none p-6 pb-4 flex flex-row items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-bold text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
              <Sparkles className="w-3 h-3 mr-1 text-amber-400" /> Guia de Bolso Anti-Prolixo
            </Badge>
            <span className="text-xs text-slate-400 hidden sm:inline">Framework para Entrevistas nos EUA</span>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-black text-white">
            Próximo Passo: Como Mandar Bem nas Entrevistas da Gringa 🇺🇸
          </CardTitle>
          <CardDescription className="text-slate-300 text-xs sm:text-sm">
            Seu perfil atrairá os recrutadores. Use este framework para transformar conversas em propostas de trabalho em dólar.
          </CardDescription>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label={isOpen ? 'Recolher guia' : 'Expandir guia'}
        >
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-6 pt-2 pb-6">
          {/* Section 1: English Demystification */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4 text-amber-400" />
              1. Desmistificando o Inglês Técnico
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              <strong>Seu inglês não precisa ser perfeito nem nativo; ele precisa ser claro, estruturado e direto.</strong> Recrutadores e engineering managers americanos contratam engenheiros pela clareza de pensamento e habilidade de resolver problemas complexos, não por fluência shakespeariana. Se você sabe explicar uma decisão de arquitetura sem se perder, você está pronto.
            </p>
          </div>

          {/* Section 2: Framework Anti-Prolixo */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              2. O Framework Anti-Prolixo (Contexto ➔ Problema ➔ Ação ➔ Resultado)
            </div>
            <p className="text-xs text-slate-400">
              O maior erro de brasileiros em entrevistas internacionais é dar voltas históricas longas. Estruture cada resposta técnica em no máximo 2 minutos:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
                <span className="text-xs font-bold font-mono text-emerald-400 uppercase">1. Context</span>
                <p className="text-xs text-slate-300">
                  Em 1 frase: Qual era o sistema e a stack ("At Fintech X, we had a core payments monolith handling 2M requests/day").
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
                <span className="text-xs font-bold font-mono text-amber-400 uppercase">2. Problem</span>
                <p className="text-xs text-slate-300">
                  Qual era o gargalo crítico ("During peak hours, connection pool exhaustion caused p99 latency to spike past 2 seconds").
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
                <span className="text-xs font-bold font-mono text-teal-400 uppercase">3. Action</span>
                <p className="text-xs text-slate-300">
                  O que VOCÊ projetou e implementou ("I led the migration to an asynchronous event-driven model using Kafka with idempotent consumers").
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
                <span className="text-xs font-bold font-mono text-emerald-300 uppercase">4. Result</span>
                <p className="text-xs text-slate-300">
                  O impacto mensurável entregue ("We dropped p99 latency to 85ms and had zero payment timeouts during Black Friday").
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Universal Questions Cheat Sheet */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              3. Roteiro de Ouro para as Perguntas Universais
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50 space-y-1.5">
                <h5 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  "Tell me about yourself" (Pitch de 60 segundos)
                </h5>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Não conte onde nasceu ou sua escola de infância. Use sua Headline e o primeiro parágrafo do novo About:
                  <em> "I'm a Senior Backend Engineer with 6+ years specializing in distributed systems and event-driven architectures. Most recently at Fintech X, I focused on scaling mission-critical microservices. Today, I'm looking for high-scale US remote engineering teams where I can drive backend architecture and operational excellence."</em>
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50 space-y-1.5">
                <h5 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                  "Tell me about a time you had a technical disagreement"
                </h5>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Mostre foco em dados e bem do produto, nunca em ego: <em>"We debated between RabbitMQ and Kafka. Instead of debating opinions, I created a quick benchmark comparing message persistence guarantees under our estimated throughput. The data showed Kafka was necessary for our durability requirements, aligning the entire team."</em>
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Golden Questions for the Interviewer */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              4. Perguntas de Alto Sinal para VOCÊ Fazer ao Entrevistador
            </div>
            <p className="text-xs text-slate-400">
              Quando o recrutador disser <em>"Do you have any questions for me?"</em>, nunca diga "No, everything was clear". Faça 1 ou 2 destas perguntas para demonstrar senioridade imediata:
            </p>

            <ul className="space-y-2 pt-1 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><em>"What does success look like for this role in the first 90 days?"</em></span>
              </li>
              <li className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><em>"What is the biggest architectural bottleneck or technical challenge the team is currently tackling?"</em></span>
              </li>
              <li className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><em>"How are technical decisions and trade-offs debated and documented across the team?"</em></span>
              </li>
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
