export const TOKEN_KEY = "chicosense_token";

export function getSessionToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY)?.trim() || null;
  } catch {
    return null;
  }
}

export function setSessionToken(token) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    throw new Error("Não foi possível salvar a sessão neste navegador. Verifique se o armazenamento está habilitado.");
  }
}

export function clearSessionToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Clearing React state still prevents access when browser storage is unavailable.
  }
}
