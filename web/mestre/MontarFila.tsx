import { type Ref, useState } from "react";
import {
  chamada,
  chaveDe,
  type NaChamada,
  nomeDe,
} from "../../shared/combate.js";
import type { Combate, Estado, Participante } from "../../shared/tipos.js";

/**
 * O modal onde a Fila de iniciativa é montada: a lista dos Participantes, e uma
 * seta para cima e uma para baixo em cada um.
 *
 * **O app não ordena.** Nem por iniciativa, nem como sugestão de partida: a Fila
 * é uma ordem escolhida, não uma ordem calculada (`CONTEXT.md`), e um "já deixei
 * ordenado para você" seria o app resolvendo o empate que é da mesa. O que ele
 * mostra é o que cada um tirou, do lado do nome, que é a informação de que o
 * mestre precisa para decidir olhando.
 */
export const MontarFila = ({
  ref,
  estado,
  combate,
  publicar,
}: {
  ref: Ref<HTMLDialogElement>;
  estado: Estado;
  combate: Combate;
  publicar: (fila: readonly Participante[]) => Promise<boolean>;
}) => {
  const [ordem, setOrdem] = useState<readonly Participante[] | null>(null);

  // A ordem de partida é a que já está na TV. Sem isto, o mestre que recarrega a
  // página no meio do Combate abre o modal na ordem da chamada e tem que
  // remontar tudo à mão só para acrescentar o reforço que acabou de chegar.
  const linhas = naOrdem(ordem ?? combate.fila ?? [], chamada(estado, combate));

  const mover = (de: number, para: number) => {
    if (para < 0 || para >= linhas.length) return;
    const movida = linhas.map(({ participante }) => participante);
    const [saiu] = movida.splice(de, 1);
    movida.splice(para, 0, saiu!);
    setOrdem(movida);
  };

  return (
    <dialog className="modal" ref={ref}>
      <header>
        <h2>Fila de iniciativa</h2>
        <form method="dialog">
          <button type="submit" aria-label="Fechar">
            ×
          </button>
        </form>
      </header>

      <ol className="montagem">
        {linhas.map(({ participante, iniciativa }, posicao) => (
          <li key={chaveDe(participante)}>
            <span>{nomeDe(estado, combate, participante)}</span>
            <span className="rolou">
              {iniciativa === null ? "—" : iniciativa.resultado}
            </span>
            <button
              type="button"
              onClick={() => mover(posicao, posicao - 1)}
              disabled={posicao === 0}
              aria-label={`Subir ${nomeDe(estado, combate, participante)}`}
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => mover(posicao, posicao + 1)}
              disabled={posicao === linhas.length - 1}
              aria-label={`Descer ${nomeDe(estado, combate, participante)}`}
            >
              ↓
            </button>
          </li>
        ))}
      </ol>

      <div className="acoes">
        <button
          type="button"
          onClick={() =>
            void publicar(linhas.map(({ participante }) => participante))
          }
        >
          publicar para a Mesa
        </button>
      </div>
    </dialog>
  );
};

/**
 * A chamada na ordem desejada, com quem sobrou no fim.
 *
 * O reforço declarado no meio do Combate entra **depois** do que o mestre já
 * arrastou, e não desmancha nada: arrumar sete Participantes e ver tudo voltar
 * ao lugar porque um ogro chegou é o tipo de coisa que faz ele desistir da tela
 * e ir gritar a ordem. Quem saiu da chamada some daqui junto.
 */
const naOrdem = (
  desejada: readonly Participante[],
  daChamada: readonly NaChamada[],
): readonly NaChamada[] => {
  const porChave = new Map(
    daChamada.map((linha) => [chaveDe(linha.participante), linha]),
  );

  const escolhidas = desejada
    .map((participante) => porChave.get(chaveDe(participante)))
    .filter((linha) => linha !== undefined);

  const ja = new Set(escolhidas.map((linha) => chaveDe(linha.participante)));
  return [
    ...escolhidas,
    ...daChamada.filter((linha) => !ja.has(chaveDe(linha.participante))),
  ];
};
