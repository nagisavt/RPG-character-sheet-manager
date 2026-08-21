import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import { fichasDaMesa } from "../fichas/mesa.js";
import { acesos, ALTURA, LARGURA, quebrar } from "./fonte-de-pixel.js";

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
 * O arquivo é o placeholder combinado inteiro: retângulo preto com o rótulo em
 * cinza claro escrito dentro. O rótulo mora no PNG e não na tela de propósito —
 * uma tela que desenhasse o nome por cima da imagem teria que saber quando a
 * imagem é placeholder e quando é a arte de verdade, e não tem como saber.
 * Estando dentro do arquivo, ele some no dia em que o desenho entra por cima.
 *
 * Rodar de novo não sobrescreve o que já existe: a arte de verdade entra na
 * pasta com o mesmo nome, e um seed que a apagasse seria um desastre silencioso.
 */
const RAIZ = dirname(fileURLToPath(import.meta.url));

/** Quadrado, porque a tela do celular lista tudo em grade. */
const LADO = { itens: 256, magias: 256, personagens: 512 } as const;

/** O cinza claro combinado para o rótulo, o mesmo que a Cena usa na TV. */
const TINTA = [0x9a, 0xa0, 0xaa] as const;

/** Quantos caracteres cabem numa linha antes de o rótulo virar poeira na tela. */
const POR_LINHA = 12;

const png = (lado: number, rotulo: string): Buffer => {
  // Uma varredura por linha: o byte 0 na frente é o filtro "nenhum", e o resto
  // são os pixels em RGB. Preto é zero em todos, então a imagem inteira já
  // nasce sendo o retângulo preto — o que sobra é acender o rótulo.
  const porLinha = 1 + lado * 3;
  const cru = Buffer.alloc(lado * porLinha);

  const acender = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= lado || y >= lado) return;
    const inicio = y * porLinha + 1 + x * 3;
    cru[inicio] = TINTA[0];
    cru[inicio + 1] = TINTA[1];
    cru[inicio + 2] = TINTA[2];
  };

  const linhas = quebrar(rotulo, POR_LINHA);
  const colunas =
    Math.max(...linhas.map((linha) => linha.length)) * (LARGURA + 1) - 1;
  // Oito décimos do lado: o rótulo respira em vez de encostar na borda.
  const escala = Math.max(1, Math.floor((lado * 0.8) / colunas));

  const alturaDoTexto = linhas.length * (ALTURA + 2) * escala - 2 * escala;
  const topo = Math.floor((lado - alturaDoTexto) / 2);

  linhas.forEach((linha, ordem) => {
    const larguraDaLinha = (linha.length * (LARGURA + 1) - 1) * escala;
    const esquerda = Math.floor((lado - larguraDaLinha) / 2);
    const base = topo + ordem * (ALTURA + 2) * escala;

    [...linha].forEach((caractere, posicao) => {
      for (const [x, y] of acesos(caractere)) {
        // Cada pixel da fonte vira um quadrado de `escala` por `escala`.
        for (let alto = 0; alto < escala; alto++) {
          for (let largo = 0; largo < escala; largo++) {
            acender(
              esquerda + (posicao * (LARGURA + 1) + x) * escala + largo,
              base + y * escala + alto,
            );
          }
        }
      }
    });
  });

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
  for (const byte of dados)
    valor = TABELA[(valor ^ byte) & 0xff]! ^ (valor >>> 8);
  return (valor ^ 0xffffffff) >>> 0;
};

/**
 * O que a Mesa pede. Sai das Fichas de verdade: um item que ninguém carrega não
 * precisa de imagem, e um que alguém carrega não pode ficar sem.
 */
const pedidos = new Map<string, { lado: number; rotulo: string }>();

const pedir = (pasta: string, chave: string, lado: number) =>
  // O rótulo é a própria chave: é o que identifica o arquivo que falta, e é por
  // ela que se procura o desenho para pôr no lugar.
  pedidos.set(join(pasta, `${chave}.png`), { lado, rotulo: chave });

for (const ficha of fichasDaMesa) {
  pedir("personagens", ficha.id, LADO.personagens);
  for (const item of ficha.inventario) pedir("itens", item.chave, LADO.itens);
  for (const magia of ficha.magias) pedir("magias", magia.chave, LADO.magias);
}

let criados = 0;
for (const [caminho, { lado, rotulo }] of pedidos) {
  const destino = join(RAIZ, caminho);
  await mkdir(dirname(destino), { recursive: true });
  // `wx` falha se o arquivo existe: a arte de verdade mora no mesmo caminho, e
  // este script não tem nada que encostar nela.
  try {
    await writeFile(destino, png(lado, rotulo), { flag: "wx" });
    criados++;
    console.log(`  criado  ${caminho}`);
  } catch {
    console.log(`  já tem  ${caminho}`);
  }
}

console.log(
  `${criados} placeholder(s) criado(s), de ${pedidos.size} asset(s) que a Mesa pede.`,
);
