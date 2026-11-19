import axios from "axios";

const TOKEN_KEY = "chicosense_token";
const LOGIN_URL = "/api/v1/auth/login";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://chico-sense-back.onrender.com",
  timeout: 60000,
  headers: {
    Accept: "application/json",
  },
});

// #region Autorização das requisições
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);

  // O login não precisa receber um token de sessão anterior.
  if (token && config.url !== LOGIN_URL) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
// #endregion

// #region Tratamento de erros das respostas
function extractMessage(error) {
  const status = error.response?.status;
  const detail = error.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item) => item?.msg)
      .filter(Boolean)
      .join("; ");
  }

  if (!error.response) {
    return "Não foi possível conectar ao servidor. Se ele estava inativo, aguarde alguns segundos e tente novamente.";
  }

  if (status === 401) return "Sessão expirada. Entre novamente.";
  if (status === 403) return "Você não tem permissão para esta ação.";
  if (status === 404) return "Registro não encontrado.";
  if (status >= 500) return "Erro no servidor. Tente novamente em instantes.";

  return "Não foi possível concluir a solicitação.";
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Sessão expirada em rota protegida (erro de senha no login não entra aqui)
    if (
      error.response?.status === 401 &&
      error.config?.url !== LOGIN_URL
    ) {
      sessionStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event("auth:expired"));
    }

    error.message = extractMessage(error);

    return Promise.reject(error);
  }
);
// #endregion

export default api;