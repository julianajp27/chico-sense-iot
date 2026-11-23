
import {
  listarSessoesCarga,
  listarLeiturasSessao,
  normalizarLeituras,
} from "./monitoramentoService";

// Converte valores numéricos, inclusive decimais recebidos como string.
function numero(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  const resultado = Number(String(valor).replace(",", "."));

  return Number.isFinite(resultado) ? resultado : null;
}

// Identifica o tipo de medição.
function identificarTipo(tipo = "") {
  const texto = String(tipo).toLowerCase();

  if (
    texto.includes("temperatura") ||
    texto.includes("temperature")
  ) {
    return "temperatura";
  }

  if (
    texto.includes("umidade") ||
    texto.includes("humidity")
  ) {
    return "umidade";
  }

  return null;
}

// Obtém os limites da configuração da carga.
// Não cria limites artificiais quando não estão disponíveis.
function obterLimites(configuracao, tipo) {
  const origem =
    configuracao?.[tipo] ??
    configuracao?.parametros?.[tipo] ??
    configuracao?.limites?.[tipo] ??
    {};

  return {
    minimo: numero(
      origem.minimo ??
      origem.valor_minimo ??
      origem.min ??
      configuracao?.[`${tipo}_minima`] ??
      configuracao?.[`${tipo}_minimo`]
    ),
    maximo: numero(
      origem.maximo ??
      origem.valor_maximo ??
      origem.max ??
      configuracao?.[`${tipo}_maxima`] ??
      configuracao?.[`${tipo}_maximo`]
    ),
  };
}

// Avalia uma leitura usando os limites conhecidos.
export function avaliarLeitura(leitura, configuracao) {
  const tipo = identificarTipo(leitura.tipo);

  if (!tipo) return null;

  const valor = numero(leitura.valor);

  if (valor === null) return null;

  const { minimo, maximo } = obterLimites(
    configuracao,
    tipo
  );

  if (minimo === null && maximo === null) {
    return null;
  }

  let motivo = null;

  if (minimo !== null && valor < minimo) {
    motivo = "abaixo do limite mínimo";
  }

  if (maximo !== null && valor > maximo) {
    motivo = "acima do limite máximo";
  }

  return {
    ...leitura,
    tipo,
    valor,
    minimo,
    maximo,
    foraDoLimite: Boolean(motivo),
    motivo,
  };
}

// Monta as ocorrências a partir das leituras reais.
// Cada ocorrência permanece ativa até uma leitura posterior
// do mesmo sensor retornar à faixa permitida.
export function gerarAlertasDasLeituras(
  leituras = [],
  configuracao = {},
  contexto = {}
) {
  const ordenadas = [...leituras].sort(
    (a, b) =>
      new Date(a.timestamp) - new Date(b.timestamp)
  );

  const ocorrencias = [];
  const abertas = new Map();

  for (const leitura of ordenadas) {
    const avaliacao = avaliarLeitura(
      leitura,
      configuracao
    );

    if (!avaliacao) continue;

    const chave = [
      avaliacao.sensorId ?? "sem-sensor",
      avaliacao.tipo,
    ].join(":");

    const aberta = abertas.get(chave);

    if (avaliacao.foraDoLimite) {
      if (aberta) {
        aberta.ultimaLeitura = avaliacao.timestamp;
        aberta.valor = avaliacao.valor;
        continue;
      }

      const titulo =
        avaliacao.tipo === "temperatura"
          ? "Temperatura fora do limite"
          : "Umidade fora do limite";

      const ocorrencia = {
        id: `${contexto.sessaoId}-${chave}-${avaliacao.id ?? avaliacao.timestamp}`,
        title: titulo,
        titulo,
        description: `${titulo}: ${avaliacao.valor} ${avaliacao.unidade ?? ""} (${avaliacao.motivo}).`,
        descricao: `${titulo}: ${avaliacao.valor} ${avaliacao.unidade ?? ""} (${avaliacao.motivo}).`,
        status: "new",
        severity: "warning",
        tipo: avaliacao.tipo,
        valor: avaliacao.valor,
        unidade: avaliacao.unidade,
        minimo: avaliacao.minimo,
        maximo: avaliacao.maximo,
        sensorId: avaliacao.sensorId,
        timestamp: avaliacao.timestamp,
        createdAt: avaliacao.timestamp,
        ultimaLeitura: avaliacao.timestamp,
        viagemId: contexto.viagemId,
        cargaId: contexto.cargaId,
        sessaoId: contexto.sessaoId,
      };

      ocorrencias.push(ocorrencia);
      abertas.set(chave, ocorrencia);
      continue;
    }

    if (aberta) {
      aberta.status = "resolved";
      aberta.normalizadoEm = avaliacao.timestamp;
      aberta.ultimaLeitura = avaliacao.timestamp;
      abertas.delete(chave);
    }
  }

  return ocorrencias.reverse();
}

// Consulta as leituras de uma sessão e gera seus alertas.
export async function listarAlertasSessao(
  sessaoId,
  configuracao,
  contexto = {}
) {
  if (!sessaoId) return [];

  const resposta = await listarLeiturasSessao(sessaoId, {
    limit: 100,
    offset: 0,
  });

  const dados = Array.isArray(resposta)
    ? resposta
    : resposta?.leituras ?? [];

  const leituras = normalizarLeituras(dados);

  return gerarAlertasDasLeituras(
    leituras,
    configuracao,
    {
      ...contexto,
      sessaoId,
    }
  );
}

// Consulta todas as sessões de uma carga.
export async function listarAlertasCarga(
  cargaId,
  configuracao,
  contexto = {}
) {
  if (!cargaId) return [];

  const sessoes = await listarSessoesCarga(cargaId);

  const resultados = await Promise.all(
    sessoes.map((sessao) =>
      listarAlertasSessao(
        sessao.id,
        configuracao,
        {
          ...contexto,
          cargaId,
        }
      )
    )
  );

  return resultados
    .flat()
    .sort(
      (a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
    );
}
