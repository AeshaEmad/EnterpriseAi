import { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import ChatPanel from "../components/chat/ChatPanel";
import FormRenderer from "../components/form/FormRenderer";
import FormPicker from "../components/form/FormPicker";
import Modal from "../components/common/Modal";
import ReviewPanel from "../components/review/ReviewPanel";
import { getForms, getFormSchema } from "../services/formSchema";
import {
  confirmSubmission,
  createSubmission,
  updateSubmissionFields,
  validateSubmission,
} from "../services/submissions";

function AutoFiller({ user, onLogout, onBack }) {
  const [stage, setStage] = useState("pick");
  const [forms, setForms] = useState([]);
  const [schema, setSchema] = useState([]);
  const [formData, setFormData] = useState({});
  const [fieldSources, setFieldSources] = useState({});
  const [fieldConfidence, setFieldConfidence] = useState({});
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  const [formInfo, setFormInfo] = useState(null);
  const [error, setError] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const draftOwner = user?.id || user?.email || "user";

  const draftKey = formInfo
    ? `enterpriseai:draft:${draftOwner}:${formInfo.formId}`
    : null;

  useEffect(() => {
    let cancelled = false;

    getForms()
      .then((list) => {
        if (!cancelled) setForms(list);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!draftKey || !draftReady) return;

    localStorage.setItem(
      draftKey,
      JSON.stringify({
        formData,
        fieldSources,
        fieldConfidence,
        savedAt: new Date().toISOString(),
      })
    );
  }, [draftKey, draftReady, formData, fieldSources, fieldConfidence]);

  const startForm = async (formId) => {
    setLoading(true);
    setError("");

    try {
      const schemaData = await getFormSchema(formId);
      const submission = await createSubmission(formId);

      const initial = schemaData.fields.reduce((data, field) => {
        data[field.name] = "";
        return data;
      }, {});

      const savedDraft = localStorage.getItem(
        `enterpriseai:draft:${draftOwner}:${schemaData.formId}`
      );

      setFormInfo(schemaData);
      setSchema(schemaData.fields);
      setSubmissionId(submission.id);
      setHistory([]);
      setDraftReady(false);

      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        setFormData({ ...initial, ...(parsedDraft.formData || {}) });
        setFieldSources(parsedDraft.fieldSources || {});
        setFieldConfidence(parsedDraft.fieldConfidence || {});
      } else {
        setFormData(initial);
      }

      setStage("fill");
      setDraftReady(true);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  const goBackToPicker = () => {
    if (draftKey) localStorage.removeItem(draftKey);
    setFormData({});
    setFieldSources({});
    setFieldConfidence({});
    setFormInfo(null);
    setSchema([]);
    setSubmissionId(null);
    setHistory([]);
    setDraftReady(false);
    setError("");
    setStage("pick");
  };

  const addCustomSelectOptions = (newData) => {
    setSchema((currentSchema) =>
      currentSchema.map((field) => {
        const value = newData[field.name];
        if (field.type !== "select" || !value) return field;

        const exists = (field.options || []).some(
          (option) =>
            String(option).toLowerCase() === String(value).trim().toLowerCase()
        );

        if (exists) return field;

        return {
          ...field,
          options: [...(field.options || []), String(value).trim()],
        };
      })
    );
  };

  const handleFormUpdate = (newData, source = "user", confidence = {}) => {
    addCustomSelectOptions(newData);

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

    setFieldConfidence((currentConfidence) => {
      const updatedConfidence = { ...currentConfidence };

      Object.keys(newData).forEach((field) => {
        if (source === "ai" && typeof confidence[field] === "number") {
          updatedConfidence[field] = confidence[field];
        } else if (source === "user") {
          delete updatedConfidence[field];
        }
      });

      return updatedConfidence;
    });
  };

  const getFilledFields = () =>
    schema.filter(
      (field) =>
        formData[field.name] !== null &&
        formData[field.name] !== undefined &&
        String(formData[field.name]).trim() !== ""
    );

  const handleSubmit = () => {
    if (getFilledFields().length === 0 || !submissionId || submitting) return;
    setReviewOpen(true);
  };

  const handleConfirmSubmit = async () => {
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
        status: confirmed.status,
        fields: filledFields.map((f) => f.name),
        data: { ...formData },
        meta: Object.fromEntries(
          filledFields.map((field) => [
            field.name,
            {
              source: fieldSources[field.name] || "user",
              confidence: fieldConfidence[field.name],
            },
          ])
        ),
      };

      setHistory((prev) => [entry, ...prev]);
      const nextSubmission = await createSubmission(formInfo.formId);
      setSubmissionId(nextSubmission.id);
      if (draftKey) localStorage.removeItem(draftKey);
      setReviewOpen(false);
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
    setFieldConfidence({});
  };

  const restoreHistory = (entry) => {
    handleFormUpdate(entry.data, "ai");
  };

  if (loading) {
    return (
      <div className="autofiller-page">
        <Header user={user} onLogout={onLogout} onBack={onBack} />
        <div className="demo-content">
          <div className="loading-state">Loading...</div>
        </div>
      </div>
    );
  }

  if (stage === "pick") {
    return (
      <div className="autofiller-page">
        <Header user={user} onLogout={onLogout} onBack={onBack} />
        <div className="form-picker-container">
          <FormPicker
            forms={forms}
            error={error}
            onSelect={(form) => startForm(form.id)}
          />
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
          formData={formData}
          submissionId={submissionId}
          onFormUpdate={(data, confidence) => {
            handleFormUpdate(data, "ai", confidence);
          }}
        />

        <FormRenderer
          formData={formData}
          fieldSources={fieldSources}
          fieldConfidence={fieldConfidence}
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

      <button
        className="switch-form-button"
        type="button"
        onClick={goBackToPicker}
      >
        &#8592; Switch form
      </button>

      {reviewOpen && (
        <Modal
          title="Review submission"
          onClose={() => setReviewOpen(false)}
        >
          <ReviewPanel
            schema={schema}
            formData={formData}
            fieldSources={fieldSources}
            fieldConfidence={fieldConfidence}
            onCancel={() => setReviewOpen(false)}
            onConfirm={handleConfirmSubmit}
            submitting={submitting}
          />
        </Modal>
      )}
    </div>
  );
}

export default AutoFiller;