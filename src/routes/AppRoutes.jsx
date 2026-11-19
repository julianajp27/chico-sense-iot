
import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Card from "../components/UI/Card";

import Dashboard from "../pages/Dashboard/Dashboard";
import Viagens from "../pages/Viagens/Viagens";
import Cargas from "../pages/Cargas/Cargas";
import Monitoramento from "../pages/Monitoramento/Monitoramento";
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
          O conteúdo desta página será implementado
          nas próximas etapas.
        </p>
      </Card>
    </div>
  );
}

function getErrorMessage(error) {
  if (error.response?.status === 401) {
    return "Sua sessão expirou. Faça login novamente.";
  }

  if (error.response?.status === 403) {
    return "Você não tem permissão para consultar as viagens.";
  }

  return (
    error.response?.data?.message ||
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
      setTrips(data);
    } catch (err) {
      console.error("Erro ao carregar viagens:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

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

      <Route
        path="/alertas"
        element={<Alertas />}
      />

      <Route
        path="/historico"
        element={<Historico />}
      />

      <Route
        path="/chicosense-ia"
        element={<ChicoSenseIA />}
      />

      <Route
        path="/configuracoes"
        element={
          <Configuracoes
            user={user}
            profile={profile}
          />
        }
      />

      {pages.map(({ path, title }) => (
        <Route
          key={path}
          path={path}
          element={<InitialPage title={title} />}
        />
      ))}

      <Route
        path="*"
        element={
          <InitialPage title="Página não encontrada" />
        }
      />
    </Routes>
  );
}
