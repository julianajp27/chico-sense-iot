export default function EmptyState({
  title       = "Nenhum registro encontrado",
  description = "Os dados aparecerão aqui quando estiverem disponíveis.",
  action,
}) {
  return (
    <div className   ="feedback-state">
      <h3 className  ="feedback-state__title">{title}</h3>

      <p className   ="feedback-state__description">
        {description}
      </p>
      {action && (
        <div className ="feedback-state__action">
          {action}
        </div>
      )}
    </div>
  );
}