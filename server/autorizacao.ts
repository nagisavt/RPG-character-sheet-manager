import type { Resposta, TipoDeComando } from "../shared/comandos.js";
import type { Identidade } from "../shared/identidade.js";

/**
 * A regra, em uma linha: **o jogador só emite sobre si mesmo, e só
 * `AnotacaoAtualizada` e `IniciativaDeclarada`; todo o resto exige ser o
 * mestre.** A iniciativa chega na issue que a traz.
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
  concederVidaBonus: ["mestre"],
  trocarCena: ["mestre"],
  // O bloco de notas é do jogador, e o mestre não escreve nele: ele lê tudo na
  // tela de Log, que é outra coisa.
  atualizarAnotacao: ["jogador"],
};

export const autorizar = (identidade: Identidade, tipo: TipoDeComando): Resposta => {
  if (identidade.como === "mesa") {
    return { aceito: false, motivo: "A tela da Mesa só lê: ela não envia Comandos" };
  }
  const podem = QUEM_PODE[tipo];
  if (!podem.includes(identidade.como)) {
    return { aceito: false, motivo: `Só o ${podem.join(" ou o ")} pode enviar '${tipo}'` };
  }
  return { aceito: true };
};
