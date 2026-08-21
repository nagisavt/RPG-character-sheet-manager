import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./estilo.css";
import { TelaDoJogador } from "./jogador/TelaDoJogador.js";
import { TelaDaMesa } from "./mesa/TelaDaMesa.js";
import { TelaDoMestre } from "./mestre/TelaDoMestre.js";

/**
 * As três telas do mesmo servidor: `/mesa` na TV, `/jogador` no celular e
 * `/mestre` no notebook. Um processo só, três caminhos.
 */
const tela = () => {
  switch (location.pathname) {
    case "/mestre":
      return <TelaDoMestre />;
    case "/mesa":
      return <TelaDaMesa />;
    case "/jogador":
      return <TelaDoJogador />;
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
    <p>
      <a href="/jogador">/jogador</a> — o celular do jogador
    </p>
  </main>
);

createRoot(document.getElementById("raiz")!).render(
  <StrictMode>{tela()}</StrictMode>,
);
