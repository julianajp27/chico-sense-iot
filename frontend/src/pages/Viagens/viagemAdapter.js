export function adaptViagensResponse(response) {
  // Contrato provisório: uma lista direta de viagens.
  if (!Array.isArray(response)) {
    throw new Error("Formato da lista de viagens não reconhecido.");
  }

  return response.map((trip) => {
    if (
      !trip ||
      typeof trip !== "object" ||
      trip.id == null ||
      String(trip.id).trim() === ""
    ) {
      throw new Error("Viagem recebida sem identificador válido.");
    }

    return {
      id: String(trip.id),
      code: trip.code ?? "",
      product: trip.product ?? "",
      origin: trip.origin ?? "",
      destination: trip.destination ?? "",
      vehicle: trip.vehicle ?? "",
      status: trip.status ?? "",
    };
  });
}