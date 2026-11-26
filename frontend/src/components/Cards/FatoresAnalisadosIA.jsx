import {
  Thermometer,
  Droplets,
  Activity,
  Info,
} from "lucide-react";

import "./FatoresAnalisadosIA.css";

const fatores = [
  {
    chave: "temperatura",
    titulo: "Última temperatura",
    unidade: "°C",
    icon: Thermometer,
  },
  {
    chave: "umidade",
    titulo: "Última umidade",
    unidade: "%",
    icon: Droplets,
  },
  {
    chave: "variacao_temperatura",
    titulo: "Variação de temperatura",
    unidade: "°C",
    icon: Activity,
    variacao: true,
  },
  {
    chave: "variacao_umidade",
    titulo: "Variação de umidade",
    unidade: "p.p.",
    icon: Activity,
    variacao: true,
  },
  {
    chave: "media_temperatura",
    titulo: "Temperatura média",
    unidade: "°C",
    icon: Thermometer,
  },
  {
    chave: "media_umidade",
    titulo: "Umidade média",
    unidade: "%",
    icon: Droplets,
  },
];

function formatarValor(valor, variacao = false) {
  if (typeof valor !== "number" || !Number.isFinite(valor)) {
    return "—";
  }

  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
    signDisplay: variacao ? "exceptZero" : "auto",
  });
}

export default function FatoresAnalisadosIA({ fatoresConsiderados }) {
  if (
    !fatoresConsiderados ||
    Object.keys(fatoresConsiderados).length === 0
  ) {
    return null;
  }

  return (
    <section className="fatores-ia">
      <h3>Fatores considerados pela IA</h3>

      <p className="fatores-ia__description">
        Variáveis utilizadas pelo modelo Isolation Forest
        para classificar as medições.
      </p>

      <div className="fatores-ia__grid">
        {fatores.map((fator) => {
          const Icon = fator.icon;

          return (
            <div
              className="fatores-ia__item"
              key={fator.chave}
            >
              <div className="fatores-ia__icon">
                <Icon size={20} aria-hidden="true" />
              </div>

              <span>{fator.titulo}</span>

              <strong>
                {formatarValor(
                  fatoresConsiderados[fator.chave],
                  fator.variacao
                )}{" "}
                {fator.unidade}
              </strong>
            </div>
          );
        })}
      </div>

      <div className="fatores-ia__notice">
        <Info size={17} aria-hidden="true" />

        <span>
          As médias consideram as cinco últimas medições.
          As variações correspondem à diferença entre as
          duas últimas leituras. A sigla p.p. significa
          pontos percentuais. Esses valores não representam
          o peso individual de cada variável na classificação.
        </span>
      </div>
    </section>
  );
}