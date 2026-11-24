
import api from "./api";

import {
  listarSessoesCarga,
  listarSessoesViagem,
} from "./monitoramentoService";

const BASE_URL = "/api/v1/monitoramentos";

function validarId(id, mensagem) {
  if (!id) {
    throw new Error(mensagem);
  }
}

function extrairAlertas(data) {
  if (Array.isArray(data)) return data;

  for (const chave of ["alertas", "items", "itens"]) {
    if (Array.isArray(data?.[chave])) {
      return data[chave];
    }
  }

  throw new Error(
    "Formato de resposta dos alertas não reconhecido."
  );
}

// ==========================================
// CONSULTA DE ALERTAS
// ==========================================

// Adaptação provisória para os componentes atuais.
// Confirmar os campos com o JSON real do Swagger.
function mapAlerta(raw, contexto = {}) {
  return {
    ...raw,

    id: raw.id ?? raw.alerta_id,

    title: raw.titulo ?? raw.title ?? raw.tipo,
    titulo: raw.titulo ?? raw.title ?? raw.tipo,

    description: raw.descricao ?? raw.description,
    descricao: raw.descricao ?? raw.description,

    status: raw.status,
    severity: raw.severidade ?? raw.severity,

    timestamp:
      raw.criado_em ??
      raw.detectado_em ??
      raw.timestamp,

    createdAt:
      raw.criado_em ??
      raw.detectado_em ??
      raw.timestamp,

    sessaoId: contexto.sessaoId ?? raw.sessao_id,
    cargaId: contexto.cargaId ?? raw.carga_id,
    viagemId: contexto.viagemId ?? raw.viagem_id,
  };
}

// Lista alertas oficiais de uma sessão.
// O argumento configuracao foi mantido por
// compatibilidade com as chamadas anteriores.
export async function listarAlertasSessao(
  sessaoId,
  configuracao = {},
  contexto = {}
) {
  if (!sessaoId) return [];

  const { data } = await api.get(
    `${BASE_URL}/${sessaoId}/alertas`
  );

  return extrairAlertas(data).map((alerta) =>
    mapAlerta(alerta, {
      ...contexto,
      sessaoId,
    })
  );
}

// Lista alertas das sessões de uma carga
export async function listarAlertasCarga(
  cargaId,
  configuracao = {},
  contexto = {}
) {
  if (!cargaId) return [];

  const sessoes = await listarSessoesCarga(cargaId);

  const resultados = await Promise.all(
    sessoes.map((sessao) =>
      listarAlertasSessao(
        sessao.id ?? sessao.sessao_id,
        configuracao,
        {
          ...contexto,
          cargaId,
        }
      )
    )
  );

  return resultados.flat().sort(
    (a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
  );
}

// Lista alertas das sessões de uma viagem
export async function listarAlertasViagem(viagemId) {
  if (!viagemId) return [];

  const sessoes = await listarSessoesViagem(viagemId);

  const resultados = await Promise.all(
    sessoes.map((sessao) =>
      listarAlertasSessao(
        sessao.id ?? sessao.sessao_id,
        {},
        {
          viagemId,
          cargaId: sessao.carga_id,
        }
      )
    )
  );

  return resultados.flat().sort(
    (a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
  );
}

// Consulta um alerta específico
export async function obterAlerta(sessaoId, alertaId) {
  validarId(sessaoId, "Informe a sessão.");
  validarId(alertaId, "Informe o alerta.");

  const { data } = await api.get(
    `${BASE_URL}/${sessaoId}/alertas/${alertaId}`
  );

  return mapAlerta(data, { sessaoId });
}

// ==========================================
// DECISÕES SOBRE ALERTAS
// ==========================================

// Registra uma decisão humana
export async function registrarDecisaoAlerta(
  sessaoId,
  alertaId,
  payload
) {
  validarId(sessaoId, "Informe a sessão.");
  validarId(alertaId, "Informe o alerta.");

  const { data } = await api.post(
    `${BASE_URL}/${sessaoId}/alertas/${alertaId}/decisoes`,
    payload
  );

  return data;
}

// Consulta histórico de decisões
export async function listarDecisoesAlerta(
  sessaoId,
  alertaId
) {
  validarId(sessaoId, "Informe a sessão.");
  validarId(alertaId, "Informe o alerta.");

  const { data } = await api.get(
    `${BASE_URL}/${sessaoId}/alertas/${alertaId}/decisoes`
  );

  return data;
}

// Consulta evidências de um alerta
export async function listarEvidenciasAlerta(
  sessaoId,
  alertaId
) {
  validarId(sessaoId, "Informe a sessão.");
  validarId(alertaId, "Informe o alerta.");

  const { data } = await api.get(
    `${BASE_URL}/${sessaoId}/alertas/${alertaId}/evidencias`
  );

  return data;
}

// ==========================================
// MONITORAMENTO PREVENTIVO
// ==========================================

// Registra configuração ambiental
export async function criarConfiguracaoAmbiental(
  sessaoId,
  payload
) {
  validarId(sessaoId, "Informe a sessão.");

  const { data } = await api.post(
    `${BASE_URL}/${sessaoId}/configuracoes-ambientais`,
    payload
  );

  return data;
}

// Lista configurações ambientais
export async function listarConfiguracoesAmbientais(sessaoId) {
  validarId(sessaoId, "Informe a sessão.");

  const { data } = await api.get(
    `${BASE_URL}/${sessaoId}/configuracoes-ambientais`
  );

  return data;
}

// Solicita avaliação preventiva ao backend
export async function criarAvaliacaoPreventiva(
  sessaoId,
  payload
) {
  validarId(sessaoId, "Informe a sessão.");

  const { data } = await api.post(
    `${BASE_URL}/${sessaoId}/avaliacoes-preventivas`,
    payload
  );

  return data;
}

// Lista avaliações preventivas
export async function listarAvaliacoesPreventivas(sessaoId) {
  validarId(sessaoId, "Informe a sessão.");

  const { data } = await api.get(
    `${BASE_URL}/${sessaoId}/avaliacoes-preventivas`
  );

  return data;
}

// Consulta uma avaliação específica
export async function obterAvaliacaoPreventiva(
  sessaoId,
  avaliacaoId
) {
  validarId(sessaoId, "Informe a sessão.");
  validarId(avaliacaoId, "Informe a avaliação.");

  const { data } = await api.get(
    `${BASE_URL}/${sessaoId}/avaliacoes-preventivas/${avaliacaoId}`
  );

  return data;
}
