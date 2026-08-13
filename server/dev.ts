import { mkdir } from "node:fs/promises";
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
const PORTA = Number(process.env["PORTA"] ?? 3000);

// A senha não tem default: um default é uma senha pública, e `/mestre` é a tela
// que declara o que aconteceu na Mesa.
const SENHA_MESTRE = process.env["SENHA_MESTRE"];
if (SENHA_MESTRE === undefined || SENHA_MESTRE === "") {
  console.error("Falta SENHA_MESTRE: a senha do mestre vem do ambiente, não do código.");
  console.error('  PowerShell:  $env:SENHA_MESTRE = "..."; npm run dev');
  console.error('  bash:        SENHA_MESTRE="..." npm run dev');
  process.exit(1);
}

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
  paginas: (requisicao, resposta) =>
    vite.middlewares(requisicao, resposta, () => {
      resposta.statusCode = 404;
      resposta.end("Esta tela não existe");
    }),
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
