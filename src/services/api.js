
import axios from "axios";

const TOKEN_KEY = "chicosense_token";
const LOGIN_URL = "/api/v1/auth/login";

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
  const token = sessionStorage.getItem(TOKEN_KEY);

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

    if (status === 401 && url !== LOGIN_URL) {
      sessionStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event("auth:expired"));
    }

    error.message = extractMessage(error);

    return Promise.reject(error);
  }
);

export default api;
