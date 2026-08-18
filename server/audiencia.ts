import type { Identidade } from "../shared/identidade.js";
import type { Audiencia, Estado, EventoNovo } from "../shared/tipos.js";

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

/**
 * O estado como **este** socket tem direito de vê-lo.
 *
 * `podeVer` cuida dos deltas, um a um. Esta função cuida da outra porta por onde
 * o estado **sai pela rede**: o snapshot, que vai inteiro e de uma vez, na
 * conexão e em toda reconexão. Sem ela, filtrar os Eventos privados não adiantaria nada
 * — o celular que dormisse e acordasse voltaria com o bloco de notas de todo
 * mundo dentro.
 *
 * O que se apaga aqui é o conteúdo, não o campo: uma tela que recebesse um
 * `Personagem` sem `anotacao` teria que adivinhar se é vazio ou se é sigilo.
 */
export const projetar = (estado: Estado, identidade: Identidade): Estado => {
  // O mestre não filtra nada, do mesmo jeito que na tela de Log dele.
  if (identidade.como === "mestre") return estado;

  const meu = identidade.como === "jogador" ? identidade.personagem : null;

  return {
    ...estado,
    personagens: Object.fromEntries(
      Object.entries(estado.personagens).map(([id, personagem]) => [
        id,
        id === meu ? personagem : { ...personagem, anotacao: "" },
      ]),
    ),
  };
};
