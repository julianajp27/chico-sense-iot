
import { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Header from "./components/Header/Header";
import Sidebar from "./components/Sidebar/Sidebar";
import useSystemStatus from "./hooks/useSystemStatus";
import Login from "./pages/Login/Login";
import AppRoutes from "./routes/AppRoutes";

const validProfiles = ["produtor", "logistica", "cliente"];

function normalizeProfile(value) {
  const normalized = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  const aliases = {
    produtor: "produtor",
    producer: "produtor",
    logistica: "logistica",
    logistics: "logistica",
    cliente: "cliente",
    client: "cliente",
    mercado: "cliente",
  };

  return aliases[normalized] || null;
}

function getUserProfile(user) {
  const candidates = [
    user?.perfil,
    user?.profile,
    user?.tipo_usuario,
    user?.tipo,
    user?.role,
    user?.papel,
  ];

  for (const candidate of candidates) {
    const value =
      typeof candidate === "object" && candidate !== null
        ? candidate.nome ?? candidate.name ?? candidate.codigo
        : candidate;

    const profile = normalizeProfile(value);

    if (profile && validProfiles.includes(profile)) {
      return profile;
    }
  }

  return null;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const system = useSystemStatus();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    function handleSessionExpired() {
      sessionStorage.removeItem("chicosense_token");

      setUser(null);
      setProfile(null);
      setIsMenuOpen(false);

      navigate("/login", { replace: true });
    }

    window.addEventListener(
      "auth:expired",
      handleSessionExpired
    );

    return () => {
      window.removeEventListener(
        "auth:expired",
        handleSessionExpired
      );
    };
  }, [navigate]);

  function handleContinue(loginUser) {
    const authenticatedProfile = getUserProfile(loginUser);

    if (!authenticatedProfile) {
      console.error(
        "O backend não retornou um perfil reconhecido.",
        loginUser
      );

      sessionStorage.removeItem("chicosense_token");
      setUser(null);
      setProfile(null);

      throw new Error(
        "Não foi possível identificar seu perfil de acesso. " +
        "Verifique as informações da conta."
      );
    }

    setUser(loginUser);
    setProfile(authenticatedProfile);

    navigate("/dashboard", { replace: true });
  }

  function handleExit() {
    sessionStorage.removeItem("chicosense_token");

    setUser(null);
    setProfile(null);
    setIsMenuOpen(false);

    navigate("/login", { replace: true });
  }

  const isAuthenticated = Boolean(user && profile);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={isAuthenticated ? "/dashboard" : "/login"}
            replace
          />
        }
      />

      <Route
        path="/selecionar-perfil"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login onContinue={handleContinue} />
          )
        }
      />

      <Route
        path="/*"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <div className="app-layout">
              <a
                className="skip-link"
                href="#main-content"
              >
                Ir para o conteúdo
              </a>

              <Sidebar
                user={user}
                alertCount={0}
                systemOnline={system.status === "online"}
                systemChecking={
                  system.status === "checking"
                }
                lastReading={system.lastCheck}
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onLogout={handleExit}
              />

              <div className="app-layout__body">
                <Header
                  user={user}
                  profile={profile}
                  alertCount={0}
                  onNotificationsClick={() =>
                    navigate("/alertas")
                  }
                  onMenuClick={() =>
                    setIsMenuOpen((current) => !current)
                  }
                  isMenuOpen={isMenuOpen}
                />

                <main
                  id="main-content"
                  className="app-layout__content"
                  tabIndex={-1}
                >
                  <AppRoutes
                    user={user}
                    profile={profile}
                  />
                </main>
              </div>
            </div>
          )
        }
      />
    </Routes>
  );
}
