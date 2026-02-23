import { useState } from "react";

export default function AuthInput({
  id,
  name,
  type = "text",
  label,
  value,
  onChange,
  error,
  autoComplete,
  required = false,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = String(value ?? "").length > 0;

  return (
    <div className={`agri-input-group ${isFocused ? "is-focused" : ""} ${error ? "has-error" : ""}`}>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <label htmlFor={id} className={hasValue || isFocused ? "is-floating" : ""}>
        {label}
      </label>
      {error ? (
        <p id={`${id}-error`} className="agri-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
