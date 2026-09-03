function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-3A4.5 4.5 0 0 0 4 18.5V20M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17 11a3 3 0 0 0 0-6M18 14a4 4 0 0 1 4 4v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FormsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M6 3h9l3 3v15H6V3Zm9 0v4h4M9 11h6M9 15h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RulesIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M14 3v4a1 1 0 0 0 1 1h4M8 13h8M8 17h5M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

import { useLocation, useNavigate } from "react-router-dom";

function AdminNav({ active, onOpenUsers, onOpenForms, onOpenRules }) {
  const location = useLocation();
  const navigate = useNavigate();

  const currentActive =
    active ||
    (location.pathname === "/admin/forms"
      ? "forms"
      : location.pathname === "/admin/rules"
      ? "rules"
      : "users");

  const handleUsers = onOpenUsers || (() => navigate("/admin/users"));
  const handleForms = onOpenForms || (() => navigate("/admin/forms"));
  const handleRules = onOpenRules || (() => navigate("/admin/rules"));

  return (
    <nav className="admin-section-nav" aria-label="Admin console sections">
      <button
        type="button"
        className={currentActive === "users" ? "active" : ""}
        onClick={handleUsers}
      >
        <span className="admin-section-icon"><UsersIcon /></span>
        <span>
          <strong>User Management</strong>
          <small>Create and review system accounts</small>
        </span>
      </button>

      <button
        type="button"
        className={currentActive === "forms" ? "active" : ""}
        onClick={handleForms}
      >
        <span className="admin-section-icon"><FormsIcon /></span>
        <span>
          <strong>Form Builder</strong>
          <small>Manage form schemas and versions</small>
        </span>
      </button>

      <button
        type="button"
        className={currentActive === "rules" ? "active" : ""}
        onClick={handleRules}
      >
        <span className="admin-section-icon"><RulesIcon /></span>
        <span>
          <strong>Business Rules</strong>
          <small>Upload rules PDFs for AI context</small>
        </span>
      </button>
    </nav>
  );
}

export default AdminNav;
