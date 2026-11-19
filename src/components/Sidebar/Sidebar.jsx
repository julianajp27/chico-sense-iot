import { NavLink } from "react-router-dom";
import {
  Bell,
  Boxes,
  History,
  LayoutDashboard,
  LogOut,
  Route,
  Settings,
  Sparkles,
  Activity,
  X,
} from "lucide-react";

import logo from "../../assets/logo-cchicosense-250x80.png";

const menuItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/viagens", label: "Viagens", icon: Route },
  { to: "/cargas", label: "Cargas", icon: Boxes },
  { to: "/monitoramento", label: "Monitoramento", icon: Activity },
  { to: "/alertas", label: "Alertas", icon: Bell },
  { to: "/chicosense-ia", label: "ChicoSense IA", icon: Sparkles },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export default function Sidebar({
  user,
  alertCount = 0,
  systemOnline = false,
  systemChecking = false,
  lastReading,
  isOpen = false,
  onClose,
  onLogout,
}) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Fechar menu"
          onClick={onClose}
        />
      )}

      <aside
        id="main-sidebar"
        className={`sidebar ${isOpen ? "sidebar--open" : ""}`}
        aria-label="Menu principal"
      >
        {/* #region Logo */}
        <div className="sidebar__header">
          <NavLink
            to="/dashboard"
            className="sidebar__brand"
            onClick={onClose}
            aria-label="ChicoSense — Dashboard"
          >
            <img
              src={logo}
              alt="ChicoSense"
              className="sidebar__logo"
            />
          </NavLink>

          <button
            type="button"
            className="sidebar__close"
            aria-label="Fechar menu"
            onClick={onClose}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {/* #endregion */}

        {/* #region Navegação */}
        <nav className="sidebar__nav" aria-label="Páginas do sistema">
          <p className="sidebar__section-label">Workspace</p>

          <ul className="sidebar__list">
            {menuItems.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `sidebar__link ${
                      isActive ? "sidebar__link--active" : ""
                    }`.trim()
                  }
                >
                  <Icon size={19} aria-hidden="true" />
                  <span>{label}</span>

                  {to === "/alertas" && alertCount > 0 && (
                    <span className="sidebar__badge">
                      <span className="sidebar__sr-only">
                        Alertas pendentes:
                      </span>
                      {alertCount}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        {/* #endregion */}

        {/* #region Conexão e usuário */}
        <div className="sidebar__footer">
          <div className="sidebar__system">
            <div className="sidebar__system-heading">
              <span
                className={`sidebar__system-dot ${
                  systemOnline && !systemChecking
                    ? "sidebar__system-dot--online"
                    : ""
                }`}
                aria-hidden="true"
              />

              <span role="status">
                {systemChecking
                  ? "Verificando conexão…"
                  : systemOnline
                    ? "Sistema operacional"
                    : "Sistema sem conexão"}
              </span>
            </div>

            {lastReading && !systemChecking && (
              <p className="sidebar__last-reading">
                {lastReading}
              </p>
            )}
          </div>

          <div className="sidebar__user">
            <span className="sidebar__avatar" aria-hidden="true">
              {getInitials(user?.name)}
            </span>

            <div className="sidebar__user-info">
              <span className="sidebar__user-name">
                {user?.name || "Usuário"}
              </span>

              {user?.email && (
                <span className="sidebar__user-email">
                  {user.email}
                </span>
              )}
            </div>

            {onLogout && (
              <button
                type="button"
                className="sidebar__logout"
                aria-label="Sair da conta"
                onClick={onLogout}
              >
                <LogOut size={19} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        {/* #endregion */}
      </aside>
    </>
  );
}