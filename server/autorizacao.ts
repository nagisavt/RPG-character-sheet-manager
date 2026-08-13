import type { Resposta, TipoDeComando } from "../shared/comandos.js";
import type { Identidade } from "../shared/identidade.js";

/**
 * A regra, em uma linha: **o jogador só emite sobre si mesmo, e só
 * `AnotacaoAtualizada` e `IniciativaDeclarada`; todo o resto exige ser o
 * mestre.** Os dois Comandos de jogador chegam nas issues que os trazem; por
 * enquanto a tabela só tem Comandos de mestre.
 *
 * A primeira metade — "sobre si mesmo" — não é checada aqui, e sim garantida
 * pela forma: o personagem de um Comando de jogador é sempre o do handshake,
 * porque o decisor recebe o autor do socket e o Comando não tem onde carregar
 * outro. Não há como escrever um Comando de jogador sobre um terceiro.
 */
const QUEM_PODE: Record<TipoDeComando, Identidade["como"][]> = {
  iniciarSessao: ["mestre"],
  finalizarSessao: ["mestre"],
  // Vida é do mestre, inclusive a do próprio jogador: quem declara o que
  // aconteceu na mesa é ele.
  alterarVida: ["mestre"],
  trocarCena: ["mestre"],
};

export const autorizar = (identidade: Identidade, tipo: TipoDeComando): Resposta => {
  if (identidade.como === "mesa") {
    return { aceito: false, motivo: "A tela da Mesa só lê: ela não envia Comandos" };
  }
  if (!QUEM_PODE[tipo].includes(identidade.como)) {
    return { aceito: false, motivo: `Só o mestre pode enviar '${tipo}'` };
  }
  return { aceito: true };
};
