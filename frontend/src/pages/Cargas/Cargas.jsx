import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import CargaDetalhes from "../../components/Cards/CargaDetalhes";
import ViagemCargasTable from "../../components/Tables/ViagemCargasTable";
import Card from "../../components/UI/Card";
import EmptyState from "../../components/UI/EmptyState";
import ErrorState from "../../components/UI/ErrorState";
import Input from "../../components/UI/Input";
import LoadingState from "../../components/UI/LoadingState";
import Select from "../../components/UI/Select";
import useCargaMonitoramento from "../../hooks/useCargaMonitoramento";
import useViagemCargas from "../../hooks/useViagemCargas";

const statusLabels = {
  in_transit: "Em trânsito",
  scheduled: "Programada",
  completed: "Concluída",
};

function normalizeSearch(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function Cargas({
  trips = [],
  loading = false,
  error,
  onRetry,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const detailsRef = useRef(null);

  const [tripId, setTripId] = useState(
    location.state?.tripId != null ? String(location.state.tripId) : ""
  );
  const [loadId, setLoadId] = useState(
    location.state?.loadId != null ? String(location.state.loadId) : ""
  );
  const [search, setSearch] = useState("");

  // Seleciona a primeira viagem quando a lista chega
  useEffect(() => {
    if (trips.length === 0) return;

    const exists = trips.some((trip) => String(trip.id) === tripId);

    if (!exists) {
      setTripId(String(trips[0].id));
      setLoadId("");
    }
  }, [trips, tripId]);

  const selectedTrip = trips.find((trip) => String(trip.id) === tripId);

  const cargas = useViagemCargas(selectedTrip?.id);

  const query = normalizeSearch(search);

  const filteredLoads = cargas.loads.filter((load) =>
    [load.code, load.variety, load.harvestLot].some((value) =>
      normalizeSearch(value).includes(query)
    )
  );

  const selectedLoad = cargas.loads.find(
    (load) => String(load.id) === loadId
  );

  const monitoramento = useCargaMonitoramento(selectedLoad?.id);

  useEffect(() => {
    if (!selectedLoad || !detailsRef.current) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    detailsRef.current.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [loadId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTripChange(event) {
    setTripId(event.target.value);
    setLoadId("");
    setSearch("");
  }

  function handleOpenLoad(load) {
    setLoadId((current) =>
      current === String(load.id) ? "" : String(load.id)
    );
  }

  const tripOptions = trips.map((trip) => ({
    value: String(trip.id),
    label: `${trip.code || trip.id} · ${trip.origin || "—"} → ${
      trip.destination || "—"
    } · ${statusLabels[trip.status] || "Situação não informada"}`,
  }));

  const controlsDisabled = loading || Boolean(error) || trips.length === 0;

  return (
    <div className="cargas-page">
      <div className="cargas-page__heading">
        <span className="cargas-page__eyebrow">
          Hierarquia viagem → carga → caixa
        </span>

        <h1 className="page-title">Cargas de Manga</h1>

        <p className="cargas-page__description">
          Selecione uma viagem para listar suas cargas e inspecionar
          caixas e sessões vinculadas.
        </p>
      </div>

      <Card
        title="Viagem selecionada"
        description="As cargas pertencem sempre a uma viagem."
      >
        <div className="cargas-page__filters">
          <Select
            label="Viagem"
            name="tripId"
            value={tripId}
            onChange={handleTripChange}
            disabled={controlsDisabled}
            placeholder="Selecione uma viagem"
            options={tripOptions}
          />

          <Input
            label="Buscar carga na viagem"
            name="loadSearch"
            type="search"
            placeholder="Carga, variedade de manga ou lote"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            disabled={controlsDisabled || !selectedTrip}
          />
        </div>

        {loading ? (
          <LoadingState message="Carregando viagens…" />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : trips.length === 0 ? (
          <EmptyState
            title="Nenhuma viagem cadastrada"
            description="Cadastre uma viagem para listar as cargas dela."
          />
        ) : cargas.loading ? (
          <LoadingState message="Carregando cargas…" />
        ) : cargas.error ? (
          <ErrorState message={cargas.error} onRetry={cargas.retry} />
        ) : cargas.loads.length === 0 ? (
          <EmptyState
            title="Nenhuma carga nesta viagem"
            description="As cargas aparecerão aqui quando forem vinculadas à viagem."
          />
        ) : filteredLoads.length === 0 ? (
          <EmptyState
            title="Nenhuma carga encontrada"
            description="Altere o texto da busca para consultar outros resultados."
          />
        ) : (
          <>
            <p className="cargas-page__results" role="status">
              {filteredLoads.length} de {cargas.loads.length} cargas
            </p>

            <ViagemCargasTable
              loads={filteredLoads}
              selectedLoadId={loadId}
              onOpenLoad={handleOpenLoad}
            />
          </>
        )}
      </Card>

      {selectedLoad && (
        <div ref={detailsRef} className="cargas-page__details">
          <CargaDetalhes
            load={selectedLoad}
            trip={selectedTrip}
            monitoring={monitoramento.data}
            loading={monitoramento.loading}
            error={monitoramento.error}
            onRetry={monitoramento.retry}
            onOpenMonitoring={(load) =>
              navigate("/monitoramento", {
                state: { tripId: selectedTrip?.id, loadId: load.id },
              })
            }
          />
        </div>
      )}
    </div>
  );
}