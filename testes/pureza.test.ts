import { readdir, readFile } from "node:fs/promises";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * O decisor e o reducer são puros: sem banco, sem socket, **sem relógio e sem
 * gerador aleatório**. Isso não é comportamento observável pela costura da
 * Mesa — nenhum teste de cena consegue distinguir um decisor que espia o
 * relógio de um que não espia — então a garantia é verificada no próprio texto
 * dos dois arquivos, que é onde ela mora.
 *
 * Isto não é uma segunda costura de teste: não exercita comportamento nenhum. É
 * uma regra de arquitetura escrita onde ela pode falhar em vermelho.
 */
const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

const semComentarios = async (caminho: string) =>
  (await readFile(join(raiz, caminho), "utf8")).replaceAll(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");

const IMPUREZAS = [
  { nome: "relógio", padrao: /\bDate\b|performance\.now|hrtime/ },
  { nome: "gerador aleatório", padrao: /Math\.random|randomUUID/ },
] as const;

/**
 * "Durante a Sessão nenhuma chamada externa acontece." O Catálogo é semeado
 * antes da noite começar, e o seed é o único arquivo do projeto autorizado a
 * falar com a internet.
 *
 * A regra vale porque o wi-fi da casa caindo no meio da sessão não pode tirar a
 * descrição de uma magia da tela — e uma regra dessas só continua valendo se
 * ficar vermelha quando alguém a quebrar.
 */
describe("nada de rede durante a Sessão", () => {
  const SEED = "server/catalogo-seed.ts";

  it(`só o ${SEED} fala com a internet`, async () => {
    const fontes = [...(await listar("server")), ...(await listar("shared"))];

    expect(fontes).toContain(SEED);

    for (const caminho of fontes.filter((fonte) => fonte !== SEED)) {
      expect(await semComentarios(caminho), caminho).not.toMatch(/\bfetch\s*\(|https?:\/\//);
    }
  });
});

const listar = async (pasta: string): Promise<string[]> => {
  const arquivos = await readdir(join(raiz, pasta), { recursive: true });
  return arquivos.filter((arquivo) => arquivo.endsWith(".ts")).map((arquivo) => posix.join(pasta, arquivo.replaceAll("\\", "/")));
};

describe.each(["shared/reducer.ts", "server/decisor.ts"])("%s é puro", (caminho) => {
  it.each(IMPUREZAS)("não tem $nome", async ({ padrao }) => {
    expect(await semComentarios(caminho)).not.toMatch(padrao);
  });

  /**
   * Banco e socket não são procurados pelo nome do módulo: o que se exige é que
   * não exista porta de entrada para eles. Importar só de `shared/` — que é puro
   * por construção — é a garantia, e ela não depende de adivinhar o nome do
   * módulo impuro da vez.
   */
  it("só importa de shared/", async () => {
    const fonte = await semComentarios(caminho);
    const origens = [...fonte.matchAll(/from\s+"([^"]+)"/g)].map(([, origem]) => origem!);

    expect(origens.length).toBeGreaterThan(0);
    for (const origem of origens) {
      const alvo = posix.normalize(posix.join(posix.dirname(caminho), origem));
      expect(alvo, `${caminho} importa '${origem}'`).toMatch(/^shared\//);
    }
  });
});
