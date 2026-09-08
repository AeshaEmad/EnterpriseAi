import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../components/layout/Header";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import AdminNav from "../components/admin/AdminNav";
import { createUser, getUsers } from "../services/users";
import { getForms } from "../services/formSchema";
import {
  getUserFormAccess,
  grantFormAccess,
  revokeFormAccess,
} from "../services/formAccess";

const ROLE_OPTIONS = ["User", "Manager", "Admin"];

const emptyForm = () => ({
  fullName: "",
  email: "",
  password: "",
  role: "User",
});

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function secureRandomIndex(max) {
  const buffer = new Uint32Array(1);
  window.crypto.getRandomValues(buffer);
  return buffer[0] % max;
}

function generatePassword(length = 14) {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%&*?";
  const all = `${letters}${numbers}${symbols}`;

  const characters = [
    letters[secureRandomIndex(letters.length)],
    numbers[secureRandomIndex(numbers.length)],
    symbols[secureRandomIndex(symbols.length)],
  ];

  while (characters.length < length) {
    characters.push(all[secureRandomIndex(all.length)]);
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = secureRandomIndex(index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }

  return characters.join("");
}

function AdminUsers({
  user,
  onLogout,
  onBack,
  onOpenUsers,
  onOpenForms,
  onOpenRules,
}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [accessTarget, setAccessTarget] = useState(null);
  const [accessForms, setAccessForms] = useState([]);
  const [accessGranted, setAccessGranted] = useState(new Set());
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessSaving, setAccessSaving] = useState(null);
  const [accessError, setAccessError] = useState("");
  const [accessDone, setAccessDone] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadUsers(), 0);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const openAccess = async (target) => {
    setAccessTarget(target);
    setAccessLoading(true);
    setAccessError("");
    setAccessDone("");

    try {
      const [forms, granted] = await Promise.all([
        getForms(),
        getUserFormAccess(target.id),
      ]);

      const grantedIds = new Set(
        (Array.isArray(granted) ? granted : []).map((item) => item.formId)
      );

      setAccessForms(Array.isArray(forms) ? forms : []);
      setAccessGranted(grantedIds);
    } catch (error) {
      setAccessError(error.message);
    } finally {
      setAccessLoading(false);
    }
  };

  const closeAccess = () => {
    setAccessTarget(null);
    setAccessForms([]);
    setAccessGranted(new Set());
    setAccessError("");
    setAccessDone("");
    setAccessSaving(null);
  };

  const toggleAccess = async (formId) => {
    if (!accessTarget || accessSaving !== null) return;

    const hasAccess = accessGranted.has(formId);
    setAccessSaving(formId);
    setAccessError("");
    setAccessDone("");

    try {
      if (hasAccess) {
        await revokeFormAccess(accessTarget.id, formId);
      } else {
        await grantFormAccess(accessTarget.id, formId);
      }

      setAccessGranted((current) => {
        const next = new Set(current);
        if (hasAccess) {
          next.delete(formId);
        } else {
          next.add(formId);
        }
        return next;
      });

      setAccessDone(hasAccess ? "Access removed." : "Form shared with this user.");
    } catch (error) {
      setAccessError(error.message);
    } finally {
      setAccessSaving(null);
    }
  };

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((item) => {
      const matchesRole =
        roleFilter === "All" ||
        String(item.role).toLowerCase() === roleFilter.toLowerCase();

      const matchesSearch =
        !query ||
        item.fullName?.toLowerCase().includes(query) ||
        item.email?.toLowerCase().includes(query);

      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  const stats = useMemo(() => {
    const active = users.filter((item) => item.isActive).length;
    const privileged = users.filter((item) =>
      ["admin", "manager"].includes(String(item.role).toLowerCase())
    ).length;

    return {
      total: users.length,
      active,
      privileged,
    };
  }, [users]);

  const openCreate = () => {
    setSuccessMessage("");
    setForm(emptyForm());
    setErrors({});
    setSubmitError("");
    setShowPassword(false);
    setCreateOpen(true);
  };

  const closeCreate = () => {
    if (creating) return;
    setCreateOpen(false);
    setForm(emptyForm());
    setErrors({});
    setSubmitError("");
  };

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setSubmitError("");
  };

  const validate = () => {
    const next = {};
    const fullName = form.fullName.trim();
    const email = form.email.trim();

    if (!fullName) {
      next.fullName = "Full name is required.";
    } else if (fullName.length < 2) {
      next.fullName = "Enter at least 2 characters.";
    }

    if (!email) {
      next.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Enter a valid email address.";
    }

    if (!form.password) {
      next.password = "An initial password is required.";
    } else if (form.password.length < 6) {
      next.password = "Password must be at least 6 characters.";
    }

    if (!ROLE_OPTIONS.includes(form.role)) {
      next.role = "Select a valid role.";
    }

    return next;
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setCreating(true);
    setSubmitError("");

    try {
      const created = await createUser(form);
      setUsers((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      setSuccessMessage(`${created.fullName} was created successfully.`);
      setCreateOpen(false);
      setForm(emptyForm());
      setErrors({});
      setSubmitError("");
      setShowPassword(false);
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleGeneratePassword = () => {
    updateForm("password", generatePassword());
    setShowPassword(true);
  };

  return (
    <div className="autofiller-page">
      <Header
        user={user}
        onLogout={onLogout}
        onBack={onBack}
        eyebrow="ADMIN CONSOLE"
        title="User Management"
      />

      <div className="admin-page admin-users-page">
        <AdminNav
          active="users"
          onOpenUsers={onOpenUsers}
          onOpenForms={onOpenForms}
          onOpenRules={onOpenRules}
        />

        <div className="users-page-heading">
          <div>
            <span className="eyebrow">ACCESS MANAGEMENT</span>
            <h2>System users</h2>
            <p className="admin-subtitle">
              Create accounts and assign the level of access each person needs.
            </p>
          </div>

          <Button variant="primary" onClick={openCreate}>
            <span aria-hidden="true">+</span> Create User
          </Button>
        </div>

        {successMessage && (
          <div className="users-alert success" role="status">
            <span className="users-alert-icon" aria-hidden="true">✓</span>
            <div>
              <strong>User created</strong>
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {loadError && (
          <div className="users-alert error" role="alert">
            <span className="users-alert-icon" aria-hidden="true">!</span>
            <div>
              <strong>Unable to load users</strong>
              <span>{loadError}</span>
            </div>
            <button type="button" onClick={loadUsers}>Try again</button>
          </div>
        )}

        {(!loadError || users.length > 0) && (
          <div className="users-stats" aria-label="User account summary">
            <div className="users-stat-card">
              <span>Total accounts</span>
              <strong>{stats.total}</strong>
              <small>All registered users</small>
            </div>
            <div className="users-stat-card">
              <span>Active accounts</span>
              <strong>{stats.active}</strong>
              <small>Can currently sign in</small>
            </div>
            <div className="users-stat-card">
              <span>Privileged roles</span>
              <strong>{stats.privileged}</strong>
              <small>Admins and managers</small>
            </div>
          </div>
        )}

        <section className="users-directory" aria-labelledby="user-directory-title">
          <div className="users-directory-head">
            <div>
              <h3 id="user-directory-title">User directory</h3>
              <p>
                {filteredUsers.length} of {users.length} account{users.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="users-toolbar">
              <label className="users-search">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name or email"
                  aria-label="Search users"
                />
              </label>

              <label className="users-role-filter">
                <span className="sr-only">Filter by role</span>
                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  aria-label="Filter users by role"
                >
                  <option value="All">All roles</option>
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {loading ? (
            <div className="users-loading" role="status">
              <span className="users-spinner" aria-hidden="true" />
              Loading users...
            </div>
          ) : loadError && users.length === 0 ? (
            <div className="users-empty">
              <span className="users-empty-icon" aria-hidden="true">!</span>
              <h4>User data is unavailable</h4>
              <p>Retry the request after confirming that the backend is running and your admin session is valid.</p>
              <Button variant="secondary" onClick={loadUsers}>Try Again</Button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="users-empty">
              <span className="users-empty-icon" aria-hidden="true">👥</span>
              <h4>{users.length === 0 ? "No users yet" : "No matching users"}</h4>
              <p>
                {users.length === 0
                  ? "Create the first account to get started."
                  : "Try changing your search or role filter."}
              </p>
              {users.length === 0 && (
                <Button variant="secondary" onClick={openCreate}>Create User</Button>
              )}
            </div>
          ) : (
            <div className="users-table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="directory-user">
                          <span className="directory-avatar" aria-hidden="true">
                            {(item.fullName || item.email || "U").charAt(0).toUpperCase()}
                          </span>
                          <span>
                            <strong>{item.fullName}</strong>
                            <small>{item.email}</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge ${String(item.role).toLowerCase()}`}>
                          {item.role}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${item.isActive ? "active" : "inactive"}`}>
                          <span aria-hidden="true" />
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="users-date">{formatDate(item.createdAt)}</td>
                      <td className="users-actions">
                        <button
                          type="button"
                          className="directory-action"
                          onClick={() => openAccess(item)}
                        >
                          Form Access
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {createOpen && (
        <Modal title="Create user account" onClose={closeCreate}>
          <form className="create-user-form" onSubmit={handleCreate} noValidate>
            <div className="create-user-intro">
              <span className="create-user-intro-icon" aria-hidden="true">＋</span>
              <div>
                <strong>Add a new system user</strong>
                <p>
                  The account is active immediately and can sign in using the email and initial password below.
                </p>
              </div>
            </div>

            <div className="create-user-grid">
              <div className={`create-user-field ${errors.fullName ? "has-error" : ""}`}>
                <label htmlFor="new-user-fullname">
                  Full name <span className="required">*</span>
                </label>
                <input
                  id="new-user-fullname"
                  type="text"
                  value={form.fullName}
                  onChange={(event) => updateForm("fullName", event.target.value)}
                  placeholder="e.g. Sara Ahmed"
                  autoComplete="off"
                  autoFocus
                />
                {errors.fullName && <span className="field-error">{errors.fullName}</span>}
              </div>

              <div className={`create-user-field ${errors.email ? "has-error" : ""}`}>
                <label htmlFor="new-user-email">
                  Work email <span className="required">*</span>
                </label>
                <input
                  id="new-user-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                  placeholder="name@company.com"
                  autoComplete="off"
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>
            </div>

            <fieldset className={`create-user-role ${errors.role ? "has-error" : ""}`}>
              <legend>
                Role <span className="required">*</span>
              </legend>
              <div className="role-options">
                {ROLE_OPTIONS.map((role) => (
                  <label
                    key={role}
                    className={`role-option ${form.role === role ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={form.role === role}
                      onChange={(event) => updateForm("role", event.target.value)}
                    />
                    <span className={`role-option-mark ${role.toLowerCase()}`} aria-hidden="true">
                      {role === "User" ? "U" : role === "Manager" ? "M" : "A"}
                    </span>
                    <span>
                      <strong>{role}</strong>
                      <small>
                        {role === "User" && "Fill and submit forms"}
                        {role === "Manager" && "Review and approve form versions"}
                        {role === "Admin" && "Manage users and form configuration"}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
              {errors.role && <span className="field-error">{errors.role}</span>}
            </fieldset>

            <div className={`create-user-field ${errors.password ? "has-error" : ""}`}>
              <div className="create-user-label-row">
                <label htmlFor="new-user-password">
                  Initial password <span className="required">*</span>
                </label>
                <button type="button" className="generate-password" onClick={handleGeneratePassword}>
                  Generate password
                </button>
              </div>

              <div className="password-control">
                <input
                  id="new-user-password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => updateForm("password", event.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {errors.password ? (
                <span className="field-error">{errors.password}</span>
              ) : (
                <span className="field-help">
                  Share this password securely. It will not be shown in the user directory after creation.
                </span>
              )}
            </div>

            {submitError && (
              <div className="form-error create-user-error" role="alert">{submitError}</div>
            )}

            <div className="create-user-actions">
              <Button type="button" variant="secondary" onClick={closeCreate} disabled={creating}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={creating}>
                {creating ? "Creating user..." : "Create User"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {accessTarget && (
        <Modal
          title={`Share forms with ${accessTarget.fullName || accessTarget.email}`}
          onClose={closeAccess}
        >
          <div className="form-access-modal">
            <p className="approval-desc">
              The user can only see and fill the forms you share with them.
              Toggle a form to share or hide it.
            </p>

            {accessError && (
              <div className="form-error" role="alert">{accessError}</div>
            )}

            {!accessError && accessDone && (
              <div className="admin-message success">{accessDone}</div>
            )}

            {accessLoading ? (
              <div className="loading-state">Loading forms...</div>
            ) : accessForms.length === 0 ? (
              <div className="admin-empty">
                No forms available to share yet.
              </div>
            ) : (
              <div className="form-access-list">
                {accessForms.map((form) => {
                  const granted = accessGranted.has(form.id);
                  return (
                    <label
                      key={form.id}
                      className={`form-access-row ${granted ? "granted" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={granted}
                        disabled={accessSaving !== null}
                        onChange={() => toggleAccess(form.id)}
                      />
                      <span className="form-access-meta">
                        <strong>{form.name}</strong>
                        <small>{form.description || "No description"}</small>
                      </span>
                      <span className="form-access-state">
                        {accessSaving === form.id
                          ? "Saving..."
                          : granted
                            ? "Shared"
                            : "Hidden"}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            <div className="reject-actions">
              <Button variant="secondary" onClick={closeAccess}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default AdminUsers;
