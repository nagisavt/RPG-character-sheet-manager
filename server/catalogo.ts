import { DatabaseSync } from "node:sqlite";
import type { Consulta, Entrada, TipoDoCatalogo } from "../shared/catalogo.js";

/**
 * O Catálogo no SQLite. Semeado por `npm run catalogo:seed`, antes da Sessão, e
 * só lido durante ela: **nenhuma chamada externa acontece com a mesa na sala**.
 * Rede caindo no meio da noite não pode tirar a descrição de uma magia da tela.
 *
 * O módulo é read-only pela superfície: não existe função que escreva aqui. Quem
 * escreve é o seed, que abre a própria conexão e roda fora do servidor.
 */
export type Catalogo = {
  consultar: (consulta: Consulta) => Entrada | null;
  /** Quantas entradas existem, por tipo. É o que o `dev` imprime para avisar que falta semear. */
  contar: () => Record<TipoDoCatalogo, number>;
  fechar: () => void;
};

export const abrirCatalogo = (caminho: string): Catalogo => {
  const banco = new DatabaseSync(caminho);
  criarEsquema(banco);

  const porChave = banco.prepare("SELECT * FROM catalogo WHERE tipo = ? AND chave = ?");
  const totais = banco.prepare("SELECT tipo, COUNT(*) AS total FROM catalogo GROUP BY tipo");

  return {
    consultar: ({ tipo, chave }) => {
      const linha = porChave.get(tipo, chave);
      return linha === undefined ? null : hidratar(linha);
    },

    contar: () => {
      const zerado: Record<TipoDoCatalogo, number> = { magia: 0, item: 0, monstro: 0 };
      for (const linha of totais.all()) {
        zerado[String(linha["tipo"]) as TipoDoCatalogo] = Number(linha["total"]);
      }
      return zerado;
    },

    fechar: () => banco.close(),
  };
};

/**
 * `tipo` + `chave` é a identidade: a mesma chave pode existir como magia e como
 * item sem se atrapalhar. `REPLACE` na semeadura é o que faz rodar o seed duas
 * vezes ser inofensivo — o Catálogo é regenerável, ao contrário do Log.
 */
export const criarEsquema = (banco: DatabaseSync): void => {
  banco.exec(`
    CREATE TABLE IF NOT EXISTS catalogo (
      tipo TEXT NOT NULL,
      chave TEXT NOT NULL,
      nome TEXT NOT NULL,
      descricao TEXT NOT NULL,
      detalhes TEXT NOT NULL,
      PRIMARY KEY (tipo, chave)
    ) WITHOUT ROWID;
  `);
};

/** Usado pelo seed e pelo harness — nunca pelo servidor, que só lê. */
export const semear = (banco: DatabaseSync, entradas: readonly Entrada[]): void => {
  criarEsquema(banco);
  const inserir = banco.prepare(
    "INSERT OR REPLACE INTO catalogo (tipo, chave, nome, descricao, detalhes) VALUES (?, ?, ?, ?, ?)",
  );
  for (const entrada of entradas) {
    inserir.run(
      entrada.tipo,
      entrada.chave,
      entrada.nome,
      entrada.descricao,
      JSON.stringify(entrada.detalhes),
    );
  }
};

const hidratar = (linha: Record<string, unknown>): Entrada => ({
  tipo: String(linha["tipo"]) as TipoDoCatalogo,
  chave: String(linha["chave"]),
  nome: String(linha["nome"]),
  descricao: String(linha["descricao"]),
  detalhes: JSON.parse(String(linha["detalhes"])) as Entrada["detalhes"],
});
