
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

// Perfis reconhecidos pelo frontend
const validProfiles = [
  "admin",
  "produtor",
  "logistica",
  "cliente",
];

// Normaliza o perfil retornado pelo backend
function normalizeProfile(value) {
  const normalized = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  const aliases = {
    admin: "admin",
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

// Identifica o perfil do usuário autenticado
function getUserProfile(user) {
  const profile = normalizeProfile(user?.perfil);

  if (profile && validProfiles.includes(profile)) {
    return profile;
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

  // Fecha o menu ao mudar de página
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Fecha o menu ao pressionar Escape
  useEffect(() => {
    if (!isMenuOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [isMenuOpen]);

  // Trata a expiração da sessão
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

  // Finaliza a autenticação
  function handleContinue(loginUser) {
    if (loginUser?.ativo !== true) {
      sessionStorage.removeItem("chicosense_token");

      setUser(null);
      setProfile(null);

      throw new Error(
        "Sua conta está inativa ou não pôde ser validada."
      );
    }

    const authenticatedProfile =
      getUserProfile(loginUser);

    if (!authenticatedProfile) {
      console.error(
        "Perfil não reconhecido:",
        loginUser?.perfil
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

  // Encerra a sessão
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
            to={
              isAuthenticated
                ? "/dashboard"
                : "/login"
            }
            replace
          />
        }
      />

      <Route
        path="/selecionar-perfil"
        element={
          <Navigate to="/login" replace />
        }
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
                systemOnline={
                  system.status === "online"
                }
                systemChecking={
                  system.status === "checking"
                }
                lastReading={system.lastCheck}
                isOpen={isMenuOpen}
                onClose={() =>
                  setIsMenuOpen(false)
                }
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
                    setIsMenuOpen(
                      (current) => !current
                    )
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
