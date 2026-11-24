import { useId } from "react";

export default function Select({
  label,
  id,
  options   = [],
  placeholder,
  error,
  hint,
  className = "",
  ...props
}) {
  const generatedId   = useId();
  const selectId      = id ?? generatedId;
  const messageId     = `${selectId}-message`;
  const message       = error || hint;

  return (
    <div className    ="form-field">
      <label className="form-field__label" htmlFor={selectId}>
        {label}
      </label>

      <select
        {...props}
        id={selectId}
        className={`input select ${className}`.trim()}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

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