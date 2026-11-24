import { useId } from "react";

export default function Input({
  label,
  id,
  type      = "text",
  error,
  hint,
  className = "",
  ...props
}) {
  const generatedId   = useId();
  const inputId       = id ?? generatedId;
  const messageId     = `${inputId}-message`;
  const message       = error || hint;

  return (
    <div className    ="form-field">
      <label className="form-field__label" htmlFor={inputId}>
        {label}
      </label>

      <input
        {...props}
        id=              {inputId}
        type=            {type}
        className=       {`input ${className}`.trim()}
        aria-invalid=    {error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
      />

      {message && (
        <span
          id={messageId}
          className={error ? "form-field__error" : "form-field__hint"}
        >
          {message}
        </span>
      )}
    </div>
  );
}