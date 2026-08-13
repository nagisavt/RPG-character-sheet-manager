import type { Estado, Ficha } from "./tipos.js";

/**
 * A posição inicial do estado: as Fichas, e nada mais. Não sai do Log — o Log é
 * o que aconteceu depois daqui (ADR-0002).
 */
export const estadoInicial = (fichas: readonly Ficha[]): Estado => ({
  sessaoAtiva: false,
  personagens: Object.fromEntries(fichas.map((ficha) => [ficha.id, personagemDe(ficha)])),
  cena: null,
});

/**
 * Campo a campo, e não `{ ...ficha }`: a Ficha vai crescer com o que o v1 só lê
 * — inventário, magias — e nada disso é estado de Mesa. O que atravessa é o que
 * está escrito aqui.
 *
 * A vida começa cheia porque a Ficha é o começo da campanha, não o meio dela: a
 * Mesa que já entrou ferida registra o dano, que é um fato, e vira Evento.
 */
const personagemDe = (ficha: Ficha) => ({
  id: ficha.id,
  nome: ficha.nome,
  vida: ficha.vidaMaxima,
  vidaMaxima: ficha.vidaMaxima,
});
