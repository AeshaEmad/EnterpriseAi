import { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import ChatPanel from "../components/chat/ChatPanel";
import FormRenderer from "../components/form/FormRenderer";
import { getFormSchema } from "../services/formSchema";

function AutoFiller({ user, onLogout, onBack }) {
  const [schema, setSchema] = useState([]);
  const [formData, setFormData] = useState({});
  const [fieldSources, setFieldSources] = useState({});
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const fields = await getFormSchema();

      if (!cancelled) {
        setSchema(fields);

        const initial = fields.reduce((data, field) => {
          data[field.name] = "";
          return data;
        }, {});

        setFormData(initial);
        setLoading(false);
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

  const handleSubmit = () => {
    const filledFields = schema.filter(
      (field) => formData[field.name]
    );

    if (filledFields.length === 0) return;

    const entry = {
      id: Date.now(),
      timestamp: Date.now(),
      title: "Submitted form",
      fields: filledFields.map((f) => f.name),
      data: { ...formData },
    };

    setHistory((prev) => [entry, ...prev]);
    handleClear();
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

  return (
    <div className="autofiller-page">
      <Header user={user} onLogout={onLogout} onBack={onBack} />

      <div className="demo-content">
        <ChatPanel
          schema={schema}
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
