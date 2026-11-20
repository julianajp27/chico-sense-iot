
import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import AlertItem from "../../components/UI/AlertItem";
import Card from "../../components/UI/Card";
import EmptyState from "../../components/UI/EmptyState";
import ErrorState from "../../components/UI/ErrorState";
import LoadingState from "../../components/UI/LoadingState";

import useViagemCargas from "../../hooks/useViagemCargas";
import { listarAlertasCarga } from "../../services/alertaService";
import api from "../../services/api";

const filters = [
  { value: "all", label: "Todos" },
  { value: "new", label: "Novos" },
  { value: "monitoring", label: "Em acompanhamento" },
  { value: "resolved", label: "Normalizados" },
];

function getErrorMessage(error) {
  const status = error?.response?.status;

  if (status === 401) {
    return "Sua sessão expirou. Faça login novamente.";
  }

  if (status === 403) {
    return "Você não possui permissão para consultar estes dados.";
  }

  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  return (
    error?.message ||
    "Não foi possível carregar os alertas."
  );
}

function getTripLabel(trip) {
  return (
    trip.nome ||
    trip.codigo ||
    trip.origem ||
    `Viagem ${String(trip.id).slice(0, 8)}`
  );
}

function getLoadLabel(load) {
  return (
    load.nome ||
    load.codigo ||
    `Carga ${String(load.id).slice(0, 8)}`
  );
}

export default function Alertas({
  trips = [],
  tripsLoading = false,
  tripsError = "",
  onRetryTrips,
}) {
  const [selectedTripId, setSelectedTripId] = useState("");
  const [selectedLoadId, setSelectedLoadId] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [alertsError, setAlertsError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const {
    loads,
    loading: loadingLoads,
    error: loadsError,
    retry: retryLoads,
  } = useViagemCargas(selectedTripId);

  // Seleciona automaticamente a primeira viagem disponível.
  useEffect(() => {
    setSelectedTripId((current) => {
      if (!trips.length) return "";

      const exists = trips.some(
        (trip) => String(trip.id) === String(current)
      );

      return exists
        ? current
        : String(trips[0].id);
    });
  }, [trips]);

  // Seleciona automaticamente a primeira carga disponível.
  useEffect(() => {
    setSelectedLoadId((current) => {
      if (!loads.length) return "";

      const exists = loads.some(
        (load) => String(load.id) === String(current)
      );

      return exists
        ? current
        : String(loads[0].id);
    });
  }, [loads]);

  // Consulta as configurações e gera alertas a partir das leituras.
  const carregarAlertas = useCallback(
    async (cargaId) => {
      if (!cargaId) {
        setAlerts([]);
        setAlertsError("");
        setLoadingAlerts(false);
        return;
      }

      setLoadingAlerts(true);
      setAlertsError("");
      setAlerts([]);

      try {
        const { data: configuracao } = await api.get(
          `/api/v1/cargas/${cargaId}/monitoramento`
        );

        const encontrados = await listarAlertasCarga(
          cargaId,
          configuracao,
          {
            viagemId: selectedTripId,
          }
        );

        setAlerts(
          Array.isArray(encontrados)
            ? encontrados
            : []
        );
      } catch (error) {
        console.error(
          "Erro ao consultar alertas:",
          error
        );

        setAlertsError(getErrorMessage(error));
      } finally {
        setLoadingAlerts(false);
      }
    },
    [selectedTripId]
  );

  useEffect(() => {
    carregarAlertas(selectedLoadId);
  }, [selectedLoadId, reloadKey, carregarAlertas]);

  const filteredAlerts = alerts.filter(
    (alert) =>
      statusFilter === "all" ||
      alert.status === statusFilter
  );

  const selectedTrip = trips.find(
    (trip) =>
      String(trip.id) === String(selectedTripId)
  );

  const selectedLoad = loads.find(
    (load) =>
      String(load.id) === String(selectedLoadId)
  );

  const loading =
    tripsLoading ||
    loadingLoads ||
    loadingAlerts;

  const error =
    tripsError ||
    loadsError ||
    alertsError;

  function handleRetry() {
    if (tripsError) {
      onRetryTrips?.();
      return;
    }

    if (loadsError) {
      retryLoads();
      return;
    }

    setReloadKey((current) => current + 1);
  }

  function handleTripChange(event) {
    setSelectedTripId(event.target.value);
    setSelectedLoadId("");
    setAlerts([]);
    setAlertsError("");
  }

  function handleLoadChange(event) {
    setSelectedLoadId(event.target.value);
    setAlerts([]);
    setAlertsError("");
  }

  return (
    <div className="alertas-page">
      {/* Cabeçalho */}
      <div className="alertas-page__heading">
        <span className="alertas-page__eyebrow">
          Ocorrências
        </span>

        <h1 className="page-title">
          Central de Alertas
        </h1>

        <p className="alertas-page__description">
          Acompanhe alterações de temperatura e umidade
          identificadas nas leituras dos sensores.
        </p>
      </div>

      {/* Seleção de viagem e carga */}
      <Card>
        <div className="alertas-page__selectors">
          {/* Viagem */}
          <div className="alertas-page__field">
            <label htmlFor="alertas-viagem">
              Viagem
            </label>

            <select
              id="alertas-viagem"
              value={selectedTripId}
              onChange={handleTripChange}
              disabled={
                tripsLoading ||
                trips.length === 0
              }
            >
              {trips.length === 0 ? (
                <option value="">
                  Nenhuma viagem disponível
                </option>
              ) : (
                <>
                  <option value="">
                    Selecione uma viagem
                  </option>

                  {trips.map((trip) => (
                    <option
                      key={trip.id}
                      value={trip.id}
                    >
                      {getTripLabel(trip)}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Carga */}
          <div className="alertas-page__field">
            <label htmlFor="alertas-carga">
              Carga
            </label>

            <select
              id="alertas-carga"
              value={selectedLoadId}
              onChange={handleLoadChange}
              disabled={
                !selectedTripId ||
                loadingLoads ||
                loads.length === 0
              }
            >
              {loads.length === 0 ? (
                <option value="">
                  Nenhuma carga disponível
                </option>
              ) : (
                <>
                  <option value="">
                    Selecione uma carga
                  </option>

                  {loads.map((load) => (
                    <option
                      key={load.id}
                      value={load.id}
                    >
                      {getLoadLabel(load)}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Atualização */}
          <div className="alertas-page__field">
            <label htmlFor="alertas-atualizar">
              Atualização
            </label>

            <button
              id="alertas-atualizar"
              type="button"
              className="alertas-page__refresh"
              onClick={handleRetry}
              disabled={loading}
            >
              <RefreshCw
                size={17}
                aria-hidden="true"
              />

              <span>
                Atualizar alertas
              </span>
            </button>
          </div>
        </div>
      </Card>

      {/* Histórico de ocorrências */}
      <Card>
        <div
          className="alertas-page__filters"
          role="group"
          aria-label="Filtrar alertas por situação"
        >
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className="alertas-page__filter"
              aria-pressed={
                statusFilter === filter.value
              }
              onClick={() =>
                setStatusFilter(filter.value)
              }
            >
              {filter.label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingState
            message="Carregando alertas..."
          />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={handleRetry}
          />
        ) : !selectedTripId ? (
          <EmptyState
            title="Nenhuma viagem selecionada"
            description="Selecione uma viagem para consultar os alertas."
          />
        ) : !selectedLoadId ? (
          <EmptyState
            title="Nenhuma carga selecionada"
            description="Selecione uma carga para consultar as ocorrências."
          />
        ) : alerts.length === 0 ? (
          <EmptyState
            title="Nenhum alerta identificado"
            description="Nenhuma ocorrência foi identificada nas leituras consultadas com os limites disponíveis."
          />
        ) : filteredAlerts.length === 0 ? (
          <EmptyState
            title="Nenhum alerta nesta situação"
            description="Selecione outro filtro para consultar as ocorrências."
          />
        ) : (
          <>
            <p
              className="alertas-page__results"
              role="status"
            >
              {filteredAlerts.length} de{" "}
              {alerts.length} alertas identificados
            </p>

            <ul className="alertas-page__list">
              {filteredAlerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  alert={{
                    ...alert,
                    cargaNome:
                      selectedLoad?.nome ||
                      selectedLoad?.codigo,
                    viagemNome:
                      selectedTrip?.nome ||
                      selectedTrip?.codigo,
                  }}
                />
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}
