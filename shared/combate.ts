import type { Combate, Estado, Iniciativa, Participante } from "./tipos.js";
import { mesmo } from "./reducer.js";

/**
 * Quem o Combate espera, e o que já chegou de cada um.
 *
 * Puro, e em `shared/` porque a mesma pergunta é feita nos dois lados: o
 * notebook do mestre desenha quem falta, e um teste confere o mesmo pela costura
 * do harness. Uma segunda conta, escrita na tela, daria "faltam dois" numa
 * versão e "falta um" na outra.
 */
export type NaFila = { participante: Participante; iniciativa: Iniciativa | null };

/**
 * Todo Participante do Combate, na ordem em que a mesa os enxerga: os
 * personagens das Fichas primeiro, os Monstros declarados depois.
 *
 * A ordem daqui **não é a Fila** — a Fila é escolhida e publicada pelo mestre, e
 * é a issue #11. Esta é a lista de chamada.
 */
export const chamada = (estado: Estado, combate: Combate): readonly NaFila[] => [
  ...Object.values(estado.personagens).map((personagem) =>
    procurar(combate, { tipo: "personagem", personagem: personagem.id }),
  ),
  ...combate.monstros.map((monstro) => procurar(combate, { tipo: "monstro", nome: monstro.nome })),
];

/** Quem ainda não declarou. É o que o mestre olha para saber de quem cobrar. */
export const faltam = (estado: Estado, combate: Combate): readonly Participante[] =>
  chamada(estado, combate)
    .filter((linha) => linha.iniciativa === null)
    .map((linha) => linha.participante);

const procurar = (combate: Combate, participante: Participante): NaFila => ({
  participante,
  iniciativa: combate.iniciativas.find((qual) => mesmo(qual.participante, participante)) ?? null,
});

/** O nome que a mesa fala, para um Participante dos dois tipos. */
export const nomeDe = (estado: Estado, participante: Participante): string =>
  participante.tipo === "monstro"
    ? participante.nome
    : (estado.personagens[participante.personagem]?.nome ?? participante.personagem);
