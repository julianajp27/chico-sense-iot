import { Leaf, Store, Truck } from "lucide-react";

import logo from "../../assets/logo-chicosense-48x48.png";
import Button from "../../components/UI/Button";
import Card from "../../components/UI/Card";

const profiles = [
  {
    value: "produtor",
    title: "Produtor",
    description:
      "Acompanhe suas cargas desde a expedição até o destino.",
    icon: Leaf,
  },
  {
    value: "logistica",
    title: "Logística",
    description:
      "Acompanhe viagens, sensores e condições de transporte.",
    icon: Truck,
  },
  {
    value: "cliente",
    title: "Cliente / Mercado",
    description:
      "Consulte a origem e as condições de transporte das cargas.",
    icon: Store,
  },
];

export default function SelecaoPerfil({ onSelect }) {
  return (
    <div className="profile-page">
      <header className="profile-page__header">
        <div className="access-brand">
          <img
            src={logo}
            alt=""
            className="profile-page__logo"
            width={48}
            height={48}
          />

          <div>
            <strong>ChicoSense</strong>

            <span className="access-brand__caption">
              COLD CHAIN INTELLIGENCE
            </span>
          </div>
        </div>
      </header>

      <main className="profile-page__content">
        <div className="profile-page__heading">
          <h1>Como você deseja acessar o ChicoSense?</h1>

          <p>
            Escolha seu perfil para continuar ao login.
            Todas as opções compartilham as mesmas funcionalidades.
          </p>
        </div>

        <div className="profile-page__grid">
          {profiles.map(
            ({ value, title, description, icon: Icon }) => (
              <Card key={value} className="profile-card">
                <span className="profile-card__icon" aria-hidden="true">
                  <Icon size={25} />
                </span>

                <h2 className="profile-card__title">{title}</h2>

                <p className="profile-card__description">
                  {description}
                </p>

                <Button
                  variant={
                    value === "logistica" ? "primary" : "secondary"
                  }
                  onClick={() => onSelect(value)}
                  aria-label={`Continuar como ${title}`}
                >
                  Continuar
                </Button>
              </Card>
            )
          )}
        </div>

        <p className="profile-page__hint">
          Você poderá trocar o perfil pelo cabeçalho do sistema.
        </p>
      </main>
    </div>
  );
}