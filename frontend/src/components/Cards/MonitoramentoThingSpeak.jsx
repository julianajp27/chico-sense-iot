import { useEffect, useRef, useState } from "react";

import {
  BrainCircuit,
  RefreshCw,
  Thermometer,
  Droplets,
} from "lucide-react";

import { obterThingSpeakIA } from "../../services/inteligenciaService";

import "./MonitoramentoThingSpeak.css";

const INTERVALO_ATUALIZACAO = 30000;
const LIMITE_ATUALIZACAO = 120000;

const titulosStatus = {
  NAO_SINALIZADO: "Nenhuma anomalia sinalizada",
  ANOMALIA_DETECTADA: "Anomalia ambiental detectada",
  DADOS_DESATUALIZADOS: "Dados desatualizados",
  DADOS_INSUFICIENTES: "Dados insuficientes",
  DADOS_INVALIDOS: "Dados inválidos",
  INTERRUPCAO_DETECTADA: "Interrupção nas medições",
  HORARIO_INVALIDO: "Horário inválido",
  CANAL_NAO_CONFIGURADO: "Canal não configurado",
  AGUARDANDO_DADOS: "Aguardando dados",
};

function formatarData(valor) {
  if (!valor) return "Não disponível";

  const data = new Date(valor);

  if (!Number.isFinite(data.getTime())) {
    return "Não disponível";
  }

  return data.toLocaleString("pt-BR", {
    timeZone: "America/Recife",
  });
}

function formatarNumero(valor, casas = 1) {
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

export default function MonitoramentoThingSpeak() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [agora, setAgora] = useState(Date.now());

  const montado = useRef(false);
  const consultando = useRef(false);

  async function consultar() {
    if (consultando.current || !montado.current) {
      return;
    }

    consultando.current = true;

    setCarregando(true);
    setErro("");

    try {
      const resposta = await obterThingSpeakIA();

      if (montado.current) {
        setDados(resposta);
        setAgora(Date.now());
      }
    } catch (error) {
      if (montado.current) {
        setDados(null);

        const mensagem = error?.response?.data?.detail;

        setErro(
          typeof mensagem === "string"
            ? mensagem
            : "Não foi possível consultar o sensor."
        );
      }
    } finally {
      consultando.current = false;

      if (montado.current) {
        setCarregando(false);
      }
    }
  }

  useEffect(() => {
    montado.current = true;

    consultar();

    const intervalo = setInterval(
      consultar,
      INTERVALO_ATUALIZACAO
    );

    const relogio = setInterval(() => {
      setAgora(Date.now());
    }, 1000);

    return () => {
      montado.current = false;
      clearInterval(intervalo);
      clearInterval(relogio);
    };
  }, []);

  const horario = dados?.ultima_medicao
    ? new Date(dados.ultima_medicao).getTime()
    : NaN;

  const idade = agora - horario;

  const dadosRecentes = Boolean(
    dados?.dados_recentes &&
      Number.isFinite(idade) &&
      idade >= 0 &&
      idade <= LIMITE_ATUALIZACAO &&
      !erro
  );

  const resultado = dadosRecentes
    ? dados?.resultado
    : null;

  const analiseValida = Boolean(
    resultado &&
      typeof resultado.anomalia === "boolean"
  );

  const fatores = analiseValida
    ? resultado.fatores_considerados
    : null;

  const statusAtual =
    dados?.dados_recentes && !dadosRecentes
      ? "DADOS_DESATUALIZADOS"
      : dados?.status;

  const titulo = erro
    ? "Análise indisponível"
    : !dados
      ? "Consultando sensor..."
      : titulosStatus[statusAtual] ||
        "Aguardando análise";

  const recomendacao = erro
    ? "Verifique a comunicação com o sensor."
    : analiseValida
      ? resultado.recomendacao
      : statusAtual === "DADOS_DESATUALIZADOS"
        ? "Verifique a transmissão do sensor e aguarde novas leituras."
        : dados?.mensagem ||
          "Aguardando medições válidas.";

  return (
    <section className="thingspeak-ia">
      <header className="thingspeak-ia__header">
        <div>
          <h2>
            <BrainCircuit size={20} />
            {" "}Análise ambiental
          </h2>

          <p>Inteligência artificial aplicada ao sensor IoT</p>
        </div>

        <div className="thingspeak-ia__controles">
          <button
            type="button"
            onClick={consultar}
            disabled={carregando}
          >
            <RefreshCw size={16} />

            {carregando
              ? "Analisando..."
              : "Atualizar"}
          </button>
        </div>
      </header>

      <div
        className={`thingspeak-ia__resultado ${
          resultado?.anomalia === true
            ? "alerta"
            : ""
        }`}
        role="status"
      >
        <h3>{titulo}</h3>

        {dados?.ultima_medicao && (
          <div className="thingspeak-ia__resumo-leitura">
            Última medição:{" "}
            {formatarData(dados.ultima_medicao)}
          </div>
        )}

        {erro && (
          <p className="thingspeak-ia__erro">
            {erro}
          </p>
        )}

        {fatores && (
          <div className="thingspeak-ia__informacoes">
            <div>
              <Thermometer size={18} />
              <small>Temperatura</small>

              <strong>
                {formatarNumero(fatores.temperatura)} °C
              </strong>
            </div>

            <div>
              <Droplets size={18} />
              <small>Umidade</small>

              <strong>
                {formatarNumero(fatores.umidade)}%
              </strong>
            </div>
          </div>
        )}

        <p className="thingspeak-ia__recomendacao">
          <strong>Orientação: </strong>
          {recomendacao}
        </p>
      </div>

      {analiseValida && fatores && (
        <details className="thingspeak-ia__detalhes">
          <summary>Detalhes da análise</summary>

          <div className="thingspeak-ia__informacoes">
            <div>
              <small>Score de anomalia</small>

              <strong>
                {formatarNumero(resultado.score, 6)}
              </strong>
            </div>

            <div>
              <small>Limite de detecção</small>

              <strong>
                {formatarNumero(resultado.limite, 6)}
              </strong>
            </div>

            <div>
              <small>Variação de temperatura</small>

              <strong>
                {formatarNumero(
                  fatores.variacao_temperatura,
                  2
                )} °C
              </strong>
            </div>

            <div>
              <small>Variação de umidade</small>

              <strong>
                {formatarNumero(
                  fatores.variacao_umidade,
                  2
                )} p.p.
              </strong>
            </div>

            <div>
              <small>Temperatura média</small>

              <strong>
                {formatarNumero(
                  fatores.media_temperatura,
                  2
                )} °C
              </strong>
            </div>

            <div>
              <small>Umidade média</small>

              <strong>
                {formatarNumero(
                  fatores.media_umidade,
                  2
                )}%
              </strong>
            </div>
          </div>

          <p>
            Modelo: {resultado.algoritmo}.
            As médias consideram cinco leituras e
            as variações consideram as duas últimas.
          </p>

          <p>
            Canal ThingSpeak: {dados.canal}.
            Atualização automática a cada 30 segundos.
          </p>
        </details>
      )}

      <p className="thingspeak-ia__limitacao">
        Modelo experimental de detecção de anomalias.
        Não comprova deterioração da carga, presença de
        etileno ou necessidade de exaustão.
        As medições não estão vinculadas a uma
        viagem específica.
      </p>
    </section>
  );
}