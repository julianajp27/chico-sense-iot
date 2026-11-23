
import api from "./api";

export async function listarSessoesCarga(cargaId) {
  if (!cargaId) return [];

  const { data } = await api.get(
    `/api/v1/cargas/${cargaId}/monitoramentos`,
    {
      params: {
        limit: 100,
        offset: 0,
      },
    }
  );

  return Array.isArray(data) ? data : [];
}

export async function obterSessao(sessaoId) {
  if (!sessaoId) return null;

  const { data } = await api.get(
    `/api/v1/monitoramentos/${sessaoId}`
  );

  return data;
}

export async function listarLeiturasSessao(
  sessaoId,
  { limit = 100, offset = 0, tipo } = {}
) {
  if (!sessaoId) {
    return {
      leituras: [],
      total: 0,
    };
  }

  const { data } = await api.get(
    `/api/v1/monitoramentos/${sessaoId}/leituras`,
    {
      params: {
        limit,
        offset,
        ...(tipo ? { tipo } : {}),
      },
    }
  );

  return data;
}

export function normalizarLeituras(leituras = []) {
  return leituras
    .filter((leitura) => {
      if (
        !leitura ||
        leitura.valor === null ||
        leitura.valor === undefined ||
        leitura.valor === ""
      ) {
        return false;
      }

      if (
        leitura.conflito_observado ||
        leitura.fora_de_ordem
      ) {
        return false;
      }

      // O significado dos estados precisa ser validado
      // antes de aplicar filtros adicionais.
      return true;
    })
    .map((leitura) => {
      const valor = Number(leitura.valor);

      return {
        id: leitura.id,
        sensorId: leitura.sensor_id,
        tipo: leitura.tipo,
        valor,
        unidade: leitura.unidade,
        timestamp: leitura.medida_em,
        estado: leitura.estado,
        tardia: leitura.tardia,
        aposEncerramento: leitura.apos_encerramento,
      };
    })
    .filter((leitura) => Number.isFinite(leitura.valor))
    .sort(
      (a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
    );
}
