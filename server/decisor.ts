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

    case "alterarVida": {
      const personagem = estado.personagens[comando.personagem];
      if (personagem === undefined) {
        return { recusa: `Personagem desconhecido: ${comando.personagem}` };
      }
      // O Log é append-only: um `NaN` gravado aqui não tem como ser corrigido
      // depois, e passaria a envenenar todo replay da campanha.
      if (!Number.isInteger(comando.diferenca)) {
        return { recusa: "A diferença de vida precisa ser um número inteiro" };
      }

      // O teto não recusa o Comando, limita o resultado: uma cura de 8 em quem
      // está a 3 do máximo aconteceu, e o Evento registra as duas coisas.
      const vida = entre(0, personagem.vida + comando.diferenca, personagem.vidaMaxima);
      return {
        eventos: [
          {
            tipo: "VidaAlterada",
            personagem: comando.personagem,
            declarado: comando.diferenca,
            vida,
            autor,
            // A vida é pública: ela está na TV, em barra, para a mesa inteira ver.
            audiencia: ["publico"],
          },
        ],
      };
    }
  }
};

const entre = (minimo: number, valor: number, maximo: number): number =>
  Math.min(Math.max(valor, minimo), maximo);
