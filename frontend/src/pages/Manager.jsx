import { useCallback, useEffect, useState } from "react";
import Header from "../components/layout/Header";
import ManagerNav from "../components/admin/ManagerNav";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import {
  approveFormVersion,
  formVersionStatus,
  getForm,
  getForms,
  rejectFormVersion,
} from "../services/formSchema";

const STATUS_LABELS = {
  [formVersionStatus.Published]: { text: "Accepted", className: "published" },
  [formVersionStatus.PendingApproval]: { text: "Pending Approval", className: "pending" },
  [formVersionStatus.Draft]: { text: "Draft", className: "draft" },
  [formVersionStatus.Rejected]: { text: "Rejected", className: "rejected" },
};

function formatDate(value) {
  if (!value) return "\u2014";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "\u2014";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatConstraints(field) {
  const rules = field.validationRules || field.validation;
  const parts = [];

  if (rules?.min !== undefined && rules?.min !== null) {
    parts.push(`Min: ${rules.min}`);
  }
  if (rules?.max !== undefined && rules?.max !== null) {
    parts.push(`Max: ${rules.max}`);
  }
  if (rules?.minLength !== undefined && rules?.minLength !== null) {
    parts.push(`Min Length: ${rules.minLength}`);
  }
  if (rules?.maxLength !== undefined && rules?.maxLength !== null) {
    parts.push(`Max Length: ${rules.maxLength}`);
  }
  if (Array.isArray(field.options) && field.options.length > 0) {
    parts.push(`Options: [${field.options.join(", ")}]`);
  }

  return parts.length > 0 ? parts.join(" · ") : "None";
}

function StatusBadge({ status }) {
  const meta = STATUS_LABELS[status] || {
    text: status || "Unknown",
    className: "draft",
  };

  return (
    <span className={`version-status ${meta.className}`}>
      {meta.text}
    </span>
  );
}

function Manager({ user, onLogout, onBack }) {
  const [activeTab, setActiveTab] = useState("approvals");
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectComment, setRejectComment] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState({});

  const toggleExpand = (versionId) => {
    setExpandedVersions((prev) => ({
      ...prev,
      [versionId]: prev[versionId] === undefined ? false : !prev[versionId],
    }));
  };

  const loadForms = useCallback(async () => {
    try {
      const list = await getForms();
      const detailed = await Promise.all(
        list.map((form) =>
          getForm(form.id).catch(() => ({
            id: form.id,
            name: form.name,
            description: form.description,
            versions: [],
          }))
        )
      );
      setForms(detailed);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadForms(), 0);
    return () => clearTimeout(timer);
  }, [loadForms]);

  const pendingVersions = forms.flatMap((form) =>
    (form.versions || [])
      .filter((version) => version.status === formVersionStatus.PendingApproval)
      .map((version) => ({ form, version }))
  );

  const refresh = async () => {
    setLoading(true);
    await loadForms();
  };

  const handleApprove = async (form, version) => {
    setActing(`${version.id}:approve`);
    setError("");
    try {
      await approveFormVersion(form.id, version.id);
      await refresh();
    } catch (approveError) {
      setError(approveError.message);
    } finally {
      setActing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectComment.trim()) return;
    setRejecting(true);
    setError("");
    try {
      await rejectFormVersion(
        rejectTarget.form.id,
        rejectTarget.version.id,
        rejectComment.trim()
      );
      setRejectTarget(null);
      setRejectComment("");
      await refresh();
    } catch (rejectError) {
      setError(rejectError.message);
      setRejectTarget(null);
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="autofiller-page">
        <Header
          user={user}
          onLogout={onLogout}
          onBack={onBack}
          eyebrow="MANAGER CONSOLE"
          title="Approvals"
        />
        <div className="admin-page">
          <div className="loading-state">Loading forms...</div>
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
        eyebrow="MANAGER CONSOLE"
        title={activeTab === "approvals" ? "Approvals" : "Forms"}
      />

      <div className="admin-page">
        <ManagerNav
          active={activeTab}
          onOpenApprovals={() => setActiveTab("approvals")}
          onOpenForms={() => setActiveTab("forms")}
        />

        <div className="admin-top">
          <div>
            <span className="eyebrow">MANAGER</span>
            <h2>
              {activeTab === "approvals"
                ? "Pending Form Approvals"
                : "All Forms"}
            </h2>
            <p className="admin-subtitle">
              {activeTab === "approvals"
                ? "Review form schemas submitted by the admin before publishing."
                : "Every form and the current status of its versions."}
            </p>
          </div>

          {error && (
            <span className="admin-message error">{error}</span>
          )}
        </div>

        {activeTab === "approvals" ? (
          pendingVersions.length === 0 ? (
            <div className="admin-empty">
              No forms are waiting for approval right now.
            </div>
          ) : (
            pendingVersions.map(({ form, version }) => {
              const fields = version.fields || [];
              const isNewForm =
                version.versionNumber === 1 ||
                !(form.versions || []).some(
                  (v) => v.id !== version.id && v.status === formVersionStatus.Published
                );
              const isExpanded = expandedVersions[version.id] ?? true;
              const publishedVersion = (form.versions || []).find(
                (v) => v.id !== version.id && v.status === formVersionStatus.Published
              );

              return (
                <div className="approval-card" key={version.id}>
                  <div className="approval-card-header">
                    <div className="approval-info">
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                          flexWrap: "wrap",
                          marginBottom: "6px",
                        }}
                      >
                        <StatusBadge status={version.status} />
                        <span
                          className={`approval-type-badge ${
                            isNewForm ? "new-form" : "update-form"
                          }`}
                        >
                          {isNewForm
                            ? "✨ New Form Creation"
                            : `📝 Schema Update (v${version.versionNumber})`}
                        </span>
                        {publishedVersion && (
                          <span className="approval-prev-note">
                            Previous Live Version: v{publishedVersion.versionNumber}
                          </span>
                        )}
                      </div>

                      <h3>{form.name || "Untitled form"}</h3>
                      <p className="approval-meta">
                        Version {version.versionNumber} · submitted{" "}
                        {formatDate(version.publishedAt || version.createdAt)} ·{" "}
                        <strong>
                          {fields.length} Field{fields.length === 1 ? "" : "s"}
                        </strong>
                      </p>

                      {form.description && (
                        <p className="approval-desc">{form.description}</p>
                      )}

                      <button
                        type="button"
                        className="approval-fields-toggle"
                        onClick={() => toggleExpand(version.id)}
                      >
                        {isExpanded
                          ? "▲ Hide Field Details & Constraints"
                          : `▼ Review Field Details & Constraints (${fields.length})`}
                      </button>
                    </div>

                    <div className="approval-actions">
                      <Button
                        variant="secondary"
                        disabled={acting === `${version.id}:approve`}
                        onClick={() => handleApprove(form, version)}
                      >
                        {acting === `${version.id}:approve`
                          ? "Approving..."
                          : "Approve & Publish"}
                      </Button>

                      <Button
                        variant="danger"
                        disabled={acting === `${version.id}:reject`}
                        onClick={() => setRejectTarget({ form, version })}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="approval-fields-table-wrap">
                      {fields.length === 0 ? (
                        <div
                          style={{
                            padding: "16px",
                            color: "var(--ink-2)",
                            fontSize: "13px",
                          }}
                        >
                          No fields defined for this version schema.
                        </div>
                      ) : (
                        <table className="approval-fields-table">
                          <thead>
                            <tr>
                              <th style={{ width: "36px" }}>#</th>
                              <th>Field Label & Name</th>
                              <th>Type</th>
                              <th>Requirement</th>
                              <th>Constraints / Rules</th>
                              <th>Field Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fields.map((f, idx) => (
                              <tr key={f.id || f.fieldName || idx}>
                                <td>{idx + 1}</td>
                                <td>
                                  <strong>{f.fieldLabel}</strong>
                                  <div
                                    style={{
                                      color: "var(--ink-2)",
                                      fontSize: "11px",
                                      fontFamily: "monospace",
                                    }}
                                  >
                                    {f.fieldName}
                                  </div>
                                </td>
                                <td>
                                  <span className="field-type-pill">
                                    {f.fieldType}
                                  </span>
                                </td>
                                <td>
                                  <span
                                    className={`field-req-pill ${
                                      f.isRequired ? "required" : "optional"
                                    }`}
                                  >
                                    {f.isRequired ? "Required" : "Optional"}
                                  </span>
                                </td>
                                <td>
                                  <span
                                    style={{
                                      fontSize: "12px",
                                      color: "var(--ink-1)",
                                    }}
                                  >
                                    {formatConstraints(f)}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    color: "var(--ink-1)",
                                    maxWidth: "280px",
                                    lineHeight: "1.4",
                                  }}
                                >
                                  {f.description || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : forms.length === 0 ? (
          <div className="admin-empty">No forms available yet.</div>
        ) : (
          <div className="forms-table-wrap">
            <table className="forms-table">
              <thead>
                <tr>
                  <th>Form</th>
                  <th>Description</th>
                  <th>Version</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {forms.map((form) =>
                  (form.versions || []).length === 0 ? (
                    <tr key={form.id}>
                      <td>{form.name || "Untitled form"}</td>
                      <td>{form.description || "\u2014"}</td>
                      <td colSpan={3} className="forms-table-empty">
                        No versions yet
                      </td>
                    </tr>
                  ) : (
                    form.versions.map((version) => (
                      <tr key={version.id}>
                        <td>{form.name || "Untitled form"}</td>
                        <td>{form.description || "\u2014"}</td>
                        <td>v{version.versionNumber}</td>
                        <td>
                          <StatusBadge status={version.status} />
                        </td>
                        <td>
                          {formatDate(
                            version.publishedAt || version.createdAt
                          )}
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rejectTarget && (
        <Modal
          title={`Reject "${rejectTarget.form.name || "Untitled form"}"`}
          onClose={() => setRejectTarget(null)}
        >
          <div className="reject-form">
            <p className="approval-desc">
              Add a comment explaining why this version is rejected.
              The admin will see it when preparing the resubmit.
            </p>
            <textarea
              value={rejectComment}
              onChange={(event) => setRejectComment(event.target.value)}
              placeholder="Required — reason for rejection..."
              rows={4}
            />
            <div className="reject-actions">
              <Button
                variant="secondary"
                onClick={() => setRejectTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                disabled={rejecting || !rejectComment.trim()}
              >
                {rejecting ? "Rejecting..." : "Reject"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Manager;