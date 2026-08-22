import { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import ChatPanel from "../components/chat/ChatPanel";
import FormRenderer from "../components/form/FormRenderer";
import { getForms, getFormSchema } from "../services/formSchema";
import {
  confirmSubmission,
  createSubmission,
  updateSubmissionFields,
  validateSubmission,
} from "../services/submissions";

function AutoFiller({ user, onLogout, onBack }) {
  const [schema, setSchema] = useState([]);
  const [formData, setFormData] = useState({});
  const [fieldSources, setFieldSources] = useState({});
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  const [formInfo, setFormInfo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const forms = await getForms();
        const selectedForm = forms.find((form) => form.isActive) || forms[0];
        if (!selectedForm) throw new Error("No forms are available yet.");

        const schemaData = await getFormSchema(selectedForm.id);
        const submission = await createSubmission(selectedForm.id);

        if (cancelled) return;
        setFormInfo(schemaData);
        setSchema(schemaData.fields);
        setSubmissionId(submission.id);

        const initial = schemaData.fields.reduce((data, field) => {
          data[field.name] = "";
          return data;
        }, {});

        setFormData(initial);
      } catch (loadError) {
        if (!cancelled) setError(loadError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleFormUpdate = (newData, source = "user") => {
    setFormData((currentData) => ({
      ...currentData,
      ...newData,
    }));

    setFieldSources((currentSources) => {
      const updatedSources = { ...currentSources };

      Object.keys(newData).forEach((field) => {
        updatedSources[field] = source;
      });

      return updatedSources;
    });
  };

  const handleSubmit = async () => {
    const filledFields = schema.filter(
      (field) => formData[field.name]
    );

    if (filledFields.length === 0 || !submissionId || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      await updateSubmissionFields(submissionId, formData, fieldSources);
      const validation = await validateSubmission(submissionId);

      if (!validation.valid) {
        const messages = [
          ...validation.fieldErrors.map((item) => item.message),
          ...validation.ruleResults.map((item) => item.message),
        ];
        throw new Error(messages.join(" ") || "Please correct the form fields.");
      }

      const confirmed = await confirmSubmission(submissionId);

      const entry = {
        id: confirmed.id,
        timestamp: confirmed.submittedAt,
        title: `${formInfo?.formName || "Form"} submitted`,
        fields: filledFields.map((f) => f.name),
        data: { ...formData },
      };

      setHistory((prev) => [entry, ...prev]);
      const nextSubmission = await createSubmission(formInfo.formId);
      setSubmissionId(nextSubmission.id);
      handleClear();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    const initial = schema.reduce((data, field) => {
      data[field.name] = "";
      return data;
    }, {});

    setFormData(initial);
    setFieldSources({});
  };

  const restoreHistory = (entry) => {
    handleFormUpdate(entry.data, "ai");
  };

  if (loading) {
    return (
      <div className="autofiller-page">
        <Header user={user} onLogout={onLogout} onBack={onBack} />
        <div className="demo-content">
          <div className="loading-state">Loading form...</div>
        </div>
      </div>
    );
  }

  if (error && !submissionId) {
    return (
      <div className="autofiller-page">
        <Header user={user} onLogout={onLogout} onBack={onBack} />
        <div className="demo-content">
          <div className="loading-state form-error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="autofiller-page">
      <Header user={user} onLogout={onLogout} onBack={onBack} />

      <div className="demo-content">
        <ChatPanel
          schema={schema}
          submissionId={submissionId}
          onFormUpdate={(data) => {
            handleFormUpdate(data, "ai");
          }}
        />

        <FormRenderer
          formData={formData}
          fieldSources={fieldSources}
          history={history}
          schema={schema}
          onRestoreHistory={restoreHistory}
          onSubmit={handleSubmit}
          submitting={submitting}
          error={error}
          title={formInfo?.formName}
          onClear={handleClear}
          onFormUpdate={(data) => {
            handleFormUpdate(data, "user");
          }}
        />
      </div>
    </div>
  );
}

export default AutoFiller;
