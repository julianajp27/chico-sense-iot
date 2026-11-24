# Chico Sense

Projeto Integrador do Grupo 01. O sistema acompanha temperatura e umidade durante o transporte de cargas e apresenta os dados em um painel web.

| Componente | Código e documentação |
|---|---|
| Aplicação web em React e Vite | [Frontend](frontend/README.md) |
| API em FastAPI e PostgreSQL | [Backend](backend/README.md) |
| Sensor DHT11, ESP32-C3 e ponte Python para ThingSpeak | [IoT](iot/README.md) |

## Organização da entrega de Computação em Nuvem

A [Sprint 1](https://github.com/julianajp27/chico-sense-iot/issues/1) acompanha a publicação e a automação. A [Sprint 2](https://github.com/julianajp27/chico-sense-iot/issues/2) acompanha as evidências e a apresentação.

Cada integrante trabalha em uma branch própria, faz commits pela sua conta e vincula seu pull request à tarefa correspondente.

### Build e testes automatizados

A cada push e pull request, o GitHub Actions executa dois trabalhos independentes em Ubuntu. O [arquivo do workflow](.github/workflows/ci.yml) define as etapas e solicita acesso de leitura ao conteúdo do repositório.

| Componente | Ambiente | Etapas |
|---|---|---|
| Frontend | Node.js 24 | Instala as versões registradas no lockfile com `npm ci`, gera a aplicação com `npm run build` e executa os testes com `npm test`. |
| Backend | Python 3.12 | Instala `backend/requirements.txt`, verifica a compilação dos módulos com `python -m compileall -q app` e executa `python -m pytest -q -rs`. A saída informa também os testes ignorados e os motivos. |

Na aba [Actions](https://github.com/julianajp27/chico-sense-iot/actions), abra uma execução e selecione `frontend` ou `backend` para consultar o resultado de cada etapa.

Em 24/11/2026, os dois trabalhos passaram no [push da branch de integração](https://github.com/julianajp27/chico-sense-iot/actions/runs/45495973040), no [pull request](https://github.com/julianajp27/chico-sense-iot/actions/runs/45495973943) e na [main após o merge do PR #17](https://github.com/julianajp27/chico-sense-iot/actions/runs/45498213669). A configuração e a demonstração do deploy automático são acompanhadas na [tarefa #16](https://github.com/julianajp27/chico-sense-iot/issues/16).
