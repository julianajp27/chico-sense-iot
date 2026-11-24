# Diagnóstico e correção da autenticação na Vercel

Data: **24/11/2026**, America/Sao_Paulo. [Contrato de integração](integracao-frontend-backend.md) · [Configuração Vercel](configuracao-vercel.md) · [Checklist pós-deploy](checklist-validacao-producao.md).

## Conclusão e primeira barreira

**CONFIRMADO — a política CORS efetiva do backend publicado rejeita a origem de produção.** A mesma API responde a localhost com autorização CORS e à Vercel sem ela. Os OPTIONS de login e de `/auth/me` retornam **400 `Disallowed CORS origin`**. A API pode responder por HTTP direto e pelo Swagger, mas o navegador da Vercel não consegue concluir a sequência de autenticação com essa política.

A primeira consulta automática identificada no código é GET `/health`, disparada por `useSystemStatus` antes do login. Ela retorna 200 sem `Access-Control-Allow-Origin` para a Vercel; sucesso HTTP não implica resposta legível por JavaScript no navegador. Ao submeter o formulário, o primeiro impedimento do fluxo de login é o preflight do POST. Não há evidência de que o erro observado seja uma senha incorreta.

O backend local já possui o suporte a `CORS_ALLOWED_ORIGINS` entregue anteriormente. **Não foi comprovado se o Render está sem essa variável, com valor incorreto ou executando outro deployment.** Ausência/má aplicação da variável é PROVÁVEL; somente o bloqueio efetivo é CONFIRMADO. Arquivo no GitHub não comprova configuração aplicada ao processo publicado.

Foram encontrados também defeitos independentes: incompatibilidade de papéis, perda do estado autenticado no reload e 404 de rotas SPA. Corrigir apenas um deles não conclui a homologação.

## Repositórios e preservação

| Item | Estado identificado |
|---|---|
| Frontend | `https://github.com/juvalent/ChicoSense-Frontend.git` |
| Checkout antigo | `C:\Users\Lenovo\Downloads\Gerenciador de Tarefas\ChicoSense-Frontend`; branch main, HEAD `a7fdd660047ac057e39d7fce6a7fcd286ccb5917` |
| Arquivos locais preservados | `.gitignore`, `app.js`, `index.html`, `package-lock.json`, `package.json`, `styles.css`, todos não rastreados naquele checkout |
| Referência atual após fetch | origin/main `554296eb4c7c746eb98cdf40a25b960ea63ab235`; origin/develop `663a896` |
| Trabalho isolado | `C:\Users\Lenovo\.codex\worktrees\chicosense-login-vercel\ChicoSense-Frontend`, branch `fix/autenticacao-vercel` baseada em origin/main |
| Backend somente leitura | `https://github.com/RenataGusmao/chico_sense_back.git`; main `816bc4b728c711065cf01567c3bac491210e2277`, também observado no remoto |
| Limites | Sem commit, staging, push, deploy, migration, alteração de credenciais ou escrita em dados de produção |

O Windows inicialmente bloqueou `git status` e algumas escritas em referências Git. Após liberar o diretório do frontend, seu status foi conferido e os arquivos não rastreados foram isolados do trabalho. No backend, o sandbox continuou impedindo `git status`/`git diff` de reconhecer a árvore; como não havia autorização para escrever nele, foi feita comparação de **todos os arquivos rastreados com os blobs de HEAD**, normalizando CRLF: nenhuma diferença. Não foi concedida escrita ao backend nem feito fetch nele.

## Evidências coletadas

Resultados completos, sem segredos: [HTTP público](evidencias/login-vercel-http.json) e [build/testes](evidencias/login-vercel-validacao.json). São observações de 24/11/2026, não garantia de estado futuro.

| Requisição | Origin / headers relevantes | HTTP / resultado |
|---|---|---|
| GET frontend `/` | sem autenticação | 200; bundle `/assets/index-CEdMBCrB.js` |
| GET frontend `/dashboard` | navegação HTTP direta | **404**; fallback SPA ausente no deployment observado |
| GET backend `/health` | Origin Vercel | 200 JSON; `allow-credentials=true`, **sem allow-origin** |
| GET backend `/health` | Origin `http://localhost:5173` | 200; `allow-origin=http://localhost:5173`; Vary inclui Origin |
| OPTIONS `/api/v1/auth/login` | Origin Vercel; método POST; header content-type | **400 Disallowed CORS origin**; sem allow-origin |
| OPTIONS `/api/v1/auth/me` | Origin Vercel; método GET; header authorization | **400 Disallowed CORS origin**; sem allow-origin |
| OPTIONS login e me | Origin localhost:5173; POST/content-type e GET/authorization | **200 OK**, allow-origin=http://localhost:5173 |
| GET `/api/v1/auth/me` | Origin Vercel, sem token | 401 `Credenciais invalidas.`; sem allow-origin |
| GET backend `/openapi.json` | sem autenticação | 200; schema de autenticação inspecionado |

Os OPTIONS anunciam GET/POST/OPTIONS e outros métodos, repetem os headers solicitados e trazem `Access-Control-Allow-Credentials: true`; a origem é o elemento rejeitado. `Vary: Origin, Accept-Encoding` aparece nos preflights. `Access-Control-Allow-Origin: *` visto no HTML servido pela **Vercel** não autoriza respostas do **Render** e não resolve a API.

### Navegador de teste

A aplicação publicada abriu e navegou internamente para `/login`; o console registrou `[ChicoSense API] Object` para o bundle observado. Com **dados artificiais de domínio reservado `.invalid`, sem conta real**, o formulário voltou a habilitar Entrar e mostrou: “Não foi possível conectar à API. Verifique a conexão e a configuração de CORS.” Nenhuma credencial real foi utilizada.

A ferramenta de navegador disponibilizou DOM e logs, mas não um HAR/Network detalhado nesta execução; portanto não se afirma ter capturado ali o POST, seu body ou headers completos. O diagnóstico combina o erro visível com a reprodução HTTP independente dos preflights. Não se confunde um HTTP direto com a aplicação da política pelo navegador. O fluxo de sucesso com uma conta real não foi executado.

## URL, ambiente e build

[api.js](../src/services/api.js) usa `import.meta.env.VITE_API_URL`, fallback `https://chico-sense-back.onrender.com` e remove barras finais. Não acrescenta `/api/v1` à base; cada service informa o path completo. A URL efetiva identificada no bundle é **`https://chico-sense-back.onrender.com`**, sem localhost, prefixo duplicado ou HTTP misto na configuração do Axios.

Foi executado npm ci com o lockfile original e o build **antes da correção**. Ele produziu `index-CEdMBCrB.js` com SHA-256 **`0f947c0f377d9ce873156658c27c90f3cd40613f1e322d87bfe4a68fa982161a`**, idêntico aos bytes do asset publicado. O CSS também conserva o nome observado. Isso comprova equivalência do artefato relevante com a main auditada, sem afirmar qual commit/branch aparece no painel Vercel.

Como o fallback e a variável configurada com o mesmo valor resultariam no mesmo bundle, **o bundle não comprova que VITE_API_URL está cadastrada em Production**. O painel não foi acessado. Um segundo build local, separado, usou `https://api-build-proof.example.invalid` e incorporou esse marcador ao JavaScript: comprova a leitura em build-time, não a configuração do projeto remoto. Nenhum desses builds foi publicado.

Há literais localhost em bibliotecas do bundle; não são a configuração Axios da aplicação e não foram tratados como chamadas reais a localhost.

## Fluxo anterior e falhas posteriores ao CORS

1. Login limpava o token anterior, fazia POST JSON email/senha e exigia access_token não vazio.
2. GET `/auth/me` enviava esse token explicitamente, antes de armazená-lo.
3. O formulário armazenava o token e chamava App.handleContinue.
4. App exigia `ativo === true`: **essa verificação corresponde ao contrato e foi preservada**.
5. App aceitava admin/produtor/logistica/cliente, com aliases de personas comerciais. Apenas ADMIN do backend se tornava um perfil reconhecido; **GESTOR/OPERADOR/CONSULTA eram recusados**, com remoção do token. Tipos de empresa e papéis não são equivalentes.
6. O perfil do usuário real afetado é NÃO VERIFICADO. A incompatibilidade é CONFIRMADA para os três papéis citados pelo código/testes, mas não se afirma que foi o primeiro erro daquela conta no deployment atual.
7. No reload, App inicializava user/profile com null e não consultava `/me` para restaurar um token existente; voltava ao login. Isso também ocorre localmente em condições equivalentes.
8. Qualquer 401 fora do login apagava a sessão. Um 401 tardio de token antigo podia invalidar token novo; 401 no health também emitia auth:expired. São defeitos de concorrência reproduzidos com mocks, não a causa comprovada do preflight atual.
9. A navegação client-side para dashboard não precisa fazer GET ao servidor; já atualização/acesso direto em `/dashboard` retorna 404 no deployment observado. É um defeito de roteamento separado da senha/CORS.

## Classificação das hipóteses

| Categoria | Diagnóstico | Classificação |
|---|---|---|
| A — URL/variável frontend | URL compilada correta; existência da variável no painel desconhecida | URL CONFIRMADA; painel NÃO VERIFICADO |
| B/E — código/contrato | Papéis incompatíveis; restauração ausente; classificação de 401 e concorrência inadequadas | CONFIRMADO no código e mocks |
| C — Vercel/SPA | `/dashboard` retorna 404 em acesso direto; sem vercel.json na base auditada | CONFIRMADO para o deployment observado |
| D — backend/CORS | Origem Vercel rejeitada, localhost autorizado | CONFIRMADO |
| D — configuração interna Render | Variável ausente/incorreta ou deployment sem configuração aplicada | PROVÁVEL; causa interna exata NÃO VERIFICADA |
| F — frontend desatualizado | Build base e asset remoto possuem mesmo SHA-256 | Sem evidência de divergência do artefato relevante |
| G — senha, assinatura JWT, conta inativa real | Nenhuma autenticação real foi autorizada/executada | NÃO VERIFICADO |

## Matriz comparativa

| Critério | Local | Vercel publicada | Evidência / conclusão |
|---|---|---|---|
| URL API | Fallback oficial; integração local funcional relatada pelo usuário | Mesmo host no bundle | URL não explica diferença observada |
| Origin | localhost:5173 / 127.0.0.1:5173 | https://chico-sense-frontend.vercel.app | São origens distintas |
| Preflight OPTIONS | OPTIONS login/me 200 e health autorizado para localhost | Login/me 400 origem proibida | Bloqueio primário confirmado; não presumir que o painel Render foi atualizado |
| POST login | Exercitado com mocks; login local real foi relato, não repetido aqui | Formulário falha; preflight rejeitado | Não há validação de senha real nesta auditoria |
| GET auth/me | Mocks validam papéis/ativo e tratamento de erros | Sem token retorna 401; preflight Bearer 400 | Sucesso autenticado publicado não testado |
| JWT | Código backend HS256/claims; frontend trata como opaco | Nenhum token real inspecionado | Assinatura/chave de produção não verificadas |
| Perfil | Código anterior rejeitava GESTOR/OPERADOR/CONSULTA também localmente | Mesmo código no bundle | Falha de contrato adicional, não diferença intrínseca de plataforma |
| Armazenamento | sessionStorage por origem/aba; antes sem restauração | Mesmo mecanismo, estado por aba/origem diferente | Correção local revalida /me no reload |
| Redirecionamento | Navegação React; dev server oferece fallback | GET direto /dashboard 404 | Rewrite SPA precisa ser publicado |
| Build | npm ci + Vite 8.3.2, Node 24.21.0 | Bundle base byte a byte idêntico | Metadata do deployment ainda precisa de consulta ao painel |

## Correções realizadas somente no frontend

| Arquivo | Mudança |
|---|---|
| src/services/authProfile.js | Enum explícito dos quatro papéis oficiais, validação estrita de ativo, sem aliases comerciais |
| src/services/session.js | Operações de storage centralizadas; mensagem se escrita for negada pelo navegador |
| src/services/authService.js | Orquestra POST→me→validação; identifica etapa da falha; não trata toda rejeição como senha errada |
| src/services/api.js | Login/health sem Bearer; 401 só expira a sessão cujo token realmente foi enviado; rejeição antiga não apaga nova sessão |
| src/pages/Login/Login.jsx | Só armazena após /me e validações; limpa senha no fim; mensagens por etapa |
| src/App.jsx | Revalida token no reload antes de liberar conteúdo; retry de rede sem autenticar por cache; mantém bloqueio de usuário/perfil inválidos |
| Header.jsx e Configuracoes.jsx | Rótulos ADMIN/GESTOR/OPERADOR/CONSULTA; não confunde papel com persona |
| vercel.json | Rewrite SPA para index.html |
| .env.example | URL pública de build, sem credenciais |
| package.json / package-lock.json / vitest.config.js / tests | Dependências de teste, comando npm test, mocks de transporte e UI real |
| docs | Os quatro documentos e evidências públicas sanitizadas |

Não foram alteradas URLs dos endpoints, regras científicas, permissões no backend ou seus arquivos. O servidor continua sendo a autoridade: conhecer o papel ou habilitar uma tela não autoriza acesso a outra empresa nem escrita para CONSULTA. A matriz completa de ações de todas as telas não foi redesenhada neste escopo; ações não permitidas continuam sujeitas ao 403 do backend.

## Testes e limites

- Instalação **npm ci** na base e novamente com o lockfile atualizado: aprovada; nenhuma instalação global.
- Lint antes/depois: exit 0, **23 warnings** preexistentes, sem erros; não houve limpeza geral de avisos fora do escopo.
- Build base e build corrigido: aprovados; aviso preexistente de chunk >500 kB. Build corrigido: `index-Kvn06UCl.js`.
- Teste de variável em build separado: marcador incorporado, nenhuma publicação.
- **37 testes aprovados, zero falhas/skips**: 23 de serviços/contrato/concorrência e 14 de UI/rotas/restauração. Todos usam adapter Axios local; nenhum teste pode consultar o servidor real.
- Na primeira execução dos novos testes, 4 falharam por seletor ambíguo entre h1 e h2 “Viagens”; a consulta foi especificada como heading nível 1. Não foi alterada a aplicação para mascarar esses testes.
- npm audit já apontava **2 dependências HIGH** na base: Vite 8.3.2 (servidor de desenvolvimento) e follow-redirects 1.16.1 (adaptador Node). Permanecem para triagem separada; não foi executado audit fix nem presumida exploração no bundle de navegador.
- Não executados: login com credenciais reais, autorização real por transportadora em produção, painel/build logs Vercel, variáveis/logs Render, migrations, banco PostgreSQL ou dados de produção.

## Ações externas e prontidão

O patch frontend está pronto para revisão local, com lint/build/testes aprovados. **A validação de produção ainda está bloqueada pelo CORS efetivo no Render e exige publicação do frontend corrigido.** Não é possível prometer que uma conta real autentica sem a homologação autorizada.

Backend/infra deve conferir o commit ativo e acrescentar a origem exata em CORS_ALLOWED_ORIGINS, reiniciando o processo conforme o procedimento do serviço. Não se recomenda novo patch no backend: o suporte já existe na main lida. Frontend deve revisar a branch, integrar/publicar somente com autorização e conferir os papéis. Na Vercel, confirmar configuração de build/variável Production e publicar o rewrite. QA deve seguir o checklist e coletar status sanitizados de cada etapa; não enviar HAR bruto com senha/Bearer.

## Fontes verificáveis

- Código frontend: [API](../src/services/api.js), [auth](../src/services/authService.js), [App](../src/App.jsx), [rotas](../src/routes/AppRoutes.jsx), [status](../src/hooks/useSystemStatus.js), [main](../src/main.jsx), [Vite](../vite.config.js), [package](../package.json).
- Backend lido: [auth schemas](https://github.com/RenataGusmao/chico_sense_back/blob/816bc4b728c711065cf01567c3bac491210e2277/app/modules/auth/schemas.py), [auth service](https://github.com/RenataGusmao/chico_sense_back/blob/816bc4b728c711065cf01567c3bac491210e2277/app/modules/auth/service.py), [JWT](https://github.com/RenataGusmao/chico_sense_back/blob/816bc4b728c711065cf01567c3bac491210e2277/app/core/security.py), [CORS](https://github.com/RenataGusmao/chico_sense_back/blob/816bc4b728c711065cf01567c3bac491210e2277/app/main.py), [Settings](https://github.com/RenataGusmao/chico_sense_back/blob/816bc4b728c711065cf01567c3bac491210e2277/app/core/config.py).
- Referências de operação: [CORS FastAPI](https://fastapi.tiangolo.com/tutorial/cors/), [variáveis Vite](https://vite.dev/guide/env-and-mode), [SPA Vite na Vercel](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas).
