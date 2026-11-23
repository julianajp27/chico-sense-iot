import StatusBadge from "../UI/StatusBadge";

function formatValue(value, unit) {
  if (!Number.isFinite(value)) return "—";

  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(value)}${unit}`;
}

export default function CargaTable({ loads = [] }) {
  return (
    <div
      className="carga-table__scroll"
      role="region"
      aria-label="Lista de cargas"
      tabIndex={0}
    >
      <table className="carga-table">
        <caption className="carga-table__caption">
          Cargas e últimas condições registradas
        </caption>

        <thead>
          <tr>
            <th scope="col">Carga</th>
            <th scope="col">Produto</th>
            <th scope="col">Origem</th>
            <th scope="col">Destino</th>
            <th scope="col">Temperatura</th>
            <th scope="col">Umidade</th>
            <th scope="col">Condição</th>
          </tr>
        </thead>

        <tbody>
          {loads.map((load) => (
            <tr key={load.id}>
              <th scope="row">{load.code || load.id}</th>
              <td>{load.product || "—"}</td>
              <td>{load.origin || "—"}</td>
              <td>{load.destination || "—"}</td>
              <td>{formatValue(load.temperature, " °C")}</td>
              <td>{formatValue(load.humidity, "%")}</td>
              <td>
                {load.status ? (
                  <StatusBadge status={load.status} />
                ) : (
                  "Não informado"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}