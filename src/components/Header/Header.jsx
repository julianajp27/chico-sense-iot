
import { Bell, Menu, ShieldCheck } from "lucide-react";

const profileLabels = {
  admin: "Administrador",
  produtor: "Produtor",
  logistica: "Logística",
  cliente: "Cliente / Mercado",
};

function getInitials(name = "") {
  return (
    String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export default function Header({
  user,
  profile,
  alertCount = 0,
  onNotificationsClick,
  onMenuClick,
  isMenuOpen = false,
  isDemo = false,
}) {
  const profileLabel =
    profileLabels[profile] || "Não identificado";

  return (
    <header className="header">
      <div className="header__start">
        <button
          type="button"
          className="header__icon-button header__menu-button"
          aria-label={
            isMenuOpen ? "Fechar menu" : "Abrir menu"
          }
          aria-controls="main-sidebar"
          aria-expanded={isMenuOpen}
          onClick={onMenuClick}
        >
          <Menu size={21} aria-hidden="true" />
        </button>

        <div
          className="header__profile-info"
          aria-label={`Perfil de acesso: ${profileLabel}`}
        >
          <span className="header__profile-icon">
            <ShieldCheck
              size={18}
              aria-hidden="true"
            />
          </span>

          <div className="header__profile-details">
            <span className="header__profile-caption">
              Perfil de acesso
            </span>

            <strong className="header__profile-name">
              {profileLabel}
            </strong>
          </div>
        </div>
      </div>

      <div className="header__actions">
        {isDemo && (
          <span className="header__demo">
            Dados de demonstração
          </span>
        )}

        <button
          type="button"
          className="header__icon-button"
          onClick={onNotificationsClick}
          disabled={!onNotificationsClick}
          aria-label={
            alertCount > 0
              ? `Notificações: ${alertCount} alertas pendentes`
              : "Notificações sem alertas pendentes"
          }
        >
          <Bell size={20} aria-hidden="true" />

          {alertCount > 0 && (
            <span
              className="header__notification-dot"
              aria-hidden="true"
            />
          )}
        </button>

        <span
          className="header__avatar"
          role="img"
          aria-label={`Usuário: ${user?.name || "Usuário"}`}
          title={user?.name || "Usuário"}
        >
          {getInitials(user?.name)}
        </span>
      </div>
    </header>
  );
}
