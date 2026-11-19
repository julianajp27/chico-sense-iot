import Card from "../UI/Card";

export default function MetricCard({
  title,
  value,
  description,
  icon,
  tone      = "neutral",
  className = "",
}) {
  return (
    <Card className={`metric-card metric-card--${tone} ${className}`.trim()}>
      <div className="metric-card__top">
        <h2 className="metric-card__title">{title}</h2>

        {icon && (
          <span
            className={`metric-card__icon metric-card__icon--${tone}`}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>

      <p className="metric-card__value">{value ?? "—"}</p>

      {description && (
        <p className="metric-card__description">{description}</p>
      )}
    </Card>
  );
}