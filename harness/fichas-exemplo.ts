import type { Ficha } from "../shared/tipos.js";

/**
 * Fichas de exemplo para o `mesa:demo` e para os testes. As Fichas de verdade
 * são digitadas à mão pelo mestre num arquivo versionado (ADR-0002); estas aqui
 * têm a mesma forma e existem só para haver uma Mesa para desenvolver contra.
 */
export const thorin: Ficha = { id: "thorin", nome: "Thorin" };
export const elara: Ficha = { id: "elara", nome: "Elara" };

export const fichasDeExemplo: readonly Ficha[] = [thorin, elara];
