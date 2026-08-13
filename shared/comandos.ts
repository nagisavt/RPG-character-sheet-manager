import type { PersonagemId } from "./tipos.js";

/**
 * Um Comando é a intenção que um cliente envia ao servidor. Pode ser recusado.
 *
 * Nenhum Comando carrega quem o enviou: a identidade é amarrada no handshake e
 * lida do socket. Um campo `autor` aqui seria um jogador dizendo ser o mestre.
 */
export type Comando =
  | { tipo: "iniciarSessao" }
  | { tipo: "finalizarSessao" }
  /** `diferenca` é assinada: negativa é dano, positiva é cura. Quem resolve o teto é o decisor. */
  | { tipo: "alterarVida"; personagem: PersonagemId; diferenca: number }
  /** O nome do arquivo em `assets/cenas/`, sem extensão e sem caminho. */
  | { tipo: "trocarCena"; cena: string };

export type TipoDeComando = Comando["tipo"];

/** A resposta do servidor a um Comando. Um Evento nunca é recusado; um Comando pode ser. */
export type Resposta = { aceito: true } | { aceito: false; motivo: string };
