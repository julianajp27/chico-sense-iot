
import { useEffect, useState } from "react";
import {
  criarViagem,
  listarTransportadoras,
  listarVeiculos,
  listarMotoristas,
} from "../../services/viagemService";

const initialForm = {
  transportadora_id: "",
  veiculo_id: "",
  motorista_id: "",
  origem: "",
  destino: "",
  saida_em: "",
  previsao_chegada_em: "",
  observacoes: "",
};

function getErrorMessage(error) {
  const detail = error.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join("; ");
  }

  if (error.response?.status === 403) {
    return "Você não tem permissão para cadastrar viagens.";
  }

  return error.message || "Não foi possível cadastrar a viagem.";
}

export default function NovaViagemForm({ onClose, onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [transportadoras, setTransportadoras] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [motoristas, setMotoristas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await listarTransportadoras();
        if (active) setTransportadoras(result);
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setVeiculos([]);
      setMotoristas([]);

      if (!form.transportadora_id) {
        setLoadingOptions(false);
        return;
      }

      setLoadingOptions(true);
      setError("");

      try {
        const [vehicles, drivers] = await Promise.all([
          listarVeiculos(form.transportadora_id),
          listarMotoristas(form.transportadora_id),
        ]);

        if (active) {
          setVeiculos(vehicles);
          setMotoristas(drivers);
        }
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoadingOptions(false);
      }
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, [form.transportadora_id]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, saving]);

  function update(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "transportadora_id"
        ? { veiculo_id: "", motorista_id: "" }
        : {}),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const departure = new Date(form.saida_em);
    const arrival = new Date(form.previsao_chegada_em);

    if (
      !Number.isFinite(departure.getTime()) ||
      !Number.isFinite(arrival.getTime())
    ) {
      setError("Informe datas e horários válidos.");
      return;
    }

    if (arrival <= departure) {
      setError(
        "A previsão de chegada deve ser posterior à saída."
      );
      return;
    }

    setSaving(true);

    try {
      await criarViagem({
        transportadora_id: form.transportadora_id,
        veiculo_id: form.veiculo_id,
        motorista_id: form.motorista_id,
        origem: form.origem.trim(),
        destino: form.destino.trim(),
        saida_em: departure.toISOString(),
        previsao_chegada_em: arrival.toISOString(),
        observacoes: form.observacoes.trim(),
      });

      await onCreated?.();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="nova-viagem__overlay">
      <div
        className="nova-viagem__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nova-viagem-title"
      >
        <div className="nova-viagem__header">
          <div>
            <h2
              id="nova-viagem-title"
              className="nova-viagem__title"
            >
              Nova viagem
            </h2>

            <p className="nova-viagem__description">
              Preencha os dados para cadastrar uma viagem.
            </p>
          </div>

          <button
            type="button"
            className="nova-viagem__close"
            onClick={onClose}
            disabled={saving}
            aria-label="Fechar formulário"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="nova-viagem__fields">
            <label className="nova-viagem__field">
              Transportadora

              <select
                name="transportadora_id"
                value={form.transportadora_id}
                onChange={update}
                required
                disabled={loading || saving}
              >
                <option value="">
                  Selecione a transportadora
                </option>

                {transportadoras.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome_fantasia ||
                      item.razao_social ||
                      item.nome ||
                      item.id}
                  </option>
                ))}
              </select>
            </label>

            <div className="nova-viagem__grid">
              <label className="nova-viagem__field">
                Veículo

                <select
                  name="veiculo_id"
                  value={form.veiculo_id}
                  onChange={update}
                  required
                  disabled={
                    !form.transportadora_id ||
                    loadingOptions ||
                    saving
                  }
                >
                  <option value="">
                    Selecione o veículo
                  </option>

                  {veiculos.map((item) => (
                    <option key={item.id} value={item.id}>
                      {[
                        item.modelo,
                        item.placa,
                        item.identificador,
                      ]
                        .filter(Boolean)
                        .join(" · ") || item.id}
                    </option>
                  ))}
                </select>
              </label>

              <label className="nova-viagem__field">
                Motorista

                <select
                  name="motorista_id"
                  value={form.motorista_id}
                  onChange={update}
                  required
                  disabled={
                    !form.transportadora_id ||
                    loadingOptions ||
                    saving
                  }
                >
                  <option value="">
                    Selecione o motorista
                  </option>

                  {motoristas.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome || item.id}
                    </option>
                  ))}
                </select>
              </label>

              <label className="nova-viagem__field">
                Origem

                <input
                  name="origem"
                  value={form.origem}
                  onChange={update}
                  placeholder="Ex.: Recife - PE"
                  required
                  disabled={saving}
                />
              </label>

              <label className="nova-viagem__field">
                Destino

                <input
                  name="destino"
                  value={form.destino}
                  onChange={update}
                  placeholder="Ex.: João Pessoa - PB"
                  required
                  disabled={saving}
                />
              </label>

              <label className="nova-viagem__field">
                Data e hora de saída

                <input
                  type="datetime-local"
                  name="saida_em"
                  value={form.saida_em}
                  onChange={update}
                  required
                  disabled={saving}
                />
              </label>

              <label className="nova-viagem__field">
                Previsão de chegada

                <input
                  type="datetime-local"
                  name="previsao_chegada_em"
                  value={form.previsao_chegada_em}
                  onChange={update}
                  required
                  disabled={saving}
                />
              </label>
            </div>

            <label className="nova-viagem__field">
              Observações

              <textarea
                name="observacoes"
                value={form.observacoes}
                onChange={update}
                placeholder="Informações adicionais sobre a viagem..."
                rows={3}
                disabled={saving}
              />
            </label>

            {error && (
              <p className="nova-viagem__error" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="nova-viagem__actions">
            <button
              type="button"
              className="nova-viagem__cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="nova-viagem__submit"
              disabled={
                loading ||
                loadingOptions ||
                saving
              }
            >
              {saving
                ? "Salvando..."
                : "+ Cadastrar viagem"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
