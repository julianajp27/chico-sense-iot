
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
import { buscarUsuario } from "./services/authService";
import { getUserProfile, validateUser } from "./services/authProfile";
import { clearSessionToken, getSessionToken } from "./services/session";

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [restoring, setRestoring] = useState(() => Boolean(getSessionToken()));
  const [restoreError, setRestoreError] = useState("");
  const [restoreAttempt, setRestoreAttempt] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  const system = useSystemStatus();

  useEffect(() => {
    const token = getSessionToken();
    if (!token) return;
    let cancelled = false;

    async function restore() {
      try {
        const restored = validateUser(await buscarUsuario(token));
        if (cancelled || getSessionToken() !== token) return;
        setUser(restored);
        setProfile(getUserProfile(restored));
      } catch (error) {
        if (cancelled || getSessionToken() !== token) return;
        const status = error.response?.status;
        if (error.isAxiosError && (!error.response || status >= 500 || status === 429)) {
          setRestoreError("Não foi possível verificar a sessão na API. Tente novamente ou volte ao login.");
        } else {
          clearSessionToken();
        }
      } finally {
        if (!cancelled) setRestoring(false);
      }
    }
    restore();
    return () => { cancelled = true; };
  }, [restoreAttempt]);

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
      clearSessionToken();

      setUser(null);
      setProfile(null);
      setIsMenuOpen(false);
      setRestoring(false);
      setRestoreError("");

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
    const validated = validateUser(loginUser);
    setUser(validated);
    setProfile(getUserProfile(validated));

    navigate("/dashboard", { replace: true });
  }

  // Encerra a sessão
  function handleExit() {
    clearSessionToken();

    setUser(null);
    setProfile(null);
    setIsMenuOpen(false);
    setRestoring(false);
    setRestoreError("");

    navigate("/login", { replace: true });
  }

  const isAuthenticated = Boolean(user && profile);

  if (restoring) return <main role="status">Verificando sessão…</main>;
  if (restoreError) return (
    <main>
      <p role="alert">{restoreError}</p>
      <button type="button" onClick={() => {
        setRestoreError("");
        setRestoring(true);
        setRestoreAttempt((value) => value + 1);
      }}>Tentar novamente</button>
      <button type="button" onClick={handleExit}>Voltar ao login</button>
    </main>
  );

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
