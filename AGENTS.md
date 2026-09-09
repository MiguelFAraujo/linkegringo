# AGENTS.md — Instruções Técnicas para Agentes de IA

Este documento contém o manual operacional e diretrizes arquiteturais para agentes de inteligência artificial (como Claude, Codex, Gemini, GPT e outros) que forem inspecionar, manter ou evoluir a base de código do **LinkeGringo**.

---

## Princípios & Regra de Ouro Inegociável

1. **100% Client-Side (Zero Backend)**:
   - Este projeto **NUNCA** deve introduzir um servidor backend proprietário (Node/Express/Fastify/Go/Python) para intermediar requisições entre o usuário e as APIs de IA.
   - Toda lógica de negócio, orquestração de prompts, parsing de PDF e comunicação com APIs de IA roda diretamente no browser do usuário (`apps/web`).
   - O modelo é estritamente **Bring Your Own Key (BYOK)**.

2. **Prevenção Absoluta de Vazamento de Segredos (Secrets)**:
   - **NUNCA** commitar chaves de API, credenciais ou tokens em arquivos de código, testes, fixtures ou documentação.
   - A Gemini API Key inserida pelo usuário é armazenada exclusivamente no `localStorage` do navegador do cliente.
   - O arquivo `.gitignore` bloqueia `.env`, `.env.*` (exceto `.env.example`), certificados e chaves.

3. **Arquitetura Modular em Camadas (`packages/*` vs `apps/*`)**:
   - `packages/core`: Contém tipos de domínio, schemas Zod, normalizadores e a interface do provedor de IA (`AiProvider`). Não depende do React nem do DOM.
   - `packages/ai`: Implementações concretas de `AiProvider` (`GeminiAiProvider`, `DemoAiProvider`), factory/registry de provedores e templates de prompts. Depende apenas de `@linkegringo/core` e SDKs de IA.
   - `apps/web`: Interface de usuário SPA em React 19 + Vite + Tailwind CSS v4. Consome `@linkegringo/core` e `@linkegringo/ai`.

---

## Padrão `AiProvider` em `packages/ai`

Todo provedor de IA implementa o contrato definido em `packages/core/src/domain/provider.ts`:

```typescript
export interface AiProvider {
  readonly id: string;
  readonly name: string;
  
  // Testa conectividade com a API
  testConnection(): Promise<boolean>;

  // Extrai perfil estruturado e diagnóstico inicial a partir do PDF (base64) ou texto
  parseAndDiagnose(input: {
    pdfBase64?: string;
    pdfText?: string;
    cvPdfBase64?: string;
  }): Promise<{ profile: Profile; review: ProfileReview }>;

  // Gera perguntas adaptativas para o objetivo
  generateInterview(input: {
    profile: Profile;
    objective: CareerObjective;
  }): Promise<InterviewPlan>;

  // Avalia o progresso da entrevista e extrai fatos técnicos confirmáveis
  evaluateProgress(input: {
    profile: Profile;
    objective: CareerObjective;
    plan: InterviewPlan;
    answers: InterviewAnswer[];
    previousFacts: ConfirmedFact[];
  }): Promise<InterviewProgress>;

  // Gera a reescrita completa do perfil e nota final
  generateRewrittenProfile(input: {
    profile: Profile;
    objective: CareerObjective;
    confirmedFacts: ConfirmedFact[];
    initialReview?: ProfileReview;
  }): Promise<ProfileAnalysis>;
}
```

Ao adicionar um novo provedor (ex: OpenAI, Anthropic, Ollama local):
1. Crie o arquivo em `packages/ai/src/providers/<nome>.ts`.
2. Implemente a interface `AiProvider`.
3. Registre na factory central em `packages/ai/src/registry.ts`.

---

## Comandos de Validação Obrigatórios

Sempre execute e valide estes comandos antes de concluir qualquer tarefa:

```bash
# Instalação de dependências
pnpm install

# Checagem de tipos estática em todo o monorepo
pnpm -r typecheck

# Build de produção do aplicativo web
pnpm --filter @linkegringo/web build

# Testes automatizados
pnpm -r test
```

---

## Padrão de Commits

Utilize **Conventional Commits**:
- `feat:` Nova funcionalidade no produto
- `fix:` Correção de bug
- `docs:` Atualizações em documentação
- `refactor:` Alterações de código sem mudança de comportamento
- `chore:` Tarefas de manutenção de repositório, dependências e build
