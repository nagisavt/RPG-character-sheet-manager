import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { createServer as criarVite } from "vite";
import { fichasDaMesa } from "../fichas/mesa.js";
import { iniciarServidor } from "./servidor.js";

/**
 * `npm run dev`: o processo Node com o SQLite, esperando conexões.
 *
 * As Fichas vêm de `fichas/mesa.ts`, o arquivo que o mestre edita à mão. O banco
 * fica em `dados/`, fora do versionamento, e sobrevive ao reinício: é ele que
 * reconstrói o estado.
 */
// O `.env` é a variável de ambiente escrita uma vez, num arquivo que não é
// versionado. Não existir é normal: quem exporta a senha na mão passa direto.
try {
  process.loadEnvFile(".env");
} catch {
  // Sem `.env`. A conferência da senha logo abaixo é quem decide se dá para subir.
}

const PORTA = Number(process.env["PORTA"] ?? 3000);

// A senha não tem default: um default é uma senha pública, e `/mestre` é a tela
// que declara o que aconteceu na Mesa.
const SENHA_MESTRE = process.env["SENHA_MESTRE"];
if (SENHA_MESTRE === undefined || SENHA_MESTRE === "") {
  console.error("Falta SENHA_MESTRE: a senha do mestre vem do ambiente, não do código.");
  console.error("  copie .env.exemplo para .env e escolha a senha lá dentro,");
  console.error('  ou exporte na mão:  $env:SENHA_MESTRE = "..."; npm run dev');
  // `tsx watch` segura o terminal depois desta saída: o processo morreu, mas a
  // janela continua aberta esperando um arquivo mudar. Editar o `.env` sobe.
  process.exit(1);
}

/**
 * O fallback de SPA responde o `index.html` para o que ele não conhece — e para
 * um `<img>`, HTML é um arquivo quebrado com cara de sucesso. A Cena que ainda
 * não tem desenho tem que dar 404, que é o que faz a TV mostrar o placeholder
 * pelo motivo certo. Vale para toda a arte que vai entrar em `assets/`.
 */
const IMAGEM = /\.(png|jpe?g|webp|svg|gif)$/i;

const imagemQueNaoExiste = (url: string | undefined): boolean => {
  const caminho = (url ?? "").split("?")[0] ?? "";
  return IMAGEM.test(caminho) && !existsSync(join("assets", caminho));
};

await mkdir("dados", { recursive: true });

// As telas no mesmo processo do Log: um `npm run dev` sobe a Mesa inteira.
const vite = await criarVite({
  configFile: "web/vite.config.ts",
  server: { middlewareMode: true },
});

const servidor = await iniciarServidor({
  fichas: fichasDaMesa,
  caminhoDoLog: "dados/mesa.db",
  senhaDoMestre: SENHA_MESTRE,
  porta: PORTA,
  paginas: (requisicao, resposta) => {
    if (imagemQueNaoExiste(requisicao.url)) {
      resposta.statusCode = 404;
      resposta.end("Este arquivo não está na pasta");
      return;
    }
    vite.middlewares(requisicao, resposta, () => {
      resposta.statusCode = 404;
      resposta.end("Esta tela não existe");
    });
  },
});

console.log(`Mesa no ar em http://localhost:${servidor.porta}/mestre`);
console.log(`Log com ${servidor.log().length} Evento(s). Sessão ativa: ${servidor.estado.sessaoAtiva}`);

const desligar = async () => {
  await servidor.encerrar();
  await vite.close();
  process.exit(0);
};
process.on("SIGINT", desligar);
process.on("SIGTERM", desligar);
