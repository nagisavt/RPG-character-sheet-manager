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
  }
};

/** O estado da Mesa é o Log dobrado sobre a posição inicial. */
export const reconstruir = (inicial: Estado, eventos: readonly EventoNovo[]): Estado =>
  eventos.reduce(reducer, inicial);
