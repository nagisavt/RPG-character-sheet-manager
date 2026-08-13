import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { io, type Socket } from "socket.io-client";
import type { Comando, Resposta } from "../shared/comandos.js";
import type { Credencial, Handshake, Snapshot, Transmissao } from "../shared/identidade.js";
import { lerLinha } from "../shared/linha-de-comando.js";
import { reducer } from "../shared/reducer.js";
import { MESA_ID, type Estado, type Evento, type Ficha } from "../shared/tipos.js";
import { iniciarServidor, type Servidor } from "../server/servidor.js";

/**
 * O harness de Mesa: a única costura de teste do projeto.
 *
 * Sobe o servidor de verdade com um seed de Fichas e um banco temporário,
 * conecta clientes falsos por handshake e expõe o estado e os Eventos que cada
 * um recebeu. É a costura mais alta possível — um teste nela atravessa
 * comando → decisor → evento → broadcast → reducer inteiro — e não sabe se
 * existe um decisor, um reducer ou um SQLite embaixo.
 *
 * Não é uma fixture escondida em `__tests__`: `npm run mesa:demo` sobe uma Mesa
 * pelo mesmo caminho, fora do contexto de teste.
 */
export type Mesa = {
  porta: number;
  caminhoDoLog: string;
  conectar: (credencial: Credencial) => Promise<Cliente>;
  /** Derruba o servidor e sobe outro no mesmo Log e na mesma porta. Os clientes voltam sozinhos. */
  reiniciar: () => Promise<void>;
  encerrar: () => Promise<void>;
};

/** Um cliente falso: o que ele enxerga é exatamente o que uma tela enxergaria. */
export type Cliente = {
  /** Reconstruído aqui pelo mesmo `reducer` que roda no servidor. */
  readonly estado: Estado;
  /** Só os Eventos que este cliente teve direito de receber. */
  readonly eventos: readonly Evento[];
  enviar: (comando: Comando) => Promise<Resposta>;
  /** A linha que o mestre digita, pelo mesmo caminho da tela: `mestre.digitar("/dano thorin 8")`. */
  digitar: (linha: string) => Promise<Resposta>;
  /** O celular que dormiu e acordou: cai e volta sozinho, com o servidor no ar. */
  reconectar: () => Promise<void>;
  desconectar: () => void;
};

export type OpcoesDaMesa = {
  fichas: readonly Ficha[];
  senhaDoMestre?: string;
  /** Um arquivo temporário é criado quando não vem caminho. */
  caminhoDoLog?: string;
};

export const criarMesa = async (opcoes: OpcoesDaMesa): Promise<Mesa> => {
  const senhaDoMestre = opcoes.senhaDoMestre ?? "1234";
  const pasta = opcoes.caminhoDoLog === undefined ? await mkdtemp(join(tmpdir(), "mesa-")) : null;
  const caminhoDoLog = opcoes.caminhoDoLog ?? join(pasta!, "mesa.db");

  let servidor = await iniciarServidor({ fichas: opcoes.fichas, caminhoDoLog, senhaDoMestre });
  const porta = servidor.porta;
  const clientes: ClienteInterno[] = [];

  /**
   * Espera todo mundo chegar no mesmo ponto do Log. É o que torna o teste
   * determinístico sem `sleep`: o ack diz que o Comando foi aceito, e isto diz
   * que a transmissão já chegou em todas as telas.
   */
  const sincronizar = async (alvo: number): Promise<void> => {
    await Promise.all(clientes.map((cliente) => cliente.aguardarAte(alvo)));
  };

  return {
    porta,
    caminhoDoLog,

    conectar: async (credencial) => {
      const cliente = await conectarCliente(porta, { mesaId: MESA_ID, ...credencial }, sincronizar);
      clientes.push(cliente);
      return cliente;
    },

    reiniciar: async () => {
      const voltaram = clientes.map((cliente) => cliente.aguardarSnapshot());
      await servidor.encerrar();
      servidor = await iniciarServidor({
        fichas: opcoes.fichas,
        caminhoDoLog,
        senhaDoMestre,
        porta,
      });
      await Promise.all(voltaram);
    },

    encerrar: async () => {
      for (const cliente of clientes) cliente.desconectar();
      await servidor.encerrar();
      if (pasta !== null) await rm(pasta, { recursive: true, force: true });
    },
  };
};

type ClienteInterno = Cliente & {
  aguardarAte: (alvo: number) => Promise<void>;
  aguardarSnapshot: () => Promise<void>;
};

const conectarCliente = async (
  porta: number,
  apresentacao: Handshake,
  sincronizar: (alvo: number) => Promise<void>,
): Promise<ClienteInterno> => {
  const socket: Socket = io(`http://localhost:${porta}`, {
    auth: apresentacao,
    transports: ["websocket"],
    // Curto de propósito: `mesa.reiniciar()` depende da volta automática, e um
    // teste não deve esperar o segundo padrão do socket.io.
    reconnectionDelay: 50,
    reconnectionDelayMax: 200,
  });

  let estado: Estado;
  let ate = -1;
  const eventos: Evento[] = [];
  const esperando = new Set<() => void>();

  const avancou = () => {
    for (const acordar of [...esperando]) acordar();
  };

  socket.on("snapshot", ({ estado: recebido, ate: ondeEstou }: Snapshot) => {
    // Na reconexão vem o snapshot completo já filtrado, e depois só deltas.
    estado = recebido;
    ate = ondeEstou;
    avancou();
  });

  socket.on("transmissao", ({ ate: id, evento }: Transmissao) => {
    // O mesmo `reducer` de `shared/`, agora rodando no cliente.
    if (evento !== null) {
      eventos.push(evento);
      estado = reducer(estado, evento);
    }
    ate = id;
    avancou();
  });

  await new Promise<void>((pronto, falhou) => {
    socket.once("connect_error", (erro) => {
      // Handshake recusado: fecha o socket aqui, senão ele fica pendurado no
      // processo e o teste que provou a recusa vaza uma conexão.
      socket.close();
      falhou(new Error(erro.message));
    });
    socket.once("snapshot", () => pronto());
  });

  const aguardarAte = (alvo: number) =>
    new Promise<void>((pronto) => {
      // Uma tela desligada não fica devendo nada: quando voltar, ela volta pelo
      // snapshot, não pelos deltas que perdeu.
      if (ate >= alvo || !socket.connected) return pronto();
      const acordar = () => {
        if (ate < alvo && socket.connected) return;
        esperando.delete(acordar);
        pronto();
      };
      esperando.add(acordar);
      socket.once("disconnect", acordar);
    });

  const enviar = async (comando: Comando): Promise<Resposta> => {
    const resposta = await socket.emitWithAck("comando", comando);
    if (resposta.aceito) await sincronizar(ate);
    return resposta;
  };

  return {
    get estado() {
      return estado;
    },
    get eventos() {
      return eventos;
    },
    enviar,
    digitar: async (linha) => {
      const leitura = lerLinha(linha);
      // Uma linha que não é comando é uma recusa como outra qualquer para quem
      // digitou: nada sai daqui, e o motivo aparece no mesmo lugar da tela.
      if ("erro" in leitura) return { aceito: false, motivo: leitura.erro };
      return enviar(leitura.comando);
    },
    reconectar: async () => {
      const voltou = new Promise<void>((pronto) => socket.once("snapshot", () => pronto()));
      socket.disconnect().connect();
      await voltou;
    },
    desconectar: () => socket.disconnect(),
    aguardarAte,
    aguardarSnapshot: () => new Promise<void>((pronto) => socket.once("snapshot", () => pronto())),
  };
};
