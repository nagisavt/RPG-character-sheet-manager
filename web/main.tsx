import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./estilo.css";
import { TelaDaMesa } from "./mesa/TelaDaMesa.js";
import { TelaDoMestre } from "./mestre/TelaDoMestre.js";

/**
 * As três telas do mesmo servidor: `/mesa` na TV, `/jogador` no celular e
 * `/mestre` no notebook. A do jogador chega na issue #8.
 */
const tela = () => {
  switch (location.pathname) {
    case "/mestre":
      return <TelaDoMestre />;
    case "/mesa":
      return <TelaDaMesa />;
    default:
      return <Portaria />;
  }
};

const Portaria = () => (
  <main className="portaria">
    <h1>Mesa</h1>
    <p>
      <a href="/mestre">/mestre</a> — o notebook do mestre
    </p>
    <p>
      <a href="/mesa">/mesa</a> — a TV no meio da mesa
    </p>
    <p className="apagado">/jogador ainda não existe.</p>
  </main>
);

createRoot(document.getElementById("raiz")!).render(<StrictMode>{tela()}</StrictMode>);
