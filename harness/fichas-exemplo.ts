import type { Ficha } from "../shared/tipos.js";

/**
 * Fichas de exemplo para o `mesa:demo` e para os testes. As Fichas de verdade
 * são as de `fichas/mesa.ts`, digitadas à mão pelo mestre (ADR-0002); estas aqui
 * têm a mesma forma e existem só para haver uma Mesa para desenvolver contra.
 *
 * São separadas de propósito: o mestre sobe a vida máxima do Thorin de verdade
 * entre duas sessões, e nenhum teste pode ficar vermelho por causa disso.
 */
export const thorin: Ficha = { id: "thorin", nome: "Thorin", vidaMaxima: 28 };
export const elara: Ficha = { id: "elara", nome: "Elara", vidaMaxima: 22 };

export const fichasDeExemplo: readonly Ficha[] = [thorin, elara];
