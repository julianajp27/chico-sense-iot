import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Bell,
  Boxes,
  Route,
} from "lucide-react";

import MetricCard from "../../components/Cards/MetricCard";
import ClimateChart from "../../components/Charts/ClimateChart";
import TransitTripsTable from "../../components/Tables/TransitTripsTable";
import Card from "../../components/UI/Card";
import EmptyState from "../../components/UI/EmptyState";
import ErrorState from "../../components/UI/ErrorState";
import LoadingState from "../../components/UI/LoadingState";
import { listarLeituras } from "../../services/sensorService";

export default function Dashboard({
  user,
  profile,
  summary = {},
  trips = [],
  tripsLoading = false,
  tripsError,
  onRetryTrips,
}) {
  const navigate = useNavigate();

  const [sensorReadings, setSensorReadings] = useState([]);
  const [sensorLoading, setSensorLoading] = useState(true);
  const [sensorError, setSensorError] = useState("");

  const firstName = user?.name?.trim().split(/\s+/)[0];

  const transitTrips = trips.filter(
    (trip) => trip.status === "in_transit"
  );

  async function carregarSensores() {
    setSensorLoading(true);
    setSensorError("");

    try {
      const dados = await listarLeituras();
      setSensorReadings(dados);
    } catch (err) {
      console.error("Erro ao buscar sensores:", err);
      setSensorError(
        "Não foi possível carregar os dados do ThingSpeak."
      );
    } finally {
      setSensorLoading(false);
    }
  }

  useEffect(() => {
    carregarSensores();
  }, []);

  const metrics = [
    {
      title: "Viagens em trânsito",
      value: summary.activeTrips,
      description: "Corredor Vale do São Francisco",
      icon: Route,
      tone: "neutral",
    },
    {
      title: "Cargas monitoradas",
      value: summary.monitoredLoads,
      description: "Lotes exclusivos de manga",
      icon: Boxes,
      tone: "neutral",
    },
    {
      title: "Sessões ativas",
      value: summary.activeSessions,
      description: "Telemetria em andamento",
      icon: Activity,
      tone: "active",
    },
    {
      title: "Alertas abertos",
      value: summary.openAlerts,
      description: "Pendentes de resolução final",
      icon: Bell,
      tone: "warning",
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard__heading">
        <span className="dashboard__eyebrow">
          Visão geral
        </span>

        <h1 className="dashboard__title">
          {firstName ? `Olá, ${firstName}.` : "Olá."} Visão das suas cargas
        </h1>

        <p className="dashboard__description">
          Acompanhe as condições da cadeia fria e priorize o que
          precisa de atenção.
        </p>
      </div>

      <section
        className="dashboard__metrics"
        aria-label="Indicadores da operação"
      >
        {metrics.map(({ title, icon: Icon, description, ...metric }) => (
          <MetricCard
            key={title}
            title={title}
            description={
              metric.value == null
                ? "Dados indisponíveis"
                : description
            }
            icon={<Icon size={18} />}
            {...metric}
          />
        ))}
      </section>

      <ClimateChart
        title="Curva Ambiente × Produto (Manga)"
        description={
          summary.referenceSession
            ? `Sessão de referência: ${summary.referenceSession}`
            : "As leituras da sessão de referência aparecerão aqui."
        }
        readings={sensorReadings}
        loading={sensorLoading}
        error={sensorError}
        onRetry={carregarSensores}
      />

      <Card
        title="Viagens em trânsito"
        description="Rotas em deslocamento no momento."
      >
        {tripsLoading ? (
          <LoadingState message="Carregando viagens…" />
        ) : tripsError ? (
          <ErrorState message={tripsError} onRetry={onRetryTrips} />
        ) : transitTrips.length === 0 ? (
          <EmptyState
            title="Nenhuma viagem em trânsito"
            description="As viagens aparecerão aqui assim que houver rotas em deslocamento."
          />
        ) : (
          <TransitTripsTable
            trips={transitTrips}
            onOpenTrip={() => navigate("/viagens")}
          />
        )}
      </Card>
    </div>
  );
}