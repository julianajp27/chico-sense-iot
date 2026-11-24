
import api from "./api";

import {
  listarLeiturasSessao,
  normalizarLeituras,
} from "./monitoramentoService";

// ==========================================
// LEITURAS OPERACIONAIS POR SESSÃO
// ==========================================

export async function listarLeituras(
  sessaoId,
  { limit = 100, offset = 0 } = {}
) {
  if (!sessaoId) {
    return [];
  }

  const resposta = await listarLeiturasSessao(
    sessaoId,
    { limit, offset }
  );

  const leituras = normalizarLeituras(
    resposta.leituras
  );

  const registros = new Map();

  leituras.forEach((leitura) => {
    const timestamp = leitura.timestamp;

    if (!timestamp) return;

    if (!registros.has(timestamp)) {
      registros.set(timestamp, {
        timestamp,
        temperature: null,
        humidity: null,
      });
    }

    const registro = registros.get(timestamp);

    const tipo = String(leitura.tipo ?? "")
      .trim()
      .toUpperCase();

    if (
      tipo === "TEMPERATURA" ||
      tipo === "TEMPERATURE"
    ) {
      registro.temperature = leitura.valor;
    }

    if (
      tipo === "UMIDADE" ||
      tipo === "HUMIDITY"
    ) {
      registro.humidity = leitura.valor;
    }
  });

  return Array.from(registros.values()).sort(
    (a, b) =>
      new Date(a.timestamp) - new Date(b.timestamp)
  );
}

// ==========================================
// THINGSPEAK - EXCLUSIVO DO ADMIN
// ==========================================

// Consulta configuração da integração global
export async function obterStatusThingSpeak() {
  const { data } = await api.get(
    "/api/v1/integracoes/thingspeak/status"
  );

  return data;
}

// Consulta feeds globais
export async function listarFeedsThingSpeak(results = 10) {
  const { data } = await api.get(
    "/api/v1/integracoes/thingspeak/feeds",
    {
      params: { results },
    }
  );

  return data;
}

// Consulta última leitura global
export async function obterUltimaLeituraThingSpeak() {
  const { data } = await api.get(
    "/api/v1/integracoes/thingspeak/ultima-leitura"
  );

  return data;
}

// Sincronização administrativa global
export async function sincronizarThingSpeak(results = 100) {
  const { data } = await api.post(
    "/api/v1/integracoes/thingspeak/sincronizar",
    null,
    {
      params: { results },
    }
  );

  return data;
}
