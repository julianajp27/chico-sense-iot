import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Card from "../UI/Card";
import EmptyState from "../UI/EmptyState";
import ErrorState from "../UI/ErrorState";
import LoadingState from "../UI/LoadingState";

function formatTime(timestamp) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Fortaleza",
  }).format(new Date(timestamp));
}

export default function ClimateChart({
  readings = [],
  loading = false,
  error,
  onRetry,
  title = "Monitoramento IoT — ThingSpeak",
  description = "Histórico de temperatura e umidade coletadas pelo protótipo.",
}) {
  const validReadings = readings
    .filter(
      (reading) =>
        Number.isFinite(new Date(reading.timestamp).getTime()) &&
        (Number.isFinite(reading.temperature) ||
          Number.isFinite(reading.humidity))
    )
    .map((reading) => ({
      timestamp: new Date(reading.timestamp).getTime(),
      temperature: Number.isFinite(reading.temperature)
        ? reading.temperature
        : null,
      humidity: Number.isFinite(reading.humidity)
        ? reading.humidity
        : null,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  return (
    <Card
      title={title}
      description={description}
    >
      {loading ? (
        <LoadingState message="Carregando dados dos sensores…" />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : validReadings.length === 0 ? (
        <EmptyState
          title="Nenhuma leitura disponível"
          description="Ainda não existem leituras para exibir."
        />
      ) : (
        <div className="climate-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={validReadings}
              margin={{ top: 20, right: 24, bottom: 12, left: 0 }}
            >
              <CartesianGrid
                stroke="var(--color-border)"
                vertical={false}
              />

              <XAxis
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={formatTime}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                yAxisId="temperatura"
                unit=" °C"
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                yAxisId="umidade"
                orientation="right"
                unit=" %"
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip
                labelFormatter={formatTime}
                formatter={(value, name) => [
                  `${Number(value).toLocaleString("pt-BR", {
                    maximumFractionDigits: 2,
                  })} ${name === "Temperatura" ? "°C" : "%"}`,
                  name,
                ]}
              />

              <Legend />

              <Line
                yAxisId="temperatura"
                name="Temperatura"
                dataKey="temperature"
                type="monotone"
                stroke="var(--color-chart-environment)"
                strokeWidth={2}
                dot={validReadings.length === 1}
                connectNulls
                isAnimationActive={false}
              />

              <Line
                yAxisId="umidade"
                name="Umidade"
                dataKey="humidity"
                type="monotone"
                stroke="var(--color-chart-product)"
                strokeWidth={2}
                dot={validReadings.length === 1}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}