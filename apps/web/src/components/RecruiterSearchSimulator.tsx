import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Info,
  Terminal,
} from 'lucide-react';
import { FormattedText } from './ui/formatted-text';

export interface RecruiterSearchSimulatorProps {
  primaryRole: string;
  rewrittenHeadline: string;
  rewrittenSummary: string;
  rewrittenSkills: string[];
  rewrittenExperiences: Array<{
    title: string;
    companyName: string;
    bullets: string[];
  }>;
}

interface TermMatchResult {
  term: string;
  status: 'match' | 'weak' | 'missing';
  location: string;
}

const BOOLEAN_AND_STOPWORDS = new Set([
  'and',
  'or',
  'not',
  'in',
  'to',
  'at',
  'by',
  'on',
  'of',
  'an',
  'as',
  'is',
  'it',
  'the',
  'for',
  'with',
  'from',
]);

const VALID_SHORT_TECH_TERMS = new Set([
  'go',
  'c#',
  'c++',
  'c',
  'r',
  'ai',
  'ml',
  'ui',
  'ux',
  'ci',
  'cd',
  'db',
  'qa',
  'js',
  'ts',
  'py',
]);

export function matchesTerm(content: string, term: string): boolean {
  if (!content || !term) return false;
  const t = term.trim().toLowerCase();
  if (t.length === 0) return false;
  const c = content.toLowerCase();

  const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i');
  return rx.test(c);
}

export function RecruiterSearchSimulator({
  primaryRole,
  rewrittenHeadline,
  rewrittenSummary,
  rewrittenSkills,
  rewrittenExperiences,
}: RecruiterSearchSimulatorProps) {
  // Preset queries tailored to the candidate's profile
  const presetQueries = useMemo(() => {
    const s1 = rewrittenSkills[0] || 'Distributed Systems';
    const s2 = rewrittenSkills[1] || 'Cloud';
    const cleanRole = primaryRole || 'Senior Software Engineer';

    return [
      `"${cleanRole}" AND (${s1} OR ${s2}) AND (Remote OR Worldwide)`,
      `title:("${cleanRole}") AND ("High Scale" OR "Microservices" OR latency)`,
      `"${s1}" AND "${s2}" AND ("Tech Lead" OR Senior OR Staff)`,
    ];
  }, [primaryRole, rewrittenSkills]);

  const [searchQuery, setSearchQuery] = useState(presetQueries[0]);

  // Parse terms from search query (supporting quoted phrases, short tech terms, and stripping Boolean noise)
  const parsedTerms = useMemo(() => {
    const terms: string[] = [];

    // 1. Quoted terms extraction: match quotes (even if unclosed at the end of the query)
    const quoteRegex = /"([^"]+)"?/g;
    let match: RegExpExecArray | null;
    let stripped = searchQuery;

    while ((match = quoteRegex.exec(searchQuery)) !== null) {
      const phrase = match[1].trim().replace(/^[^a-zA-Z0-9#+.]+|[^a-zA-Z0-9#+.]+$/g, '');
      if (phrase.length >= 1 && !terms.some((t) => t.toLowerCase() === phrase.toLowerCase())) {
        terms.push(phrase);
      }
      stripped = stripped.replace(match[0], ' ');
    }

    // 2. Clean boolean operators, field prefixes (title:, skills:), and grouping/wildcard symbols
    const cleanedText = stripped
      .replace(/\b(?:AND|OR|NOT)\b/gi, ' ')
      .replace(/\b(?:title|skills|experience):\s*/gi, ' ')
      .replace(/[()[\]{}<>*?~^]/g, ' ');

    // 3. Split remaining words by whitespace, commas, semicolons, pipes
    const words = cleanedText
      .split(/[\s,;/:|&]+/)
      .map((w) => w.trim().replace(/^[^a-zA-Z0-9#+.]+|[^a-zA-Z0-9#+.]+$/g, ''))
      .filter((w) => {
        if (!w) return false;
        const lower = w.toLowerCase();
        if (BOOLEAN_AND_STOPWORDS.has(lower)) return false;
        return w.length > 2 || VALID_SHORT_TECH_TERMS.has(lower);
      });

    for (const w of words) {
      if (!terms.some((t) => t.toLowerCase() === w.toLowerCase())) {
        terms.push(w);
      }
    }

    return terms.slice(0, 8);
  }, [searchQuery]);

  // Analyze matches for each term using word-boundary matching
  const termResults: TermMatchResult[] = useMemo(() => {
    return parsedTerms.map((term) => {
      // Check high-priority match (Headline, Skills list, or Job Titles)
      const inHeadline = matchesTerm(rewrittenHeadline, term);
      const inSkills = rewrittenSkills.some((s) => matchesTerm(s, term) || matchesTerm(term, s));
      const inExpTitles = rewrittenExperiences.some((e) => matchesTerm(e.title, term));

      if (inHeadline || inSkills || inExpTitles) {
        const loc = inHeadline
          ? 'Headline'
          : inSkills
          ? 'Top Skills'
          : 'Cargo de Experiência';
        return { term, status: 'match', location: loc };
      }

      // Check secondary match (deep in summary or bullets)
      const inSummary = matchesTerm(rewrittenSummary, term);
      const inBullets = rewrittenExperiences.some((e) => e.bullets.some((b) => matchesTerm(b, term)));
      if (inSummary || inBullets) {
        return { term, status: 'weak', location: 'Summary / Bullets' };
      }

      return { term, status: 'missing', location: 'Não encontrado' };
    });
  }, [parsedTerms, rewrittenHeadline, rewrittenSkills, rewrittenExperiences, rewrittenSummary]);

  // Overall match score
  const matchCount = termResults.filter((r) => r.status === 'match').length;
  const weakCount = termResults.filter((r) => r.status === 'weak').length;
  const total = termResults.length || 1;
  const matchPercentage = Math.round(((matchCount * 1.0 + weakCount * 0.5) / total) * 100);

  return (
    <Card className="border-[#1E293B] bg-[#0F1623]/80 shadow-xl w-full">
      <CardHeader className="p-5 sm:p-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <CardTitle className="text-base sm:text-lg font-bold text-white tracking-tight">
                Simulador de Busca do Recrutador (Boolean & Natural Language)
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-400">
              Teste queries booleanas reais usadas no LinkedIn Recruiter e veja como seu perfil indexa em cada zona.
            </CardDescription>
          </div>

          <Badge
            variant="outline"
            className="text-xs text-emerald-400 border-emerald-500/30 bg-emerald-950/15 font-mono self-start sm:self-auto"
          >
            Compatibilidade: {matchPercentage}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 pt-0 space-y-5">
        {/* Preset Query Buttons */}
        <div className="space-y-1.5">
          <span className="text-xs text-slate-400 font-medium block">
            Queries padrão de tech recruiters (clique para testar):
          </span>
          <div className="flex flex-wrap gap-2">
            {presetQueries.map((query, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSearchQuery(query)}
                className={`text-xs px-3 py-1.5 rounded-lg border text-left font-mono transition-colors cursor-pointer ${
                  searchQuery === query
                    ? 'border-emerald-500/60 bg-emerald-950/20 text-emerald-300'
                    : 'border-[#1E293B] bg-[#090D14] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                #{idx + 1}: {query.slice(0, 48)}...
              </button>
            ))}
          </div>
        </div>

        {/* Live Search Input */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Ex: "Senior Backend Engineer" AND (Java OR Go) AND Kafka'
              className="pl-10 text-xs sm:text-sm font-mono bg-[#090D14] border-[#1E293B] text-white focus-visible:ring-emerald-500/50"
            />
          </div>
        </div>

        {/* Term Matches Breakdown */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Correspondência por termo na busca:</span>
            <span className="text-[11px] font-mono">
              {matchCount} Match(es) • {weakCount} Parcial(is)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {termResults.map((res, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex flex-col justify-between space-y-1.5 ${
                  res.status === 'match'
                    ? 'border-emerald-500/30 bg-emerald-950/15'
                    : res.status === 'weak'
                    ? 'border-amber-500/30 bg-amber-950/15'
                    : 'border-rose-500/30 bg-rose-950/15'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-mono font-bold text-white truncate">
                    {res.term}
                  </span>
                  {res.status === 'match' && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-2.5 h-2.5" /> MATCH
                    </span>
                  )}
                  {res.status === 'weak' && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <AlertTriangle className="w-2.5 h-2.5" /> WEAK
                    </span>
                  )}
                  {res.status === 'missing' && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      <XCircle className="w-2.5 h-2.5" /> MISSING
                    </span>
                  )}
                </div>

                <span className="text-[10px] text-slate-400 block">
                  {res.location}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recruiter Algorithmic Tip */}
        <div className="p-3.5 rounded-xl border border-[#1E293B] bg-[#090D14]/70 flex items-start gap-2.5 text-xs text-slate-300">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed text-[11px]">
            <strong className="text-white block">Dica de Algoritmo do LinkedIn Recruiter:</strong>
            O algoritmo de busca pondera termos presentes na <strong>Headline</strong> e nos cargos com peso 3x superior ao corpo de texto. Palavras com tag <strong>MATCH</strong> posicionadas nos primeiros 60 caracteres garantem que seu perfil não seja descartado nos filtros automáticos.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
