import {
  createServer,
  type IncomingMessage,
  type Server as ServidorHttp,
  type ServerResponse,
} from "node:http";
import { Server as ServidorSocket, type Socket } from "socket.io";
import type { Consulta, Entrada, TipoDoCatalogo } from "../shared/catalogo.js";
import type { Comando, Resposta } from "../shared/comandos.js";
import { estadoInicial } from "../shared/estado.js";
import {
  autorDe,
  type Apresentacao,
  type Identidade,
  type Snapshot,
  type Transmissao,
} from "../shared/identidade.js";
import { reconstruir, reducer } from "../shared/reducer.js";
import { MESA_ID, type Estado, type Ficha } from "../shared/tipos.js";
import { podeVer } from "./audiencia.js";
import { autorizar } from "./autorizacao.js";
import { abrirCatalogo } from "./catalogo.js";
import { decisor } from "./decisor.js";
import { abrirStore, type Store } from "./store.js";

export type OpcoesDoServidor = {
  fichas: readonly Ficha[];
  /** O arquivo SQLite onde o Log mora. Ele sobrevive ao processo: é o que reconstrói o estado. */
  caminhoDoLog: string;
  senhaDoMestre: string;
  /** `0` pede uma porta livre ao sistema. A porta de verdade sai em `servidor.porta`. */
  porta?: number;
  /**
   * Quem serve as telas. Opcional porque os testes sobem a Mesa sem navegador
   * nenhum: a costura é o socket, e o harness não deve carregar um bundler para
   * provar que um Comando virou Evento.
   */
  paginas?: (requisicao: IncomingMessage, resposta: ServerResponse) => void;
};

export type Servidor = {
  porta: number;
  /** O estado da Mesa, em memória. O SQLite guarda só o Log. */
  readonly estado: Estado;
  log: () => ReturnType<Store["ler"]>;
  /** Quantas entradas o Catálogo tem, por tipo. Zero quer dizer que falta semear. */
  catalogo: () => Record<TipoDoCatalogo, number>;
  encerrar: () => Promise<void>;
};

type Sessao = { identidade: Identidade };

export const iniciarServidor = async (opcoes: OpcoesDoServidor): Promise<Servidor> => {
  const store = abrirStore({ caminho: opcoes.caminhoDoLog });
  const catalogo = abrirCatalogo(opcoes.caminhoDoLog);

  // Na subida, o estado é o Log dobrado sobre as Fichas. Reiniciar o servidor
  // no meio da Sessão custa segundos e não perde nada.
  const log = store.ler();
  let estado = reconstruir(estadoInicial(opcoes.fichas), log);
  let ate = log.at(-1)?.id ?? 0;

  // As telas entram como listener do http **antes** do socket.io: o engine.io
  // guarda quem já estava ali e só repassa o que não for dele. Registrar depois
  // faria as duas coisas responderem à mesma requisição.
  const http = opcoes.paginas === undefined ? createServer() : createServer(opcoes.paginas);
  const io = new ServidorSocket<
    { comando: ComandoDoCliente; consultar: ConsultaDoCliente },
    EventosDoServidor,
    never,
    Sessao
  >(
    http,
    { serveClient: false },
  );

  const telasLigadas = () => io.of("/").sockets.values();

  io.use((socket, seguir) => {
    const identidade = identificar(socket.handshake.auth as Apresentacao, opcoes);
    if (typeof identidade === "string") return seguir(new Error(identidade));
    socket.data.identidade = identidade;
    seguir();
  });

  io.on("connection", (socket) => {
    socket.emit("snapshot", { estado, ate });
    socket.on("comando", (comando, responder) => responder(processar(socket, comando)));
    // Consultar o Catálogo não é Comando: não muda nada, não vira Evento e não
    // passa por autorização — é a mesma regra do SRD para qualquer tela.
    socket.on("consultar", (consulta, responder) =>
      responder(ehConsulta(consulta) ? catalogo.consultar(consulta) : null),
    );
  });

  const processar = (socket: Socket<never, EventosDoServidor, never, Sessao>, comando: Comando) => {
    const { identidade } = socket.data;

    const autorizacao = autorizar(identidade, comando.tipo);
    if (!autorizacao.aceito) return autorizacao;

    const autor = autorDe(identidade);
    if (autor === null) return { aceito: false, motivo: "Esta tela não envia Comandos" } as const;

    const decisao = decisor(estado, comando, autor);
    if ("recusa" in decisao) return { aceito: false, motivo: decisao.recusa } as const;

    for (const novo of decisao.eventos) {
      const evento = store.gravar(novo);
      estado = reducer(estado, evento);
      ate = evento.id;
      // O broadcast acontece antes do ack: quando quem mandou o Comando recebe
      // "aceito", a própria transmissão dele já chegou.
      for (const tela of telasLigadas()) {
        const visivel = podeVer(evento, tela.data.identidade);
        tela.emit("transmissao", { ate: evento.id, evento: visivel ? evento : null });
      }
    }
    return { aceito: true } as const;
  };

  await new Promise<void>((pronto) => http.listen(opcoes.porta ?? 0, pronto));

  return {
    porta: portaDe(http),
    get estado() {
      return estado;
    },
    log: () => store.ler(),
    catalogo: () => catalogo.contar(),
    encerrar: async () => {
      await io.close();
      store.fechar();
      catalogo.fechar();
    },
  };
};

/**
 * A identidade é amarrada aqui, uma vez, e nunca mais lida do conteúdo de um
 * Comando. Devolve a `Identidade` ou o motivo da recusa.
 */
const identificar = (apresentacao: Apresentacao, opcoes: OpcoesDoServidor): Identidade | string => {
  if (apresentacao.mesaId !== MESA_ID) return "Mesa desconhecida";

  switch (apresentacao.como) {
    case "mestre":
      // A senha vem de variável de ambiente e nunca do cliente.
      return apresentacao.senha === opcoes.senhaDoMestre ? { como: "mestre" } : "Senha incorreta";

    case "jogador": {
      // A identidade do jogador é declarada, não provada: cinco pessoas na mesma
      // sala, sem PIN. O que se exige é que o personagem exista nas Fichas.
      const personagem = apresentacao.personagem;
      if (typeof personagem !== "string") return "Falta dizer qual personagem";
      if (!opcoes.fichas.some((ficha) => ficha.id === personagem)) {
        return `Personagem desconhecido: ${personagem}`;
      }
      return { como: "jogador", personagem };
    }

    case "mesa":
      // A TV abre sem senha nenhuma: ligar a tela é abrir o navegador.
      return { como: "mesa" };

    default:
      return "Handshake sem identidade";
  }
};

const portaDe = (http: ServidorHttp): number => {
  const endereco = http.address();
  if (endereco === null || typeof endereco === "string") {
    throw new Error("O servidor subiu sem porta TCP");
  }
  return endereco.port;
};

/**
 * A consulta chega da rede, então nada nela é confiável antes de conferido —
 * mesma régua do handshake. Um `tipo` que não existe não é erro de ninguém: o
 * Catálogo simplesmente não tem aquilo.
 */
const TIPOS: readonly string[] = ["magia", "item", "monstro"];

const ehConsulta = (consulta: unknown): consulta is Consulta => {
  if (typeof consulta !== "object" || consulta === null) return false;
  const { tipo, chave } = consulta as Record<string, unknown>;
  return typeof chave === "string" && typeof tipo === "string" && TIPOS.includes(tipo);
};

type ComandoDoCliente = (comando: Comando, responder: (resposta: Resposta) => void) => void;

type ConsultaDoCliente = (consulta: Consulta, responder: (entrada: Entrada | null) => void) => void;

type EventosDoServidor = {
  snapshot: (snapshot: Snapshot) => void;
  transmissao: (transmissao: Transmissao) => void;
};
