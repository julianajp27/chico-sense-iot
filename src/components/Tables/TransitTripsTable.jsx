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

export default function TransitTripsTable({ trips = [], onOpenTrip }) {
  return (
    <div
      className="transit-table__scroll"
      role="region"
      aria-label="Viagens em trânsito"
      tabIndex={0}
    >
      <table className="transit-table">
        <caption className="transit-table__caption">
          Viagens em deslocamento no momento
        </caption>

        <thead>
          <tr>
            <th scope="col">Viagem</th>
            <th scope="col">Origem → Destino</th>
            <th scope="col">Veículo</th>
            <th scope="col">Partida / Chegada</th>
            <th scope="col">Cargas</th>
            <th scope="col">Estado</th>
            <th scope="col">Ação</th>
          </tr>
        </thead>

        <tbody>
          {trips.map((trip) => (
            <tr key={trip.id}>
              <th scope="row">{trip.code || trip.id}</th>

              <td>
                {trip.origin || "—"} → {trip.destination || "—"}
              </td>

              <td>{trip.vehicle || "—"}</td>

              <td className="transit-table__dates">
                {formatDateTime(trip.departureAt)} →{" "}
                {formatDateTime(trip.arrivalAt)}
              </td>

              <td>{trip.loadsCount ?? "—"}</td>

              <td>
                <span className="transit-table__status">
                  Em trânsito
                </span>
              </td>

              <td>
                <button
                  type="button"
                  className="button button--secondary transit-table__action"
                  onClick={() => onOpenTrip?.(trip)}
                >
                  Abrir viagem
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}