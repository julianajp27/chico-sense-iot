import { useCallback, useEffect, useRef, useState } from "react";

import api from "../services/api";

const INTERVAL_MS = 60000;

function formatTime(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Fortaleza",
  }).format(date);
}

export default function useSystemStatus() {
  // checking | online | offline
  const [status, setStatus] = useState("checking");
  const [lastCheck, setLastCheck] = useState("");

  const mounted = useRef(true);
  const inFlight = useRef(false);

  const check = useCallback(async () => {
    if (inFlight.current) return;

    inFlight.current = true;

    try {
      await api.get("/health", { timeout: 60000 });

      if (mounted.current) setStatus("online");
    } catch {
      if (mounted.current) setStatus("offline");
    } finally {
      inFlight.current = false;

      if (mounted.current) {
        setLastCheck(`Verificado às ${formatTime(new Date())}`);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;

    check();

    const timer = setInterval(check, INTERVAL_MS);

    return () => {
      mounted.current = false;
      clearInterval(timer);
    };
  }, [check]);

  return { status, lastCheck };
}