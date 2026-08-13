import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./estilo.css";
import { TelaDoMestre } from "./mestre/TelaDoMestre.js";

/**
 * As três telas do mesmo servidor: `/mesa` na TV, `/jogador` no celular e
 * `/mestre` no notebook. As duas primeiras chegam nas issues #4 e #8.
 */
const tela = () => {
  switch (location.pathname) {
    case "/mestre":
      return <TelaDoMestre />;
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
    <p className="apagado">/mesa e /jogador ainda não existem.</p>
  </main>
);

createRoot(document.getElementById("raiz")!).render(<StrictMode>{tela()}</StrictMode>);
