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

function AdminNav({ active, onOpenUsers, onOpenForms }) {
  return (
    <nav className="admin-section-nav" aria-label="Admin console sections">
      <button
        type="button"
        className={active === "users" ? "active" : ""}
        onClick={onOpenUsers}
      >
        <span className="admin-section-icon"><UsersIcon /></span>
        <span>
          <strong>User Management</strong>
          <small>Create and review system accounts</small>
        </span>
      </button>

      <button
        type="button"
        className={active === "forms" ? "active" : ""}
        onClick={onOpenForms}
      >
        <span className="admin-section-icon"><FormsIcon /></span>
        <span>
          <strong>Form Builder</strong>
          <small>Manage form schemas and versions</small>
        </span>
      </button>
    </nav>
  );
}

export default AdminNav;
