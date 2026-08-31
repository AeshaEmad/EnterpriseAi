import { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import {
  createForm,
  createFormVersion,
  getForm,
  getForms,
  getFormSchema,
} from "../services/formSchema";

const FIELD_TYPES = [
  "text",
  "email",
  "tel",
  "number",
  "date",
  "select",
];

const emptyField = () => ({
  name: "",
  label: "",
  type: "text",
  required: false,
  placeholder: "",
  options: [],
});

function Admin({ user, onLogout, onBack }) {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingOptions, setEditingOptions] = useState(null);
  const [optionInput, setOptionInput] = useState("");
  const [formInfo, setFormInfo] = useState(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const forms = await getForms();
        const selectedForm = forms.find((form) => form.isActive) || forms[0];
        if (!selectedForm) return;
        const details = await getForm(selectedForm.id);
        if (cancelled) return;
        if (details.versions.length === 0) {
          setFormInfo({
            formId: details.id,
            formName: details.name,
            versionNumber: 0,
          });
          return;
        }
        const schema = await getFormSchema(selectedForm.id);

        if (cancelled) return;
        setFormInfo(schema);
        setFields(
          schema.fields.map((f) => ({
            ...f,
            options: f.options || [],
          }))
        );
      } catch (error) {
        if (!cancelled) setMessage(error.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = (index, key, value) => {
    setFields((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };

      if (key === "type" && value === "select" && !updated[index].options.length) {
        updated[index].options = ["Option 1", "Option 2"];
      }

      if (key === "type" && value !== "select") {
        updated[index].options = [];
      }

      return updated;
    });
  };

  const addField = () => {
    setFields((prev) => [...prev, emptyField()]);
  };

  const removeField = (index) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const addOption = (fieldIndex) => {
    if (!optionInput.trim()) return;

    setFields((prev) => {
      const updated = [...prev];
      const field = { ...updated[fieldIndex] };

      field.options = [...field.options, optionInput.trim()];
      updated[fieldIndex] = field;

      return updated;
    });

    setOptionInput("");
  };

  const removeOption = (fieldIndex, optionIndex) => {
    setFields((prev) => {
      const updated = [...prev];
      const field = { ...updated[fieldIndex] };

      field.options = field.options.filter(
        (_, i) => i !== optionIndex
      );
      updated[fieldIndex] = field;

      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      if (fields.length === 0) throw new Error("Add at least one field.");
      if (fields.some((field) => !field.name.trim() || !field.label.trim())) {
        throw new Error("Every field must have a name and label.");
      }

      let targetForm = formInfo;
      if (!targetForm) {
        if (!formName.trim()) throw new Error("Form name is required.");
        const created = await createForm(formName.trim(), formDescription.trim());
        targetForm = {
          formId: created.id,
          formName: created.name,
          versionNumber: 0,
        };
      }

      await createFormVersion(
        targetForm.formId,
        targetForm.versionNumber + 1,
        fields
      );
      setFormInfo({
        ...targetForm,
        versionNumber: targetForm.versionNumber + 1,
      });
      setMessage("New schema version submitted for approval successfully.");
    } catch (error) {
      setMessage(error.message);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="autofiller-page">
        <Header user={user} onLogout={onLogout} onBack={onBack} />
        <div className="admin-page">
          <div className="loading-state">Loading schema...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="autofiller-page">
      <Header user={user} onLogout={onLogout} onBack={onBack} />

      <div className="admin-page">
        <div className="admin-top">
          <div>
            <span className="eyebrow">ADMIN</span>
            <h2>{formInfo?.formName || "Form Schema Builder"}</h2>
            <p className="admin-subtitle">
              Saving creates a new version and submits it for approval.
            </p>
          </div>

          <div className="admin-actions">
            {message && (
              <span
                className={`admin-message ${
                  message.toLowerCase().includes("success")
                    ? "success"
                    : "error"
                }`}
              >
                {message}
              </span>
            )}

            <Button onClick={addField}>+ Add Field</Button>

            <Button
              variant="secondary"
              onClick={() => setPreviewOpen(true)}
              disabled={fields.length === 0}
            >
              Preview
            </Button>

            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Schema"}
            </Button>
          </div>
        </div>

        <div className="admin-fields">
          {!formInfo && (
            <div className="admin-field-card">
              <div className="admin-field-header">
                <span className="admin-field-num">FORM DETAILS</span>
              </div>
              <div className="admin-field-grid">
                <div className="admin-field-group">
                  <label>Form Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(event) => setFormName(event.target.value)}
                    placeholder="e.g. Employee Onboarding"
                  />
                </div>
                <div className="admin-field-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(event) => setFormDescription(event.target.value)}
                    placeholder="What this form is used for"
                  />
                </div>
              </div>
            </div>
          )}

          {fields.map((field, index) => (
            <div className="admin-field-card" key={index}>
              <div className="admin-field-header">
                <span className="admin-field-num">
                  #{index + 1}
                </span>

                <button
                  className="admin-remove-btn"
                  type="button"
                  onClick={() => removeField(index)}
                >
                  Remove
                </button>
              </div>

              <div className="admin-field-grid">
                <div className="admin-field-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) =>
                      updateField(index, "name", e.target.value)
                    }
                    placeholder="e.g. fullName"
                  />
                </div>

                <div className="admin-field-group">
                  <label>Label</label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) =>
                      updateField(index, "label", e.target.value)
                    }
                    placeholder="e.g. Full Name"
                  />
                </div>

                <div className="admin-field-group">
                  <label>Type</label>
                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateField(index, "type", e.target.value)
                    }
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-field-group">
                  <label>Placeholder</label>
                  <input
                    type="text"
                    value={field.placeholder}
                    onChange={(e) =>
                      updateField(
                        index,
                        "placeholder",
                        e.target.value
                      )
                    }
                    placeholder="Optional placeholder"
                  />
                </div>

                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) =>
                      updateField(
                        index,
                        "required",
                        e.target.checked
                      )
                    }
                  />
                  Required
                </label>
              </div>

              {field.type === "select" && (
                <div className="admin-options">
                  <div className="admin-options-header">
                    <label>Options</label>
                  </div>

                  <div className="admin-options-list">
                    {field.options.map((opt, oi) => (
                      <span className="admin-option-tag" key={oi}>
                        {opt}

                        <button
                          type="button"
                          onClick={() =>
                            removeOption(index, oi)
                          }
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="admin-option-add">
                    <input
                      type="text"
                      value={
                        editingOptions === index
                          ? optionInput
                          : ""
                      }
                      placeholder="Add option..."
                      onChange={(e) => {
                        setEditingOptions(index);
                        setOptionInput(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addOption(index);
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => addOption(index)}
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {fields.length === 0 && (
            <div className="admin-empty">
              No fields defined yet. Click "+ Add Field" to
              start.
            </div>
          )}
        </div>
      </div>

      {previewOpen && (
        <Modal
          title="Form preview"
          onClose={() => setPreviewOpen(false)}
        >
          <div className="admin-preview">
            <div className="admin-preview-top">
              <span className="eyebrow">PREVIEW</span>
              <h3>{formInfo?.formName || formName || "Untitled Form"}</h3>
            </div>

            <div className="admin-preview-grid">
              {fields.map((field, index) => (
                <div className="admin-preview-field" key={`${field.name}-${index}`}>
                  <label>
                    {field.label || "Untitled field"}
                    {field.required && <span className="required">*</span>}
                  </label>

                  {field.type === "select" ? (
                    <select defaultValue="">
                      <option value="">
                        {field.placeholder || "Select..."}
                      </option>
                      {(field.options || []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      readOnly
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Admin;
