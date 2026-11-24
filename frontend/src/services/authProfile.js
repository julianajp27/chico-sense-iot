// These are authorization roles, not company types or business personas.
export const PROFILE_LABELS = Object.freeze({
  ADMIN: "Administrador",
  GESTOR: "Gestor",
  OPERADOR: "Operador",
  CONSULTA: "Consulta",
});

export function getUserProfile(user) {
  return Object.hasOwn(PROFILE_LABELS, user?.perfil) ? user.perfil : null;
}

export function validateUser(user) {
  if (!user || typeof user !== "object" || Array.isArray(user)) {
    throw new Error("Resposta de usuário inválida.");
  }
  if (user.ativo !== true) {
    throw new Error("Sua conta está inativa ou não pôde ser validada.");
  }
  if (!getUserProfile(user)) {
    throw new Error("Perfil de acesso não reconhecido. A API deve informar ADMIN, GESTOR, OPERADOR ou CONSULTA.");
  }
  return { ...user, name: user.nome || "" };
}
