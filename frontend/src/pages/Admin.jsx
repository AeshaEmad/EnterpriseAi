import { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Button from "../components/common/Button";
import {
  getFormSchema,
  saveFormSchema,
  clearSchemaCache,
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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const schema = await getFormSchema();

      if (!cancelled) {
        setFields(
          schema.map((f) => ({
            ...f,
            options: f.options || [],
          }))
        );
        setLoading(false);
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

    const result = await saveFormSchema(fields);

    if (result.error) {
      setMessage(result.error);
    } else {
      clearSchemaCache();
      setMessage("Form schema saved successfully.");
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
            <h2>Form Schema Builder</h2>
            <p className="admin-subtitle">
              Define the fields that appear in the employee
              form.
            </p>
          </div>

          <div className="admin-actions">
            {message && (
              <span
                className={`admin-message ${
                  message.includes("success")
                    ? "success"
                    : "error"
                }`}
              >
                {message}
              </span>
            )}

            <Button onClick={addField}>+ Add Field</Button>

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
    </div>
  );
}

export default Admin;
