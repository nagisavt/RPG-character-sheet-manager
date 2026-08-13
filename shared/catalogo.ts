/**
 * O Catálogo: os dados de regra do SRD, iguais para qualquer mesa.
 *
 * Ele é a terceira fonte de dado do sistema, e a única que **nunca muda**:
 * Catálogo nunca, Ficha entre sessões, Log durante a sessão (ADR-0002). Por
 * isso ele não vira Evento e não entra no Log — repetir "Míssil Mágico faz
 * 1d4+1" dentro de um Log append-only seria gravar para sempre uma coisa que
 * não aconteceu.
 */
export type TipoDoCatalogo = "magia" | "item" | "monstro";

/**
 * Uma entrada, do jeito que a tela lê. `detalhes` guarda o que é próprio de cada
 * tipo — nível e escola de uma magia, peso e custo de um item — sem virar uma
 * tabela por tipo: o v1 só exibe, e o que ele exibe é `nome` e `descricao`.
 */
export type Entrada = {
  tipo: TipoDoCatalogo;
  /** O identificador do SRD, como `srd-2024_acid-arrow`. É por ele que se consulta. */
  chave: string;
  nome: string;
  descricao: string;
  detalhes: Record<string, string | number | boolean | null>;
};

/** O que uma tela pergunta ao Catálogo. Não é Comando: não muda nada, não pode ser recusado por regra. */
export type Consulta = { tipo: TipoDoCatalogo; chave: string };
