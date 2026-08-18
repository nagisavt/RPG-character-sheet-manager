import type { Estado, EventoNovo, Personagem, PersonagemId } from "./tipos.js";

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

    case "VidaAlterada":
      // **Atribui, não acumula** (ADR-0003). É o que faz o replay do Log dar no
      // mesmo lugar depois de a vida máxima mudar na Ficha.
      return comPersonagem(estado, evento.personagem, (personagem) => ({
        vida: evento.vida,
        // Um `VidaAlterada` gravado antes de a Vida bônus existir não tem o
        // segundo pote, e vai continuar não tendo: o Log não se reescreve. Um
        // Evento que não fala de um pote não mexe nele.
        vidaBonus: evento.vidaBonus ?? personagem.vidaBonus,
      }));

    case "VidaBonusConcedida":
      // Substitui o valor anterior. Somar seria o app decidindo que dois efeitos
      // se empilham, que é regra de mesa e não é dele (ADR-0001).
      return comPersonagem(estado, evento.personagem, () => ({ vidaBonus: evento.vidaBonus }));

    case "MoedasAlteradas":
      // Atribui, não acumula (ADR-0003), do mesmo jeito que a vida.
      return comPersonagem(estado, evento.personagem, () => ({ moedas: evento.moedas }));

    case "AnotacaoAtualizada":
      // Atribui a Anotação inteira. O cliente que não tinha direito de ver este
      // Evento não chega aqui: ele nunca o recebeu.
      return comPersonagem(estado, evento.personagem, () => ({ anotacao: evento.texto }));
  }
};

/**
 * Um personagem trocado, e o resto do estado igual.
 *
 * Um personagem que saiu das Fichas continua no Log: a campanha em que ele
 * esteve aconteceu. Os Eventos dele passam batido daqui, sem quebrar o replay —
 * e é essa regra, escrita uma vez, que todo Evento de personagem herda.
 */
const comPersonagem = (
  estado: Estado,
  id: PersonagemId,
  mudanca: (personagem: Personagem) => Partial<Personagem>,
): Estado => {
  const personagem = estado.personagens[id];
  if (personagem === undefined) return estado;

  return {
    ...estado,
    personagens: { ...estado.personagens, [id]: { ...personagem, ...mudanca(personagem) } },
  };
};

/** O estado da Mesa é o Log dobrado sobre a posição inicial. */
export const reconstruir = (inicial: Estado, eventos: readonly EventoNovo[]): Estado =>
  eventos.reduce(reducer, inicial);
