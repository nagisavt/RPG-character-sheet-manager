import type { Combate, Estado, Iniciativa, Participante } from "./tipos.js";

/**
 * Quem o Combate espera, e o que já chegou de cada um.
 *
 * Puro, e em `shared/` porque a mesma pergunta é feita nos dois lados: o
 * notebook do mestre desenha quem falta, e um teste confere o mesmo pela costura
 * do harness. Uma segunda conta, escrita na tela, daria "faltam dois" numa
 * versão e "falta um" na outra.
 */
export type NaChamada = {
  participante: Participante;
  iniciativa: Iniciativa | null;
};

/** Dois Participantes são o mesmo quando são do mesmo tipo e do mesmo nome. */
export const mesmo = (um: Participante, outro: Participante): boolean =>
  um.tipo === "personagem" && outro.tipo === "personagem"
    ? um.personagem === outro.personagem
    : um.tipo === "monstro" &&
      outro.tipo === "monstro" &&
      um.nome === outro.nome;

/**
 * Um d20 é um d20. Vinte e três não foi rolado num dado, foi digitado errado — e
 * o Log é append-only, então não dá para corrigir depois de gravado.
 *
 * A regra mora aqui, e não em cada lado, porque quem digita é a tela e quem
 * confere é o servidor: dois limites diferentes seriam uma linha aceita no
 * celular e recusada no meio da mesa.
 */
export const ehD20 = (valor: number): boolean =>
  Number.isInteger(valor) && valor >= 1 && valor <= 20;

/**
 * Todo Participante do Combate, na ordem em que a mesa os enxerga: os
 * personagens das Fichas primeiro, os Monstros declarados depois.
 *
 * A ordem daqui **não é a Fila de iniciativa** — a Fila é escolhida e publicada
 * pelo mestre, e é a issue #11. Esta é a lista de chamada.
 */
export const chamada = (
  estado: Estado,
  combate: Combate,
): readonly NaChamada[] => [
  ...Object.values(estado.personagens).map((personagem) =>
    procurar(combate, { tipo: "personagem", personagem: personagem.id }),
  ),
  ...combate.monstros.map((monstro) =>
    procurar(combate, { tipo: "monstro", nome: monstro.nome }),
  ),
];

/** Quem ainda não declarou. É o que o mestre olha para saber de quem cobrar. */
export const faltam = (
  estado: Estado,
  combate: Combate,
): readonly Participante[] =>
  chamada(estado, combate)
    .filter((linha) => linha.iniciativa === null)
    .map((linha) => linha.participante);

const procurar = (combate: Combate, participante: Participante): NaChamada => ({
  participante,
  iniciativa:
    combate.iniciativas.find((qual) =>
      mesmo(qual.participante, participante),
    ) ?? null,
});

/**
 * O nome que a mesa fala, para um Participante dos dois tipos. Um Monstro com
 * mais de um leva o quanto junto — "Goblin arqueiro ×3" é uma linha só na Fila,
 * e não três Participantes.
 */
export const nomeDe = (
  estado: Estado,
  combate: Combate,
  participante: Participante,
): string => {
  if (participante.tipo === "personagem") {
    return (
      estado.personagens[participante.personagem]?.nome ??
      participante.personagem
    );
  }

  const quantos =
    combate.monstros.find((qual) => qual.nome === participante.nome)
      ?.quantidade ?? 1;
  return quantos > 1 ? `${participante.nome} ×${quantos}` : participante.nome;
};

/** A chave de lista de um Participante: a identidade dele, nunca o nome que se lê. */
export const chaveDe = (participante: Participante): string =>
  participante.tipo === "personagem"
    ? `personagem:${participante.personagem}`
    : `monstro:${participante.nome}`;
