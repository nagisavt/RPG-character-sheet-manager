import type { Identidade } from "../shared/identidade.js";
import type { Audiencia, EventoNovo } from "../shared/tipos.js";

/**
 * A audiência é **gravada** no Evento, não calculada no broadcast: a
 * visibilidade é uma escolha feita num instante, e recalcular depois reescreveria
 * retroativamente quem viu o quê num Log que nunca é apagado.
 *
 * Aqui só se lê a escolha já gravada, para decidir se este socket a recebe.
 */
export const podeVer = (evento: EventoNovo, identidade: Identidade): boolean =>
  // A tela de Log do mestre não filtra nada: só ele a abre, e ela mostra o Log
  // inteiro, incluindo o que é privado dos jogadores.
  identidade.como === "mestre" || evento.audiencia.some((alvo) => alcanca(alvo, identidade));

const alcanca = (alvo: Audiencia, identidade: Identidade): boolean => {
  if (alvo === "publico") return true;
  if (alvo === "mestre") return identidade.como === "mestre";
  return identidade.como === "jogador" && identidade.personagem === alvo.privado;
};
