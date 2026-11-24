import { describe, expect, it, vi } from "vitest";
import { AxiosError } from "axios";
import api from "../src/services/api";
import { autenticar, buscarUsuario, loginErrorMessage } from "../src/services/authService";
import { validateUser } from "../src/services/authProfile";
import { getSessionToken, setSessionToken } from "../src/services/session";
import { reply, user } from "./helpers";

describe("contrato e papéis reais", () => {
  it.each(["ADMIN", "GESTOR", "OPERADOR", "CONSULTA"])("aceita %s sem traduzir para tipo de empresa", async (role) => {
    const calls = [];
    api.defaults.adapter = async (config) => {
      calls.push(config);
      return config.url.endsWith("/login")
        ? reply(config, { access_token: "fixture-candidate", token_type: "bearer", expires_in: 1800 })
        : reply(config, user(role));
    };
    const result = await autenticar(" tester@example.invalid ", "fixture-password");
    expect(result.user.perfil).toBe(role);
    expect(result.user.name).toBe("Tester local");
    expect(calls.map((c) => c.url)).toEqual(["/api/v1/auth/login", "/api/v1/auth/me"]);
    expect(JSON.parse(calls[0].data)).toEqual({ email: "tester@example.invalid", senha: "fixture-password" });
    expect(calls[0].headers.has("Authorization")).toBe(false);
    expect(calls[1].headers.get("Authorization")).toBe("Bearer fixture-candidate");
    expect(getSessionToken()).toBeNull(); // Service returns validated data; UI owns storage.
  });

  it.each(["produtor", "logistica", "cliente", "GESTOR_ADMIN", "admin", null])("rejeita perfil sem contrato %s", (role) => {
    expect(() => validateUser(user(role))).toThrow(/Perfil de acesso não reconhecido/);
  });

  it.each([false, "true", 1, undefined])( "exige ativo booleano true (%s)", (ativo) => {
    expect(() => validateUser(user("GESTOR", { ativo }))).toThrow(/inativa/);
  });

  it("não consulta /me quando o token está ausente", async () => {
    const adapter = vi.fn(async (config) => reply(config, { token_type: "bearer" }));
    api.defaults.adapter = adapter;
    await expect(autenticar("tester@example.invalid", "fixture-password")).rejects.toThrow(/Token de acesso ausente/);
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it("separa credenciais inválidas de token recusado por /me", async () => {
    api.defaults.adapter = async (config) => reply(config, {}, 401);
    const loginError = await autenticar("tester@example.invalid", "fixture-password").catch((e) => e);
    expect(loginError.authStage).toBe("login");
    expect(loginErrorMessage(loginError)).toBe("E-mail ou senha incorretos.");
    api.defaults.adapter = async (config) => config.url.endsWith("/login")
      ? reply(config, { access_token: "fixture-candidate" }) : reply(config, {}, 401);
    const meError = await autenticar("tester@example.invalid", "fixture-password").catch((e) => e);
    expect(meError.authStage).toBe("usuario");
    expect(loginErrorMessage(meError)).toMatch(/API recusou a consulta do usuário/);
  });

  it("distingue falha de conexão de senha incorreta", async () => {
    api.defaults.adapter = async (config) => { throw new AxiosError("Network Error", "ERR_NETWORK", config); };
    const error = await autenticar("tester@example.invalid", "fixture-password").catch((e) => e);
    expect(loginErrorMessage(error)).toMatch(/conectar à API/);
    expect(getSessionToken()).toBeNull();
  });

  it("preserva host HTTPS e exatamente um prefixo API", () => {
    expect(api.defaults.baseURL).toBe("https://chico-sense-back.onrender.com");
    expect(api.getUri({ url: "/api/v1/auth/login" })).toBe("https://chico-sense-back.onrender.com/api/v1/auth/login");
  });
});

describe("sessão e concorrência HTTP", () => {
  it.each(["/health", "/api/v1/auth/login"])("não envia Bearer nem expira sessão em rota pública %s", async (path) => {
    setSessionToken("fixture-session");
    const expired = vi.fn();
    window.addEventListener("auth:expired", expired);
    api.defaults.adapter = async (config) => {
      expect(config.headers.has("Authorization")).toBe(false);
      return reply(config, {}, 401);
    };
    await api.get(path, { headers: { Authorization: "Bearer fixture-unwanted" } }).catch(() => {});
    expect(getSessionToken()).toBe("fixture-session");
    expect(expired).not.toHaveBeenCalled();
    window.removeEventListener("auth:expired", expired);
  });

  it("duas rejeições 401 da sessão atual geram uma única expiração", async () => {
    setSessionToken("fixture-session");
    const expired = vi.fn();
    window.addEventListener("auth:expired", expired);
    api.defaults.adapter = async (config) => reply(config, {}, 401);
    await Promise.allSettled([api.get("/api/v1/viagens"), api.get("/api/v1/cargas/fixture")]);
    expect(expired).toHaveBeenCalledTimes(1);
    expect(getSessionToken()).toBeNull();
    window.removeEventListener("auth:expired", expired);
  });

  it("401 tardio de token antigo não encerra login novo", async () => {
    setSessionToken("fixture-old");
    let rejectOld;
    let configOld;
    let started;
    const ready = new Promise((resolve) => { started = resolve; });
    api.defaults.adapter = (config) => new Promise((_, reject) => {
      configOld = config; rejectOld = reject; started();
    });
    const pending = api.get("/api/v1/viagens").catch((e) => e);
    await ready;
    setSessionToken("fixture-new");
    rejectOld(new AxiosError("Expired", "ERR_BAD_REQUEST", configOld, {}, { status: 401, data: {}, config: configOld }));
    await pending;
    expect(getSessionToken()).toBe("fixture-new");
  });

  it("401 de token candidato no /me não invalida outra sessão", async () => {
    setSessionToken("fixture-existing");
    api.defaults.adapter = async (config) => reply(config, {}, 401);
    await buscarUsuario("fixture-candidate").catch(() => {});
    expect(getSessionToken()).toBe("fixture-existing");
  });
});
