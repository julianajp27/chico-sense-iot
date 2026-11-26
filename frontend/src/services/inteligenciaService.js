import api from "./api";

// Consulta a disponibilidade do modelo de IA.
export async function obterStatusIA() {
  const response = await api.get("/ia/status");
  return response.data;
}

// Consulta os resultados históricos do ThingSpeak.
export async function obterHistoricoIA() {
  const response = await api.get("/ia/historico");
  return response.data;
}

// Envia medições para análise pelo Isolation Forest.
export async function analisarMedicoesIA(medicoes) {
  const response = await api.post("/ia/analisar", {
    medicoes,
  });

  return response.data;
}

// Consulta e analisa as medições reais do ThingSpeak.
export async function obterThingSpeakIA() {
  const response = await api.get("/ia/thingspeak");
  return response.data;
}