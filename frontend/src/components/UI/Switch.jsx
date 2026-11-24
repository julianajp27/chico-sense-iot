import { useId } from "react";

export default function Switch({
  label,
  id,
  className = "",
  disabled  = false,
  ...props
}) {
  const generatedId = useId();
  const switchId    = id ?? generatedId;

  return (
    <label
      htmlFor   ={switchId}
      className ={`switch-field ${
        disabled ? "switch-field--disabled" : ""
      } ${className}`.trim()}
    >
      <span className="switch-field__label">{label}</span>

      <span className="switch-field__control">
        <input
          {...props}
          id=      {switchId}
          type=    "checkbox"
          role=    "switch"
          disabled={disabled}
          className="switch-field__input"
        />

        <span
          className="switch-field__track"
          aria-hidden="true"
        />
      </span>
    </label>
  );
}