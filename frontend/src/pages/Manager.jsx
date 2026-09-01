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
            pendingVersions.map(({ form, version }) => (
              <div className="approval-card" key={version.id}>
                <div className="approval-info">
                  <StatusBadge status={version.status} />
                  <h3>{form.name || "Untitled form"}</h3>
                  <p className="approval-meta">
                    Version {version.versionNumber} · submitted{" "}
                    {formatDate(version.publishedAt || version.createdAt)}
                  </p>
                  {form.description && (
                    <p className="approval-desc">{form.description}</p>
                  )}
                </div>

                <div className="approval-actions">
                  <Button
                    variant="secondary"
                    disabled={acting === `${version.id}:approve`}
                    onClick={() => handleApprove(form, version)}
                  >
                    {acting === `${version.id}:approve`
                      ? "Approving..."
                      : "Approve"}
                  </Button>

                  <Button
                    variant="danger"
                    disabled={
                      acting === `${version.id}:reject`
                    }
                    onClick={() => setRejectTarget({ form, version })}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))
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