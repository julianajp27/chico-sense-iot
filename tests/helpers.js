import { AxiosError } from "axios";

export function user(perfil = "GESTOR", extra = {}) {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    nome: "Tester local", email: "tester@example.invalid", ativo: true,
    perfil_id: "00000000-0000-0000-0000-000000000002",
    perfil, empresas: [], ...extra,
  };
}

export function reply(config, data, status = 200) {
  const response = { config, data, status, statusText: String(status), headers: {} };
  if (status >= 400) throw new AxiosError("Mock HTTP failure", "ERR_BAD_REQUEST", config, {}, response);
  return response;
}
