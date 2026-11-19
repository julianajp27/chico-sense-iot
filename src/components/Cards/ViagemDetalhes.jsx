import Card from "../UI/Card";
import EmptyState from "../UI/EmptyState";
import ViagemCargasTable from "../Tables/ViagemCargasTable";

const statusLabels = {
  in_transit: "Em trânsito",
  scheduled: "Programada",
  completed: "Concluída",
};

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) return "—";

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

export default function ViagemDetalhes({ trip, onOpenLoad }) {
  const loads = Array.isArray(trip?.loads) ? trip.loads : [];

  return (
    <Card
      className="trip-details"
      title={`Viagem ${trip.code || trip.id} · ${trip.origin || "—"} → ${
        trip.destination || "—"
      }`}
      description="Dados operacionais e cargas vinculadas a esta viagem"
      action={
        <span
          className={`viagem-table__status viagem-table__status--${
            statusLabels[trip.status] ? trip.status : "unknown"
          }`}
        >
          {statusLabels[trip.status] || "Não informado"}
        </span>
      }
    >
      <dl className="trip-details__info">
        <div className="trip-details__item">
          <dt>Veículo frigorífico</dt>
          <dd>{trip.vehicle || "—"}</dd>
        </div>

        <div className="trip-details__item">
          <dt>Motorista responsável</dt>
          <dd>{trip.driver || "—"}</dd>
        </div>

        <div className="trip-details__item">
          <dt>Janela prevista</dt>
          <dd>
            {formatDateTime(trip.departureAt)} →{" "}
            {formatDateTime(trip.arrivalAt)}
          </dd>
        </div>
      </dl>

      <div className="trip-details__loads">
        <h3 className="trip-details__loads-title">
          Cargas desta viagem ({loads.length})
        </h3>

        {loads.length === 0 ? (
          <EmptyState
            title="Nenhuma carga vinculada"
            description="As cargas desta viagem aparecerão aqui quando forem cadastradas."
          />
        ) : (
          <ViagemCargasTable loads={loads} onOpenLoad={onOpenLoad} />
        )}
      </div>
    </Card>
  );
}