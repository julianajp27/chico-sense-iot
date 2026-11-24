
import axios from "axios";
import { clearSessionToken, getSessionToken } from "./session";

const LOGIN_URL = "/api/v1/auth/login";
const PUBLIC_URLS = [LOGIN_URL, "/health"];

const api = axios.create({
  baseURL: (
    import.meta.env.VITE_API_URL ||
    "https://chico-sense-back.onrender.com"
  ).replace(/\/+$/, ""),

  timeout: 60000,

  headers: {
    Accept: "application/json",
  },
});

// Autorização das requisições
api.interceptors.request.use((config) => {
  const token = getSessionToken();

  if (PUBLIC_URLS.includes(config.url)) {
    config.headers.delete("Authorization");
    return config;
  }

  if (
    token &&
    config.url !== LOGIN_URL &&
    !config.headers.Authorization
  ) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Tratamento das mensagens de erro
function extractMessage(error) {
  const status = error.response?.status;
  const detail = error.response?.data?.detail;

  if (error.code === "ECONNABORTED") {
    return "O servidor demorou muito para responder.";
  }

  if (!error.response) {
    return "Não foi possível conectar à API. Verifique a conexão e a configuração de CORS.";
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item) => {
        const campo = item.loc?.join(".") || "";
        return `${campo}: ${item.msg || "Valor inválido"}`;
      })
      .join("; ");
  }

  switch (status) {
    case 400:
      return "Requisição inválida.";
    case 401:
      return "Credenciais inválidas ou sessão expirada.";
    case 403:
      return "Você não tem permissão para esta operação.";
    case 404:
      return "Registro não encontrado.";
    case 409:
      return "Conflito com um registro existente.";
    case 422:
      return "Os dados enviados não passaram na validação.";
    case 503:
      return "Serviço temporariamente indisponível.";
    default:
      return status >= 500
        ? "Erro interno do servidor."
        : `Não foi possível concluir a solicitação (${status}).`;
  }
}

// Interceptor das respostas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method;

    console.error("[ChicoSense API]", {
      method: method?.toUpperCase(),
      url,
      status,
      code: error.code,
    });

    const token = getSessionToken();
    const sentAuthorization = error.config?.headers?.get?.("Authorization");
    // A delayed 401 for an older token must not invalidate a newer login.
    // Candidate tokens used by /auth/me before login completion are not sessions yet.
    if (status === 401 && !PUBLIC_URLS.includes(url) && token && sentAuthorization === `Bearer ${token}`) {
      clearSessionToken();
      window.dispatchEvent(new Event("auth:expired"));
    }

    error.message = extractMessage(error);

    return Promise.reject(error);
  }
);

export default api;
