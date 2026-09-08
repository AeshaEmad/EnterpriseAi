import { useState } from "react";
import FieldStatus from "./FieldStatus";

function FormField({
  label,
  value = "",
  type = "text",
  required = false,
  placeholder = "—",
  options = [],
  description = "",
  status,
  confidence,
  missing = false,
  onChange,
  name,
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
  const selectOptions = isSelect ? [...options] : options;
  const hasCurrentOption = selectOptions.some(
    (option) => String(option).toLowerCase() === String(inputValue).trim().toLowerCase()
  );

  if (isSelect && inputValue && !hasCurrentOption) {
    selectOptions.push(inputValue);
  }

  return (
    <div
      className={`form-field ${status || ""} ${missing ? "missing" : ""
        }`}
      data-field-name={name}
    >
      <div className="field-label">
        <label>
          {label}
          {required && (
            <span className="required">*</span>
          )}
        </label>

        {missing && (
          <span className="field-missing-text">Required</span>
        )}

        <FieldStatus status={status} confidence={confidence} />
      </div>

      {description && (
        <p className="field-description">{description}</p>
      )}

      {isSelect ? (
        <select value={inputValue} onChange={handleChange} data-field-name={name}>
          <option value="">{placeholder}</option>

          {selectOptions.map((option) => (
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
          data-field-name={name}
        />
      )}
    </div>
  );
}

export default FormField;
