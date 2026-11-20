
import api from "./api";

const BASE_URL = "/api/v1/monitoramentos";

function validarSessao(sessaoId) {
  if (!sessaoId) {
    throw new Error("Selecione uma sessão de monitoramento.");
  }
}

/**
 * Lista as análises de etileno já registradas
 * para uma sessão de monitoramento.
 */
export async function listarAnalisesEtileno(
  sessaoId,
  { limit = 20, offset = 0 } = {}
) {
  validarSessao(sessaoId);

  const { data } = await api.get(
    `${BASE_URL}/${sessaoId}/analises-etileno`,
    {
      params: {
        limit,
        offset,
      },
    }
  );

  return {
    sessao_id: data?.sessao_id ?? sessaoId,
    total: data?.total ?? 0,
    limit: data?.limit ?? limit,
    offset: data?.offset ?? offset,
    analises: Array.isArray(data?.analises)
      ? data.analises
      : [],
  };
}

/**
 * Consulta uma análise específica.
 * Não executa um novo cálculo.
 */
export async function obterAnaliseEtileno(
  sessaoId,
  analiseId
) {
  validarSessao(sessaoId);

  if (!analiseId) {
    throw new Error("Informe a análise que deseja consultar.");
  }

  const { data } = await api.get(
    `${BASE_URL}/${sessaoId}/analises-etileno/${analiseId}`
  );

  return data;
}

/**
 * Solicita ao backend uma nova análise.
 *
 * O backend é responsável pelo cálculo científico,
 * validação dos dados e persistência do resultado.
 */
export async function criarAnaliseEtileno(
  sessaoId,
  {
    chave_idempotencia,
    modo = "MODO_RESTRITO",
    intervalo_maximo_s,
    inicio,
    fim,
    corte_aquisicao,
    revisao_aquisicao,
  }
) {
  validarSessao(sessaoId);

  if (!chave_idempotencia) {
    throw new Error("A chave de idempotência é obrigatória.");
  }

  if (!inicio || !fim) {
    throw new Error("Informe o início e o fim da análise.");
  }

  if (
    intervalo_maximo_s === undefined ||
    intervalo_maximo_s === null ||
    intervalo_maximo_s === ""
  ) {
    throw new Error("Informe o intervalo máximo.");
  }

  const payload = {
    chave_idempotencia,
    modo,
    intervalo_maximo_s: Number(intervalo_maximo_s),
    inicio,
    fim,
    ...(corte_aquisicao
      ? { corte_aquisicao }
      : {}),
    ...(revisao_aquisicao !== undefined &&
    revisao_aquisicao !== null &&
    revisao_aquisicao !== ""
      ? { revisao_aquisicao: Number(revisao_aquisicao) }
      : {}),
  };

  const { data } = await api.post(
    `${BASE_URL}/${sessaoId}/analises-etileno`,
    payload
  );

  return data;
}
