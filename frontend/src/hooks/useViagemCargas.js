
import { useCallback, useEffect, useRef, useState } from "react";

import { listarCargas } from "../services/viagemService";

export default function useViagemCargas(viagemId) {
  const cache = useRef({});
  const latestId = useRef(null);

  const [state, setState] = useState({
    loads: [],
    loading: false,
    error: "",
  });

  const load = useCallback(async (id, force = false) => {
    latestId.current = id;

    if (id === undefined || id === null || id === "") {
      setState({
        loads: [],
        loading: false,
        error: "",
      });
      return;
    }

    const key = String(id);

    if (!force && key in cache.current) {
      setState({
        loads: cache.current[key],
        loading: false,
        error: "",
      });
      return;
    }

    setState({
      loads: [],
      loading: true,
      error: "",
    });

    try {
      const loads = await listarCargas(id);

      cache.current[key] = loads;

      if (String(latestId.current) === key) {
        setState({
          loads,
          loading: false,
          error: "",
        });
      }
    } catch (err) {
      if (String(latestId.current) === key) {
        setState({
          loads: [],
          loading: false,
          error:
            err.message ||
            "Não foi possível carregar as cargas desta viagem.",
        });
      }
    }
  }, []);

  useEffect(() => {
    load(viagemId);
  }, [viagemId, load]);

  const retry = useCallback(() => {
    load(viagemId, true);
  }, [viagemId, load]);

  return {
    ...state,
    retry,
  };
}
