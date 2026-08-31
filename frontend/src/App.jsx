import "./App.css";
import { useState, useEffect } from "react";
import AutoFiller from "./pages/AutoFiller";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
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

  if (!user) {
    return (
      <div className="auth-page">
        <Login onSuccess={setUser} />
      </div>
    );
  }

  if (view === "admin" && user.role === "admin") {
    return (
      <Admin
        user={user}
        onLogout={handleLogout}
        onBack={() => setView("home")}
      />
    );
  }

  if (view === "home") {
    return (
      <Home
        user={user}
        onOpenDemo={() => setView("autofiller")}
        onOpenAdmin={() => setView("admin")}
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
