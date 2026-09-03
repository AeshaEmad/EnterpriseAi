import "./App.css";
import "./admin-users.css";
import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import AutoFiller from "./pages/AutoFiller";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import AdminUsers from "./pages/AdminUsers";
import BusinessRules from "./pages/BusinessRules";
import Manager from "./pages/Manager";
import Login from "./pages/Login";
import { getSessionUser, logout } from "./services/auth";

function ProtectedRoute({ user, allowedRoles, children }) {
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppContent() {
  const [user, setUser] = useState(getSessionUser);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleExpired = () => {
      logout();
      setUser(null);
      navigate("/login");
    };
    window.addEventListener("auth:expired", handleExpired);

    return () => {
      window.removeEventListener("auth:expired", handleExpired);
    };
  }, [navigate]);

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate("/login");
  };

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    const from = location.state?.from;
    const redirectPath = from
      ? from.pathname + (from.search || "") + (from.hash || "")
      : "/";
    navigate(redirectPath, { replace: true });
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/" replace />
          ) : (
            <div className="auth-page">
              <Login onSuccess={handleLoginSuccess} />
            </div>
          )
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute user={user}>
            <Home
              user={user}
              onOpenDemo={() => navigate("/autofiller")}
              onOpenAdmin={() => navigate("/admin/users")}
              onOpenManager={() => navigate("/manager")}
              onLogout={handleLogout}
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/autofiller"
        element={
          <ProtectedRoute user={user}>
            <AutoFiller
              user={user}
              onLogout={handleLogout}
              onBack={() => navigate("/")}
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={<Navigate to="/admin/users" replace />}
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute user={user} allowedRoles={["admin"]}>
            <AdminUsers
              user={user}
              onLogout={handleLogout}
              onBack={() => navigate("/")}
              onOpenUsers={() => navigate("/admin/users")}
              onOpenForms={() => navigate("/admin/forms")}
              onOpenRules={() => navigate("/admin/rules")}
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/forms"
        element={
          <ProtectedRoute user={user} allowedRoles={["admin"]}>
            <Admin
              user={user}
              onLogout={handleLogout}
              onBack={() => navigate("/")}
              onOpenUsers={() => navigate("/admin/users")}
              onOpenForms={() => navigate("/admin/forms")}
              onOpenRules={() => navigate("/admin/rules")}
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/rules"
        element={
          <ProtectedRoute user={user} allowedRoles={["admin"]}>
            <BusinessRules
              user={user}
              onLogout={handleLogout}
              onBack={() => navigate("/")}
              onOpenUsers={() => navigate("/admin/users")}
              onOpenForms={() => navigate("/admin/forms")}
              onOpenRules={() => navigate("/admin/rules")}
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager"
        element={
          <ProtectedRoute user={user} allowedRoles={["manager"]}>
            <Manager
              user={user}
              onLogout={handleLogout}
              onBack={() => navigate("/")}
            />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
