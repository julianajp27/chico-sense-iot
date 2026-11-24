import api from "./api";
import { validateUser } from "./authProfile";

export async function fazerLogin(email, senha) {
  const response = await api.post("/api/v1/auth/login", {
    email,
    senha,
  });

  return response.data;
}

export async function buscarUsuario(token) {
  const response = await api.get("/api/v1/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function autenticar(email, senha) {
  let stage = "login";
  try {
    const data = await fazerLogin(email.trim(), senha);
    const token = data?.access_token;
    if (typeof token !== "string" || !token.trim()) {
      throw new Error("Token de acesso ausente na resposta.");
    }
    stage = "usuario";
    const user = await buscarUsuario(token);
    stage = "validacao";
    return { token, user: validateUser(user) };
  } catch (error) {
    error.authStage = stage;
    throw error;
  }
}

export function loginErrorMessage(error) {
  const status = error?.response?.status;
  if (status === 401) {
    return error.authStage === "usuario"
      ? "O login retornou um token, mas a API recusou a consulta do usuário. Não foi possível validar a sessão."
      : "E-mail ou senha incorretos.";
  }
  if (status === 403) return "Seu usuário não tem permissão para acessar.";
  if (status === 422) return "Verifique os dados informados.";
  if (status === 404) return "O serviço de autenticação não foi encontrado.";
  return error?.message || "Não foi possível concluir o login. Tente novamente.";
}
