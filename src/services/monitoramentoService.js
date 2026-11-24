
import api from "./api";

const BASE_URL = "/api/v1";

// Extrai listas de respostas da API.
// Os formatos alternativos precisam ser confirmados
// com o retorno real do backend.
function extrairLista(data, ...chaves) {
  if (Array.isArray(data)) {
    return data;
  }

  for (const chave of chaves) {
    if (Array.isArray(data?.[chave])) {
      return data[chave];
    }
  }

  throw new Error(
    "Formato de resposta da API não reconhecido."
  );
}

function validarId(id, mensagem) {
  if (!id) {
    throw new Error(mensagem);
  }
}

// ==========================================
// SESSÕES DE MONITORAMENTO
// ==========================================

// Lista sessões vinculadas a uma carga
export async function listarSessoesCarga(
  cargaId,
  { limit = 100, offset = 0 } = {}
) {
  if (!cargaId) return [];

  const { data } = await api.get(
    `${BASE_URL}/cargas/${cargaId}/monitoramentos`,
    {
      params: { limit, offset },
    }
  );

  return extrairLista(
    data,
    "sessoes",
    "monitoramentos",
    "items",
    "itens"
  );
}

// Lista sessões vinculadas a uma viagem
export async function listarSessoesViagem(
  viagemId,
  { limit = 100, offset = 0 } = {}
) {
  if (!viagemId) return [];

  const { data } = await api.get(
    `${BASE_URL}/viagens/${viagemId}/monitoramentos`,
    {
      params: { limit, offset },
    }
  );

  return extrairLista(
    data,
    "sessoes",
    "monitoramentos",
    "items",
    "itens"
  );
}

// Consulta uma sessão específica
export async function obterSessao(sessaoId) {
  if (!sessaoId) return null;

  const { data } = await api.get(
    `${BASE_URL}/monitoramentos/${sessaoId}`
  );

  return data;
}

// Inicia uma sessão de monitoramento
export async function iniciarSessao(cargaId, payload) {
  validarId(cargaId, "Informe a carga.");

  const { data } = await api.post(
    `${BASE_URL}/cargas/${cargaId}/monitoramentos`,
    payload
  );

  return data;
}

// Encerra uma sessão
export async function encerrarSessao(sessaoId, payload) {
  validarId(sessaoId, "Informe a sessão.");

  const { data } = await api.post(
    `${BASE_URL}/monitoramentos/${sessaoId}/encerrar`,
    payload
  );

  return data;
}

// Cancela uma sessão
export async function cancelarSessao(sessaoId, payload) {
  validarId(sessaoId, "Informe a sessão.");

  const { data } = await api.post(
    `${BASE_URL}/monitoramentos/${sessaoId}/cancelar`,
    payload
  );

  return data;
}

// ==========================================
// HISTÓRICO IOT
// ==========================================

// Consulta leituras de uma sessão
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
    `${BASE_URL}/monitoramentos/${sessaoId}/leituras`,
    {
      params: {
        limit,
        offset,
        ...(tipo ? { tipo } : {}),
      },
    }
  );

  const leituras = extrairLista(
    data,
    "leituras",
    "items",
    "itens"
  );

  return {
    ...(Array.isArray(data) ? {} : data),
    leituras,
    total: data?.total ?? leituras.length,
  };
}

// Solicita sincronização do histórico
export async function sincronizarSessao(sessaoId, payload) {
  validarId(sessaoId, "Informe a sessão.");

  const { data } = await api.post(
    `${BASE_URL}/monitoramentos/${sessaoId}/sincronizacoes`,
    payload
  );

  return data;
}

// Consulta sincronizações
export async function listarSincronizacoes(sessaoId, params = {}) {
  validarId(sessaoId, "Informe a sessão.");

  const { data } = await api.get(
    `${BASE_URL}/monitoramentos/${sessaoId}/sincronizacoes`,
    { params }
  );

  return data;
}

// Consulta qualidade das leituras
export async function obterQualidadeSessao(sessaoId) {
  validarId(sessaoId, "Informe a sessão.");

  const { data } = await api.get(
    `${BASE_URL}/monitoramentos/${sessaoId}/qualidade`
  );

  return data;
}

// ==========================================
// NORMALIZAÇÃO DAS LEITURAS
// ==========================================

export function normalizarLeituras(leituras = []) {
  if (!Array.isArray(leituras)) {
    return [];
  }

  return leituras
    .filter((leitura) => {
      if (
        !leitura ||
        leitura.valor === null ||
        leitura.valor === undefined ||
        String(leitura.valor).trim() === ""
      ) {
        return false;
      }

      if (
        leitura.conflito_observado ||
        leitura.fora_de_ordem
      ) {
        return false;
      }

      return true;
    })
    .map((leitura) => ({
      id: leitura.id,
      sensorId: leitura.sensor_id,
      tipo: leitura.tipo,
      valor: Number(leitura.valor),
      unidade: leitura.unidade,
      timestamp: leitura.medida_em,
      estado: leitura.estado,
      tardia: leitura.tardia,
      aposEncerramento: leitura.apos_encerramento,
    }))
    .filter(
      (leitura) =>
        Number.isFinite(leitura.valor) &&
        leitura.timestamp &&
        Number.isFinite(Date.parse(leitura.timestamp))
    )
    .sort(
      (a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
    );
}
