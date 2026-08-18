import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import { fichasDaMesa } from "../fichas/mesa.js";

/**
 * `npm run assets:placeholders`: um PNG preto para cada asset que a Ficha pede.
 *
 * **Por que gerar arquivo em vez de deixar a tela se virar sem ele.** Todo asset
 * é pedido pelo caminho desde o dia 1, e o `dev.ts` responde 404 de propósito
 * para imagem que não existe. Sem os arquivos, a mesa inteira desenvolve contra
 * um layout que nunca viu uma imagem — e o dia em que a arte entra é o dia em
 * que se descobre que ela não cabe. Com eles, o que muda quando a arte chega é
 * o conteúdo do arquivo, não o código.
 *
 * O placeholder é o retângulo preto; o rótulo em cinza claro é desenhado pela
 * tela por cima, que é como a Cena já faz. Escrever texto dentro do PNG pediria
 * uma fonte, e uma fonte é uma dependência para um arquivo que vai ser jogado
 * fora assim que o desenho chegar.
 *
 * Rodar de novo não sobrescreve o que já existe: a arte de verdade entra na
 * pasta com o mesmo nome, e um seed que a apagasse seria um desastre silencioso.
 */
const RAIZ = dirname(fileURLToPath(import.meta.url));

/** Quadrado, porque a tela do celular lista tudo em grade. */
const LADO = { itens: 256, magias: 256, personagens: 512 } as const;

const png = (lado: number): Buffer => {
  // Uma varredura por linha: o byte 0 na frente é o filtro "nenhum", e o resto
  // são os pixels em RGB. Preto é zero em todos, então a imagem inteira é zero.
  const cru = Buffer.alloc(lado * (1 + lado * 3));
  for (let linha = 0; linha < lado; linha++) cru[linha * (1 + lado * 3)] = 0;

  const cabecalho = Buffer.alloc(13);
  cabecalho.writeUInt32BE(lado, 0);
  cabecalho.writeUInt32BE(lado, 4);
  cabecalho[8] = 8; // 8 bits por canal
  cabecalho[9] = 2; // cor verdadeira, RGB, sem canal alfa
  // Os três zeros seguintes: compressão, filtro e entrelaçamento, todos padrão.

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pedaco("IHDR", cabecalho),
    pedaco("IDAT", deflateSync(cru)),
    pedaco("IEND", Buffer.alloc(0)),
  ]);
};

/** Um pedaço de PNG: tamanho, nome, conteúdo e o CRC dos dois últimos. */
const pedaco = (nome: string, conteudo: Buffer): Buffer => {
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(conteudo.length, 0);

  const corpo = Buffer.concat([Buffer.from(nome, "ascii"), conteudo]);
  const verificacao = Buffer.alloc(4);
  verificacao.writeUInt32BE(crc32(corpo), 0);

  return Buffer.concat([tamanho, corpo, verificacao]);
};

const TABELA = Array.from({ length: 256 }, (_, byte) => {
  let valor = byte;
  for (let volta = 0; volta < 8; volta++) {
    valor = valor & 1 ? 0xedb88320 ^ (valor >>> 1) : valor >>> 1;
  }
  return valor >>> 0;
});

const crc32 = (dados: Buffer): number => {
  let valor = 0xffffffff;
  for (const byte of dados) valor = TABELA[(valor ^ byte) & 0xff]! ^ (valor >>> 8);
  return (valor ^ 0xffffffff) >>> 0;
};

/**
 * O que a Mesa pede. Sai das Fichas de verdade: um item que ninguém carrega não
 * precisa de imagem, e um que alguém carrega não pode ficar sem.
 */
const pedidos = new Map<string, number>();

for (const ficha of fichasDaMesa) {
  pedidos.set(join("personagens", `${ficha.id}.png`), LADO.personagens);
  for (const item of ficha.inventario) pedidos.set(join("itens", `${item.chave}.png`), LADO.itens);
  for (const magia of ficha.magias) pedidos.set(join("magias", `${magia.chave}.png`), LADO.magias);
}

let criados = 0;
for (const [caminho, lado] of pedidos) {
  const destino = join(RAIZ, caminho);
  await mkdir(dirname(destino), { recursive: true });
  // `wx` falha se o arquivo existe: a arte de verdade mora no mesmo caminho, e
  // este script não tem nada que encostar nela.
  try {
    await writeFile(destino, png(lado), { flag: "wx" });
    criados++;
    console.log(`  criado  ${caminho}`);
  } catch {
    console.log(`  já tem  ${caminho}`);
  }
}

console.log(`${criados} placeholder(s) criado(s), de ${pedidos.size} asset(s) que a Mesa pede.`);
