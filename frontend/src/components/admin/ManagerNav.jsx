function ApproveIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
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

function ManagerNav({ active, onOpenApprovals, onOpenForms }) {
  return (
    <nav className="admin-section-nav" aria-label="Manager console sections">
      <button
        type="button"
        className={active === "approvals" ? "active" : ""}
        onClick={onOpenApprovals}
      >
        <span className="admin-section-icon"><ApproveIcon /></span>
        <span>
          <strong>Form Approvals</strong>
          <small>Review and approve submitted form versions</small>
        </span>
      </button>

      <button
        type="button"
        className={active === "forms" ? "active" : ""}
        onClick={onOpenForms}
      >
        <span className="admin-section-icon"><FormsIcon /></span>
        <span>
          <strong>Forms</strong>
          <small>Browse forms and their version statuses</small>
        </span>
      </button>
    </nav>
  );
}

export default ManagerNav;