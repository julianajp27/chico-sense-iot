
import {
  CheckCircle,
  Info,
  TriangleAlert,
} from "lucide-react";

const severityConfig = {
  info: {
    label: "Informação",
    icon: Info,
  },
  warning: {
    label: "Atenção",
    icon: TriangleAlert,
  },
  critical: {
    label: "Crítico",
    icon: TriangleAlert,
  },
};

const statusLabels = {
  new: "Novo",
  monitoring: "Em acompanhamento",
  resolved: "Normalizado",
};

function formatDate(value) {
  if (!value) return "Não informado";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Recife",
  }).format(date);
}

function formatValue(value, unidade) {
  if (value === null || value === undefined || value === "") {
    return "Não informado";
  }

  const numero = Number(value);

  const valor = Number.isFinite(numero)
    ? new Intl.NumberFormat("pt-BR", {
        maximumFractionDigits: 2,
      }).format(numero)
    : String(value);

  return `${valor}${unidade ? ` ${unidade}` : ""}`;
}

function getReference(alert) {
  if (alert.reference) return alert.reference;

  if (alert.cargaNome) return alert.cargaNome;

  if (alert.cargaId) {
    return `Carga ${String(alert.cargaId).slice(0, 8)}`;
  }

  if (alert.sessaoId) {
    return `Sessão ${String(alert.sessaoId).slice(0, 8)}`;
  }

  return "Não informada";
}

export default function AlertItem({ alert }) {
  const severity = severityConfig[alert.severity] ??
    severityConfig.info;

  const status = statusLabels[alert.status] ??
    "Situação não informada";

  const Icon =
    alert.status === "resolved"
      ? CheckCircle
      : severity.icon;

  const iconType =
    alert.status === "resolved"
      ? "resolved"
      : severityConfig[alert.severity]
        ? alert.severity
        : "info";

  const titulo =
    alert.title ??
    alert.titulo ??
    "Ocorrência sem título";

  const descricao =
    alert.description ??
    alert.descricao;

  const valorRegistrado =
    alert.recordedValue ??
    formatValue(alert.valor, alert.unidade);

  const dataOcorrencia =
    alert.occurredAt ??
    alert.timestamp ??
    alert.createdAt;

  return (
    <li className="alert-item">
      <span
        className={`alert-item__icon alert-item__icon--${iconType}`}
        aria-hidden="true"
      >
        <Icon size={22} />
      </span>

      <div className="alert-item__content">
        <div className="alert-item__labels">
          <span className="alert-item__status">
            {status}
          </span>

          <span className="alert-item__severity">
            {severity.label}
          </span>
        </div>

        <h2 className="alert-item__title">
          {titulo}
        </h2>

        {descricao && (
          <p className="alert-item__description">
            {descricao}
          </p>
        )}

        <dl className="alert-item__details">
          <div>
            <dt>Referência</dt>
            <dd>{getReference(alert)}</dd>
          </div>

          <div>
            <dt>Valor registrado</dt>
            <dd>{valorRegistrado}</dd>
          </div>

          <div>
            <dt>Data e hora</dt>
            <dd>{formatDate(dataOcorrencia)}</dd>
          </div>

          {(alert.minimo !== null &&
            alert.minimo !== undefined) ||
          (alert.maximo !== null &&
            alert.maximo !== undefined) ? (
            <div>
              <dt>Limites configurados</dt>
              <dd>
                {alert.minimo != null
                  ? formatValue(alert.minimo, alert.unidade)
                  : "—"}
                {" até "}
                {alert.maximo != null
                  ? formatValue(alert.maximo, alert.unidade)
                  : "—"}
              </dd>
            </div>
          ) : null}

          {alert.status === "resolved" &&
            alert.normalizadoEm && (
              <div>
                <dt>Normalizado em</dt>
                <dd>{formatDate(alert.normalizadoEm)}</dd>
              </div>
            )}
        </dl>
      </div>
    </li>
  );
}
