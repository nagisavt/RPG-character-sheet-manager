import { mkdir } from "node:fs/promises";
import { fichasDeExemplo } from "../harness/fichas-exemplo.js";
import { iniciarServidor } from "./servidor.js";

/**
 * `npm run dev`: o processo Node com o SQLite, esperando conexões.
 *
 * As Fichas ainda são as de exemplo — o arquivo versionado de Fichas de verdade
 * é a issue #3. O banco fica em `dados/`, fora do versionamento, e sobrevive ao
 * reinício: é ele que reconstrói o estado.
 */
const PORTA = Number(process.env["PORTA"] ?? 3000);
const SENHA_MESTRE = process.env["SENHA_MESTRE"] ?? "1234";

await mkdir("dados", { recursive: true });

const servidor = await iniciarServidor({
  fichas: fichasDeExemplo,
  caminhoDoLog: "dados/mesa.db",
  senhaDoMestre: SENHA_MESTRE,
  porta: PORTA,
});

console.log(`Mesa no ar em http://localhost:${servidor.porta}`);
console.log(`Log com ${servidor.log().length} Evento(s). Sessão ativa: ${servidor.estado.sessaoAtiva}`);

const desligar = async () => {
  await servidor.encerrar();
  process.exit(0);
};
process.on("SIGINT", desligar);
process.on("SIGTERM", desligar);
