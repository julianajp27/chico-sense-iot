# Configuração da Vercel e integração com Render

24/11/2026. [Diagnóstico](diagnostico-login-vercel.md) · [Integração](integracao-frontend-backend.md) · [Checklist](checklist-validacao-producao.md).

## O que foi verificado e o que não foi

O domínio publicado serve o bundle reprodutível da main auditada. A URL compilada do Axios está correta. GET direto /dashboard retorna 404. Não existe vercel.json no commit base; este patch acrescenta rewrite SPA. Os campos internos do painel **não foram consultados**: não há CLI vercel instalada, vínculo .vercel nem conector Vercel disponível nesta sessão. Nenhuma autenticação no painel ou tentativa de obter tokens de deploy foi realizada.

| Campo no painel | Valor esperado / procedimento | Estado de verificação |
|---|---|---|
| Projeto/domínio | Projeto que atende chico-sense-frontend.vercel.app | Domínio público confirmado; identificação interna não consultada |
| Git repository | juvalent/ChicoSense-Frontend | Remote local confirmado; associação do painel desconhecida |
| Production Branch | Confirmar main, ou registrar outra branch efetivamente escolhida pela equipe | Não presumir pelo nome do remote |
| Framework Preset | Vite | Esperado pelo código/build; painel não consultado |
| Root Directory | Raiz que contém package.json e src (normalmente . neste repo) | Conferir se não aponta a subpasta/cópia antiga |
| Build Command | npm run build | Executado localmente com sucesso |
| Output Directory | dist | Gerado pelo Vite local |
| Install Command | npm ci | Executado com lockfile atualizado |
| Node.js Version | 24.x como ambiente local validado (24.21.0); conferir suporte/opção do projeto | Versão remota não verificada |
| Variável Production | VITE_API_URL=https://chico-sense-back.onrender.com | Efeito compilado correto; existência da variável no painel não comprovada |
| Build/Deployment Logs | Registrar commit, branch, Node/npm, comandos e conclusão sem erros | Não acessados |
| Rewrites | vercel.json deste patch deve estar no root efetivo | Ainda não publicado |

Nenhuma linha “esperada” comprova que o painel já possui esse valor.

## Variável de build

Em Settings → Environment Variables (ou seção equivalente da interface atual), confirmar/criar:

```text
Nome: VITE_API_URL
Valor: https://chico-sense-back.onrender.com
Ambiente: Production
```

Sem barra/caminho é a forma recomendada; a implementação remove barras finais. Não colocar /api/v1, /docs, localhost, URL do frontend, aspas como parte do valor ou espaços. A variável é pública no JavaScript: não incluir senha, SECRET_KEY, chave ThingSpeak ou DSN. Preview deve usar backend/origem aprovados; ele não recebe autorização CORS por existir na Vercel.

Variáveis VITE_* são incorporadas em build-time. Alteração no painel exige **novo deployment/build**; não muda o JavaScript de um deployment já pronto. Isso está descrito na [documentação Vite](https://vite.dev/guide/env-and-mode). O fallback desta aplicação produz a mesma URL, portanto uma URL correta no bundle não demonstra o cadastro da variável.

## SPA e refresh

O projeto usa BrowserRouter. Navegação interna /dashboard pode funcionar sem GET dessa URL no servidor; acesso direto/reload requer fallback. Adicionado [vercel.json](../vercel.json):

```json
{
  "$schema":"https://openapi.vercel.sh/vercel.json",
  "rewrites":[{"source":"/(.*)","destination":"/index.html"}]
}
```

É a configuração SPA descrita para Vite na [documentação Vercel](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas). Os assets existentes continuam sendo servidos como arquivos. A aplicação continua chamando o Render por URL absoluta; esse rewrite **não é proxy da API** e não resolve CORS. Não há alteração de cleanUrls neste patch.

Depois do fallback, o App precisa restaurar a sessão consultando /me: servir HTML não autentica ninguém. Essa restauração foi acrescentada no código local. Sem token, o acesso direto protegido mostra login; com token válido, revalida identidade; se indisponível, permite retry sem exibir conteúdo privado.

## Passo obrigatório no Render — não executado

1. Abrir o serviço que atende https://chico-sense-back.onrender.com.
2. Conferir o commit/deployment ativo e o start command (a aplicação com create_app/CORSMiddleware do repo oficial). Não inferir atualização pelo OpenAPI info.version=0.1.0.
3. Confirmar se está ativa a implementação de CORS_ALLOWED_ORIGINS já integrada na main do backend: commit de correção 3788748, merge 795f4b1; main lida 816bc4b.
4. Em Environment, ler a lista atual e **acrescentar a origem exata**, preservando outras origens aprovadas:

```text
CORS_ALLOWED_ORIGINS=["https://chico-sense-frontend.vercel.app"]
```

O valor é uma lista JSON, não CSV. Se já há outras origens necessárias, incluí-las na mesma lista. Sem path nem barra final. Localhost:5173 e127.0.0.1:5173 são acrescentados pelo código. Não usar * nem *.vercel.app.

5. Aplicar/reiniciar/republicar o processo segundo o procedimento autorizado da equipe. Nenhuma migration ou mudança de banco é necessária para essa variável.
6. Repetir OPTIONS login/me e GET health com Origin Vercel. Esperado 200 para preflight e Access-Control-Allow-Origin exatamente igual à origem, além de credentials=true e Vary: Origin. Só depois homologar o login real.

O comportamento atual foi 400 Disallowed CORS origin. Se persistir após configurar, verificar serviço/domínio/deployment/processo efetivo e outros proxies. Não se recomenda alterar autenticação ou fazer novo patch backend sem evidência: o suporte à lista já existe no código lido. Não foi feita nenhuma mudança nesse repositório nesta execução.

## Procedimento de publicação a executar pela equipe

1. Revisar a branch local fix/autenticacao-vercel no worktree indicado no diagnóstico. Ela não foi commitada nem enviada.
2. Revisar os quatro documentos, as alterações frontend e os testes. Executar npm ci, npm run lint, npm test, npm run build.
3. Com autorização explícita, criar commit/push/PR e integrar à branch Production efetivamente configurada. Não presumir main nem misturar os arquivos antigos não rastreados da outra cópia local.
4. Configurar/verificar VITE_API_URL em Production; conferir Root/Output/Install/Build/Node; registrar o hash implantado e o status do deployment.
5. Aplicar o CORS no Render em procedimento separado e autorizado. Mesmo que o frontend publique corretamente, o login continuará bloqueado enquanto o backend rejeitar a origem.
6. Fazer novo build/deployment na Vercel com o código e variáveis corretos; conferir alias público ligado ao novo deployment. Comparar o asset carregado com o build aprovado, não apenas “Ready”.
7. Executar o checklist pós-deploy, sem copiar senhas/Bearer nos relatórios. Promover somente com critérios objetivos aprovados e rollback disponível pela equipe.

## Reprodução local

Na branch/worktree de correção:

```powershell
npm ci
npm run lint
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

O preview 4173 não é uma origem CORS aprovada por padrão no backend! Para testar contra a API, usar dev server 5173 ou aprovar explicitamente a origem de preview num ambiente de teste. Não culpar o build por uma porta diferente não autorizada. Mocks dos testes não dependem do backend nem exigem configuração de CORS.

O build com marcador example.invalid desta investigação foi somente compilação, em diretório separado, sem executar requisições ou publicar. Não utilizá-lo para deployment.

## Pendências de infraestrutura e segurança

- Painel Vercel: confirmar efetivamente Node/Root/branch/variável/logs; nenhum acesso foi suposto.
- Render: corrigir política CORS efetiva e comprovar commit/configuração aplicada.
- Credenciais de teste: equipe deve fornecer/utilizar conta autorizada para login e escopo; não inserir credenciais reais em código/testes.
- npm audit: duas dependências com advisories HIGH já existiam no lockfile base; triagem de atualização é separada da causa do login. Não foi feito audit fix automático. Não atribuir esses advisories ao bloqueio CORS sem evidência.
- Lint mantém 23 warnings preexistentes e build mantém aviso de chunk grande. Ambos encerram com exit 0; isso não equivale a ausência de dívida técnica.
