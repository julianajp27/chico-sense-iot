
import { useState } from "react";

import logo from "../../assets/chicosense-branco-250x80.png";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";

import { autenticar, loginErrorMessage } from "../../services/authService";
import { clearSessionToken, setSessionToken } from "../../services/session";

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

    clearSessionToken();

    try {
      const { token, user } = await autenticar(email, password);
      // Only a user with ativo=true and a recognized API role reaches storage.
      setSessionToken(token);
      await onContinue(user);
    } catch (err) {
      clearSessionToken();
      setError(loginErrorMessage(err));
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
