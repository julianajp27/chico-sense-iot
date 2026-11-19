import api from "./api";

function pick(source, ...keys) {
  for (const key of keys) {
    const value = source?.[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
}

/* ---------- Mapeador (ajustar quando tivermos o JSON real) ---------- */

function mapMonitoramento(raw) {
  if (!raw) return null;

  return {
    precooling: pick(
      raw,
      "pre_resfriamento",
      "pre_resfriamento_realizado",
      "preresfriamento"
    ),
    boardingRecordedAt: pick(
      raw,
      "embarque_registrado_em",
      "embarque_registrado",
      "data_embarque",
      "embarque"
    ),
    samplingInterval: pick(
      raw,
      "intervalo_amostragem_minutos",
      "intervalo_amostragem",
      "amostragem_minutos",
      "amostragem"
    ),
    conservationGuidance: pick(
      raw,
      "orientacao_conservacao",
      "orientacao",
      "observacoes"
    ),
  };
}

/* ---------- Rotas ---------- */

// GET /api/v1/cargas/{carga_id}/monitoramento
export async function obterMonitoramentoCarga(cargaId, config) {
  try {
    const { data } = await api.get(
      `/api/v1/cargas/${cargaId}/monitoramento`,
      config
    );

    return mapMonitoramento(data);
  } catch (err) {
    if (err.response?.status === 404) return null;

    throw err;
  }
}