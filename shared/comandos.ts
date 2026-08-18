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
  /** `vidaBonus` é o total depois do Comando, não o quanto acrescentar: ele substitui. */
  | { tipo: "concederVidaBonus"; personagem: PersonagemId; vidaBonus: number }
  /** O nome do arquivo em `assets/cenas/`, sem extensão e sem caminho. */
  | { tipo: "trocarCena"; cena: string }
  /** `diferenca` é assinada: negativa é gasto, positiva é ganho. Quem para em zero é o decisor. */
  | { tipo: "alterarMoedas"; personagem: PersonagemId; diferenca: number }
  /**
   * O bloco de notas inteiro, como ele ficou. Não diz de quem é: o personagem
   * sai do socket, e é isso que faz não existir escrever no bloco do colega.
   */
  | { tipo: "atualizarAnotacao"; texto: string };

export type TipoDeComando = Comando["tipo"];

/** A resposta do servidor a um Comando. Um Evento nunca é recusado; um Comando pode ser. */
export type Resposta = { aceito: true } | { aceito: false; motivo: string };
