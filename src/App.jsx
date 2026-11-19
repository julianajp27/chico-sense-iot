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
import SelecaoPerfil from "./pages/SelecaoPerfil/SelecaoPerfil";
import AppRoutes from "./routes/AppRoutes";

const validProfiles = ["produtor", "logistica", "cliente"];

export default function App() {
  // #region Estado da aplicação
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const system = useSystemStatus();
  // #endregion

  // #region Comportamento do menu
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
  // #endregion

  // #region Sessão expirada (a API respondeu 401)
  useEffect(() => {
    function handleSessionExpired() {
      setUser(null);
      setProfile(null);
      setIsMenuOpen(false);

      navigate("/selecionar-perfil", { replace: true });
    }

    window.addEventListener("auth:expired", handleSessionExpired);

    return () => {
      window.removeEventListener("auth:expired", handleSessionExpired);
    };
  }, [navigate]);
  // #endregion

  // #region Fluxo de acesso
  function handleSelectProfile(selectedProfile) {
    if (!validProfiles.includes(selectedProfile)) return;

    setProfile(selectedProfile);
    navigate(user ? "/dashboard" : "/login");
  }

  function handleContinue(loginUser) {
    setUser(loginUser);
    navigate("/dashboard", { replace: true });
  }

  function handleChangeProfile() {
    navigate("/selecionar-perfil");
  }

  function handleExit() {
    sessionStorage.removeItem("chicosense_token");

    setUser(null);
    setProfile(null);
    setIsMenuOpen(false);

    navigate("/selecionar-perfil", { replace: true });
  }

  const accessDestination = !profile
    ? "/selecionar-perfil"
    : !user
      ? "/login"
      : "/dashboard";
  // #endregion

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={accessDestination} replace />}
      />

      {/* #region Seleção inicial */}
      <Route
        path="/selecionar-perfil"
        element={
          <SelecaoPerfil onSelect={handleSelectProfile} />
        }
      />
      {/* #endregion */}

      {/* #region Login */}
      <Route
        path="/login"
        element={
          !profile ? (
            <Navigate to="/selecionar-perfil" replace />
          ) : user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login
              profile={profile}
              onContinue={handleContinue}
              onChangeProfile={handleChangeProfile}
            />
          )
        }
      />
      {/* #endregion */}

      {/* #region Layout principal */}
      <Route
        path="/*"
        element={
          !user || !profile ? (
            <Navigate to={accessDestination} replace />
          ) : (
            <div className="app-layout">
              <a className="skip-link" href="#main-content">
                Ir para o conteúdo
              </a>

              <Sidebar
                user={user}
                alertCount={0}
                systemOnline={system.status === "online"}
                systemChecking={system.status === "checking"}
                lastReading={system.lastCheck}
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onLogout={handleExit}
              />

              <div className="app-layout__body">
                <Header
                  user={user}
                  profile={profile}
                  onProfileChange={handleSelectProfile}
                  alertCount={0}
                  onNotificationsClick={() => navigate("/alertas")}
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
                  <AppRoutes user={user} profile={profile} />
                </main>
              </div>
            </div>
          )
        }
      />
      {/* #endregion */}
    </Routes>
  );
}