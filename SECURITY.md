# Política de Segurança e Privacidade — LinkeGringo 🛡️

A segurança e a privacidade dos dados profissionais dos nossos usuários são prioridades absolutas no LinkeGringo.

---

## 🔒 Arquitetura de Privacidade por Design (Client-Side Only)

O LinkeGringo foi projetado desde o primeiro dia com o princípio de **privacidade auditável**:

1. **Zero Servidores Próprios**: Não operamos nenhum servidor backend, banco de dados ou serviço de telemetria intermediário.
2. **Nenhum Dado Armazenado Externamente**: O PDF do seu LinkedIn, seus dados profissionais e as respostas das suas entrevistas nunca passam por servidores de terceiros gerenciados por nós.
3. **Bring Your Own Key (BYOK)**: Sua chave de API da Google Gemini é armazenada exclusivamente na memória local (`localStorage`) do seu navegador.
4. **Comunicação Direta**: As requisições de IA ocorrem diretamente entre o seu navegador e as APIs oficiais do Google AI Studio (`generativelanguage.googleapis.com`).
5. **Auditoria Transparente**: Qualquer usuário pode abrir a aba *Network* das ferramentas de desenvolvedor (F12) do navegador e auditar todas as conexões de rede em tempo real.

---

## 🚨 Reporte de Vulnerabilidades

Se você identificar qualquer problema de segurança, comportamento inesperado ou risco de vazamento de credenciais:

1. **Não abra uma issue pública** contendo detalhes exploráveis da vulnerabilidade.
2. Envie um e-mail com a descrição técnica detalhada para:  
   **murielgasparini@gmail.com** (ou através de contato direto com o mantenedor Muriel Gasparini no GitHub).
3. Responderemos em até 48 horas úteis com o plano de mitigação e correção.

---

## ⚠️ Boas Práticas ao Usar o LinkeGringo

- **Nunca compartilhe sua chave de API** com terceiros ou grave gravações de tela exibindo a chave exposta.
- Se estiver utilizando um computador público ou compartilhado, utilize o botão **"Remover Chave"** no diálogo de configuração antes de fechar a aba.
- No Google AI Studio, você pode revogar ou criar novas chaves de API a qualquer momento com apenas 1 clique.
