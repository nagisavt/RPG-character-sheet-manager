import { mkdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import type { Entrada } from "../shared/catalogo.js";
import { semear } from "./catalogo.js";

/**
 * `npm run catalogo:seed`: baixa o SRD 5.2.1 (2024, CC-BY) do Open5e v2 e grava
 * no SQLite. **Este é o único arquivo do projeto que fala com a internet**, e
 * ele roda antes da Sessão, nunca durante — a regra está escrita como teste em
 * `testes/pureza.test.ts`.
 *
 * O motivo é a regra dura do v1: nada pode ser ponto único de falha da noite. O
 * wi-fi da casa caindo não pode tirar a descrição de uma magia da tela.
 *
 * Rodar duas vezes é inofensivo: o Catálogo é regenerável, ao contrário do Log.
 */
const DOCUMENTO = "srd-2024";
const API = "https://api.open5e.com/v2";

type Bruto = Record<string, unknown>;
type Pagina = { next: string | null; results: Bruto[] };

const baixar = async (recurso: string): Promise<Bruto[]> => {
  let endereco: string | null = `${API}/${recurso}/?document__key=${DOCUMENTO}&limit=100`;
  const tudo: Bruto[] = [];

  while (endereco !== null) {
    const resposta = await fetch(endereco);
    if (!resposta.ok) {
      throw new Error(`Open5e respondeu ${resposta.status} em ${recurso}`);
    }
    const pagina = (await resposta.json()) as Pagina;
    tudo.push(...pagina.results);
    process.stdout.write(`\r  ${recurso}: ${tudo.length}`);
    endereco = pagina.next;
  }

  process.stdout.write("\n");
  return tudo;
};

/** Os campos do Open5e vêm ora como texto, ora como `{ name, key }`. */
const rotulo = (valor: unknown): string => {
  if (typeof valor === "string") return valor;
  if (typeof valor === "number") return String(valor);
  if (typeof valor === "object" && valor !== null) return rotulo((valor as Bruto)["name"]);
  return "";
};

const numero = (valor: unknown): number | null => (typeof valor === "number" ? valor : null);

const comoMagia = (bruto: Bruto): Entrada => ({
  tipo: "magia",
  chave: rotulo(bruto["key"]),
  nome: rotulo(bruto["name"]),
  descricao: rotulo(bruto["desc"]),
  detalhes: {
    nivel: numero(bruto["level"]),
    escola: rotulo(bruto["school"]),
    execucao: rotulo(bruto["casting_time"]),
    alcance: rotulo(bruto["range_text"]),
    duracao: rotulo(bruto["duration"]),
    concentracao: bruto["concentration"] === true,
    ritual: bruto["ritual"] === true,
  },
});

const comoItem = (bruto: Bruto): Entrada => ({
  tipo: "item",
  chave: rotulo(bruto["key"]),
  nome: rotulo(bruto["name"]),
  descricao: rotulo(bruto["desc"]),
  detalhes: {
    categoria: rotulo(bruto["category"]),
    custo: rotulo(bruto["cost"]),
    peso: rotulo(bruto["weight"]),
  },
});

/**
 * Criatura do SRD não tem campo de descrição — o texto dela mora nas ações e
 * traços. A descrição aqui é montada dos campos que existem, que é o que serve
 * para o mestre conferir uma coisa no meio da mesa.
 *
 * Isto não é o Monstro da Fila de iniciativa: aquele o mestre declara na hora,
 * com nome e bônus, e não vem daqui (CONTEXT.md).
 */
const comoMonstro = (bruto: Bruto): Entrada => {
  const tipo = rotulo(bruto["type"]);
  const tamanho = rotulo(bruto["size"]);
  const nd = numero(bruto["challenge_rating"]);
  const vida = numero(bruto["hit_points"]);

  return {
    tipo: "monstro",
    chave: rotulo(bruto["key"]),
    nome: rotulo(bruto["name"]),
    descricao: [tipo, tamanho].filter(Boolean).join(" ") + (nd === null ? "" : `, ND ${nd}`),
    detalhes: { tipo, tamanho, nd, vida },
  };
};

console.log(`Baixando o SRD ${DOCUMENTO} do Open5e…`);

const entradas: Entrada[] = [
  ...(await baixar("spells")).map(comoMagia),
  ...(await baixar("items")).map(comoItem),
  ...(await baixar("creatures")).map(comoMonstro),
].filter((entrada) => entrada.chave !== "" && entrada.nome !== "");

await mkdir("dados", { recursive: true });
const banco = new DatabaseSync("dados/mesa.db");
semear(banco, entradas);
banco.close();

console.log(`\n${entradas.length} entradas no Catálogo, em dados/mesa.db.`);
console.log("Daqui para frente nenhuma chamada externa acontece: a Sessão lê só daqui.");
