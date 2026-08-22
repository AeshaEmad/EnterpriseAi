import { useState } from "react";
import FormField from "./FormField";
import RequiredFields from "./RequiredFields";
import History from "../history/History";
import formSchema from "../../config/formSchema";

function FormRenderer({
  formData = {},
  fieldSources = {},
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
  const requiredFields = schema
    .filter((field) => field.required)
    .map((field) => field.name);

  const filledFields = schema.filter(
    (field) => formData[field.name]
  );
  const completedRequired = schema.filter(
    (field) =>
      field.required && formData[field.name]
  );

  const handleFieldChange = (field, value) => {
    if (onFormUpdate) {
      onFormUpdate({
        [field]: value,
      });
    }
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
                label={field.label}
                type={field.type}
                value={formData[field.name] || ""}
                required={field.required}
                placeholder={field.placeholder}
                options={field.options}
                status={fieldSources[field.name]}
                onChange={(value) =>
                  handleFieldChange(field.name, value)
                }
              />
            ))}
          </div>

          <div className="form-actions">
            {error && <div className="form-error">{error}</div>}
            <button
              className="btn primary"
              type="button"
              onClick={onSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
            <button
              className="btn secondary"
              type="button"
              onClick={onClear}
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
