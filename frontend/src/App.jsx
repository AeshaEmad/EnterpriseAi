import "./App.css";
import { useState, useEffect } from "react";
import AutoFiller from "./pages/AutoFiller";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { getSessionUser, logout } from "./services/auth";

function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState("login");
  const [view, setView] = useState("home");
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getSessionUser().then((u) => {
      if (!cancelled) {
        setUser(u);
        setAuthLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    setView("home");
  };

  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="loading-state">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-page">
        {authView === "login" ? (
          <Login
            onSuccess={setUser}
            onSwitch={() => setAuthView("register")}
          />
        ) : (
          <Register
            onSuccess={setUser}
            onSwitch={() => setAuthView("login")}
          />
        )}
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
