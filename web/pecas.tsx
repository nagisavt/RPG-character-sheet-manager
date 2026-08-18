import { useEffect, useState, type ReactNode } from "react";
import type { Personagem } from "../shared/tipos.js";

/**
 * As peças que as três telas desenham igual.
 *
 * Elas moram aqui e não em cada tela porque a vida do Thorin tem que ser a mesma
 * coisa na TV, no notebook e no celular: três cópias da mesma barra viram três
 * regras de arredondamento diferentes no dia em que alguém mexe numa delas. O
 * tamanho continua sendo de cada tela — a TV mede tudo em `vw` e o celular em
 * `rem` —, e isso é CSS, que é onde a diferença é de verdade.
 */

/**
 * Os dois potes de vida, um embaixo do outro. A barra de baixo, branca, é a Vida
 * bônus, e só existe quando existe: quem não tem nenhuma não ganha uma faixa
 * vazia para a mesa decifrar.
 */
export const BarraDeVida = ({ personagem }: { personagem: Personagem }) => (
  <>
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

    {personagem.vidaBonus > 0 && (
      <div
        className="barra bonus"
        role="meter"
        aria-label={`Vida bônus de ${personagem.nome}`}
        aria-valuenow={personagem.vidaBonus}
        aria-valuemin={0}
        aria-valuemax={personagem.vidaMaxima}
      >
        <div
          style={{
            // A Vida bônus não tem teto, mas a barra tem: ela satura na largura
            // da vida do personagem. Deixar a barra crescer para fora seria
            // reescalar a fileira inteira da TV por causa de um efeito de uma
            // noite; quem carrega o valor exato é o número do lado do nome.
            width: `${Math.min(personagem.vidaBonus / personagem.vidaMaxima, 1) * 100}%`,
          }}
        />
      </div>
    )}
  </>
);

/**
 * As Moedas: um número só, sem denominação. Não existe PC, PP, PE, PO nem PL, e
 * é de propósito — converter prata em ouro acontece na cabeça do mestre, antes
 * de ele digitar (ADR-0001).
 */
export const Moedas = ({ personagem }: { personagem: Personagem }) => (
  <p className="moedas">
    Moedas <strong>{personagem.moedas}</strong>
  </p>
);

/** `28 / 28 +10`, com a Vida bônus na cor dela. */
export const Numeros = ({ personagem }: { personagem: Personagem }) => (
  <>
    {personagem.vida} / {personagem.vidaMaxima}
    {personagem.vidaBonus > 0 && <em className="bonus">+{personagem.vidaBonus}</em>}
  </>
);

/**
 * Uma imagem que é pedida pelo caminho desde o dia 1, com o nome dela por baixo
 * enquanto o arquivo não existe.
 *
 * O arquivo faltando não é erro: é o estado normal de um asset que ainda não foi
 * desenhado. O `dev.ts` responde 404 de propósito para imagem que não está na
 * pasta — sem isso o fallback de SPA devolveria HTML, que para um `<img>` é um
 * arquivo quebrado com cara de sucesso, e o rótulo nunca apareceria.
 */
export const ImagemOuRotulo = ({
  className,
  caminho,
  rotulo,
}: {
  className: string;
  caminho: string;
  rotulo: ReactNode;
}) => {
  const [faltando, setFaltando] = useState(false);

  // Trocou de arquivo: o próximo tem o direito de existir.
  useEffect(() => setFaltando(false), [caminho]);

  return (
    <span className={className}>
      {faltando ? (
        <span className="rotulo">{rotulo}</span>
      ) : (
        <img src={caminho} alt="" onError={() => setFaltando(true)} />
      )}
    </span>
  );
};
