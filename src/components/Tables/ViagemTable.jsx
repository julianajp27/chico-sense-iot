import Button from "../UI/Button";

function formatWeight(value) {
  return Number.isFinite(value) ? `${value} kg` : "—";
}

export default function ViagemCargasTable({
  loads = [],
  selectedLoadId,
  onOpenLoad,
}) {
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
          {loads.map((load) => {
            const isSelected =
              selectedLoadId !== undefined &&
              String(load.id) === String(selectedLoadId);

            return (
              <tr
                key={load.id}
                className={
                  isSelected ? "carga-table__row--selected" : undefined
                }
              >
                <th scope="row">{load.code || load.id}</th>
                <td>{load.variety || "—"}</td>
                <td>{load.harvestLot || "—"}</td>
                <td>{load.boxes ?? "—"}</td>
                <td>{formatWeight(load.netWeightKg)}</td>
                <td>
                  <Button
                    variant={isSelected ? "primary" : "secondary"}
                    className="carga-table__action"
                    aria-pressed={isSelected}
                    onClick={() => onOpenLoad?.(load)}
                  >
                    {isSelected ? "Carga aberta" : "Abrir carga"}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}