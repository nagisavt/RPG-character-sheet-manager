import type { Estado, Ficha } from "./tipos.js";

/**
 * A posição inicial do estado: as Fichas, e nada mais. Não sai do Log — o Log é
 * o que aconteceu depois daqui (ADR-0002).
 */
export const estadoInicial = (fichas: readonly Ficha[]): Estado => ({
  sessaoAtiva: false,
  personagens: Object.fromEntries(fichas.map((ficha) => [ficha.id, { ...ficha }])),
});
