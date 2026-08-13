import { createInterface } from "node:readline/promises";
import { criarMesa } from "./criar-mesa.js";
import { fichasDeExemplo } from "./fichas-exemplo.js";

/**
 * `npm run mesa:demo`: uma Mesa completa com Fichas de exemplo, pelo mesmo
 * harness dos testes, para servir de playground durante o desenvolvimento.
 *
 * O harness é código de produção-adjacente, não uma fixture escondida: rodar
 * ele fora do contexto de teste é o que garante isso.
 */
const mesa = await criarMesa({ fichas: fichasDeExemplo });

const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });
const celular = await mesa.conectar({ como: "jogador", personagem: "thorin" });
const tv = await mesa.conectar({ como: "mesa" });

console.log(`Mesa no ar na porta ${mesa.porta}, com o mestre, o celular do Thorin e a TV ligados.`);
console.log(`Log em ${mesa.caminhoDoLog}`);
// As linhas com `/` são Comandos da Mesa, digitados como o mestre digitaria na
// tela dele. As palavras soltas são controles daqui, do playground.
console.log("Comandos: /iniciar, /finalizar, /dano <personagem> <n>, /cura <personagem> <n>");
console.log("Playground: estado, log, reiniciar, sair");

const vidas = () =>
  Object.values(tv.estado.personagens)
    .map((personagem) => `${personagem.nome} ${personagem.vida}/${personagem.vidaMaxima}`)
    .join(", ");

/** Devolve `false` quando é hora de fechar a Mesa. */
const responder = async (linha: string): Promise<boolean> => {
  if (linha === "sair") return false;

  if (linha === "estado") {
    console.log(tv.estado);
    return true;
  }

  if (linha === "log") {
    // O mestre não filtra nada: o que ele recebeu é o Log inteiro.
    for (const evento of mestre.eventos) {
      console.log(`${evento.id}  ${evento.timestamp}  ${evento.tipo}  (${evento.autor.tipo})`);
    }
    return true;
  }

  if (linha === "reiniciar") {
    await mesa.reiniciar();
    console.log(`Servidor reiniciado. A TV voltou com sessaoAtiva=${tv.estado.sessaoAtiva}.`);
    return true;
  }

  if (linha === "") return true;

  const resposta = await mestre.digitar(linha);
  console.log(resposta.aceito ? "aceito" : `recusado: ${resposta.motivo}`);
  console.log(`  a TV vê sessaoAtiva=${tv.estado.sessaoAtiva} e ${vidas()}`);
  console.log(`  o celular do Thorin recebeu ${celular.eventos.length} Evento(s)`);
  return true;
};

const entrada = createInterface({ input: process.stdin, output: process.stdout, prompt: "> " });

// A entrada pode fechar (EOF, Ctrl+D, um script mandando as linhas de uma vez)
// enquanto um Comando ainda está em curso — pedir o prompt depois disso estoura.
let aberta = true;
entrada.on("close", () => (aberta = false));

entrada.prompt();
for await (const linha of entrada) {
  if (!(await responder(linha.trim()))) break;
  if (aberta) entrada.prompt();
}

entrada.close();
await mesa.encerrar();
