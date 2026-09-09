## Descrição

Descreva de forma concisa as alterações introduzidas por este pull request e a justificativa técnica.

## Tipo de Alteração

- [ ] `fix`: Correção de bug (sem quebra de compatibilidade)
- [ ] `feat`: Nova funcionalidade (sem quebra de compatibilidade)
- [ ] `refactor`: Refatoração ou otimização de performance
- [ ] `docs`: Atualizações em documentação
- [ ] `test`: Adição ou melhoria de testes e CI
- [ ] `chore`: Manutenção de dependências e tooling

## Issue Relacionada

Resolve #(número da issue se aplicável)

## Checklist de Qualidade e Arquitetura

- [ ] **100% Client-Side**: Nenhuma dependência de backend proprietário foi introduzida.
- [ ] **Zero Vazamento de Segredos**: Nenhuma chave de API, credencial ou token foi adicionada a arquivos, testes ou documentação.
- [ ] **Estilo Sóbrio**: Não foram incluídos emojis no código, interface ou documentação.
- [ ] **Checagem de Tipos**: Executei `pnpm -r typecheck` e todos os pacotes passaram com 0 erros.
- [ ] **Testes Automatizados**: Executei `pnpm -r test` e todos os testes passaram (100% green).
- [ ] **Build de Produção**: Executei `pnpm --filter @linkegringo/web build` com sucesso.
- [ ] **Conventional Commits**: As mensagens de commit seguem o padrão especificado no projeto.
