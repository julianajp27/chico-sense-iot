import { useCallback, useEffect, useRef, useState } from "react";

import { obterMonitoramentoCarga } from "../services/cargaService";

export default function useCargaMonitoramento(loadId) {
  const cache = useRef({});
  const latestId = useRef(null);

  const [state, setState] = useState({
    data: null,
    loading: false,
    error: "",
  });

  const load = useCallback(async (id, force = false) => {
    latestId.current = id;

    if (!id) {
      setState({ data: null, loading: false, error: "" });
      return;
    }

    if (!force && id in cache.current) {
      setState({ data: cache.current[id], loading: false, error: "" });
      return;
    }

    setState({ data: null, loading: true, error: "" });

    try {
      const data = await obterMonitoramentoCarga(id);

      cache.current[id] = data;

      if (latestId.current === id) {
        setState({ data, loading: false, error: "" });
      }
    } catch (err) {
      if (latestId.current === id) {
        setState({
          data: null,
          loading: false,
          error:
            err.message ||
            "Não foi possível carregar os dados de monitoramento.",
        });
      }
    }
  }, []);

  useEffect(() => {
    load(loadId);
  }, [loadId, load]);

  return { ...state, retry: () => load(loadId, true) };
}