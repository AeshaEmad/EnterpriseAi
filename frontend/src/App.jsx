import "./App.css";
import "./admin-users.css";
import { useState, useEffect } from "react";
import AutoFiller from "./pages/AutoFiller";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import AdminUsers from "./pages/AdminUsers";
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

  if (!user) {
    return (
      <div className="auth-page">
        <Login onSuccess={setUser} />
      </div>
    );
  }

  const isAdmin = user.role === "admin";

  if (view === "admin-users" && isAdmin) {
    return (
      <AdminUsers
        user={user}
        onLogout={handleLogout}
        onBack={() => setView("home")}
        onOpenUsers={openAdminUsers}
        onOpenForms={openAdminForms}
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
      />
    );
  }

  if (view === "home" || (view.startsWith("admin-") && !isAdmin)) {
    return (
      <Home
        user={user}
        onOpenDemo={() => setView("autofiller")}
        onOpenAdmin={openAdminUsers}
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
