function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  required = false,
  autoComplete,
  ...rest
}) {
  return (
    <div
      className={`auth-field ${error ? "has-error" : ""}`}
    >
      <label>
        {label}
        {required && <span className="required">*</span>}
      </label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        {...rest}
      />

      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

export default Input;
