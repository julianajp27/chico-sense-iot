
import { useState } from "react";

import logo from "../../assets/chicosense-branco-250x80.png";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";

import {
  fazerLogin,
  buscarUsuario,
} from "../../services/authService";

export default function Login({ onContinue }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    sessionStorage.removeItem("chicosense_token");

    try {
      // 1. Autenticar com e-mail e senha
      const loginData = await fazerLogin(
        email.trim(),
        password
      );

      const token = loginData?.access_token;

      if (typeof token !== "string" || !token.trim()) {
        throw new Error(
          "Token de acesso ausente na resposta."
        );
      }

      // 2. Consultar os dados do usuário autenticado
      const usuario = await buscarUsuario(token);

      if (
        !usuario ||
        typeof usuario !== "object" ||
        Array.isArray(usuario)
      ) {
        throw new Error(
          "Resposta de usuário inválida."
        );
      }

      // 3. Armazenar o token da sessão
      sessionStorage.setItem(
        "chicosense_token",
        token
      );

      // 4. Enviar o usuário ao App.jsx
      // O perfil será identificado automaticamente lá.
      await onContinue({
        ...usuario,
        name: usuario.name || usuario.nome || "",
        email: usuario.email || email.trim(),
      });

    } catch (err) {
      sessionStorage.removeItem("chicosense_token");

      const status = err?.response?.status;

      if (status === 401) {
        setError(
          "E-mail ou senha incorretos, ou sessão não autorizada."
        );
      } else if (status === 403) {
        setError(
          "Seu usuário não tem permissão para acessar."
        );
      } else if (status === 422) {
        setError(
          "Verifique os dados informados."
        );
      } else if (status === 404) {
        setError(
          "O serviço de autenticação não foi encontrado."
        );
      } else {
        setError(
          err?.message ||
          "Não foi possível concluir o login. Tente novamente."
        );
      }
    } finally {
      setPassword("");
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-page__presentation">
        <div className="access-brand">
          <img
            src={logo}
            alt="ChicoSense"
            className="login-page__logo"
            width={250}
            height={80}
          />
        </div>

        <div className="login-page__message">
          <h1>
            Do campo ao destino, cada detalhe importa.
          </h1>

          <p>
            Acompanhe as condições das suas cargas em tempo real, 
            com monitoramento inteligente para preservar a qualidade 
            das frutas durante o transporte.
          </p>

          <div className="login-page__steps">
            <span>IoT</span>
            <span>Dados</span>
            <span>IA</span>
            <span>Decisão</span>
          </div>
        </div>

        <p className="login-page__footnote">
          Monitoramento complementar. O ChicoSense
          não controla a refrigeração do veículo.
        </p>
      </section>

      <section
        className="login-page__form-area"
        aria-labelledby="login-title"
      >
        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          <span className="access-eyebrow">
            Bem-vindo de volta
          </span>

          <h2 id="login-title">
            Acesse sua conta
          </h2>

          <p className="login-form__description">
            Entre com suas credenciais para
            acessar o ChicoSense.
          </p>

          <Input
            label="E-mail"
            name="email"
            type="email"
            placeholder="nome@empresa.com.br"
            autoComplete="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            disabled={loading}
            required
          />

          <Input
            label="Senha"
            name="password"
            type="password"
            placeholder="Digite sua senha"
            autoComplete="current-password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            disabled={loading}
            required
          />

          {error && (
            <p
              className="login-form__error"
              role="alert"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            loading={loading}
            disabled={loading}
          >
            Entrar
          </Button>
        </form>
      </section>
    </main>
  );
}
