import type { Estado, Ficha } from "./tipos.js";

/**
 * A posição inicial do estado: as Fichas, e nada mais. Não sai do Log — o Log é
 * o que aconteceu depois daqui (ADR-0002).
 */
export const estadoInicial = (fichas: readonly Ficha[]): Estado => ({
  sessaoAtiva: false,
  personagens: Object.fromEntries(
    fichas.map((ficha) => [ficha.id, personagemDe(ficha)]),
  ),
  cena: null,
  // Fora de Combate. Ele nasce de um `CombateIniciado` e some quando o mestre
  // encerra — nunca da Ficha, que não sabe de que noite se está falando.
  combate: null,
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
  bonusDeIniciativa: ficha.bonusDeIniciativa,
  // Zero, e não um campo da Ficha: a Vida bônus é concedida durante a Sessão e
  // gasta na mesma noite. Começar a campanha com ela seria a Ficha inventando
  // um fato que ninguém declarou.
  vidaBonus: 0,
  // As Moedas vêm da Ficha pelo mesmo motivo da vida: é com elas que o
  // personagem chegou no começo da campanha. O que ele gastou depois é fato da
  // Sessão, e fato da Sessão é Log.
  moedas: ficha.moedas,
  // Vazio, e não da Ficha: o que o jogador escreveu é fato da Sessão também. A
  // Ficha é a folha de papel, não o caderno dele.
  anotacao: "",
});
