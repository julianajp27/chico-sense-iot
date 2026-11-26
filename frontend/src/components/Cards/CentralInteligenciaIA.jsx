import MonitoramentoThingSpeak from "./MonitoramentoThingSpeak";
import MonitoramentoInteligente from "./MonitoramentoInteligente";

import "./CentralInteligenciaIA.css";

export default function CentralInteligenciaIA() {
  return (
    <section className="central-ia">
      <MonitoramentoThingSpeak />

      <details className="central-ia__secao">
        <summary>Avaliação do modelo de IA</summary>

        <div className="central-ia__conteudo">
          <MonitoramentoInteligente modo="avaliacao" />
        </div>
      </details>
    </section>
  );
}