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
          [evento.personagem]: {
            ...personagem,
            vida: evento.vida,
            // Um `VidaAlterada` gravado antes de a Vida bônus existir não tem o
            // segundo pote, e vai continuar não tendo: o Log não se reescreve.
            // Um Evento que não fala de um pote não mexe nele.
            vidaBonus: evento.vidaBonus ?? personagem.vidaBonus,
          },
        },
      };
    }

    case "VidaBonusConcedida": {
      const personagem = estado.personagens[evento.personagem];
      if (personagem === undefined) return estado;

      // Substitui o valor anterior. Somar seria o app decidindo que dois efeitos
      // se empilham, que é regra de mesa e não é dele (ADR-0001).
      return {
        ...estado,
        personagens: {
          ...estado.personagens,
          [evento.personagem]: { ...personagem, vidaBonus: evento.vidaBonus },
        },
      };
    }
  }
};

/** O estado da Mesa é o Log dobrado sobre a posição inicial. */
export const reconstruir = (inicial: Estado, eventos: readonly EventoNovo[]): Estado =>
  eventos.reduce(reducer, inicial);
