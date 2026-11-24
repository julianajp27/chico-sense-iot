export default function Card({
  title,
  description,
  action,
  children,
  className = "",
  ...props
}) {
  const hasHeader = title || description || action;

  return (
    <section
        {...props}
      className            ={`card ${className}`.trim()}
    >
      {hasHeader && (
        <div className     ="card__header">
          <div className   ="card__heading">
            {title && <h2 className="card__title">{title}</h2>}

            {description && (
              <p className ="card__description">{description}</p>
            )}
          </div>

          {action && (
            <div className ="card__action">{action}</div>
          )}
        </div>
      )}

      <div className       ="card__content">{children}</div>
    </section>
  );
}