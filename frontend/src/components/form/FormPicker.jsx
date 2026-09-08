import Button from "../common/Button";

function FormPicker({ forms, onSelect, error }) {
  return (
    <div className="form-picker">
      <div className="form-picker-head">
        <span className="eyebrow">SELECT A FORM</span>
        <h2>Which form do you want to fill?</h2>
        <p className="form-picker-sub">
          Pick a form to start. The AI assistant will help you
          complete it from a single sentence.
        </p>
      </div>

      {error && <div className="form-error">{error}</div>}

      {forms.length === 0 && !error ? (
        <div className="loading-state">
          No forms are available for you yet.
        </div>
      ) : (
        <div className="form-picker-grid">
          {forms.map((form) => (
            <div className="form-picker-card" key={form.id}>
              <div className="form-picker-card-head">
                <span className="form-picker-mark">
                  {form.name.charAt(0).toUpperCase()}
                </span>
                <span className="eyebrow">FORM</span>
              </div>

              <h3>{form.name}</h3>
              <p className="form-picker-desc">
                {form.description || "No description provided."}
              </p>

              <Button
                variant="primary"
                onClick={() => onSelect(form)}
              >
                Fill this form
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FormPicker;