
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock3,
  FlaskConical,
  Info,
  Leaf,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";

import Card from "../../components/UI/Card";
import {
  criarAnaliseEtileno,
  listarAnalisesEtileno,
  obterAnaliseEtileno,
} from "../../services/etilenoService";

import { listarSessoesCarga } from "../../services/monitoramentoService";
import useViagemCargas from "../../hooks/useViagemCargas";

function formatarData(valor) {
  if (!valor) return "—";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "—";

  return data.toLocaleString("pt-BR");
}

function formatarNumero(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "—";
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero)) return String(valor);

  return numero.toLocaleString("pt-BR", {
    maximumFractionDigits: 4,
  });
}

function formatarErro(error) {
  const detalhe = error?.response?.data?.detail;

  if (typeof detalhe === "string") return detalhe;

  if (Array.isArray(detalhe)) {
    return detalhe
      .map((item) => item.msg || "Campo inválido")
      .join("; ");
  }

  const status = error?.response?.status;

  if (status === 401) return "Sua sessão expirou. Faça login novamente.";
  if (status === 403) return "Você não tem permissão para realizar esta operação.";
  if (status === 404) return "O registro solicitado não foi encontrado.";
  if (status === 409) return "A operação apresentou um conflito de estado ou integridade.";
  if (status === 422) return "Os parâmetros da análise são inválidos.";
  if (status === 503) return "O servidor não conseguiu persistir a análise. Consulte o histórico antes de tentar novamente.";

  return error?.message || "Não foi possível concluir a operação.";
}

function paraISO(valor) {
  if (!valor) return undefined;

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return undefined;

  return data.toISOString();
}

function formatarInputData(valor) {
  if (!valor) return "";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "";

  const local = new Date(
    data.getTime() - data.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 16);
}

function identificar(item, alternativas = []) {
  for (const chave of alternativas) {
    const valor = item?.[chave];

    if (valor !== undefined && valor !== null && valor !== "") {
      return String(valor);
    }
  }

  return "";
}

function extrairLista(valor, campos = []) {
  if (Array.isArray(valor)) return valor;

  for (const campo of campos) {
    if (Array.isArray(valor?.[campo])) return valor[campo];
  }

  return [];
}

function ResumoCard({ titulo, valor, descricao, Icone, destaque }) {
  return (
    <Card>
      <div
        className={`etileno-resumo ${
          destaque ? "etileno-resumo--destaque" : ""
        }`}
      >
        <div className="etileno-resumo__topo">
          <span>{titulo}</span>
          <span className="etileno-resumo__icone">
            <Icone size={19} />
          </span>
        </div>

        <strong className="etileno-resumo__valor">{valor}</strong>
        <p className="etileno-resumo__descricao">{descricao}</p>
      </div>
    </Card>
  );
}

export default function Etileno({ trips = [] }) {
  const [viagemId, setViagemId] = useState("");
  const [cargaId, setCargaId] = useState("");
  const [sessaoId, setSessaoId] = useState("");

  const [sessoes, setSessoes] = useState([]);
  const [carregandoSessoes, setCarregandoSessoes] = useState(false);
  const [erroSessoes, setErroSessoes] = useState("");

  const [analises, setAnalises] = useState([]);
  const [totalAnalises, setTotalAnalises] = useState(0);
  const [carregandoAnalises, setCarregandoAnalises] = useState(false);
  const [erroAnalises, setErroAnalises] = useState("");

  const [analiseDetalhada, setAnaliseDetalhada] = useState(null);
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);
  const [erroDetalhes, setErroDetalhes] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroCriacao, setErroCriacao] = useState("");

  const [atualizacao, setAtualizacao] = useState(0);

  const [formulario, setFormulario] = useState({
    inicio: "",
    fim: "",
    corte_aquisicao: "",
    revisao_aquisicao: "",
    modo: "MODO_RESTRITO",
    intervalo_maximo_s: "60",
  });

  // A chave é preservada se a requisição falhar.
  // Isso evita criar uma análise duplicada ao repetir o envio.
  const [chavePendente, setChavePendente] = useState("");

  const {
    loads,
    loading: carregandoCargas,
    error: erroCargas,
  } = useViagemCargas(viagemId);

  const viagens = useMemo(
    () => extrairLista(trips, ["viagens", "items", "dados"]),
    [trips]
  );

  const cargas = useMemo(
    () => extrairLista(loads, ["cargas", "items", "dados"]),
    [loads]
  );

  const sessaoSelecionada = sessoes.find(
    (item) => String(item.id) === String(sessaoId)
  );

  useEffect(() => {
    let ativo = true;

    setSessoes([]);
    setErroSessoes("");
    setSessaoId("");

    if (!cargaId) return;

    setCarregandoSessoes(true);

    listarSessoesCarga(cargaId)
      .then((dados) => {
        if (!ativo) return;

        setSessoes(
          extrairLista(dados, ["monitoramentos", "sessoes", "items"])
        );
      })
      .catch((error) => {
        if (ativo) setErroSessoes(formatarErro(error));
      })
      .finally(() => {
        if (ativo) setCarregandoSessoes(false);
      });

    return () => {
      ativo = false;
    };
  }, [cargaId]);

  useEffect(() => {
    let ativo = true;

    setAnalises([]);
    setTotalAnalises(0);
    setErroAnalises("");
    setAnaliseDetalhada(null);

    if (!sessaoId) return;

    setCarregandoAnalises(true);

    listarAnalisesEtileno(sessaoId, { limit: 100, offset: 0 })
      .then((dados) => {
        if (!ativo) return;

        setAnalises(dados.analises || []);
        setTotalAnalises(dados.total || 0);
      })
      .catch((error) => {
        if (ativo) setErroAnalises(formatarErro(error));
      })
      .finally(() => {
        if (ativo) setCarregandoAnalises(false);
      });

    return () => {
      ativo = false;
    };
  }, [sessaoId, atualizacao]);

  const ultimaAnalise = useMemo(() => {
    return [...analises].sort(
      (a, b) =>
        new Date(b.executada_em || b.created_at) -
        new Date(a.executada_em || a.created_at)
    )[0];
  }, [analises]);

  function selecionarViagem(event) {
    setViagemId(event.target.value);
    setCargaId("");
    setSessaoId("");
  }

  function selecionarCarga(event) {
    setCargaId(event.target.value);
    setSessaoId("");
  }

  function atualizarHistorico() {
    setAtualizacao((anterior) => anterior + 1);
  }

  function abrirNovaAnalise() {
    if (!sessaoId) return;

    setErroCriacao("");
    setChavePendente("");

    setFormulario({
      inicio: formatarInputData(sessaoSelecionada?.inicio),
      fim: formatarInputData(sessaoSelecionada?.fim),
      corte_aquisicao: "",
      revisao_aquisicao: "",
      modo: "MODO_RESTRITO",
      intervalo_maximo_s: "60",
    });

    setModalAberto(true);
  }

  function atualizarCampo(campo, valor) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));

    // Uma alteração no payload precisa de nova chave.
    setChavePendente("");
  }

  async function solicitarAnalise(event) {
    event.preventDefault();

    if (!sessaoId || salvando) return;

    setErroCriacao("");

    const inicio = paraISO(formulario.inicio);
    const fim = paraISO(formulario.fim);
    const corte = paraISO(formulario.corte_aquisicao);

    if (!inicio || !fim) {
      setErroCriacao("Informe o início e o fim da análise.");
      return;
    }

    if (new Date(inicio) >= new Date(fim)) {
      setErroCriacao("O fim deve ser posterior ao início.");
      return;
    }

    if (
      formulario.corte_aquisicao &&
      !corte
    ) {
      setErroCriacao("Informe um corte de aquisição válido.");
      return;
    }

    if (
      sessaoSelecionada?.estado === "ATIVA" &&
      !corte
    ) {
      setErroCriacao(
        "Sessões ativas exigem corte de aquisição explícito."
      );
      return;
    }

    const chave =
      chavePendente || crypto.randomUUID();

    setChavePendente(chave);
    setSalvando(true);

    try {
      await criarAnaliseEtileno(sessaoId, {
        chave_idempotencia: chave,
        modo: formulario.modo,
        intervalo_maximo_s: Number(
          formulario.intervalo_maximo_s
        ),
        inicio,
        fim,
        ...(corte ? { corte_aquisicao: corte } : {}),
        ...(formulario.revisao_aquisicao !== ""
          ? {
              revisao_aquisicao: Number(
                formulario.revisao_aquisicao
              ),
            }
          : {}),
      });

      setModalAberto(false);
      setChavePendente("");
      atualizarHistorico();
    } catch (error) {
      setErroCriacao(formatarErro(error));
    } finally {
      setSalvando(false);
    }
  }

  async function visualizarAnalise(analiseId) {
    if (!sessaoId || !analiseId) return;

    setErroDetalhes("");
    setAnaliseDetalhada(null);
    setCarregandoDetalhes(true);

    try {
      const dados = await obterAnaliseEtileno(
        sessaoId,
        analiseId
      );

      setAnaliseDetalhada(dados);
    } catch (error) {
      setErroDetalhes(formatarErro(error));
    } finally {
      setCarregandoDetalhes(false);
    }
  }

  const resultadoUltima = ultimaAnalise?.resultado;

  const unidadeVolume =
    resultadoUltima?.unidade_volume || "µL";

  const volumeMin =
    resultadoUltima?.volume_janela_min_ul;

  const volumeMax =
    resultadoUltima?.volume_janela_max_ul;

  const possuiEstimativa =
    volumeMin !== undefined &&
    volumeMin !== null &&
    volumeMax !== undefined &&
    volumeMax !== null;

  return (
    <div className="etileno-page">
      <header className="etileno-page__cabecalho">
        <div>
          <span className="etileno-page__eyebrow">
            Conservação pós-colheita · Manga do Vale do São Francisco
          </span>

          <h1 className="page-title">
            Análises de Etileno
          </h1>

          <p className="etileno-page__descricao">
            Consulte as estimativas de produção potencial de
            etileno calculadas a partir das leituras da sessão
            selecionada.
          </p>
        </div>

        <button
          type="button"
          className="button button--primary"
          onClick={abrirNovaAnalise}
          disabled={!sessaoId}
        >
          <Plus size={17} />
          Nova análise
        </button>
      </header>

      <div className="etileno-aviso">
        <Info size={18} />
        <span>
          Estimativa científica, não leitura direta de sensor.
          Os resultados não representam concentração real
          de etileno nem uma previsão de liberação.
        </span>
      </div>

      <Card>
        <div className="etileno-selecao">
          <h2>Sessão de monitoramento</h2>
          <p>
            Selecione a viagem, a carga e a sessão para
            consultar ou solicitar análises de etileno.
          </p>

          <div className="etileno-selecao__campos">
            <label className="etileno-campo">
              <span>Viagem</span>
              <select
                value={viagemId}
                onChange={selecionarViagem}
              >
                <option value="">Selecione uma viagem</option>

                {viagens.map((viagem) => (
                  <option key={viagem.id} value={viagem.id}>
                    {identificar(viagem, [
                      "code",
                      "codigo",
                      "nome",
                      "id",
                    ])}
                  </option>
                ))}
              </select>
            </label>

            <label className="etileno-campo">
              <span>Carga</span>
              <select
                value={cargaId}
                onChange={selecionarCarga}
                disabled={!viagemId || carregandoCargas}
              >
                <option value="">
                  {carregandoCargas
                    ? "Carregando cargas..."
                    : "Selecione uma carga"}
                </option>

                {cargas.map((carga) => (
                  <option key={carga.id} value={carga.id}>
                    {identificar(carga, [
                      "code",
                      "codigo",
                      "nome",
                      "id",
                    ])}
                  </option>
                ))}
              </select>
            </label>

            <label className="etileno-campo">
              <span>Sessão</span>
              <select
                value={sessaoId}
                onChange={(event) =>
                  setSessaoId(event.target.value)
                }
                disabled={!cargaId || carregandoSessoes}
              >
                <option value="">
                  {carregandoSessoes
                    ? "Carregando sessões..."
                    : "Selecione uma sessão"}
                </option>

                {sessoes.map((sessao) => (
                  <option key={sessao.id} value={sessao.id}>
                    {identificar(sessao, [
                      "produto_identificado",
                      "id",
                    ])}
                    {" · "}
                    {sessao.estado || "Sem estado"}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {(erroCargas || erroSessoes) && (
            <p className="etileno-erro">
              {formatarErro(erroCargas) || erroSessoes}
            </p>
          )}
        </div>
      </Card>

      <div className="etileno-resumos">
        <ResumoCard
          titulo="Total de análises"
          valor={sessaoId ? totalAnalises : "—"}
          descricao="Registros preservados nesta sessão"
          Icone={FlaskConical}
        />

        <ResumoCard
          titulo="Última análise"
          valor={
            ultimaAnalise
              ? `ET-${ultimaAnalise.id.slice(0, 8)}`
              : "—"
          }
          descricao={
            ultimaAnalise
              ? `Executada em ${formatarData(
                  ultimaAnalise.executada_em
                )}`
              : "Nenhuma análise selecionada"
          }
          Icone={Clock3}
        />

        <ResumoCard
          titulo="Produção potencial estimada"
          valor={
            possuiEstimativa
              ? `${formatarNumero(volumeMin)} a ${formatarNumero(
                  volumeMax
                )} ${unidadeVolume}`
              : "—"
          }
          descricao={
            resultadoUltima?.percentual_cobertura != null
              ? `Cobertura: ${formatarNumero(
                  resultadoUltima.percentual_cobertura
                )}%`
              : "Disponível após análise válida"
          }
          Icone={Leaf}
          destaque
        />
      </div>

      <Card>
        <div className="etileno-historico">
          <div className="etileno-historico__cabecalho">
            <div>
              <h2>Histórico de análises da sessão</h2>
              <p>
                Consulte análises anteriores sem recalcular
                nem alterar entradas fixadas.
              </p>
            </div>

            <button
              type="button"
              className="button button--secondary"
              onClick={atualizarHistorico}
              disabled={!sessaoId || carregandoAnalises}
            >
              <RefreshCw size={16} />
              Atualizar
            </button>
          </div>

          {erroAnalises && (
            <p className="etileno-erro">{erroAnalises}</p>
          )}

          {carregandoAnalises ? (
            <p className="etileno-mensagem">
              Carregando análises...
            </p>
          ) : !sessaoId ? (
            <p className="etileno-mensagem">
              Selecione uma sessão para consultar o histórico.
            </p>
          ) : analises.length === 0 ? (
            <p className="etileno-mensagem">
              Nenhuma análise encontrada para esta sessão.
            </p>
          ) : (
            <div className="etileno-tabela__scroll">
              <table className="etileno-tabela">
                <thead>
                  <tr>
                    <th>Análise</th>
                    <th>Data de execução</th>
                    <th>Status do cálculo</th>
                    <th>Volume estimado</th>
                    <th>Ação</th>
                  </tr>
                </thead>

                <tbody>
                  {analises.map((analise) => {
                    const resultado = analise.resultado;

                    const minimo =
                      resultado?.volume_janela_min_ul;
                    const maximo =
                      resultado?.volume_janela_max_ul;

                    return (
                      <tr key={analise.id}>
                        <td>
                          <strong>
                            ET-{analise.id.slice(0, 8)}
                          </strong>
                        </td>

                        <td>
                          {formatarData(
                            analise.executada_em
                          )}
                        </td>

                        <td>
                          {analise.status_calculo || "—"}
                        </td>

                        <td>
                          {minimo != null && maximo != null
                            ? `${formatarNumero(
                                minimo
                              )} a ${formatarNumero(
                                maximo
                              )} µL`
                            : "—"}
                        </td>

                        <td>
                          <button
                            type="button"
                            className="button button--secondary"
                            onClick={() =>
                              visualizarAnalise(analise.id)
                            }
                          >
                            Visualizar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalAnalises > analises.length && (
            <p className="etileno-mensagem">
              Exibindo {analises.length} de {totalAnalises}
              análises. Esta consulta retorna até 100 registros.
            </p>
          )}
        </div>
      </Card>

      {(carregandoDetalhes || analiseDetalhada || erroDetalhes) && (
        <Card>
          <div className="etileno-detalhes">
            <div className="etileno-detalhes__cabecalho">
              <h2>Detalhes da análise</h2>

              <button
                type="button"
                className="button button--secondary"
                onClick={() => {
                  setAnaliseDetalhada(null);
                  setErroDetalhes("");
                  setCarregandoDetalhes(false);
                }}
              >
                <X size={16} />
                Fechar
              </button>
            </div>

            {carregandoDetalhes && (
              <p>Carregando resultado...</p>
            )}

            {erroDetalhes && (
              <p className="etileno-erro">{erroDetalhes}</p>
            )}

            {analiseDetalhada && (
              <>
                <div className="etileno-detalhes__grid">
                  <div>
                    <span>Status</span>
                    <strong>
                      {analiseDetalhada.status_calculo || "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Modelo</span>
                    <strong>
                      {analiseDetalhada.versao_modelo || "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Início</span>
                    <strong>
                      {formatarData(analiseDetalhada.inicio)}
                    </strong>
                  </div>

                  <div>
                    <span>Fim</span>
                    <strong>
                      {formatarData(analiseDetalhada.fim)}
                    </strong>
                  </div>

                  <div>
                    <span>Volume mínimo da janela</span>
                    <strong>
                      {formatarNumero(
                        analiseDetalhada.resultado
                          ?.volume_janela_min_ul
                      )} µL
                    </strong>
                  </div>

                  <div>
                    <span>Volume máximo da janela</span>
                    <strong>
                      {formatarNumero(
                        analiseDetalhada.resultado
                          ?.volume_janela_max_ul
                      )} µL
                    </strong>
                  </div>

                  <div>
                    <span>Cobertura</span>
                    <strong>
                      {formatarNumero(
                        analiseDetalhada.resultado
                          ?.percentual_cobertura
                      )}%
                    </strong>
                  </div>

                  <div>
                    <span>Risco de etileno</span>
                    <strong>
                      {analiseDetalhada.classificacao_risco_etileno ||
                        "Não avaliado"}
                    </strong>
                  </div>
                </div>

                {Boolean(
                  analiseDetalhada.resultado?.motivos?.length
                ) && (
                  <div className="etileno-detalhes__observacoes">
                    <h3>Motivos informados pelo modelo</h3>
                    <ul>
                      {analiseDetalhada.resultado.motivos.map(
                        (motivo, index) => (
                          <li key={index}>{motivo}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {Boolean(
                  analiseDetalhada.resultado?.limitacoes?.length
                ) && (
                  <div className="etileno-detalhes__observacoes">
                    <h3>Limitações</h3>
                    <ul>
                      {analiseDetalhada.resultado.limitacoes.map(
                        (limitacao, index) => (
                          <li key={index}>{limitacao}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      )}

      {modalAberto && (
        <div className="etileno-modal__overlay">
          <div
            className="etileno-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="etileno-modal-titulo"
          >
            <div className="etileno-modal__cabecalho">
              <div>
                <h2 id="etileno-modal-titulo">
                  Nova análise de etileno
                </h2>
                <p>
                  Informe os parâmetros exigidos pelo motor
                  científico do backend.
                </p>
              </div>

              <button
                type="button"
                className="button button--ghost"
                onClick={() => setModalAberto(false)}
                disabled={salvando}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="etileno-modal__formulario"
              onSubmit={solicitarAnalise}
            >
              <label className="etileno-campo">
                <span>Início da janela</span>
                <input
                  type="datetime-local"
                  required
                  value={formulario.inicio}
                  onChange={(event) =>
                    atualizarCampo(
                      "inicio",
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="etileno-campo">
                <span>Fim da janela</span>
                <input
                  type="datetime-local"
                  required
                  value={formulario.fim}
                  onChange={(event) =>
                    atualizarCampo(
                      "fim",
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="etileno-campo">
                <span>Corte de aquisição</span>
                <input
                  type="datetime-local"
                  value={formulario.corte_aquisicao}
                  onChange={(event) =>
                    atualizarCampo(
                      "corte_aquisicao",
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="etileno-campo">
                <span>Revisão de aquisição</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formulario.revisao_aquisicao}
                  onChange={(event) =>
                    atualizarCampo(
                      "revisao_aquisicao",
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="etileno-campo">
                <span>Modo</span>
                <select
                  value={formulario.modo}
                  onChange={(event) =>
                    atualizarCampo(
                      "modo",
                      event.target.value
                    )
                  }
                >
                  <option value="MODO_RESTRITO">
                    MODO_RESTRITO
                  </option>
                </select>
              </label>

              <label className="etileno-campo">
                <span>Intervalo máximo (segundos)</span>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={formulario.intervalo_maximo_s}
                  onChange={(event) =>
                    atualizarCampo(
                      "intervalo_maximo_s",
                      event.target.value
                    )
                  }
                />
              </label>

              <p className="etileno-modal__aviso">
                <Activity size={16} />
                A análise será calculada e persistida pelo
                backend. Uma sessão cancelada não permite
                novos cálculos.
              </p>

              {erroCriacao && (
                <p className="etileno-erro">
                  {erroCriacao}
                </p>
              )}

              <div className="etileno-modal__acoes">
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setModalAberto(false)}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="button button--primary"
                  disabled={salvando}
                >
                  <FlaskConical size={17} />
                  {salvando
                    ? "Calculando..."
                    : "Solicitar análise"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
