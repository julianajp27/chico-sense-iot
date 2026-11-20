
import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Card from "../components/UI/Card";

import Dashboard from "../pages/Dashboard/Dashboard";
import Viagens from "../pages/Viagens/Viagens";
import Cargas from "../pages/Cargas/Cargas";
import Monitoramento from "../pages/Monitoramento/Monitoramento";
import Etileno from "../pages/Etileno/Etileno";
import Alertas from "../pages/Alertas/Alertas";
import Historico from "../pages/Historico/Historico";
import ChicoSenseIA from "../pages/ChicoSenseIA/ChicoSenseIA";
import Configuracoes from "../pages/Configuracoes/Configuracoes";

import { listarViagens } from "../services/viagemService";

const pages = [];

function InitialPage({ title }) {
  return (
    <div>
      <h1 className="page-title">{title}</h1>

      <Card>
        <p className="page-placeholder">
          O conteúdo desta página será implementado nas próximas etapas.
        </p>
      </Card>
    </div>
  );
}

function getErrorMessage(error) {
  if (error?.response?.status === 401) {
    return "Sua sessão expirou. Faça login novamente.";
  }

  if (error?.response?.status === 403) {
    return "Você não possui permissão para consultar as viagens.";
  }

  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  return (
    error?.message ||
    "Não foi possível carregar as viagens."
  );
}

export default function AppRoutes({ user, profile }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listarViagens();

      setTrips(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar viagens:", err);

      setError(getErrorMessage(err));
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <Routes>
      {/* Rota inicial */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <Dashboard
            user={user}
            profile={profile}
            trips={trips}
            tripsLoading={loading}
            tripsError={error}
            onRetryTrips={reload}
          />
        }
      />

      {/* Viagens */}
      <Route
        path="/viagens"
        element={
          <Viagens
            trips={trips}
            loading={loading}
            error={error}
            onRetry={reload}
          />
        }
      />

      {/* Cargas */}
      <Route
        path="/cargas"
        element={
          <Cargas
            trips={trips}
            loading={loading}
            error={error}
            onRetry={reload}
          />
        }
      />

      {/* Monitoramento ambiental */}
      <Route
        path="/monitoramento"
        element={
          <Monitoramento
            trips={trips}
            tripsLoading={loading}
            tripsError={error}
            onRetryTrips={reload}
          />
        }
      />

      {/* Análises de Etileno */}
      <Route
        path="/etileno"
        element={
          <Etileno
            trips={trips}
          />
        }
      />

      {/* Central de Alertas */}
      <Route
        path="/alertas"
        element={
          <Alertas
            trips={trips}
            tripsLoading={loading}
            tripsError={error}
            onRetryTrips={reload}
          />
        }
      />

      <Route
  path="/historico"
  element={
    <Historico
      trips={trips}
      loading={loading}
      error={error}
      onRetry={reload}
    />
  }
/>

      <Route
  path="/chicosense-ia"
  element={
    <ChicoSenseIA
      trips={trips}
      tripsLoading={loading}
      tripsError={error}
      onRetryTrips={reload}
    />
  }
/>

      {/* Configurações */}
      <Route
  path="/configuracoes"
  element={
    <Configuracoes
      user={user}
      profile={profile}
      trips={trips}
    />
  }
/>

      {/* Páginas futuras */}
      {pages.map(({ path, title }) => (
        <Route
          key={path}
          path={path}
          element={<InitialPage title={title} />}
        />
      ))}

      {/* Página não encontrada */}
      <Route
        path="*"
        element={
          <InitialPage title="Página não encontrada" />
        }
      />
    </Routes>
  );
}
