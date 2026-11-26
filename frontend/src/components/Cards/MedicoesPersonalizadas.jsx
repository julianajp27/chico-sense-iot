import { useState } from "react";
import {
  BrainCircuit,
  RotateCcw,
  Clock,
  LoaderCircle,
  SlidersHorizontal,
} from "lucide-react";

import Card from "../UI/Card";
import ErrorState from "../UI/ErrorState";
import FatoresAnalisadosIA from "./FatoresAnalisadosIA";
import GraficoMedicoesIA from "../Charts/GraficoMedicoesIA";
import { analisarMedicoesIA } from "../../services/inteligenciaService";

import "./MedicoesPersonalizadas.css";

function criarMedicoesVazias() {
  return Array.from({ length: 5 }, () => ({
    temperatura: "",
    umidade: "",
  }));
}

function formatarNumero(valor, casas = 6) {
  if (typeof valor !== "number" || !Number.isFinite(valor)) {
    return "—";
  }

  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

export default function MedicoesPersonalizadas({
  disponivel = false,
}) {
  const [medicoes, setMedicoes] = useState(criarMedicoesVazias);
  const [resultado, setResultado] = useState(null);
  const [analisando, setAnalisando] = useState(false);
  const [erro, setErro] = useState("");
  const [tempo, setTempo] = useState(null);

  function atualizarMedicao(index, campo, valor) {
    setMedicoes((anteriores) =>
      anteriores.map((medicao, posicao) =>
        posicao === index
          ? { ...medicao, [campo]: valor }
          : medicao
      )
    );

    setResultado(null);
    setErro("");
    setTempo(null);
  }

  function limparMedicoes() {
    setMedicoes(criarMedicoesVazias());
    setResultado(null);
    setErro("");
    setTempo(null);
  }

  function validarMedicoes() {
    for (let i = 0; i < medicoes.length; i++) {
      const medicao = medicoes[i];

      if (
        medicao.temperatura.trim() === "" ||
        medicao.umidade.trim() === ""
      ) {
        return `Preencha todos os campos da medição ${i + 1}.`;
      }

      const temperatura = Number(medicao.temperatura);
      const umidade = Number(medicao.umidade);

      if (
        !Number.isFinite(temperatura) ||
        !Number.isFinite(umidade)
      ) {
        return `Valores inválidos na medição ${i + 1}.`;
      }

      if (temperatura < -273.15) {
        return `Temperatura fisicamente inválida na medição ${i + 1}.`;
      }

      if (umidade < 0 || umidade > 100) {
        return `A umidade da medição ${i + 1} deve estar entre 0% e 100%.`;
      }
    }

    return "";
  }

  async function executarAnalise(event) {
    event?.preventDefault();

    if (analisando || !disponivel) return;

    setResultado(null);
    setTempo(null);
    setErro("");

    const erroValidacao = validarMedicoes();

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setAnalisando(true);

    const inicioProcessamento = performance.now();

    try {
      const inicioMedicoes = Date.UTC(2026, 0, 1, 12, 0, 0);

      const dados = medicoes.map((medicao, index) => ({
        data_hora: new Date(
          inicioMedicoes + index * 16000
        ).toISOString(),

        temperatura: Number(medicao.temperatura),
        umidade: Number(medicao.umidade),
      }));

      const resposta = await analisarMedicoesIA(dados);

      setResultado(resposta);
      setTempo(performance.now() - inicioProcessamento);
    } catch (error) {
      setErro(
        error.message || "Não foi possível executar a análise."
      );
    } finally {
      setAnalisando(false);
    }
  }

  return (
    <Card
      title="Medições personalizadas"
      description="Insira seus próprios valores para testar o modelo de inteligência artificial."
      action={<SlidersHorizontal size={20} />}
    >
      <div className="medicoes-personalizadas">
        <div className="medicoes-personalizadas__notice">
          <Clock size={18} />

          <span>
            Demonstração com cinco medições consecutivas e
            intervalo simulado de 16 segundos. Os valores
            informados serão processados pelo modelo treinado.
          </span>
        </div>

        <form onSubmit={executarAnalise} noValidate>
          <div className="medicoes-personalizadas__table-wrapper">
            <table className="medicoes-personalizadas__table">
              <thead>
                <tr>
                  <th>Medição</th>
                  <th>Temperatura (°C)</th>
                  <th>Umidade (%)</th>
                </tr>
              </thead>

              <tbody>
                {medicoes.map((medicao, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>

                    <td>
                      <input
                        type="number"
                        step="any"
                        min="-273.15"
                        placeholder="Ex.: 25"
                        aria-label={`Temperatura da medição ${index + 1}`}
                        value={medicao.temperatura}
                        disabled={analisando}
                        onChange={(event) =>
                          atualizarMedicao(
                            index,
                            "temperatura",
                            event.target.value
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        max="100"
                        placeholder="Ex.: 40"
                        aria-label={`Umidade da medição ${index + 1}`}
                        value={medicao.umidade}
                        disabled={analisando}
                        onChange={(event) =>
                          atualizarMedicao(
                            index,
                            "umidade",
                            event.target.value
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="medicoes-personalizadas__actions">
            <button
              type="submit"
              className="medicoes-personalizadas__execute"
              disabled={analisando || !disponivel}
              aria-busy={analisando}
            >
              {analisando ? (
                <LoaderCircle
                  size={19}
                  className="medicoes-personalizadas__spinner"
                />
              ) : (
                <BrainCircuit size={19} />
              )}

              {analisando
                ? "Processando medições..."
                : "Executar análise personalizada"}
            </button>

            <button
              type="button"
              className="medicoes-personalizadas__clear"
              disabled={analisando}
              onClick={limparMedicoes}
            >
              <RotateCcw size={17} />
              Limpar
            </button>
          </div>
        </form>

        {!disponivel && (
          <p>O serviço de inteligência artificial está indisponível.</p>
        )}

        {erro && (
          <ErrorState
            message={erro}
            onRetry={executarAnalise}
          />
        )}

        {resultado && (
          <div
            role="status"
            className={`medicoes-personalizadas__result ${
              resultado.anomalia === true
                ? "medicoes-personalizadas__result--anomaly"
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

            <div className="medicoes-personalizadas__metrics">
              <div>
                <span>Score de anomalia</span>
                <strong>
                  {formatarNumero(resultado.score)}
                </strong>
              </div>

              <div>
                <span>Limite de detecção</span>
                <strong>
                  {formatarNumero(resultado.limite)}
                </strong>
              </div>

              <div>
                <span>Tempo de resposta</span>
                <strong>
                  {formatarNumero(tempo, 0)} ms
                </strong>
              </div>
            </div>

            <p>{resultado.recomendacao}</p>
                <FatoresAnalisadosIA
                  fatoresConsiderados={resultado.fatores_considerados}
                />
                <GraficoMedicoesIA
  medicoes={medicoes.map((medicao, index) => ({
    data_hora: new Date(
      Date.UTC(2026, 0, 1, 12, 0, 0) + index * 16000
    ).toISOString(),
    temperatura: Number(medicao.temperatura),
    umidade: Number(medicao.umidade),
  }))}
/>
            {resultado.anomalia === false && (
              <p>
                A ausência de anomalia sinalizada não significa
                que as condições ambientais sejam seguras
                para a carga.
              </p>
            )}

            <p className="medicoes-personalizadas__footnote">
              {resultado.limitacao}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}