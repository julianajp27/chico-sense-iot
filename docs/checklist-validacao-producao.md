# Checklist de validação de produção — autenticação

24/11/2026. [Diagnóstico](diagnostico-login-vercel.md) · [Integração](integracao-frontend-backend.md) · [Vercel](configuracao-vercel.md).

## Estado de partida

- [x] HTTP público inspecionado sem autenticação real; CORS Vercel rejeitado com 400 e localhost autorizado no health.
- [x] Bundle base reproduzido localmente e SHA-256 idêntico ao publicado.
- [x] Falha visível no formulário reproduzida no navegador com dados artificiais, sem credencial real.
- [x] Correções frontend preparadas em branch isolada e arquivos antigos preservados.
- [x] npm ci e lint/build aprovados; 37 testes mockados aprovados.
- [ ] Commit/push/revisão/integração/deploy — **não executados**.
- [ ] Variáveis, logs e commit efetivo nos painéis Vercel/Render — não consultados.
- [ ] Login real/escopo em produção — não executados; exige conta autorizada da equipe.

## 1. Registrar a publicação correta

Frontend/infra deve registrar: projeto Vercel, domínio, commit/branch do deployment, ambiente Production, Root, Node, comandos e status do build. API deve registrar serviço Render/commit/processo e a presença da origem na lista CORS, sem copiar outros segredos. Conferir VITE_API_URL no bundle efetivamente carregado após build; estar no painel não basta se o deployment é anterior.

## 2. Verificar CORS sem senha

Comandos de leitura/preflight (PowerShell Windows usa curl.exe, não o alias curl):

```powershell
curl.exe -i -X OPTIONS "https://chico-sense-back.onrender.com/api/v1/auth/login" -H "Origin: https://chico-sense-frontend.vercel.app" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: content-type"
curl.exe -i -X OPTIONS "https://chico-sense-back.onrender.com/api/v1/auth/me" -H "Origin: https://chico-sense-frontend.vercel.app" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: authorization"
curl.exe -i "https://chico-sense-back.onrender.com/health" -H "Origin: https://chico-sense-frontend.vercel.app"
```

Aceite: OPTIONS 200, Access-Control-Allow-Origin=https://chico-sense-frontend.vercel.app, Allow-Methods inclui POST/GET/OPTIONS, Allow-Headers permite Content-Type/Authorization conforme solicitado, credentials=true e Vary inclui Origin. Health 200 e mesmo allow-origin. Comparar localhost:5173 para assegurar compatibilidade local. Repetir com origem externa artificial: não deve receber allow-origin, e preflight deve ser rejeitado.

Não substituir evidência do navegador por curl: o cliente HTTP pode ler uma resposta que o browser bloqueia. Se400 Disallowed CORS origin persistir, parar a homologação de credenciais e corrigir serviço/configuração efetiva. Não colocar Access-Control-Allow-Origin no request como workaround.

## 3. Navegador, Console e Network

1. Abrir a origem pública em aba de teste. Abrir DevTools → Network, habilitar Preserve log e desabilitar cache durante o diagnóstico.
2. Conferir GET /health: Request URL no Render, Origin correto, status200 e headers CORS. Falha nessa etapa é conectividade/política, não senha.
3. Com uma **conta de teste autorizada pela equipe**, submeter o formulário uma vez. Não usar conta real desconhecida nem repetir tentativas de senha.
4. Localizar OPTIONS e POST /api/v1/auth/login. Registrar apenas método, URL sem parâmetros sensíveis, status, nomes dos headers e etapa. **Não copiar payload com senha, token da resposta, cookies ou Authorization completo.**
5. POST200 deve conter token string. Conferir GET /api/v1/auth/me posterior com Bearer, sem reproduzir seu valor no relatório. Esperado 200, ativo booleano true e perfil oficial.
6. Se POST200 e /me401, registrar separadamente: não classificar como senha errada. Conferir emissão/validação da API com o backend; não decodificar JWT público como prova de validade.
7. Confirmar ausência de erro JavaScript e de CORS no login. Uma mensagem genérica de rede exige análise de Network; não prova, sozinha, que é CORS.

HAR/export do console pode conter credenciais e dados pessoais. Compartilhar somente versão sanitizada/revisada, nunca o arquivo bruto.

## 4. Perfil e escopo

| Caso | Aceite | Execução produção |
|---|---|---|
| ADMIN ativo autorizado | Dashboard e rótulo Administrador | Pendente conta autorizada |
| GESTOR ativo autorizado | Dashboard e rótulo Gestor, ações limitadas pelo backend | Pendente |
| OPERADOR ativo autorizado | Dashboard e rótulo Operador; escritas privilegiadas403 | Pendente |
| CONSULTA ativo autorizado | Leitura no escopo; escrita403, sem atribuir papel operacional | Pendente |
| Perfil desconhecido/null | Não entrar nem manter token candidato | Coberto em mocks; só testar em ambiente controlado |
| ativo false/ausente/string | Não entrar | Coberto em mocks; não desativar conta de produção para simular |
| IDs de outra empresa |403/404 conforme contrato, sem dados do recurso | Preferir homologação isolada e contas autorizadas |

Não cadastrar/desativar usuários, criar cargas ou alterar produção para executar estes negativos. Os cenários que exigem mutação ficam no ambiente de teste.

## 5. Sessão, reload e concorrência

- [ ] Login válido termina em /dashboard somente após /me e validações.
- [ ] sessionStorage contém chicosense_token sem senha ou cópia de usuário como credencial; não copiar o valor.
- [ ] Reload de /dashboard recebe index.html (HTTP 200, não404) e consulta /me antes de mostrar conteúdo.
- [ ] Acesso direto /viagens e /configuracoes também carrega SPA; sem token, mostra login.
- [ ] Token expirado/rejeitado:401 privado limpa a sessão correspondente e retorna ao login.
- [ ] Rede/503 durante restauração: nenhum conteúdo privado; exibe retry sem inferir senha incorreta.
- [ ] Sair limpa token/estado; voltar à rota protegida não recupera usuário por cache local.
- [ ] Login/health não levam Bearer; /me leva token explícito e outras privadas o token atual.
- [ ] Falhas simultâneas/401 antigo não removem login novo (casos já automatizados com mocks, sem provocar falhas artificiais em produção).
- [ ] Não há aliases de produtor/logistica/cliente para papéis oficiais.

## 6. Regressão funcional

Com contas autorizadas, conferir consultas de viagens/cargas e navegação dashboard/viagens/configurações. Erro403 deve ser tratado como permissão, não logout automático nem lista vazia bem-sucedida. Dados ambientais/científicos preservam null/limitações; não alterar regras para fazer telas passarem. Nenhuma ação física ou migration faz parte deste checklist.

## 7. Critério de conclusão e responsáveis

**Frontend:** revisar/publicar o patch, confirmar papéis e restauração, manter logs sem segredos e executar testes locais.

**Backend/Render:** comprovar que a origem está autorizada no processo publicado e que a autenticação segue inalterada. Se ainda falhar após CORS, investigar POST e /me separadamente com evidências de conta autorizada.

**Vercel:** comprovar variável Production, commit correto, build e rewrite SPA no alias público. Configuração de painel sem rebuild não é conclusão.

**QA:** registrar para cada cenário status aprovado/reprovado/não executado, ambiente/commit/data e evidência sanitizada. Concluir somente com preflight, POST válido, /me válido, papel correto, dashboard e reload aprovados no deployment pretendido, mais rejeições de segurança preservadas. 37 testes mockados não substituem isso.

Este documento é roteiro, não declaração de aprovação de produção. Até executar os itens pendentes, a correção continua local e a autenticação publicada não está homologada.
