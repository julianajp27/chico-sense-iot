import { useId } from "react";

export default function Checkbox({
  label,
  id,
  className = "",
  disabled  = false,
  ...props
}) {
  const generatedId = useId();
  const checkboxId  = id ?? generatedId;

  return (
    <label
      htmlFor  ={checkboxId}
      className={`checkbox-field ${
        disabled ? "checkbox-field--disabled" : ""
      } ${className}`.trim()}
    >
      <input
        {...props}
        id=       {checkboxId}
        type=     "checkbox"
        disabled= {disabled}
        className="checkbox-field__input"
      />

      <span className="checkbox-field__label">{label}</span>
    </label>
  );
}