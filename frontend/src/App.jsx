import "./App.css";
import "./admin-users.css";
import { useState, useEffect } from "react";
import AutoFiller from "./pages/AutoFiller";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import AdminUsers from "./pages/AdminUsers";
import BusinessRules from "./pages/BusinessRules";
import Manager from "./pages/Manager";
import Login from "./pages/Login";
import { getSessionUser, logout } from "./services/auth";

function App() {
  const [user, setUser] = useState(getSessionUser);
  const [view, setView] = useState("home");

  useEffect(() => {
    const handleExpired = () => {
      logout();
      setUser(null);
      setView("home");
    };
    window.addEventListener("auth:expired", handleExpired);

    return () => {
      window.removeEventListener("auth:expired", handleExpired);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    setView("home");
  };

  const openAdminUsers = () => setView("admin-users");
  const openAdminForms = () => setView("admin-forms");
  const openAdminRules = () => setView("admin-rules");
  const openManager = () => setView("manager");

  if (!user) {
    return (
      <div className="auth-page">
        <Login onSuccess={setUser} />
      </div>
    );
  }

  const isAdmin = user.role === "admin";
  const isManager = user.role === "manager";

  if (view === "manager" && isManager) {
    return (
      <Manager
        user={user}
        onLogout={handleLogout}
        onBack={() => setView("home")}
      />
    );
  }

  if (view === "admin-users" && isAdmin) {
    return (
      <AdminUsers
        user={user}
        onLogout={handleLogout}
        onBack={() => setView("home")}
        onOpenUsers={openAdminUsers}
        onOpenForms={openAdminForms}
        onOpenRules={openAdminRules}
      />
    );
  }

  if (view === "admin-forms" && isAdmin) {
    return (
      <Admin
        user={user}
        onLogout={handleLogout}
        onBack={() => setView("home")}
        onOpenUsers={openAdminUsers}
        onOpenForms={openAdminForms}
        onOpenRules={openAdminRules}
      />
    );
  }

  if (view === "admin-rules" && isAdmin) {
    return (
      <BusinessRules
        user={user}
        onLogout={handleLogout}
        onBack={() => setView("home")}
        onOpenUsers={openAdminUsers}
        onOpenForms={openAdminForms}
        onOpenRules={openAdminRules}
      />
    );
  }

  if (view === "home" || (view.startsWith("admin-") && !isAdmin) || (view === "manager" && !isManager)) {
    return (
      <Home
        user={user}
        onOpenDemo={() => setView("autofiller")}
        onOpenAdmin={openAdminUsers}
        onOpenManager={openManager}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <AutoFiller
      user={user}
      onLogout={handleLogout}
      onBack={() => setView("home")}
    />
  );
}

export default App;
