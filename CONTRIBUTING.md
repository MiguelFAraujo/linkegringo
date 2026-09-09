# Guia de Contribuição — LinkeGringo

Obrigado por se interessar em contribuir com o **LinkeGringo**! Este é um projeto open source mantido pela comunidade com o objetivo de abrir as portas do mercado internacional para profissionais de tecnologia brasileiros.

---

## Ambiente de Desenvolvimento

### Requisitos
- **Node.js**: v22 ou superior
- **pnpm**: v11 ou superior
- Chave de API do **Google AI Studio** (opcional, já que você pode utilizar o **Modo Demo** local para desenvolvimento sem consumir cotas de API).

### Configuração Inicial
```bash
# Clone o repositório
git clone https://github.com/Muriel-Gasparini/linkegringo.git
cd linkegringo

# Instale todas as dependências do monorepo
pnpm install

# Inicie o servidor Vite em modo desenvolvimento
pnpm dev
```
Acesse `http://localhost:5173` no seu navegador.

---

## Adicionando Novos Provedores de IA

O LinkeGringo possui uma arquitetura desacoplada via Factory pattern em `packages/ai`:

1. Verifique a interface `AiProvider` em `packages/core/src/domain/provider.ts`.
2. Crie uma classe que implementa essa interface em `packages/ai/src/providers/<provedor>.ts`.
3. Registre o provedor em `packages/ai/src/registry.ts`:
   - Atualize `getAvailableProviders()` para retornar as opções.
   - Atualize `createAiProvider()` para instanciar a classe com a API key informada.
4. Adicione o provedor na lista de seleção do componente de chaves em `apps/web/src/components/ApiKeyDialog.tsx`.

> **Atenção**: Como a aplicação é 100% client-side, o SDK do novo provedor deve ser compatível com execução no navegador (suportar CORS ou chamadas via `fetch` direto).

---

## Padrões de Código e UI

- **TypeScript**: Modo estrito (`strict: true`) em todos os pacotes. Não utilize `any` sem justificativa sólida.
- **Validação com Zod**: Toda entrada de dados de LLMs e storage local deve ser validada por schemas Zod.
- **Estilização**: Tailwind CSS v4 com padrão de design limpo e acessível. Priorize contraste visual e responsividade móvel.
- **Sem Segredos**: Nunca inclua chaves de teste ou tokens reais em PRs.

---

## Validação Antes de Abrir PR

Antes de submeter seu Pull Request, certifique-se de que todos os checks passam:

```bash
# Checar tipos TypeScript
pnpm -r typecheck

# Executar testes unitários
pnpm -r test

# Gerar build estático de produção
pnpm --filter @linkegringo/web build
```

---

## Processo de Pull Request

1. Crie uma branch a partir da `main`:
   ```bash
   git checkout -b feat/minha-melhoria
   ```
2. Faça commits atômicos utilizando o padrão [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat(web): adicionar suporte a exportação em PDF`
   - `fix(ai): tratar erro 429 de quota do Gemini`
3. Abra o Pull Request detalhando o que foi alterado e como testar manualmente.
