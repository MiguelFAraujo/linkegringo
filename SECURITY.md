# Politica de Seguranca e Privacidade — LinkeGringo

A seguranca e a privacidade dos dados profissionais dos nossos usuarios sao prioridades absolutas no LinkeGringo.

---

## Arquitetura de Privacidade por Design (Client-Side Only)

O LinkeGringo foi projetado desde o primeiro dia com o principio de **privacidade auditavel**:

1. **Zero Servidores Proprios**: Nao operamos nenhum servidor backend, banco de dados ou servico de telemetria intermediario.
2. **Nenhum Dado Armazenado Externamente**: O PDF do seu LinkedIn, seus dados profissionais e as respostas das suas entrevistas nunca passam por servidores de terceiros gerenciados por nos.
3. **Bring Your Own Key (BYOK)**: Sua chave de API da Google Gemini e armazenada exclusivamente na memoria local (`localStorage`) do seu navegador.
4. **Comunicação Direta**: As requisicoes de IA ocorrem diretamente entre o seu navegador e as APIs oficiais do Google AI Studio (`generativelanguage.googleapis.com`).
5. **Auditoria Transparente**: Qualquer usuario pode abrir a aba *Network* das ferramentas de desenvolvedor (F12) do navegador e auditar todas as conexoes de rede em tempo real.

---

## Reporte de Vulnerabilidades

Se voce identificar qualquer problema de seguranca, comportamento inesperado ou risco de vazamento de credenciais:

1. **Nao abra uma issue publica** contendo detalhes exploraveis da vulnerabilidade.
2. Envie um e-mail com a descricao tecnica detalhada para:  
   **murielgasparini@gmail.com** (ou atraves de contato direto com o mantenedor Muriel Gasparini no GitHub).
3. Responderemos em ate 48 horas uteis com o plano de mitigacao e correcao.

---

## Boas Praticas ao Usar o LinkeGringo

- **Nunca compartilhe sua chave de API** com terceiros ou grave gravacoes de tela exibindo a chave exposta.
- Se estiver utilizando um computador publico ou compartilhado, utilize o botao **"Remover Chave"** no dialogo de configuracao antes de fechar a aba.
- No Google AI Studio, voce pode revogar ou criar novas chaves de API a qualquer momento com apenas 1 clique.
