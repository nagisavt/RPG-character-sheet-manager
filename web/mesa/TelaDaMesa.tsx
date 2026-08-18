import { useEffect } from "react";
import { chaveDe, nomeDe } from "../../shared/combate.js";
import type { Combate, Estado, Personagem } from "../../shared/tipos.js";
import { BarraDeVida, ImagemOuRotulo, Numeros } from "../pecas.js";
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

  const combate = ligacao.estado.combate;

  return (
    <div className="tv">
      {/* A Fila publicada troca o fundo; a Cena continua embaixo, esperando o
          Combate acabar. As barras de vida ficam nos dois layouts. */}
      {combate?.fila == null ? (
        <Cena cena={ligacao.estado.cena} />
      ) : (
        <Fila estado={ligacao.estado} combate={combate} />
      )}
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
  if (cena === null) {
    return (
      <span className="cena">
        <span className="rotulo">sem Cena</span>
      </span>
    );
  }

  return <ImagemOuRotulo className="cena" caminho={`/cenas/${cena}.png`} rotulo={cena} />;
};

/**
 * A Fila de iniciativa em tela cheia: os nomes, na ordem que o mestre escolheu.
 *
 * **Sem número nenhum** — nem o que cada um rolou, nem a posição. E nada aqui
 * acompanha de quem é a vez: não existe noção de turno neste app, e destacar
 * alguém seria inventar uma. Quem diz "é sua vez" é a pessoa na cabeceira.
 */
const Fila = ({ estado, combate }: { estado: Estado; combate: Combate }) => (
  <div className="fila">
    <ol>
      {(combate.fila ?? []).map((participante) => (
        <li key={chaveDe(participante)}>{nomeDe(estado, combate, participante)}</li>
      ))}
    </ol>
  </div>
);

/**
 * A vida máxima define o **comprimento** da barra, comparada com a maior da
 * Mesa: quem tem 35 de máximo tem uma barra mais longa que quem tem 22, e o
 * quanto está cheia é o preenchimento dentro dela. Olhando de dois metros dá
 * para ver quem está mal sem ler número nenhum.
 *
 * A Vida bônus é uma segunda barra, branca, logo abaixo — e só aparece quando
 * existe: quem não tem nenhuma não ganha uma faixa vazia para a mesa decifrar.
 */
const Barra = ({ personagem, maiorDaMesa }: { personagem: Personagem; maiorDaMesa: number }) => (
  <li style={{ width: `${(personagem.vidaMaxima / maiorDaMesa) * 100}%` }}>
    <div className="nome">
      <span>{personagem.nome}</span>
      <span>
        <Numeros personagem={personagem} />
      </span>
    </div>
    <BarraDeVida personagem={personagem} />
  </li>
);
