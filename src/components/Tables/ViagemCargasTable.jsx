import Button from "../UI/Button";

function formatWeight(value) {
  return Number.isFinite(value) ? `${value} kg` : "—";
}

export default function ViagemCargasTable({ loads = [], onOpenLoad }) {
  return (
    <div
      className="carga-table__scroll"
      role="region"
      aria-label="Cargas da viagem"
      tabIndex={0}
    >
      <table className="carga-table">
        <caption className="carga-table__caption">
          Cargas vinculadas à viagem
        </caption>

        <thead>
          <tr>
            <th scope="col">Carga</th>
            <th scope="col">Variedade</th>
            <th scope="col">Lote de colheita</th>
            <th scope="col">Caixas</th>
            <th scope="col">Peso líquido</th>
            <th scope="col">Ação</th>
          </tr>
        </thead>

        <tbody>
          {loads.map((load) => (
            <tr key={load.id}>
              <th scope="row">{load.code || load.id}</th>
              <td>{load.variety || "—"}</td>
              <td>{load.harvestLot || "—"}</td>
              <td>{load.boxes ?? "—"}</td>
              <td>{formatWeight(load.netWeightKg)}</td>
              <td>
                <Button
                  variant="secondary"
                  onClick={() => onOpenLoad?.(load)}
                >
                  Abrir carga
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}