import { useState } from "react";
import FieldStatus from "./FieldStatus";

function FormField({
  label,
  value = "",
  type = "text",
  required = false,
  placeholder = "—",
  options = [],
  status,
  onChange,
}) {
  const [prevValue, setPrevValue] = useState(value);
  const [inputValue, setInputValue] = useState(value);

  if (prevValue !== value) {
    setPrevValue(value);
    setInputValue(value);
  }

  const handleChange = (event) => {
    const newValue = event.target.value;

    setInputValue(newValue);

    if (onChange) {
      onChange(newValue);
    }
  };

  const isSelect = type === "select";

  return (
    <div className={`form-field ${status || ""}`}>
      <div className="field-label">
        <label>
          {label}
          {required && (
            <span className="required">*</span>
          )}
        </label>

        <FieldStatus status={status} />
      </div>

      {isSelect ? (
        <select value={inputValue} onChange={handleChange}>
          <option value="">{placeholder}</option>

          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={inputValue}
          placeholder={placeholder}
          onChange={handleChange}
        />
      )}
    </div>
  );
}

export default FormField;
