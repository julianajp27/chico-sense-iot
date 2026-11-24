import Button from "../UI/Button";
import Card from "../UI/Card";
import EmptyState from "../UI/EmptyState";
import ErrorState from "../UI/ErrorState";
import LoadingState from "../UI/LoadingState";

function formatDateTime(value) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Fortaleza",
  })
    .format(date)
    .replace(",", "");
}

function formatValue(value) {
  if (value === undefined || value === null || value === "") {
    return "Não informado";
  }

  if (typeof value === "boolean") return value ? "Sim" : "Não";

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return formatDateTime(value);
  }

  return String(value);
}

function formatSampling(value) {
  if (typeof value === "number") return `A cada ${value} min`;

  return formatValue(value);
}

export default function CargaDetalhes({
  load,
  trip,
  monitoring,
  loading = false,
  error,
  onRetry,
  onOpenMonitoring,
}) {
  const items = [
    {
      label: "Pré-resfriamento",
      value: formatValue(monitoring?.precooling),
    },
    {
      label: "Embarque registrado",
      value: formatValue(monitoring?.boardingRecordedAt),
    },
    {
      label: "Amostragem da sessão",
      value: formatSampling(monitoring?.samplingInterval),
    },
    {
      label: "Orientação de conservação",
      value: formatValue(monitoring?.conservationGuidance),
    },
  ];

  return (
    <Card
      className="load-details"
      title={`${load.code || load.id}${
        load.variety ? ` · ${load.variety}` : ""
      }`}
      description={`Lote ${load.harvestLot || "—"} · ${
        trip?.origin || "—"
      } → ${trip?.destination || "—"}`}
      action={
        <Button onClick={() => onOpenMonitoring?.(load)}>
          Ir ao monitoramento
        </Button>
      }
    >
      {loading ? (
        <LoadingState message="Carregando dados de monitoramento…" />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : !monitoring ? (
        <EmptyState
          title="Dados de monitoramento não declarados"
          description="Os dados adicionais desta carga aparecerão aqui depois de declarados."
        />
      ) : (
        <dl className="load-details__info">
          {items.map((item) => (
            <div key={item.label} className="load-details__item">
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
}