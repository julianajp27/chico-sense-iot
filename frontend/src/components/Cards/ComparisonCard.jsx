import Card from "../UI/Card";

function formatValue(value, unit) {
  if (!Number.isFinite(value)) return "—";

  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(value)}${unit}`;
}

function formatDifference(environment, product, unit) {
  if (
    !Number.isFinite(environment) ||
    !Number.isFinite(product)
  ) {
    return "Diferença indisponível";
  }

  const difference = product - environment;

  const formatted = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    signDisplay: "exceptZero",
  }).format(difference);

  return `Produto − ambiente: ${formatted}${unit}`;
}

export default function ComparisonCard({
  title,
  icon,
  environmentValue,
  productValue,
  unit,
  differenceUnit = unit,
}) {
  return (
    <Card
      title={title}
      description={formatDifference(
        environmentValue,
        productValue,
        differenceUnit
      )}
      action={
        icon ? (
          <span className="comparison-card__icon" aria-hidden="true">
            {icon}
          </span>
        ) : undefined
      }
    >
      <dl className="comparison-card__values">
        <div className="comparison-card__measurement">
          <dt>Ambiente refrigerado</dt>
          <dd>{formatValue(environmentValue, unit)}</dd>
        </div>

        <div className="comparison-card__measurement">
          <dt>Próximo ao produto</dt>
          <dd>{formatValue(productValue, unit)}</dd>
        </div>
      </dl>
    </Card>
  );
}