import { useEffect, useState } from "react";
import type { Personagem } from "../../shared/tipos.js";
import { usarMesa } from "../usar-mesa.js";

/**
 * A TV no meio da mesa. Só lê: ela não envia Comando nenhum, e o servidor
 * recusaria se ela tentasse.
 *
 * Tudo aqui é medido em `vw`, a partir de um tamanho de fonte só. A TV tem
 * distância de leitura fixa — dois metros, sempre —, então o que se ajusta é
 * aquele número, olhando de lá, e não cada pedaço da tela.
 */
export const TelaDaMesa = () => {
  const { ligacao, entrar } = usarMesa();

  // Sem senha: ligar a TV é abrir o navegador.
  useEffect(() => entrar({ como: "mesa" }), [entrar]);

  if (ligacao.situacao !== "na mesa") {
    return (
      <div className="tv">
        <p className="avisando">
          {ligacao.situacao === "recusado" ? ligacao.motivo : "Ligando na Mesa…"}
        </p>
      </div>
    );
  }

  const personagens = Object.values(ligacao.estado.personagens);

  return (
    <div className="tv">
      <Cena cena={ligacao.estado.cena} />
      <ul className="vidas">
        {personagens.map((personagem) => (
          <Barra
            key={personagem.id}
            personagem={personagem}
            maiorDaMesa={Math.max(...personagens.map((outro) => outro.vidaMaxima))}
          />
        ))}
      </ul>
    </div>
  );
};

/**
 * O código sempre pede o arquivo. O que muda com o tempo é se ele tem desenho ou
 * não — e enquanto não tiver, a TV mostra o retângulo preto com o nome, que é o
 * placeholder combinado. Some sozinho no dia em que o PNG entrar na pasta.
 */
const Cena = ({ cena }: { cena: string | null }) => {
  const [faltando, setFaltando] = useState(false);

  // Trocou de Cena: a próxima tem o direito de existir.
  useEffect(() => setFaltando(false), [cena]);

  if (cena === null) {
    return (
      <div className="cena">
        <span className="rotulo">sem Cena</span>
      </div>
    );
  }

  return (
    <div className="cena">
      {faltando ? (
        <span className="rotulo">{cena}</span>
      ) : (
        <img src={`/cenas/${cena}.png`} alt="" onError={() => setFaltando(true)} />
      )}
    </div>
  );
};

/**
 * A vida máxima define o **comprimento** da barra, comparada com a maior da
 * Mesa: quem tem 35 de máximo tem uma barra mais longa que quem tem 22, e o
 * quanto está cheia é o preenchimento dentro dela. Olhando de dois metros dá
 * para ver quem está mal sem ler número nenhum.
 */
const Barra = ({ personagem, maiorDaMesa }: { personagem: Personagem; maiorDaMesa: number }) => (
  <li style={{ width: `${(personagem.vidaMaxima / maiorDaMesa) * 100}%` }}>
    <div className="nome">
      <span>{personagem.nome}</span>
      <span>
        {personagem.vida} / {personagem.vidaMaxima}
      </span>
    </div>
    <div
      className="barra"
      role="meter"
      aria-label={`Vida de ${personagem.nome}`}
      aria-valuenow={personagem.vida}
      aria-valuemin={0}
      aria-valuemax={personagem.vidaMaxima}
    >
      <div style={{ width: `${(personagem.vida / personagem.vidaMaxima) * 100}%` }} />
    </div>
  </li>
);
