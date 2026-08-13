import type { Estado, EventoNovo } from "./tipos.js";

/**
 * `reducer(estado, evento) => estado`. Puro: sem banco, sem socket, sem relógio
 * e sem gerador aleatório. Roda no servidor e no cliente, deste mesmo arquivo.
 *
 * Recebe `EventoNovo` e não `Evento` de propósito: o reducer lê o corpo do
 * Evento e nunca o envelope, então serve tanto para o replay do Log quanto para
 * um Evento recém-decidido, antes de ser gravado.
 */
export const reducer = (estado: Estado, evento: EventoNovo): Estado => {
  switch (evento.tipo) {
    case "SessaoIniciada":
      return { ...estado, sessaoAtiva: true };
    case "SessaoFinalizada":
      return { ...estado, sessaoAtiva: false };

    case "CenaTrocada":
      return { ...estado, cena: evento.cena };

    case "VidaAlterada": {
      const personagem = estado.personagens[evento.personagem];
      // Um personagem que saiu das Fichas continua no Log: a campanha em que ele
      // esteve aconteceu. Os Eventos dele passam batido, não quebram o replay.
      if (personagem === undefined) return estado;

      // **Atribui, não acumula** (ADR-0003). É o que faz o replay do Log dar no
      // mesmo lugar depois de a vida máxima mudar na Ficha.
      return {
        ...estado,
        personagens: {
          ...estado.personagens,
          [evento.personagem]: { ...personagem, vida: evento.vida },
        },
      };
    }
  }
};

/** O estado da Mesa é o Log dobrado sobre a posição inicial. */
export const reconstruir = (inicial: Estado, eventos: readonly EventoNovo[]): Estado =>
  eventos.reduce(reducer, inicial);
