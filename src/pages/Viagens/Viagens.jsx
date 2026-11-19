
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import ViagemDetalhes from "../../components/Cards/ViagemDetalhes";
import ViagemTable from "../../components/Tables/ViagemTable";
import NovaViagemForm from "../../components/Forms/NovaViagemForm";

import Card from "../../components/UI/Card";
import EmptyState from "../../components/UI/EmptyState";
import ErrorState from "../../components/UI/ErrorState";
import Input from "../../components/UI/Input";
import LoadingState from "../../components/UI/LoadingState";

const tabs = [
  { value: "in_transit", label: "Em trânsito" },
  { value: "scheduled", label: "Programadas" },
  { value: "completed", label: "Concluídas" },
];

function normalizeSearch(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function Viagens({
  trips = [],
  loading = false,
  error,
  onRetry,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const detailsRef = useRef(null);

  const initialTripId = location.state?.tripId ?? null;

  const [tab, setTab] = useState(
    () =>
      trips.find((trip) => trip.id === initialTripId)?.status ??
      "in_transit"
  );

  const [search, setSearch] = useState("");
  const [selectedTripId, setSelectedTripId] = useState(initialTripId);

  // Controle do formulário de cadastro
  const [showNewTrip, setShowNewTrip] = useState(false);

  // Mensagem após cadastrar uma viagem
  const [successMessage, setSuccessMessage] = useState("");

  const query = normalizeSearch(search);

  const tabTrips = trips.filter((trip) => trip.status === tab);

  const filteredTrips = tabTrips.filter((trip) =>
    [
      trip.code,
      trip.origin,
      trip.destination,
      trip.vehicle,
      trip.driver,
    ].some((value) => normalizeSearch(value).includes(query))
  );

  const selectedTrip = filteredTrips.find(
    (trip) => trip.id === selectedTripId
  );

  useEffect(() => {
    if (!selectedTrip || !detailsRef.current) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    detailsRef.current.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [selectedTripId, selectedTrip]);

  function handleOpenTrip(trip) {
    setSelectedTripId((current) =>
      current === trip.id ? null : trip.id
    );
  }

  function handleOpenNewTrip() {
    setSuccessMessage("");
    setShowNewTrip(true);
  }

  function handleCloseNewTrip() {
    setShowNewTrip(false);
  }

  async function handleTripCreated() {
    // Atualiza a lista centralizada no AppRoutes
    if (typeof onRetry === "function") {
      await onRetry();
    }

    // Exibe a aba onde a nova viagem deve aparecer
    setTab("scheduled");
    setSearch("");
    setSelectedTripId(null);

    setSuccessMessage("Viagem cadastrada com sucesso!");
  }

  const controlsDisabled = loading || Boolean(error);

  return (
    <div className="viagens-page">
      <div className="viagens-page__heading">
        <div>
          <span className="viagens-page__eyebrow">
            Operação
          </span>

          <h1 className="page-title">Viagens</h1>

          <p className="viagens-page__description">
            Consulte as viagens e as cargas vinculadas a cada uma.
          </p>
        </div>

        <button
          type="button"
          className="viagens-page__new-button"
          onClick={handleOpenNewTrip}
        >
          + Nova viagem
        </button>
      </div>

      {successMessage && (
        <div
          role="status"
          style={{
            padding: "12px 16px",
            marginBottom: 16,
            borderRadius: 10,
            border: "1px solid #3b8060",
            background: "rgba(30, 120, 70, 0.12)",
            color: "#78d9a3",
          }}
        >
          {successMessage}
        </div>
      )}

      <Card
        title="Viagens"
        description="Selecione uma viagem para ver seus detalhes e cargas."
      >
        <div className="viagens-page__toolbar">
          <div
            className="viagens-page__categories"
            role="group"
            aria-label="Filtrar viagens por situação"
          >
            {tabs.map((item) => (
              <button
                key={item.value}
                type="button"
                className="viagens-page__category"
                aria-pressed={tab === item.value}
                disabled={controlsDisabled}
                onClick={() => {
                  setTab(item.value);
                  setSelectedTripId(null);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="viagens-page__search">
            <Input
              label="Buscar viagens"
              name="tripSearch"
              type="search"
              placeholder="Código, rota, veículo ou motorista"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              disabled={controlsDisabled}
            />
          </div>
        </div>

        {loading ? (
          <LoadingState message="Carregando viagens…" />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : trips.length === 0 ? (
          <EmptyState
            title="Nenhuma viagem cadastrada"
            description="As viagens aparecerão aqui assim que forem cadastradas."
          />
        ) : tabTrips.length === 0 ? (
          <EmptyState
            title="Nenhuma viagem nesta situação"
            description="Selecione outra aba para consultar as demais viagens."
          />
        ) : filteredTrips.length === 0 ? (
          <EmptyState
            title="Nenhuma viagem encontrada"
            description="Altere o texto da busca para consultar outros resultados."
          />
        ) : (
          <>
            <p
              className="viagens-page__results"
              role="status"
            >
              {filteredTrips.length} de {tabTrips.length} viagens
            </p>

            <ViagemTable
              trips={filteredTrips}
              selectedTripId={selectedTripId}
              onOpenTrip={handleOpenTrip}
            />
          </>
        )}
      </Card>

      {selectedTrip && (
        <div
          ref={detailsRef}
          className="viagens-page__details"
        >
          <ViagemDetalhes
            trip={selectedTrip}
            onOpenLoad={(load) =>
              navigate("/cargas", {
                state: {
                  tripId: selectedTrip.id,
                  loadId: load.id,
                },
              })
            }
          />
        </div>
      )}

      {/* Modal de cadastro de viagem */}
      {showNewTrip && (
        <NovaViagemForm
          onClose={handleCloseNewTrip}
          onCreated={handleTripCreated}
        />
      )}
    </div>
  );
}
