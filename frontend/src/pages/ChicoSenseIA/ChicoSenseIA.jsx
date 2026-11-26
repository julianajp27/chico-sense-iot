import { useState } from "react";

import {
  Activity,
  ArrowRight,
  Bell,
  BrainCircuit,
  CalendarDays,
  Cloud,
  Database,
  Info,
  MapPinned,
  Sparkles,
  Thermometer,
} from "lucide-react";

import Card from "../../components/UI/Card";
import EmptyState from "../../components/UI/EmptyState";
import ErrorState from "../../components/UI/ErrorState";
import LoadingState from "../../components/UI/LoadingState";
import CentralInteligenciaIA from "../../components/Cards/CentralInteligenciaIA";

const levels = {
  low: {
    label: "Risco baixo",
    className: "ia-page__risk--low",
  },
  moderate: {
    label: "Risco moderado",
    className: "ia-page__risk--moderate",
  },
  high: {
    label: "Risco alto",
    className: "ia-page__risk--high",
  },
};

const flowSteps = [
  { label: "Sensores IoT", icon: Activity },
  { label: "Backend / API", icon: Cloud },
  { label: "Banco de Dados", icon: Database },
  { label: "ChicoSense IA", icon: BrainCircuit },
  { label: "Dashboard", icon: Activity },
  { label: "Alertas e decisões", icon: Bell },
];

function formatDate(value) {
  if (!value) return null;

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Recife",
  }).format(date);
}

function getTripLabel(trip) {
  return (
    trip.nome ||
    trip.codigo ||
    trip.origem ||
    `Viagem ${String(trip.id).slice(0, 8)}`
  );
}

export default function ChicoSenseIA({
  trips = [],
  tripsLoading = false,
  tripsError = "",
  onRetryTrips,
  connected = false,
  analysis,
  loading = false,
  error,
  onRetry,
}) {
  const [selectedTripId, setSelectedTripId] =
    useState("");

  const [showExplanation, setShowExplanation] =
    useState(false);

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [product, setProduct] = useState("");

  const currentTripId = trips.some(
    (trip) =>
      String(trip.id) === String(selectedTripId)
  )
    ? selectedTripId
    : trips.length
      ? String(trips[0].id)
      : "";

  const analysisMatchesTrip =
    analysis &&
    (!analysis.viagemId ||
      String(analysis.viagemId) === currentTripId);

  const currentAnalysis =
    connected && analysisMatchesTrip
      ? analysis
      : null;

  const level = levels[currentAnalysis?.level];

  const hasScore =
    typeof currentAnalysis?.score === "number" &&
    Number.isFinite(currentAnalysis.score) &&
    currentAnalysis.score >= 0 &&
    currentAnalysis.score <= 100;

  const hasAnalysis = Boolean(
    level &&
      hasScore &&
      typeof currentAnalysis?.summary === "string" &&
      currentAnalysis.summary.trim()
  );

  const factors = Array.isArray(
    currentAnalysis?.factors
  )
    ? currentAnalysis.factors
    : [];

  const insights = Array.isArray(
    currentAnalysis?.insights
  )
    ? currentAnalysis.insights
    : [];

  const generatedAt = formatDate(
    currentAnalysis?.generatedAt
  );

  const isLoading = tripsLoading || loading;
  const currentError = tripsError || error;

  return (
    <div className="ia-page">

      {/* Cabeçalho original */}

      <div className="ia-page__heading">
        <div>
          <span className="ia-page__eyebrow">
            Assistente de apoio à decisão
          </span>

          <h1 className="page-title">
            ChicoSense IA
          </h1>

          <p className="ia-page__description">
            Inteligência preventiva para apoiar o
            acompanhamento e a tomada de decisões.
          </p>
        </div>
      </div>

      {/* IA integrada ao sensor real */}

      <CentralInteligenciaIA />

      {/* Área original preservada */}

      <details className="central-ia__secao">
        <summary>
          Análise por viagem e planejamento
        </summary>

        <div
          className="central-ia__conteudo"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div className="ia-page__notice">
            <Info size={18} aria-hidden="true" />

            <span>
              Esta seção contém as funcionalidades
              originais de análise por viagem e
              planejamento. Elas são independentes
              da detecção experimental de anomalias
              ambientais apresentada acima.
            </span>
          </div>

          {/* Seletor de viagem */}

          <div className="ia-page__trip-select">
            <label htmlFor="ia-viagem">
              Viagem
            </label>

            <select
              id="ia-viagem"
              value={currentTripId}
              onChange={(event) => {
                setSelectedTripId(
                  event.target.value
                );

                setShowExplanation(false);
              }}
              disabled={
                tripsLoading || !trips.length
              }
            >
              {!trips.length ? (
                <option value="">
                  Nenhuma viagem disponível
                </option>
              ) : (
                trips.map((trip) => (
                  <option
                    key={trip.id}
                    value={trip.id}
                  >
                    {getTripLabel(trip)}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Aviso original */}

          <div className="ia-page__notice">
            <Info size={18} aria-hidden="true" />

            <span>
              A IA não controla o veículo nem a
              refrigeração. Suas recomendações são
              de apoio à decisão e não representam
              garantia de conservação.
            </span>
          </div>

          {/* Painel principal original */}

          <Card>
            <div className="ia-page__hero">
              <div className="ia-page__hero-icon">
                <Sparkles
                  size={28}
                  aria-hidden="true"
                />
              </div>

              <div className="ia-page__hero-content">
                <span className="ia-page__integration-status">
                  {connected && hasAnalysis
                    ? "Análise disponível"
                    : "Integração com IA pendente"}
                </span>

                <h2>
                  {hasAnalysis
                    ? currentAnalysis.summary
                    : "Inteligência artificial em preparação"}
                </h2>

                <p>
                  {hasAnalysis
                    ? "Resultado disponibilizado pelo serviço de inteligência artificial."
                    : "Esta área apresentará avaliações de risco, recomendações e análises preventivas quando o serviço de IA estiver integrado ao ChicoSense."}
                </p>

                {hasAnalysis && (
                  <div className="ia-page__hero-actions">
                    <span
                      className={`ia-page__risk ${level.className}`}
                    >
                      {level.label}
                    </span>

                    <strong>
                      {currentAnalysis.score}/100
                    </strong>

                    {currentAnalysis.explanation && (
                      <button
                        type="button"
                        className="ia-page__action-button"
                        onClick={() =>
                          setShowExplanation(
                            (value) => !value
                          )
                        }
                      >
                        Por que esta recomendação?
                      </button>
                    )}
                  </div>
                )}

                {showExplanation &&
                  currentAnalysis?.explanation && (
                    <div className="ia-page__explanation">
                      <h3>Explicação da análise</h3>

                      <p>
                        {currentAnalysis.explanation}
                      </p>
                    </div>
                  )}

                {generatedAt && hasAnalysis && (
                  <p className="ia-page__timestamp">
                    Análise gerada em {generatedAt}.
                  </p>
                )}
              </div>

              <div className="ia-page__hero-side">
                <h3>Principais fatores</h3>

                {hasAnalysis && factors.length ? (
                  <ul className="ia-page__factor-list">
                    {factors.map((factor, index) => (
                      <li key={factor.id ?? index}>
                        <strong>
                          {factor.title}
                        </strong>

                        {factor.description && (
                          <span>
                            {factor.description}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="ia-page__pending">
                    <BrainCircuit size={23} />

                    <p>
                      Aguardando fatores calculados
                      pela IA.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Erros e carregamento */}

          {isLoading && (
            <Card>
              <LoadingState
                message="Carregando informações..."
              />
            </Card>
          )}

          {currentError && (
            <Card>
              <ErrorState
                message={currentError}
                onRetry={
                  tripsError
                    ? onRetryTrips
                    : onRetry
                }
              />
            </Card>
          )}

          {/* Alertas e planejamento originais */}

          <div className="ia-page__details">
            <Card
              title="Alertas preventivos"
              description="Análises antes de ultrapassar limites."
              action={
                <span className="ia-page__integration-status">
                  {hasAnalysis
                    ? `${insights.length} insights`
                    : "Em preparação"}
                </span>
              }
            >
              {hasAnalysis && insights.length ? (
                <ul className="ia-page__list">
                  {insights.map((insight, index) => (
                    <li
                      key={insight.id ?? index}
                      className="ia-page__item"
                    >
                      <div className="ia-page__insight-icon">
                        <Thermometer size={19} />
                      </div>

                      <div>
                        <h3>{insight.title}</h3>

                        {insight.description && (
                          <p>
                            {insight.description}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title="Nenhum insight disponível"
                  description="Os alertas preventivos serão exibidos quando a IA estiver integrada."
                />
              )}
            </Card>

            <Card
              title="Planejamento Inteligente"
              description="Preparação para recomendações de transporte."
              action={<CalendarDays size={20} />}
            >
              <div className="ia-page__planning">
                <div className="ia-page__planning-field">
                  <label htmlFor="ia-origem">
                    Origem
                  </label>

                  <input
                    id="ia-origem"
                    type="text"
                    placeholder="Cidade de origem"
                    value={origin}
                    onChange={(event) =>
                      setOrigin(event.target.value)
                    }
                  />
                </div>

                <div className="ia-page__planning-field">
                  <label htmlFor="ia-destino">
                    Destino
                  </label>

                  <input
                    id="ia-destino"
                    type="text"
                    placeholder="Cidade de destino"
                    value={destination}
                    onChange={(event) =>
                      setDestination(
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="ia-page__planning-field">
                  <label htmlFor="ia-produto">
                    Produto
                  </label>

                  <input
                    id="ia-produto"
                    type="text"
                    placeholder="Produto transportado"
                    value={product}
                    onChange={(event) =>
                      setProduct(event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="ia-page__planning-placeholder">
                <MapPinned size={24} />

                <div>
                  <strong>
                    Planejamento inteligente em
                    desenvolvimento
                  </strong>

                  <p>
                    A comparação de horários e
                    riscos será disponibilizada após
                    a integração com o modelo de
                    inteligência artificial.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Fluxo tecnológico original */}

          <Card
            title="Como os dados geram inteligência"
            description="Fluxo tecnológico conceitual do ChicoSense."
          >
            <div className="ia-page__flow">
              {flowSteps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <div
                    className="ia-page__flow-step"
                    key={step.label}
                  >
                    <span className="ia-page__flow-icon">
                      <Icon size={20} />
                    </span>

                    <span>{step.label}</span>

                    {index <
                      flowSteps.length - 1 && (
                      <ArrowRight
                        size={16}
                        className="ia-page__flow-arrow"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <p className="ia-page__flow-note">
              O fluxo representa a arquitetura
              planejada. A análise automatizada
              depende da integração futura com
              o serviço de IA.
            </p>
          </Card>
        </div>
      </details>
    </div>
  );
}