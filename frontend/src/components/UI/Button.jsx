export default function Button({
  children,
  variant   = "primary",
  type      = "button",
  disabled  = false,
  loading   = false,
  className = "",
  ...props
}) {
  return (
    <button
                {...props}
      type=     {type}
      disabled ={disabled || loading}
      aria-busy={loading || undefined}
      className={`button button--${variant} ${className}`.trim()}
    >
      {loading && (<span className="button__spinner" aria-hidden="true" />)}

      {loading ? "Aguarde…" : children}
    </button>
  );
}