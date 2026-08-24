import type { Ficha } from "../shared/tipos.js";

/**
 * Fichas de exemplo para o `mesa:demo` e para os testes. As Fichas de verdade
 * são as de `fichas/mesa.ts`, digitadas à mão pelo mestre (ADR-0002); estas aqui
 * têm a mesma forma e existem só para haver uma Mesa para desenvolver contra.
 *
 * São separadas de propósito: o mestre sobe a vida máxima do Thorin de verdade
 * entre duas sessões, e nenhum teste pode ficar vermelho por causa disso.
 *
 * As chaves são as do `catalogo-exemplo.ts`, para que a Ficha e o Catálogo do
 * harness se encontrem — é assim que a mesa de verdade funciona.
 */
export const thorin: Ficha = {
  id: "thorin",
  nome: "Thorin",
  vidaMaxima: 28,
  moedas: 120,
  bonusDeIniciativa: 1,
  inventario: [{ chave: "srd-2024_rope", quantidade: 1 }],
  magias: [],
  equipado: { maoPrincipal: null, maoSecundaria: null, corpo: null },
};

export const elara: Ficha = {
  id: "elara",
  nome: "Elara",
  vidaMaxima: 22,
  moedas: 35,
  bonusDeIniciativa: 3,
  inventario: [],
  magias: [{ chave: "srd-2024_magic-missile", conhecida: true }],
  equipado: { maoPrincipal: null, maoSecundaria: null, corpo: null },
};

export const fichasDeExemplo: readonly Ficha[] = [thorin, elara];
