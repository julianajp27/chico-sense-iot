import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Thermometer,
  Droplets,
  Clock,
  Info,
} from "lucide-react";

import "./GraficoMedicoesIA.css";

const formatadorHorario = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Recife",
});

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "America/Recife",
});

function formatarHorario(timestamp) {
  return formatadorHorario.format(new Date(timestamp));
}

function formatarNumero(valor, casas = 1) {
  return Number(valor).toLocaleString("pt-BR", {
    maximumFractionDigits: casas,
    minimumFractionDigits: casas,
  });
}

function IndicadorSemicircular({
  valor,
  minimo,
  maximo,
  unidade,
  cor,
  titulo,
}) {
  const proporcao = Math.min(
    1,
    Math.max(0, (valor - minimo) / (maximo - minimo))
  );

  const angulo = -90 + proporcao * 180;

  return (
    <div className="grafico-ia__gauge">
      <svg
        viewBox="0 0 240 155"
        role="img"
        aria-label={`${titulo}: ${valor} ${unidade}`}
      >
        <path
          d="M 30 110 A 90 90 0 0 1 210 110"
          fill="none"
          stroke="#e1e6eb"
          strokeWidth="28"
          pathLength="100"
        />

        <path
          d="M 30 110 A 90 90 0 0 1 210 110"
          fill="none"
          stroke={cor}
          strokeWidth="28"
          pathLength="100"
          strokeDasharray={`${proporcao * 100} 100`}
          className="grafico-ia__gauge-fill"
        />

        <g
          className="grafico-ia__pointer"
          style={{
            transform: `rotate(${angulo}deg)`,
            transformOrigin: "120px 110px",
          }}
        >
          <line
            x1="120"
            y1="110"
            x2="120"
            y2="30"
            stroke="#26364a"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>

        <circle
          cx="120"
          cy="110"
          r="6"
          fill="#26364a"
        />

        <text
          x="22"
          y="138"
          textAnchor="middle"
          className="grafico-ia__scale"
        >
          {minimo}
        </text>

        <text
          x="218"
          y="138"
          textAnchor="middle"
          className="grafico-ia__scale"
        >
          {maximo}
        </text>

        <text
          x="120"
          y="143"
          textAnchor="middle"
          className="grafico-ia__value"
        >
          {formatarNumero(valor)} {unidade}
        </text>
      </svg>
    </div>
  );
}

function PainelMedicao({
  titulo,
  unidade,
  dados,
  campo,
  minimo,
  maximo,
  cor,
  icon: Icon,
}) {
  const ultimaMedicao = dados[dados.length - 1];

  return (
    <section className="grafico-ia__panel">
      <div className="grafico-ia__heading">
        <div className="grafico-ia__icon">
          <Icon size={21} aria-hidden="true" />
        </div>

        <div>
          <h3>{titulo}</h3>
          <span>Última leitura</span>
        </div>
      </div>

      <IndicadorSemicircular
        titulo={titulo}
        valor={ultimaMedicao[campo]}
        minimo={minimo}
        maximo={maximo}
        unidade={unidade}
        cor={cor}
      />

      <div className="grafico-ia__chart-title">
        Evolução das medições
      </div>

      <div className="grafico-ia__chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dados}
            margin={{
              top: 15,
              right: 15,
              bottom: 12,
              left: 0,
            }}
          >
            <CartesianGrid
              stroke="#e1e6eb"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              ticks={dados.map((item) => item.timestamp)}
              tickFormatter={formatarHorario}
              tick={{ fontSize: 10 }}
              minTickGap={12}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              domain={[minimo, maximo]}
              unit={` ${unidade}`}
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={55}
            />

            <Tooltip
              labelFormatter={(timestamp) =>
                `Horário: ${formatarHorario(timestamp)}`
              }
              formatter={(valor) => [
                `${formatarNumero(valor)} ${unidade}`,
                titulo,
              ]}
            />

            <Line
              type="linear"
              dataKey={campo}
              name={titulo}
              stroke={cor}
              strokeWidth={2.5}
              dot={{ r: 4, fill: cor }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default function GraficoMedicoesIA({
  medicoes = [],
  origem = "SIMULACAO",
}) {
  const dadosReais = origem === "THINGSPEAK";
  const dados = medicoes
    .filter(
      (medicao) =>
        Number.isFinite(medicao.temperatura) &&
        Number.isFinite(medicao.umidade) &&
        Number.isFinite(
          new Date(medicao.data_hora).getTime()
        )
    )
    .map((medicao) => ({
      timestamp: new Date(medicao.data_hora).getTime(),
      temperatura: medicao.temperatura,
      umidade: medicao.umidade,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  if (dados.length < 2) {
    return null;
  }

  const temperaturas = dados.map(
    (medicao) => medicao.temperatura
  );

  const temperaturaMinima = Math.min(
    0,
    Math.floor(Math.min(...temperaturas) / 10) * 10
  );

  const temperaturaMaxima = Math.max(
    50,
    Math.ceil(Math.max(...temperaturas) / 10) * 10
  );

  const ultimaMedicao = dados[dados.length - 1];

  return (
    <section className="grafico-ia">
      <div className="grafico-ia__header">
        <h3>Condições ambientais analisadas</h3>

        <p>
          Indicadores e evolução das medições utilizadas
          na análise da inteligência artificial.
        </p>
      </div>

      <div className="grafico-ia__timestamp">
        <Clock size={18} aria-hidden="true" />

        <span>
          {dadosReais
  ? "Última medição do sensor: "
  : "Última medição simulada: "}
          <strong>
            {formatadorData.format(
              new Date(ultimaMedicao.timestamp)
            )}
          </strong>
          {" — horário de Recife"}
        </span>
      </div>

      <div className="grafico-ia__grid">
        <PainelMedicao
          titulo="Temperatura"
          unidade="°C"
          dados={dados}
          campo="temperatura"
          minimo={temperaturaMinima}
          maximo={temperaturaMaxima}
          cor="#91b91c"
          icon={Thermometer}
        />

        <PainelMedicao
          titulo="Umidade"
          unidade="%"
          dados={dados}
          campo="umidade"
          minimo={0}
          maximo={100}
          cor="#3895b8"
          icon={Droplets}
        />
      </div>

      <div className="grafico-ia__notice">
  <Info size={17} aria-hidden="true" />

  <span>
    {dadosReais
      ? "Os gráficos representam medições reais coletadas pelo sensor e recebidas pelo ThingSpeak. Consulte o horário da última leitura para verificar sua atualidade."
      : "Os gráficos representam medições simuladas utilizadas como entrada do modelo, e não previsões ou monitoramento em tempo real."}

    {" As escalas dos indicadores são referências visuais e não limites de segurança da carga."}
  </span>
</div>
</section>
  );
}