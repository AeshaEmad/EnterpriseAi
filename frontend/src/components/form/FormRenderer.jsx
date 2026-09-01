import { useState } from "react";
import FormField from "./FormField";
import RequiredFields from "./RequiredFields";
import History from "../history/History";
import formSchema from "../../config/formSchema";

const hasValidValue = (field, value) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return false;
  }

  return true;
};

function FormRenderer({
  formData = {},
  fieldSources = {},
  fieldConfidence = {},
  onFormUpdate,
  onSubmit,
  onClear,
  history = [],
  onRestoreHistory,
  schema = formSchema,
  submitting = false,
  error = "",
  title = "Employee Form",
}) {
  const [activeTab, setActiveTab] = useState("form");
  const [missingFields, setMissingFields] = useState(() => new Set());
  const requiredFields = schema
    .filter((field) => field.required)
    .map((field) => field.name);

  const filledFields = schema.filter(
    (field) => hasValidValue(field, formData[field.name])
  );
  const completedRequired = schema.filter(
    (field) =>
      field.required && hasValidValue(field, formData[field.name])
  );

  const handleFieldChange = (field, value) => {
    if (onFormUpdate) {
      onFormUpdate({
        [field]: value,
      });
    }

    setMissingFields((current) => {
      if (!current.has(field)) return current;
      const next = new Set(current);
      next.delete(field);
      return next;
    });
  };

  const handleSubmit = () => {
    const missingRequired = schema
      .filter(
        (field) =>
          field.required && !hasValidValue(field, formData[field.name])
      )
      .map((field) => field.name);

    if (missingRequired.length > 0) {
      setMissingFields(new Set(missingRequired));
      return;
    }

    setMissingFields(new Set());

    if (onSubmit) onSubmit();
  };

  return (
    <main className="form-renderer">
      <div className="form-top">
        <div>
          <span className="eyebrow">HR</span>
          <h2>{title}</h2>
        </div>

        <div className="form-stats">
          <RequiredFields
            total={requiredFields.length}
            completed={completedRequired.length}
          />

          <span className="total-fields">
            {filledFields.length}/{schema.length} fields filled
          </span>
        </div>
      </div>

      <div className="field-legend">
        <span>
          <span className="legend-dot ai"></span>
          AI-filled
        </span>

        <span>
          <span className="legend-dot user"></span>
          User-entered
        </span>
      </div>

      <div className="form-tabs">
        <button
          className={activeTab === "form" ? "active" : ""}
          type="button"
          onClick={() => setActiveTab("form")}
        >
          FORM
        </button>

        <button
          className={activeTab === "history" ? "active" : ""}
          type="button"
          onClick={() => setActiveTab("history")}
        >
          HISTORY
        </button>
      </div>

      {activeTab === "history" ? (
        <History
          entries={history}
          onView={(entry) => {
            if (onRestoreHistory) {
              onRestoreHistory(entry);
            }

            setActiveTab("form");
          }}
        />
      ) : (
        <>
          <div className="fields">
            {schema.map((field) => (
              <FormField
                key={field.name}
                name={field.name}
                label={field.label}
                type={field.type}
                value={formData[field.name] || ""}
                required={field.required}
                placeholder={field.placeholder}
                options={field.options}
                status={
                  hasValidValue(field, formData[field.name])
                    ? fieldSources[field.name]
                    : undefined
                }
                missing={missingFields.has(field.name)}
                confidence={fieldConfidence[field.name]}
                onChange={(value) =>
                  handleFieldChange(field.name, value)
                }
              />
            ))}
          </div>

          <div className="form-actions">
            {missingFields.size > 0 && (
              <div className="missing-summary">
                {missingFields.size} required field
                {missingFields.size > 1 ? "s" : ""} need to be filled
                before submitting.
              </div>
            )}
            {error && <div className="form-error">{error}</div>}
            <button
              className="btn primary"
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
            <button
              className="btn secondary"
              type="button"
              onClick={() => {
                setMissingFields(new Set());
                onClear();
              }}
            >
              Clear
            </button>
          </div>
        </>
      )}
    </main>
  );
}

export default FormRenderer;
