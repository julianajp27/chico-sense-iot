
import { useEffect, useState } from "react";
import {
  Building2,
  Thermometer,
  Radio,
  RefreshCw,
  UserRound,
} from "lucide-react";

import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";
import EmptyState from "../../components/UI/EmptyState";
import LoadingState from "../../components/UI/LoadingState";

import { listarCargas } from "../../services/viagemService";
import { obterMonitoramentoCarga } from "../../services/cargaService";
import { listarLeituras } from "../../services/sensorService";

const sections = [
  {
    value: "organization",
    label: "Perfil e organização",
    icon: Building2,
  },
  {
    value: "limits",
    label: "Limites de monitoramento",
    icon: Thermometer,
  },
  {
    value: "integrations",
    label: "Integrações",
    icon: Radio,
  },
];

const profileLabels = {
  produtor: "Produtor",
  logistica: "Logística",
  cliente: "Cliente / Mercado",
};

function display(value) {
  return value === null ||
    value === undefined ||
    value === ""
    ? "Não informado"
    : String(value);
}

function formatDate(value) {
  if (!value) return "Não informado";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Recife",
  }).format(date);
}

export default function Configuracoes({
  user,
  profile,
  trips = [],
  organization,
  onSaveOrganization,
}) {
  const [section, setSection] = useState("organization");

  return (
    <div className="settings-page">
      <div className="settings-page__heading">
        <span className="settings-page__eyebrow">
          WORKSPACE
        </span>

        <h1 className="page-title">Configurações</h1>

        <p className="settings-page__description">
          Gerencie seu perfil e consulte as configurações
          e integrações do ChicoSense.
        </p>
      </div>

      <div className="settings-page__layout">
        <nav
          className="settings-page__nav"
          aria-label="Seções de configurações"
        >
          {sections.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.value}
                type="button"
                className={`settings-page__nav-button ${
                  section === item.value
                    ? "settings-page__nav-button--active"
                    : ""
                }`}
                aria-current={
                  section === item.value ? "page" : undefined
                }
                onClick={() => setSection(item.value)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="settings-page__content">
          {section === "organization" && (
            <>
              <Card
                title="Perfil atual"
                description="Informações do usuário autenticado."
              >
                <div className="settings-page__profile-header">
                  <span className="settings-page__profile-avatar">
                    <UserRound size={25} />
                  </span>

                  <div>
                    <h2>{display(user?.name)}</h2>
                    <p>{display(user?.email)}</p>
                  </div>
                </div>

                <dl className="settings-page__profile">
                  <div>
                    <dt>Usuário</dt>
                    <dd>{display(user?.name)}</dd>
                  </div>

                  <div>
                    <dt>E-mail</dt>
                    <dd>{display(user?.email)}</dd>
                  </div>

                  <div>
                    <dt>Perfil selecionado</dt>
                    <dd>
                      {profileLabels[profile] ||
                        display(profile)}
                    </dd>
                  </div>
                </dl>
              </Card>

              <OrganizationForm
                key={JSON.stringify([
                  organization?.id,
                  organization?.name,
                  organization?.responsible,
                  organization?.email,
                ])}
                organization={organization}
                onSave={onSaveOrganization}
              />
            </>
          )}

          {section === "limits" && (
            <MonitoringSettings trips={trips} />
          )}

          {section === "integrations" && (
            <IntegrationsSettings />
          )}
        </div>
      </div>
    </div>
  );
}

function OrganizationForm({ organization, onSave }) {
  const [name, setName] = useState(
    organization?.name ?? ""
  );

  const [responsible, setResponsible] = useState(
    organization?.responsible ?? ""
  );

  const [email, setEmail] = useState(
    organization?.email ?? ""
  );

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const canSave = typeof onSave === "function";

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canSave || saving) return;

    setSaving(true);
    setFeedback(null);

    try {
      await onSave({
        name: name.trim(),
        responsible: responsible.trim(),
        email: email.trim(),
      });

      setFeedback({
        type: "success",
        message: "Informações salvas com sucesso.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Não foi possível salvar as informações.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card
      title="Organização"
      description="Informações administrativas da organização."
    >
      {!canSave && (
        <p className="settings-page__notice">
          A edição da organização ainda não está
          disponível. Os dados não serão enviados
          ao backend até que a integração de
          salvamento seja implementada.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="settings-page__form-grid">
          <Input
            label="Nome da organização"
            name="organizationName"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setFeedback(null);
            }}
            disabled={saving || !canSave}
            required
          />

          <Input
            label="Responsável"
            name="organizationResponsible"
            value={responsible}
            onChange={(event) => {
              setResponsible(event.target.value);
              setFeedback(null);
            }}
            disabled={saving || !canSave}
            required
          />

          <Input
            label="E-mail da organização"
            name="organizationEmail"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setFeedback(null);
            }}
            disabled={saving || !canSave}
            required
          />
        </div>

        <div className="settings-page__form-actions">
          <Button
            type="submit"
            disabled={!canSave || saving}
            loading={saving}
          >
            Salvar alterações
          </Button>
        </div>

        {feedback && (
          <p
            className={`settings-page__feedback settings-page__feedback--${feedback.type}`}
            role={
              feedback.type === "error"
                ? "alert"
                : "status"
            }
          >
            {feedback.message}
          </p>
        )}
      </form>
    </Card>
  );
}

function MonitoringSettings({ trips }) {
  const [tripId, setTripId] = useState("");
  const [loadId, setLoadId] = useState("");
  const [loads, setLoads] = useState([]);
  const [configuration, setConfiguration] = useState(null);
  const [loadingLoads, setLoadingLoads] = useState(false);
  const [loadingConfiguration, setLoadingConfiguration] =
    useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    setLoads([]);
    setLoadId("");
    setConfiguration(null);
    setError("");

    if (!tripId) return;

    async function fetchLoads() {
      setLoadingLoads(true);

      try {
        const data = await listarCargas(tripId);

        if (active) {
          setLoads(Array.isArray(data) ? data : []);
        }
      } catch {
        if (active) {
          setError(
            "Não foi possível consultar as cargas da viagem."
          );
        }
      } finally {
        if (active) setLoadingLoads(false);
      }
    }

    fetchLoads();

    return () => {
      active = false;
    };
  }, [tripId]);

  useEffect(() => {
    let active = true;

    setConfiguration(null);
    setError("");

    if (!loadId) return;

    async function fetchConfiguration() {
      setLoadingConfiguration(true);

      try {
        const data = await obterMonitoramentoCarga(loadId);

        if (active) {
          setConfiguration(data);
        }
      } catch {
        if (active) {
          setError(
            "Não foi possível consultar a configuração da carga."
          );
        }
      } finally {
        if (active) {
          setLoadingConfiguration(false);
        }
      }
    }

    fetchConfiguration();

    return () => {
      active = false;
    };
  }, [loadId]);

  return (
    <Card
      title="Configurações de monitoramento"
      description="Consulte as configurações registradas para cada carga."
    >
      <div className="settings-page__selectors">
        <div className="settings-page__field">
          <label htmlFor="settings-trip">
            Viagem
          </label>

          <select
            id="settings-trip"
            value={tripId}
            onChange={(event) =>
              setTripId(event.target.value)
            }
          >
            <option value="">
              Selecione uma viagem
            </option>

            {trips.map((trip) => (
              <option
                key={trip.id}
                value={String(trip.id)}
              >
                {trip.code || trip.id}
              </option>
            ))}
          </select>
        </div>

        <div className="settings-page__field">
          <label htmlFor="settings-load">
            Carga
          </label>

          <select
            id="settings-load"
            value={loadId}
            onChange={(event) =>
              setLoadId(event.target.value)
            }
            disabled={!tripId || loadingLoads}
          >
            <option value="">
              Selecione uma carga
            </option>

            {loads.map((load) => (
              <option
                key={load.id}
                value={String(load.id)}
              >
                {load.code || load.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(loadingLoads || loadingConfiguration) && (
        <LoadingState message="Consultando configurações..." />
      )}

      {error && (
        <p
          className="settings-page__feedback settings-page__feedback--error"
          role="alert"
        >
          {error}
        </p>
      )}

      {!tripId && !loadingLoads && (
        <EmptyState
          title="Selecione uma viagem"
          description="Escolha uma viagem para consultar suas cargas e configurações."
        />
      )}

      {tripId &&
        !loadingLoads &&
        loads.length === 0 &&
        !error && (
          <EmptyState
            title="Nenhuma carga encontrada"
            description="Esta viagem não possui cargas disponíveis."
          />
        )}

      {tripId &&
        loads.length > 0 &&
        !loadId &&
        !loadingLoads && (
          <EmptyState
            title="Selecione uma carga"
            description="Escolha uma carga para visualizar suas configurações."
          />
        )}

      {loadId &&
        !loadingConfiguration &&
        !configuration &&
        !error && (
          <EmptyState
            title="Configuração não encontrada"
            description="Não há configuração de monitoramento registrada para esta carga."
          />
        )}

      {configuration && !loadingConfiguration && (
        <>
          <dl className="settings-page__profile">
            <div>
              <dt>Pré-resfriamento</dt>
              <dd>
                {configuration.precooling === true
                  ? "Realizado"
                  : configuration.precooling === false
                    ? "Não realizado"
                    : "Não informado"}
              </dd>
            </div>

            <div>
              <dt>Embarque registrado</dt>
              <dd>
                {formatDate(
                  configuration.boardingRecordedAt
                )}
              </dd>
            </div>

            <div>
              <dt>Intervalo de amostragem</dt>
              <dd>
                {configuration.samplingInterval != null
                  ? `${configuration.samplingInterval} minutos`
                  : "Não informado"}
              </dd>
            </div>

            <div>
              <dt>Orientações de conservação</dt>
              <dd>
                {display(
                  configuration.conservationGuidance
                )}
              </dd>
            </div>
          </dl>

          <p className="settings-page__notice">
            Os limites de temperatura e umidade
            ainda não estão disponíveis no
            mapeamento atual da API. Esta consulta
            apresenta apenas as configurações
            efetivamente retornadas pelo serviço.
          </p>
        </>
      )}
    </Card>
  );
}

function IntegrationsSettings() {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [consulted, setConsulted] = useState(false);

  async function checkIntegration() {
    setLoading(true);
    setError("");

    try {
      const data = await listarLeituras();

      setReadings(Array.isArray(data) ? data : []);
    } catch {
      setError(
        "Não foi possível consultar a integração ThingSpeak."
      );
      setReadings([]);
    } finally {
      setLoading(false);
      setConsulted(true);
    }
  }

  useEffect(() => {
    checkIntegration();
  }, []);

  const latest = [...readings]
    .filter((reading) => reading.timestamp)
    .sort(
      (a, b) =>
        new Date(b.timestamp) -
        new Date(a.timestamp)
    )[0];

  return (
    <Card
      title="Integração com sensores"
      description="Consulta de leituras recebidas pelo backend."
    >
      <div className="settings-page__integration-header">
        <div className="settings-page__integration-info">
          <Radio size={22} />

          <div>
            <strong>ThingSpeak</strong>
            <span>
              Integração de dados de sensores
            </span>
          </div>
        </div>

        <Button
          variant="secondary"
          onClick={checkIntegration}
          disabled={loading}
        >
          <RefreshCw size={15} />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <LoadingState message="Consultando sensores..." />
      ) : error ? (
        <p
          className="settings-page__feedback settings-page__feedback--error"
          role="alert"
        >
          {error}
        </p>
      ) : consulted ? (
        <>
          <dl className="settings-page__profile">
            <div>
              <dt>Consulta ao backend</dt>
              <dd>Realizada com sucesso</dd>
            </div>

            <div>
              <dt>Registros retornados</dt>
              <dd>{readings.length}</dd>
            </div>

            <div>
              <dt>Última leitura retornada</dt>
              <dd>
                {latest
                  ? formatDate(latest.timestamp)
                  : "Nenhuma leitura disponível"}
              </dd>
            </div>

            <div>
              <dt>Temperatura</dt>
              <dd>
                {latest?.temperature != null
                  ? `${latest.temperature} °C`
                  : "Não informada"}
              </dd>
            </div>

            <div>
              <dt>Umidade</dt>
              <dd>
                {latest?.humidity != null
                  ? `${latest.humidity} %`
                  : "Não informada"}
              </dd>
            </div>
          </dl>

          <p className="settings-page__notice">
            Uma consulta bem-sucedida confirma
            que o backend respondeu à solicitação.
            Isso não garante que os sensores
            estejam conectados em tempo real.
          </p>
        </>
      ) : null}
    </Card>
  );
}
