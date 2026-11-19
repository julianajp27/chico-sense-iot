
import api from "./api";

/* ---------- Utilitários de mapeamento ---------- */

function pick(source, ...keys) {
  for (const key of keys) {
    const value = source?.[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
}

function asList(data) {
  if (Array.isArray(data)) return data;

  const list = pick(
    data,
    "items",
    "itens",
    "results",
    "resultados",
    "dados"
  );

  return Array.isArray(list) ? list : [];
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
}

/* ---------- Mapeamento de status ---------- */

function mapStatus(value) {
  const status = normalizeText(value);

  if (
    [
      "em_transito",
      "transito",
      "em_andamento",
      "iniciada",
      "in_transit",
    ].includes(status)
  ) {
    return "in_transit";
  }

  if (
    [
      "planejada",
      "programada",
      "agendada",
      "criada",
      "scheduled",
    ].includes(status)
  ) {
    return "scheduled";
  }

  if (
    [
      "concluida",
      "finalizada",
      "entregue",
      "encerrada",
      "completed",
    ].includes(status)
  ) {
    return "completed";
  }

  if (["cancelada", "cancelled", "canceled"].includes(status)) {
    return "cancelled";
  }

  return "unknown";
}

function toText(value, ...keys) {
  if (value && typeof value === "object") {
    return pick(value, ...keys);
  }

  return value;
}

function mapVehicle(raw) {
  const vehicle = pick(raw, "veiculo");

  if (!vehicle) {
    return pick(raw, "veiculo_id");
  }

  if (typeof vehicle !== "object") {
    return vehicle;
  }

  const plate = pick(vehicle, "placa");

  return [
    pick(vehicle, "descricao", "modelo", "nome"),
    plate ? `Placa ${plate}` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
}

/* ---------- Mapeamento de viagens ---------- */

function mapViagem(raw) {
  return {
    id: pick(raw, "id", "viagem_id"),

    code: pick(
      raw,
      "codigo",
      "numero",
      "identificador",
      "id"
    ),

    origin: pick(raw, "origem", "cidade_origem"),

    destination: pick(raw, "destino", "cidade_destino"),

    transportadoraId: pick(raw, "transportadora_id"),

    vehicleId: pick(raw, "veiculo_id"),

    driverId: pick(raw, "motorista_id"),

    vehicle: mapVehicle(raw),

    driver:
      toText(
        pick(raw, "motorista"),
        "nome",
        "name"
      ) ?? pick(raw, "motorista_id"),

    departureAt: pick(
      raw,
      "saida_em",
      "partida_prevista",
      "data_partida",
      "partida",
      "saida_prevista",
      "inicio_previsto"
    ),

    arrivalAt: pick(
      raw,
      "previsao_chegada_em",
      "chegada_prevista",
      "data_chegada",
      "chegada",
      "fim_previsto"
    ),

    actualDepartureAt: pick(raw, "inicio_real"),

    actualArrivalAt: pick(raw, "chegada_em"),

    loadsCount: pick(
      raw,
      "total_cargas",
      "qtd_cargas",
      "quantidade_cargas"
    ),

    status: mapStatus(
      pick(raw, "status", "situacao", "estado")
    ),

    observations: pick(raw, "observacoes"),
  };
}

/* ---------- Mapeamento de cargas ---------- */

function mapCarga(raw) {
  return {
    id: pick(raw, "id", "carga_id"),

    code: pick(
      raw,
      "identificacao",
      "codigo",
      "numero",
      "identificador",
      "id"
    ),

    variety: toText(
      pick(raw, "variedade", "produto"),
      "nome",
      "variedade"
    ),

    harvestLot: pick(
      raw,
      "lote_colheita",
      "lote",
      "lote_de_colheita"
    ),

    boxes: pick(
      raw,
      "quantidade_caixas",
      "total_caixas",
      "caixas",
      "qtd_caixas"
    ),

    netWeightKg: pick(
      raw,
      "peso_liquido_kg",
      "peso_liquido",
      "peso_kg"
    ),

    status: mapStatus(pick(raw, "status")),
  };
}

/* ==========================================
   VIAGENS
========================================== */

// GET /api/v1/viagens
export async function listarViagens(config) {
  const { data } = await api.get(
    "/api/v1/viagens",
    config
  );

  return asList(data).map(mapViagem);
}

// GET /api/v1/viagens/{viagem_id}
export async function obterViagem(viagemId, config) {
  const { data } = await api.get(
    `/api/v1/viagens/${viagemId}`,
    config
  );

  return mapViagem(data);
}

// POST /api/v1/viagens
export async function criarViagem(payload, config) {
  const { data } = await api.post(
    "/api/v1/viagens",
    payload,
    config
  );

  return mapViagem(data);
}

// PATCH /api/v1/viagens/{viagem_id}
export async function atualizarViagem(
  viagemId,
  payload,
  config
) {
  const { data } = await api.patch(
    `/api/v1/viagens/${viagemId}`,
    payload,
    config
  );

  return mapViagem(data);
}

/* ==========================================
   CARGAS VINCULADAS À VIAGEM
========================================== */

// GET /api/v1/viagens/{viagem_id}/cargas
export async function listarCargas(viagemId, config) {
  const { data } = await api.get(
    `/api/v1/viagens/${viagemId}/cargas`,
    config
  );

  return asList(data).map(mapCarga);
}

/* ==========================================
   TRANSPORTADORAS
========================================== */

// GET /api/v1/empresas
export async function listarTransportadoras(config) {
  const { data } = await api.get(
    "/api/v1/empresas",
    config
  );

  return asList(data);
}

/* ==========================================
   VEÍCULOS
========================================== */

// GET /api/v1/veiculos
export async function listarVeiculos(
  empresaId,
  config = {}
) {
  const { data } = await api.get(
    "/api/v1/veiculos",
    {
      ...config,
      params: {
        ...config.params,
        ...(empresaId
          ? { empresa_id: empresaId }
          : {}),
        ativo: true,
      },
    }
  );

  return asList(data);
}

/* ==========================================
   MOTORISTAS
========================================== */

// GET /api/v1/motoristas
export async function listarMotoristas(
  empresaId,
  config = {}
) {
  const { data } = await api.get(
    "/api/v1/motoristas",
    {
      ...config,
      params: {
        ...config.params,
        ...(empresaId
          ? { empresa_id: empresaId }
          : {}),
        ativo: true,
      },
    }
  );

  return asList(data);
}
