const statusConfig = {
  normal: {
    label:     "Normal",
    className: "status-badge--normal",
  },
  attention: {
    label:     "Atenção",
    className: "status-badge--attention",
  },
  critical: {
    label:     "Crítico",
    className: "status-badge--critical",
  },
  offline: {
    label:     "Offline",
    className: "status-badge--offline",
  },
};

export default function StatusBadge({
  status =    "offline",
  className = "",
}) {
  const config = statusConfig[status] ?? {
    label:     "Desconhecido",
    className: "status-badge--offline",
  };

  return (
    <span
      className={`status-badge ${config.className} ${className}`.trim()}
    >
      <span className="status-badge__dot" aria-hidden="true" />
      {config.label}
    </span>
  );
}