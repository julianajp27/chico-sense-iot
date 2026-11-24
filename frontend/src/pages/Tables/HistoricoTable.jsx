
import { ChevronRight, Leaf } from "lucide-react";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Recife",
  }).format(date);
}

function formatValue(value, unit = "") {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) return "—";

  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(number)}${unit ? ` ${unit}` : ""}`;
}

const statusConfig = {
  completed: {
    label: "Concluída",
    className: "historico-table__status--completed",
  },
  cancelled: {
    label: "Cancelada",
    className: "historico-table__status--cancelled",
  },
  in_transit: {
    label: "Em trânsito",
    className: "historico-table__status--transit",
  },
  scheduled: {
    label: "Programada",
    className: "historico-table__status--scheduled",
  },
};

export default function HistoricoTable({
  trips = [],
  onOpenTrip,
}) {
  return (
    <div
      className="historico-table__scroll"
      role="region"
      aria-label="Histórico de viagens"
      tabIndex={0}
    >
      <table className="historico-table">
        <thead>
          <tr>
            <th scope="col">Viagem</th>
            <th scope="col">Produto</th>
            <th scope="col">Origem</th>
            <th scope="col">Destino</th>
            <th scope="col">Temperatura</th>
            <th scope="col">Umidade</th>
            <th scope="col">Status</th>
            <th scope="col">Ação</th>
          </tr>
        </thead>

        <tbody>
          {trips.map((trip) => {
            const status =
              statusConfig[trip.status] ?? {
                label: "Não informado",
                className: "",
              };

            return (
              <tr key={trip.id}>
                <th scope="row">
                  <div className="historico-table__trip">
                    <strong>
                      {trip.code || trip.id}
                    </strong>

                    <span>
                      {formatDate(
                        trip.actualArrivalAt ||
                        trip.arrivalAt
                      )}
                    </span>
                  </div>
                </th>

                <td>
                  <span className="historico-table__product">
                    <Leaf
                      size={15}
                      aria-hidden="true"
                    />

                    {trip.product || "Não informado"}
                  </span>
                </td>

                <td>{trip.origin || "—"}</td>

                <td>{trip.destination || "—"}</td>

                <td>
                  {formatValue(
                    trip.temperature,
                    "°C"
                  )}
                </td>

                <td>
                  {formatValue(
                    trip.humidity,
                    "%"
                  )}
                </td>

                <td>
                  <span
                    className={`historico-table__status ${status.className}`}
                  >
                    {status.label}
                  </span>
                </td>

                <td>
                  <button
                    type="button"
                    className="historico-table__action"
                    aria-label={`Ver detalhes da viagem ${
                      trip.code || trip.id
                    }`}
                    onClick={() => onOpenTrip?.(trip)}
                  >
                    <ChevronRight
                      size={18}
                      aria-hidden="true"
                    />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
