import type { Comando } from "../shared/comandos.js";
import type { Autor, Estado, EventoNovo } from "../shared/tipos.js";

/**
 * A decisão sobre um Comando: os Eventos que ele produz, ou a recusa.
 *
 * Uma recusa aqui é de regra da Mesa ("a Sessão já está em curso"), não de
 * permissão — a autorização já recusou antes o que nem devia ter chegado.
 */
export type Decisao = { eventos: EventoNovo[] } | { recusa: string };

/**
 * `decisor(estado, comando, autor) => EventoNovo[]`. Puro: sem banco, sem
 * socket, sem relógio e sem gerador aleatório.
 *
 * O `autor` é o terceiro argumento, e não um campo do Comando, porque ele vem
 * da identidade do socket: um Comando que carregasse o próprio autor seria um
 * jogador podendo se declarar mestre.
 */
export const decisor = (estado: Estado, comando: Comando, autor: Autor): Decisao => {
  switch (comando.tipo) {
    case "iniciarSessao":
      if (estado.sessaoAtiva) return { recusa: "A Sessão já está em curso" };
      return { eventos: [{ tipo: "SessaoIniciada", autor, audiencia: ["publico"] }] };

    case "finalizarSessao":
      if (!estado.sessaoAtiva) return { recusa: "Nenhuma Sessão em curso" };
      return { eventos: [{ tipo: "SessaoFinalizada", autor, audiencia: ["publico"] }] };
  }
};
