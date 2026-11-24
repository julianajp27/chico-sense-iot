import { StrictMode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AxiosError } from "axios";
import App from "../src/App";
import api from "../src/services/api";
import { getSessionToken, setSessionToken } from "../src/services/session";
import { reply, user } from "./helpers";

function mount(path = "/login") {
  return render(<StrictMode><MemoryRouter initialEntries={[path]}><App /></MemoryRouter></StrictMode>);
}

function adapterFor(currentUser = user(), { loginStatus = 200, meStatus = 200, missingToken = false } = {}) {
  api.defaults.adapter = async (config) => {
    if (config.url === "/health") return reply(config, { status: "ok" });
    if (config.url === "/api/v1/auth/login") return reply(config, missingToken ? {} : { access_token: "fixture-session", token_type: "bearer", expires_in: 1800 }, loginStatus);
    if (config.url === "/api/v1/auth/me") return reply(config, currentUser, meStatus);
    if (config.url === "/api/v1/viagens") return reply(config, []);
    // Reject unhandled calls locally: never let a test call the real server.
    return reply(config, { detail: "Unhandled local mock" }, 404);
  };
}

function submit() {
  fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "tester@example.invalid" } });
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "fixture-password" } });
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
}

describe("login e navegação reais com HTTP mockado", () => {
  it.each(["ADMIN", "GESTOR", "OPERADOR", "CONSULTA"])("login %s alcança dashboard mantendo o papel", async (role) => {
    adapterFor(user(role)); mount(); submit();
    expect(await screen.findByRole("heading", { name: /Olá, Tester/ })).toBeTruthy();
    expect(getSessionToken()).toBe("fixture-session");
    expect(screen.getByLabelText(/Perfil de acesso:/).textContent).toContain({ ADMIN: "Administrador", GESTOR: "Gestor", OPERADOR: "Operador", CONSULTA: "Consulta" }[role]);
    fireEvent.click(screen.getByRole("link", { name: "Viagens", exact: true }));
    expect(await screen.findByRole("heading", { name: "Viagens", exact: true, level: 1 })).toBeTruthy();
    fireEvent.click(screen.getByRole("link", { name: "Configurações", exact: true }));
    expect(await screen.findByRole("heading", { name: "Configurações", exact: true })).toBeTruthy();
  });

  it.each([
    ["senha inválida", user(), { loginStatus: 401 }, /E-mail ou senha incorretos/],
    ["falha no me", user(), { meStatus: 401 }, /API recusou a consulta do usuário/],
    ["perfil desconhecido", user("logistica"), {}, /Perfil de acesso não reconhecido/],
    ["inativo", user("GESTOR", { ativo: false }), {}, /conta está inativa/],
    ["token ausente", user(), { missingToken: true }, /Token de acesso ausente/],
  ])("%s não armazena sessão nem acessa dashboard", async (_, currentUser, options, message) => {
    adapterFor(currentUser, options); mount(); submit();
    expect((await screen.findByRole("alert")).textContent).toMatch(message);
    expect(getSessionToken()).toBeNull();
    expect(screen.queryByRole("heading", { name: /Olá, Tester/ })).toBeNull();
    expect(screen.getByLabelText("Senha").value).toBe("");
  });

  it("sem token redireciona rota protegida ao login", async () => {
    adapterFor(); mount("/dashboard");
    expect(await screen.findByRole("heading", { name: "Acesse sua conta" })).toBeTruthy();
  });

  it("reload revalida me e mantém dashboard, sem novo POST de login", async () => {
    const methods = [];
    adapterFor();
    const adapter = api.defaults.adapter;
    api.defaults.adapter = async (config) => { methods.push(config.url); return adapter(config); };
    setSessionToken("fixture-session"); mount("/dashboard");
    expect(await screen.findByRole("heading", { name: /Olá, Tester/ })).toBeTruthy();
    expect(methods).toContain("/api/v1/auth/me");
    expect(methods).not.toContain("/api/v1/auth/login");
  });

  it("sessão expirada no bootstrap limpa token e retorna ao login", async () => {
    adapterFor(user(), { meStatus: 401 });
    setSessionToken("fixture-session"); mount("/dashboard");
    expect(await screen.findByRole("heading", { name: "Acesse sua conta" })).toBeTruthy();
    expect(getSessionToken()).toBeNull();
  });

  it("rede indisponível no bootstrap permite retry sem mostrar conteúdo privado", async () => {
    api.defaults.adapter = async (config) => {
      if (config.url === "/health") return reply(config, {});
      throw new AxiosError("Network Error", "ERR_NETWORK", config);
    };
    setSessionToken("fixture-session"); mount("/dashboard");
    expect((await screen.findByRole("alert")).textContent).toMatch(/verificar a sessão/);
    expect(screen.queryByRole("heading", { name: /Olá, Tester/ })).toBeNull();
    expect(getSessionToken()).toBe("fixture-session");
    adapterFor();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByRole("heading", { name: /Olá, Tester/ })).toBeTruthy();
  });

  it("evento auth:expired encerra a sessão já autenticada", async () => {
    adapterFor(); setSessionToken("fixture-session"); mount("/dashboard");
    await screen.findByRole("heading", { name: /Olá, Tester/ });
    act(() => window.dispatchEvent(new Event("auth:expired")));
    await waitFor(() => expect(getSessionToken()).toBeNull());
    expect(await screen.findByRole("heading", { name: "Acesse sua conta" })).toBeTruthy();
  });
});
