import { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Button from "../components/common/Button";
import AdminNav from "../components/admin/AdminNav";
import { getForms } from "../services/formSchema";

function BusinessRules({ user, onLogout, onBack, onOpenUsers, onOpenForms, onOpenRules }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [pdf, setPdf] = useState(null);
  const [rules, setRules] = useState([]);
  const [toast, setToast] = useState({ show: false, text: "", type: "" });

  const showToast = (text, type = "success") => {
    setToast({ show: true, text, type });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ show: false, text: "", type: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const allForms = await getForms();
        if (cancelled) return;
        setForms(allForms);
        if (allForms.length > 0) setSelectedFormId(allForms[0].id);
      } catch (error) {
        if (!cancelled) showToast(error.message, "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpload = () => {
    if (!pdf) {
      showToast("Choose a PDF file first.", "error");
      return;
    }
    if (!selectedFormId) {
      showToast("Select a form first.", "error");
      return;
    }

    const entry = {
      id: `rule-${Date.now()}`,
      formId: selectedFormId,
      formName: forms.find((f) => f.id === selectedFormId)?.name || "Unknown form",
      fileName: pdf.name,
      uploadedAt: new Date().toISOString(),
    };

    setRules((prev) => [entry, ...prev]);
    setPdf(null);
    showToast(`Uploaded "${pdf.name}" for ${entry.formName}.`);
  };

  if (loading) {
    return (
      <div className="autofiller-page">
        <Header
          user={user}
          onLogout={onLogout}
          onBack={onBack}
          eyebrow="ADMIN CONSOLE"
          title="Business Rules"
        />
        <div className="admin-page">
          <div className="loading-state">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="autofiller-page">
      <Header
        user={user}
        onLogout={onLogout}
        onBack={onBack}
        eyebrow="ADMIN CONSOLE"
        title="Business Rules"
      />

      <div className="admin-page">
        <AdminNav
          active="rules"
          onOpenUsers={onOpenUsers}
          onOpenForms={onOpenForms}
          onOpenRules={onOpenRules}
        />

        <div className="admin-top">
          <div>
            <span className="eyebrow">ADMIN</span>
            <h2>Business Rules</h2>
            <p className="admin-subtitle">
              Upload business rules PDFs that give the AI extra context per form.
            </p>
          </div>
        </div>

        {toast.show && (
          <div className={`toast-notification ${toast.type}`}>
            {toast.text}
          </div>
        )}

        <div className="business-rules-card">
          <div className="business-rules-grid">
            <label className="admin-form-select">
              <span>Form</span>
              <select
                value={selectedFormId}
                onChange={(e) => setSelectedFormId(e.target.value)}
              >
                {forms.length === 0 && <option value="">No forms yet</option>}
                {forms.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-pdf-label">
              <span className="admin-pdf-icon">&#128196;</span>
              <span>
                <strong>Business Rules PDF</strong>
                <small>{pdf ? pdf.name : "Choose a PDF to upload"}</small>
              </span>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setPdf(e.target.files[0] || null)}
              />
            </label>

            <Button onClick={handleUpload} disabled={!pdf || !selectedFormId}>
              Upload
            </Button>
          </div>
        </div>

        <div className="business-rules-list">
          <div className="business-rules-list-head">
            <span className="eyebrow">UPLOADED RULES</span>
          </div>

          {rules.length === 0 && (
            <div className="admin-empty">
              No business rules uploaded yet.
            </div>
          )}

          {rules.map((rule) => (
            <div className="business-rule-item" key={rule.id}>
              <span className="business-rule-file">&#128196;</span>
              <div className="business-rule-info">
                <strong>{rule.fileName}</strong>
                <small>{rule.formName}</small>
              </div>
              <span className="business-rule-form">
                <small>{new Date(rule.uploadedAt).toLocaleTimeString()}</small>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BusinessRules;
