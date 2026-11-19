
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarClock,
  Droplets,
  RefreshCw,
  Thermometer,
  Truck,
  Package,
} from "lucide-react";

import Card from "../../components/UI/Card";
import EmptyState from "../../components/UI/EmptyState";
import ErrorState from "../../components/UI/ErrorState";
import LoadingState from "../../components/UI/LoadingState";

import useViagemCargas from "../../hooks/useViagemCargas";

import {
  listarSessoesCarga,
  listarLeiturasSessao,
  normalizarLeituras,
} from "../../services/monitoramentoService";

function getErrorMessage(error) {
  const status = error?.response?.status;

  if (status === 401) {
    return "Sua sessão expirou. Faça login novamente.";
  }

  if (status === 403) {
    return "Você não tem permissão para consultar este monitoramento.";
  }

  if (status === 404) {
    return "Monitoramento não encontrado.";
  }

  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") return detail;

  return (
    error?.message ||
    "Não foi possível carregar o monitoramento."
  );
}

function formatValue(value, unit = "") {
  if (!Number.isFinite(value)) return "—";

  return `${value.toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
  })}${unit}`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("pt-BR");
}

function SensorCard({
  title,
  icon: Icon,
  value,
  unit,
  sensorId,
  timestamp,
  description,
}) {
  return (
    <Card>
      <div className="monitoramento-metrica">
        <div className="monitoramento-metrica__header">
          <div className="monitoramento-metrica__icon">
            <Icon size={20} />
          </div>

          <h2 className="monitoramento-metrica__title">
            {title}
          </h2>
        </div>

        <p className="monitoramento-metrica__value">
          {formatValue(value, unit)}
        </p>

        <p className="monitoramento-metrica__description">
          {description}
        </p>

        <div className="monitoramento-metrica__details">
          <div className="monitoramento-metrica__detail">
            <span>Sensor</span>
            <strong title={sensorId || ""}>
              {sensorId || "Não identificado"}
            </strong>
          </div>

          <div className="monitoramento-metrica__detail">
            <span>Última medição</span>
            <strong>{formatDate(timestamp)}</strong>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Monitoramento({
  trips = [],
  tripsLoading = false,
  tripsError,
  onRetryTrips,
}) {
  const [viagemId, setViagemId] = useState("");
  const [cargaId, setCargaId] = useState("");
  const [sessaoId, setSessaoId] = useState("");

  const [sessoes, setSessoes] = useState([]);
  const [sessoesLoading, setSessoesLoading] = useState(false);
  const [sessoesError, setSessoesError] = useState("");

  const [historico, setHistorico] = useState(null);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [historicoError, setHistoricoError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  const {
    loads,
    loading: cargasLoading,
    error: cargasError,
    retry: retryCargas,
  } = useViagemCargas(viagemId);

  useEffect(() => {
    if (!viagemId || tripsLoading || tripsError) return;

    const existe = trips.some(
      (trip) => String(trip.id) === viagemId
    );

    if (!existe) {
      setViagemId("");
      setCargaId("");
      setSessaoId("");
    }
  }, [trips, viagemId, tripsLoading, tripsError]);

  useEffect(() => {
    let active = true;

    setSessoes([]);
    setSessaoId("");
    setSessoesError("");

    if (!cargaId) {
      setSessoesLoading(false);
      return;
    }

    setSessoesLoading(true);

    listarSessoesCarga(cargaId)
      .then((data) => {
        if (active) {
          setSessoes(Array.isArray(data) ? data : []);
        }
      })
      .catch((error) => {
        if (active) {
          setSessoesError(getErrorMessage(error));
        }
      })
      .finally(() => {
        if (active) setSessoesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [cargaId, refreshKey]);

  useEffect(() => {
    let active = true;

    setHistorico(null);
    setHistoricoError("");

    if (!sessaoId) {
      setHistoricoLoading(false);
      return;
    }

    setHistoricoLoading(true);

    listarLeiturasSessao(sessaoId, {
      limit: 100,
      offset: 0,
    })
      .then((data) => {
        if (active) setHistorico(data);
      })
      .catch((error) => {
        if (active) {
          setHistoricoError(getErrorMessage(error));
        }
      })
      .finally(() => {
        if (active) setHistoricoLoading(false);
      });

    return () => {
      active = false;
    };
  }, [sessaoId, refreshKey]);

  const leituras = useMemo(
    () => normalizarLeituras(historico?.leituras ?? []),
    [historico]
  );

  const ultimaTemperatura = useMemo(
    () =>
      [...leituras]
        .reverse()
        .find((item) => item.tipo === "TEMPERATURA"),
    [leituras]
  );

  const ultimaUmidade = useMemo(
    () =>
      [...leituras]
        .reverse()
        .find((item) => item.tipo === "UMIDADE"),
    [leituras]
  );

  const sessaoSelecionada = sessoes.find(
    (sessao) => String(sessao.id) === sessaoId
  );

  function selecionarViagem(event) {
    setViagemId(event.target.value);
    setCargaId("");
    setSessaoId("");
  }

  function selecionarCarga(event) {
    setCargaId(event.target.value);
    setSessaoId("");
  }

  function atualizar() {
    if (!viagemId) {
      onRetryTrips?.();
      return;
    }

    if (!cargaId) {
      retryCargas();
      return;
    }

    setRefreshKey((value) => value + 1);
  }

  function renderConteudo() {
    if (tripsLoading) {
      return (
        <Card>
          <LoadingState message="Carregando viagens..." />
        </Card>
      );
    }

    if (tripsError) {
      return (
        <Card>
          <ErrorState
            message={tripsError}
            onRetry={onRetryTrips}
          />
        </Card>
      );
    }

    if (!trips.length) {
      return (
        <Card>
          <EmptyState
            title="Nenhuma viagem disponível"
            description="Nenhuma viagem foi retornada pela API para este usuário."
          />
        </Card>
      );
    }

    if (!viagemId) {
      return (
        <Card>
          <EmptyState
            title="Selecione uma viagem"
            description="Escolha uma viagem para consultar as cargas e os sensores."
          />
        </Card>
      );
    }

    if (cargasLoading) {
      return (
        <Card>
          <LoadingState message="Carregando cargas..." />
        </Card>
      );
    }

    if (cargasError) {
      return (
        <Card>
          <ErrorState
            message={cargasError}
            onRetry={retryCargas}
          />
        </Card>
      );
    }

    if (!loads.length) {
      return (
        <Card>
          <EmptyState
            title="Nenhuma carga disponível"
            description="Esta viagem ainda não possui cargas cadastradas."
          />
        </Card>
      );
    }

    if (!cargaId) {
      return (
        <Card>
          <EmptyState
            title="Selecione uma carga"
            description="Escolha a carga que deseja monitorar."
          />
        </Card>
      );
    }

    if (sessoesLoading) {
      return (
        <Card>
          <LoadingState message="Carregando sessões..." />
        </Card>
      );
    }

    if (sessoesError) {
      return (
        <Card>
          <ErrorState
            message={sessoesError}
            onRetry={atualizar}
          />
        </Card>
      );
    }

    if (!sessoes.length) {
      return (
        <Card>
          <EmptyState
            title="Nenhuma sessão disponível"
            description="Esta carga ainda não possui sessões de monitoramento."
          />
        </Card>
      );
    }

    if (!sessaoId) {
      return (
        <Card>
          <EmptyState
            title="Selecione uma sessão"
            description="Escolha uma sessão para consultar o histórico IoT."
          />
        </Card>
      );
    }

    if (historicoLoading) {
      return (
        <Card>
          <LoadingState message="Carregando leituras..." />
        </Card>
      );
    }

    if (historicoError) {
      return (
        <Card>
          <ErrorState
            message={historicoError}
            onRetry={atualizar}
          />
        </Card>
      );
    }

    if (!leituras.length) {
      return (
        <Card>
          <EmptyState
            title="Nenhuma leitura disponível"
            description="Não foram encontradas medições utilizáveis nesta consulta."
          />
        </Card>
      );
    }

    return (
      <>
        <div className="monitoramento-page__comparisons">
          <SensorCard
            title="Temperatura"
            icon={Thermometer}
            value={ultimaTemperatura?.valor}
            unit={ultimaTemperatura?.unidade || " °C"}
            sensorId={ultimaTemperatura?.sensorId}
            timestamp={ultimaTemperatura?.timestamp}
            description="Última temperatura registrada na sessão."
          />

          <SensorCard
            title="Umidade"
            icon={Droplets}
            value={ultimaUmidade?.valor}
            unit={ultimaUmidade?.unidade || "%"}
            sensorId={ultimaUmidade?.sensorId}
            timestamp={ultimaUmidade?.timestamp}
            description="Última umidade registrada na sessão."
          />
        </div>

        <Card>
          <div className="monitoramento-sessao">
            <div className="monitoramento-sessao__heading">
              <div className="monitoramento-sessao__icon">
                <Activity size={20} />
              </div>

              <div>
                <h2>Informações da sessão</h2>
                <p>
                  Dados do monitoramento selecionado
                </p>
              </div>
            </div>

            <div className="monitoramento-sessao__grid">
              <div className="monitoramento-sessao__item">
                <span>Produto</span>
                <strong>
                  {sessaoSelecionada?.produto_identificado ||
                    "Não informado"}
                </strong>
              </div>

              <div className="monitoramento-sessao__item">
                <span>Estado</span>
                <strong>
                  {sessaoSelecionada?.estado ||
                    "Não informado"}
                </strong>
              </div>

              <div className="monitoramento-sessao__item">
                <span>Início</span>
                <strong>
                  {formatDate(sessaoSelecionada?.inicio)}
                </strong>
              </div>

              <div className="monitoramento-sessao__item">
                <span>Leituras consultadas</span>
                <strong>{leituras.length}</strong>
              </div>
            </div>
          </div>
        </Card>

        <p className="monitoramento-page__note">
          As medições são provenientes do histórico IoT da
          sessão. A comparação Ambiente × Produto depende
          da identificação dos sensores em cada contexto.
          A validade operacional das leituras ainda precisa
          ser confirmada.
        </p>
      </>
    );
  }

  return (
    <div className="monitoramento-page">
      <div className="monitoramento-page__heading">
        <span className="monitoramento-page__eyebrow">
          Telemetria IoT
        </span>

        <h1 className="page-title">
          Ambiente × Produto
        </h1>

        <p className="monitoramento-page__description">
          Acompanhe as condições registradas pelos sensores
          durante o transporte das cargas.
        </p>
      </div>

      <Card>
        <div className="monitoramento-filtros">
          <div className="monitoramento-filtros__campo">
            <label htmlFor="monitoramento-viagem">
              <Truck size={16} />
              Viagem
            </label>

            <select
              id="monitoramento-viagem"
              className="monitoramento-filtros__select"
              value={viagemId}
              onChange={selecionarViagem}
              disabled={tripsLoading}
            >
              <option value="">
                Selecione uma viagem
              </option>

              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.code || "Viagem"} —{" "}
                  {trip.origin || "Origem não informada"}
                  {" → "}
                  {trip.destination || "Destino não informado"}
                </option>
              ))}
            </select>
          </div>

          <div className="monitoramento-filtros__campo">
            <label htmlFor="monitoramento-carga">
              <Package size={16} />
              Carga
            </label>

            <select
              id="monitoramento-carga"
              className="monitoramento-filtros__select"
              value={cargaId}
              onChange={selecionarCarga}
              disabled={!viagemId || cargasLoading}
            >
              <option value="">
                Selecione uma carga
              </option>

              {loads.map((load) => (
                <option key={load.id} value={load.id}>
                  {load.code || "Carga"} —{" "}
                  {load.variety || "Produto não informado"}
                </option>
              ))}
            </select>
          </div>

          <div className="monitoramento-filtros__campo">
            <label htmlFor="monitoramento-sessao">
              <CalendarClock size={16} />
              Sessão
            </label>

            <select
              id="monitoramento-sessao"
              className="monitoramento-filtros__select"
              value={sessaoId}
              onChange={(event) =>
                setSessaoId(event.target.value)
              }
              disabled={!cargaId || sessoesLoading}
            >
              <option value="">
                Selecione uma sessão
              </option>

              {sessoes.map((sessao) => (
                <option key={sessao.id} value={sessao.id}>
                  {sessao.produto_identificado ||
                    "Monitoramento"}
                  {" — "}
                  {sessao.estado || "Sem estado"}
                  {" — "}
                  {formatDate(sessao.inicio)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="button button--primary monitoramento-filtros__refresh"
            onClick={atualizar}
            disabled={
              tripsLoading ||
              cargasLoading ||
              sessoesLoading ||
              historicoLoading
            }
            title="Atualizar monitoramento"
          >
            <RefreshCw size={17} />
            Atualizar
          </button>
        </div>
      </Card>

      <div className="monitoramento-conteudo">
        {renderConteudo()}
      </div>
    </div>
  );
}
