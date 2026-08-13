import type { Entrada } from "../shared/catalogo.js";

/**
 * Um punhado de entradas de Catálogo para o `mesa:demo` e para os testes, pelo
 * mesmo motivo das Fichas de exemplo: o Catálogo de verdade vem do
 * `catalogo:seed`, tem mil e cem entradas e pode ser resemeado a qualquer
 * momento — nenhum teste pode ficar vermelho por causa disso.
 *
 * As chaves são as de verdade do SRD, para que o que se aprende aqui valha lá.
 */
export const misselMagico: Entrada = {
  tipo: "magia",
  chave: "srd-2024_magic-missile",
  nome: "Míssil Mágico",
  descricao: "Três dardos de energia, cada um com 1d4+1 de dano de força.",
  detalhes: { nivel: 1, escola: "Evocação", concentracao: false, ritual: false },
};

export const corda: Entrada = {
  tipo: "item",
  chave: "srd-2024_rope",
  nome: "Corda",
  descricao: "Corda de 15 metros, que aguenta 1.600 quilos.",
  detalhes: { categoria: "Equipamento", custo: "1.00", peso: "5.000 lb" },
};

export const catalogoDeExemplo: readonly Entrada[] = [misselMagico, corda];
