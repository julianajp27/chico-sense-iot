import { useEffect, useState, useCallback } from "react";

import {
  BrainCircuit,
  Database,
  Activity,
  Info,
} from "lucide-react";

import Card from "../UI/Card";
import LoadingState from "../UI/LoadingState";
import ErrorState from "../UI/ErrorState";
import MedicoesPersonalizadas from "./MedicoesPersonalizadas";
import FatoresAnalisadosIA from "./FatoresAnalisadosIA";
import GraficoMedicoesIA from "../Charts/GraficoMedicoesIA";

import {
  obterStatusIA,
  obterHistoricoIA,
  analisarMedicoesIA,
} from "../../services/inteligenciaService";

import "./MonitoramentoInteligente.css";

const cenarios = {
  estavel: {
    nome: "Condições ambientais estáveis",
    temperaturas: [25, 25, 25.1, 25, 25.1],
    umidades: [40, 40.1, 40, 40.2, 40],
  },

  temperatura: {
    nome: "Aumento brusco de temperatura",
    temperaturas: [25, 25, 25, 25, 40],
    umidades: [40, 40, 40, 40, 40],
  },

  umidade: {
    nome: "Aumento brusco de umidade",
    temperaturas: [25, 25, 25, 25, 25],
    umidades: [40, 40, 40, 40, 95],
  },

  simultaneo: {
    nome: "Aumento de temperatura e umidade",
    temperaturas: [25, 25, 25, 25, 40],
    umidades: [40, 40, 40, 40, 95],
  },

  reducao: {
    nome: "Redução brusca de temperatura",
    temperaturas: [28, 28, 28, 28, 10],
    umidades: [45, 45, 45, 45, 45],
  },
};

function gerarMedicoes(cenario) {
  const inicio = Date.UTC(2026, 0, 1, 12, 0, 0);

  return cenario.temperaturas.map(
    (temperatura, index) => ({
      data_hora: new Date(
        inicio + index * 16000
      ).toISOString(),

      temperatura,

      umidade: cenario.umidades[index],
    })
  );
}

function formatarNumero(valor, casas = 6) {
  if (
    typeof valor !== "number" ||
    !Number.isFinite(valor)
  ) {
    return "—";
  }

  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

export default function MonitoramentoInteligente({
  modo = "completo",
}) {
  const exibirAvaliacao =
    modo === "completo" || modo === "avaliacao";

  const exibirLaboratorio =
    modo === "completo" || modo === "laboratorio";

  const [status, setStatus] = useState(null);
  const [historico, setHistorico] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [erroHistorico, setErroHistorico] = useState("");

  const [cenario, setCenario] = useState("estavel");
  const [resultado, setResultado] = useState(null);
  const [analisando, setAnalisando] = useState(false);
  const [erroAnalise, setErroAnalise] = useState("");

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErro("");
    setErroHistorico("");

    try {
      const dadosStatus = await obterStatusIA();

      setStatus(dadosStatus);

      if (exibirAvaliacao) {
        try {
          const dadosHistorico =
            await obterHistoricoIA();

          setHistorico(dadosHistorico);
        } catch (error) {
          setHistorico(null);

          setErroHistorico(
            error.response?.status === 403
              ? "Histórico disponível apenas para administradores."
              : error.message
          );
        }
      }
    } catch (error) {
      setStatus(null);
      setHistorico(null);
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }, [exibirAvaliacao]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  async function executarAnalise() {
    setAnalisando(true);
    setResultado(null);
    setErroAnalise("");

    try {
      const medicoes = gerarMedicoes(
        cenarios[cenario]
      );

      const resposta = await analisarMedicoesIA(
        medicoes
      );

      setResultado(resposta);
    } catch (error) {
      setErroAnalise(error.message);
    } finally {
      setAnalisando(false);
    }
  }

  const resumo = historico?.resultado;

  return (
    <div className="monitoramento-ia">

      {/* Disponibilidade do modelo */}

      <Card>
        <div className="monitoramento-ia__heading">
          <div className="monitoramento-ia__icon">
            <BrainCircuit size={26} />
          </div>

          <div>
            <h2>
              {modo === "avaliacao"
                ? "Avaliação do modelo"
                : modo === "laboratorio"
                  ? "Laboratório de IA"
                  : "Monitoramento Inteligente"}
            </h2>

            <p>Detecção de anomalias ambientais</p>
          </div>

          <span
            className={`monitoramento-ia__status ${
              status?.disponivel
                ? "monitoramento-ia__status--active"
                : ""
            }`}
          >
            {carregando
              ? "Verificando IA"
              : status?.disponivel
                ? "IA disponível"
                : "IA indisponível"}
          </span>
        </div>

        {carregando && (
          <LoadingState
            message="Consultando serviço de IA..."
          />
        )}

        {erro && (
          <ErrorState
            message={erro}
            onRetry={carregarDados}
          />
        )}

        {status?.disponivel && (
          <div className="monitoramento-ia__model">
            <strong>Isolation Forest</strong>

            <span>
              Modelo experimental de Machine Learning
            </span>
          </div>
        )}
      </Card>

      {/* Aba: Avaliação do modelo */}

      {exibirAvaliacao && (
        <Card
          title="Análise histórica"
          description="Dados reais coletados pelo ThingSpeak"
          action={<Database size={20} />}
        >
          <div className="monitoramento-ia__notice">
            <Info size={18} />

            <span>
              Dados históricos. Não representa
              monitoramento em tempo real nem análise
              da viagem selecionada.
            </span>
          </div>

          {erroHistorico && (
            <p>{erroHistorico}</p>
          )}

          {!resumo &&
            !carregando &&
            !erroHistorico && (
              <p>
                Resultados históricos indisponíveis.
              </p>
            )}

          {resumo && (
            <>
              <div className="monitoramento-ia__metrics">

                <div className="monitoramento-ia__metric">
                  <span>Medições avaliadas</span>

                  <strong>
                    {resumo.total_avaliado}
                  </strong>
                </div>

                <div className="monitoramento-ia__metric">
                  <span>Anomalias sinalizadas</span>

                  <strong className="monitoramento-ia__warning">
                    {resumo.registros_sinalizados}
                  </strong>
                </div>

                <div className="monitoramento-ia__metric">
                  <span>Não sinalizadas</span>

                  <strong>
                    {resumo.registros_nao_sinalizados}
                  </strong>
                </div>

                <div className="monitoramento-ia__metric">
                  <span>Percentual sinalizado</span>

                  <strong>
                    {formatarNumero(
                      resumo.percentual_sinalizado,
                      2
                    )}%
                  </strong>
                </div>

              </div>

              <div className="monitoramento-ia__bar">
                <div
                  className="monitoramento-ia__bar-normal"
                  style={{
                    width: `${
                      100 - resumo.percentual_sinalizado
                    }%`,
                  }}
                />

                <div
                  className="monitoramento-ia__bar-anomaly"
                  style={{
                    width: `${
                      resumo.percentual_sinalizado
                    }%`,
                  }}
                />
              </div>

              <div className="monitoramento-ia__legend">
                <span>
                  ● Registros não sinalizados
                </span>

                <span>
                  ● Anomalias sinalizadas
                </span>
              </div>

              <p className="monitoramento-ia__footnote">
                O percentual sinalizado não representa
                a precisão do modelo nem a probabilidade
                de deterioração.
              </p>
            </>
          )}
        </Card>
      )}

      {/* Aba: Laboratório de IA */}

      {exibirLaboratorio && (
        <>
          <Card
            title="Demonstração da Inteligência Artificial"
            description="Execute uma análise com medições simuladas"
            action={<Activity size={20} />}
          >
            <div className="monitoramento-ia__simulation">

              <label htmlFor="ia-cenario">
                Cenário de teste
              </label>

              <select
                id="ia-cenario"
                value={cenario}
                disabled={analisando}
                onChange={(event) => {
                  setCenario(event.target.value);
                  setResultado(null);
                  setErroAnalise("");
                }}
              >
                {Object.entries(cenarios).map(
                  ([id, item]) => (
                    <option key={id} value={id}>
                      {item.nome}
                    </option>
                  )
                )}
              </select>

              <div className="monitoramento-ia__table-wrapper">
                <table className="monitoramento-ia__table">
                  <thead>
                    <tr>
                      <th>Medição</th>
                      <th>Temperatura</th>
                      <th>Umidade</th>
                    </tr>
                  </thead>

                  <tbody>
                    {cenarios[cenario].temperaturas.map(
                      (temperatura, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>

                          <td>
                            {formatarNumero(
                              temperatura,
                              1
                            )} °C
                          </td>

                          <td>
                            {formatarNumero(
                              cenarios[cenario]
                                .umidades[index],
                              1
                            )}%
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                className="monitoramento-ia__button"
                onClick={executarAnalise}
                disabled={
                  analisando || !status?.disponivel
                }
              >
                <BrainCircuit size={18} />

                {analisando
                  ? "Analisando medições..."
                  : "Executar análise"}
              </button>
            </div>

            {erroAnalise && (
              <ErrorState
                message={erroAnalise}
                onRetry={executarAnalise}
              />
            )}

            {resultado && (
              <div
                role="status"
                className={`monitoramento-ia__result ${
                  resultado.anomalia === true
                    ? "monitoramento-ia__result--anomaly"
                    : resultado.anomalia === false
                      ? "monitoramento-ia__result--normal"
                      : ""
                }`}
              >
                <h3>
                  {resultado.anomalia === true
                    ? "Anomalia detectada"
                    : resultado.anomalia === false
                      ? "Nenhuma anomalia sinalizada"
                      : resultado.status}
                </h3>

                <div className="monitoramento-ia__metrics">

                  <div className="monitoramento-ia__metric">
                    <span>Score de anomalia</span>

                    <strong>
                      {formatarNumero(resultado.score)}
                    </strong>
                  </div>

                  <div className="monitoramento-ia__metric">
                    <span>Limite de detecção</span>

                    <strong>
                      {formatarNumero(resultado.limite)}
                    </strong>
                  </div>

                </div>

                <p>{resultado.recomendacao}</p>

                <FatoresAnalisadosIA
                  fatoresConsiderados={
                    resultado.fatores_considerados
                  }
                />

                <GraficoMedicoesIA
                  medicoes={
                    gerarMedicoes(cenarios[cenario])
                  }
                />

                <p className="monitoramento-ia__footnote">
                  {resultado.limitacao}
                </p>
              </div>
            )}
          </Card>

          {/* Medições personalizadas */}

          <MedicoesPersonalizadas
            disponivel={status?.disponivel === true}
          />
        </>
      )}

      {/* Limitações do modelo */}

      <div className="monitoramento-ia__notice">
        <Info size={18} />

        <span>
          Modelo experimental. Não comprova risco de
          deterioração da carga, presença de etileno ou
          necessidade de exaustão.
        </span>
      </div>
    </div>
  );
}