/**
 * Uma fonte de 3×5 pixels, para escrever o rótulo dentro do PNG de placeholder.
 *
 * **Por que uma fonte à mão em vez de uma dependência.** O placeholder existe
 * para ser jogado fora: no dia em que o desenho entra na pasta, nada disto roda
 * de novo. Puxar um renderizador de fonte para dentro do projeto — com binário
 * nativo, versão de sistema e tudo o que vem junto — para gerar um arquivo
 * temporário sairia mais caro do que as trinta linhas de tabela aqui embaixo.
 *
 * Só maiúsculas, números e os três símbolos que aparecem numa chave do SRD
 * (`srd-2024_magic-missile`). O que não estiver na tabela vira espaço, que num
 * rótulo de placeholder é um buraco, não um defeito.
 */
const GLIFOS: Record<string, readonly string[]> = {
  A: ["###", "# #", "###", "# #", "# #"],
  B: ["## ", "# #", "## ", "# #", "## "],
  C: ["###", "#  ", "#  ", "#  ", "###"],
  D: ["## ", "# #", "# #", "# #", "## "],
  E: ["###", "#  ", "## ", "#  ", "###"],
  F: ["###", "#  ", "## ", "#  ", "#  "],
  G: ["###", "#  ", "# #", "# #", "###"],
  H: ["# #", "# #", "###", "# #", "# #"],
  I: ["###", " # ", " # ", " # ", "###"],
  J: ["###", "  #", "  #", "# #", "###"],
  K: ["# #", "# #", "## ", "# #", "# #"],
  L: ["#  ", "#  ", "#  ", "#  ", "###"],
  M: ["# #", "###", "###", "# #", "# #"],
  N: ["# #", "## ", "###", "# #", "# #"],
  O: ["###", "# #", "# #", "# #", "###"],
  P: ["###", "# #", "###", "#  ", "#  "],
  Q: ["###", "# #", "# #", "###", "  #"],
  R: ["###", "# #", "## ", "# #", "# #"],
  S: ["###", "#  ", "###", "  #", "###"],
  T: ["###", " # ", " # ", " # ", " # "],
  U: ["# #", "# #", "# #", "# #", "###"],
  V: ["# #", "# #", "# #", "# #", " # "],
  W: ["# #", "# #", "###", "###", "# #"],
  X: ["# #", "# #", " # ", "# #", "# #"],
  Y: ["# #", "# #", "###", " # ", " # "],
  Z: ["###", "  #", " # ", "#  ", "###"],
  "0": ["###", "# #", "# #", "# #", "###"],
  "1": [" # ", "## ", " # ", " # ", "###"],
  "2": ["###", "  #", "###", "#  ", "###"],
  "3": ["###", "  #", "###", "  #", "###"],
  "4": ["# #", "# #", "###", "  #", "  #"],
  "5": ["###", "#  ", "###", "  #", "###"],
  "6": ["###", "#  ", "###", "# #", "###"],
  "7": ["###", "  #", "  #", "  #", "  #"],
  "8": ["###", "# #", "###", "# #", "###"],
  "9": ["###", "# #", "###", "  #", "###"],
  "-": ["   ", "   ", "###", "   ", "   "],
  _: ["   ", "   ", "   ", "   ", "###"],
  ".": ["   ", "   ", "   ", "   ", " # "],
};

export const LARGURA = 3;
export const ALTURA = 5;

/** Os pixels acesos de um caractere, em coordenadas de 0 a 2 e de 0 a 4. */
export const acesos = (caractere: string): readonly [number, number][] => {
  const glifo = GLIFOS[caractere.toUpperCase()];
  if (glifo === undefined) return [];

  const pontos: [number, number][] = [];
  for (let linha = 0; linha < ALTURA; linha++) {
    for (let coluna = 0; coluna < LARGURA; coluna++) {
      if (glifo[linha]?.[coluna] === "#") pontos.push([coluna, linha]);
    }
  }
  return pontos;
};

/**
 * Quebra o rótulo em linhas de no máximo `porLinha` caracteres, cortando de
 * preferência no hífen ou no sublinhado — é onde uma chave do SRD tem junta.
 */
export const quebrar = (rotulo: string, porLinha: number): string[] => {
  const linhas: string[] = [];
  let sobra = rotulo;

  while (sobra.length > porLinha) {
    const pedaco = sobra.slice(0, porLinha + 1);
    const junta = Math.max(pedaco.lastIndexOf("-"), pedaco.lastIndexOf("_"));
    const corte = junta > 0 ? junta + 1 : porLinha;
    linhas.push(sobra.slice(0, corte));
    sobra = sobra.slice(corte);
  }

  linhas.push(sobra);
  return linhas;
};
