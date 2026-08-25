import { useCallback, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { Consulta, Entrada } from "../shared/catalogo.js";
import type { Comando, Resposta } from "../shared/comandos.js";
import type {
  Credencial,
  LogDaMesa,
  Snapshot,
  Transmissao,
} from "../shared/identidade.js";
import { lerLinha } from "../shared/linha-de-comando.js";
import { reducer } from "../shared/reducer.js";
import { type Estado, type Ficha, MESA_ID } from "../shared/tipos.js";

/**
 * A ligação de uma tela com a Mesa. É o outro lado exato do harness de teste:
 * handshake, snapshot, deltas, e o `reducer` de `shared/` rodando aqui no
 * navegador — o mesmo arquivo que roda no servidor.
 */
export type Ligacao =
  | { situacao: "na porta" }
  | { situacao: "entrando" }
  | { situacao: "recusado"; motivo: string }
  | {
      situacao: "na mesa";
      estado: Estado;
      /**
       * Até onde do Log esta tela já está em dia. Vem do servidor, no snapshot e
       * em cada transmissão, e é o que diz para a tela de Log do mestre que o
       * Log cresceu — inclusive quando o Evento que o fez crescer não muda nada
       * que se veja na tela.
       */
      ate: number;
    };

export const usarMesa = () => {
  const [ligacao, setLigacao] = useState<Ligacao>({ situacao: "na porta" });
  const socket = useRef<Socket | null>(null);

  const entrar = useCallback((credencial: Credencial) => {
    socket.current?.close();
    setLigacao({ situacao: "entrando" });

    // A identidade vai no handshake e nunca no conteúdo de um Comando: é aqui,
    // uma vez, que esta tela diz quem é.
    const ligado = io({ auth: { mesaId: MESA_ID, ...credencial } });
    socket.current = ligado;

    ligado.on("connect_error", (erro) => {
      // A senha errada é recusada pelo servidor, no handshake. Nada do que está
      // atrás dela chegou a sair de lá.
      ligado.close();
      setLigacao({ situacao: "recusado", motivo: erro.message });
    });

    // Na (re)conexão vem o snapshot completo já filtrado, e depois só deltas.
    ligado.on("snapshot", ({ estado, ate }: Snapshot) =>
      setLigacao({ situacao: "na mesa", estado, ate }),
    );

    ligado.on("transmissao", ({ ate, evento }: Transmissao) => {
      setLigacao((anterior) => {
        if (anterior.situacao !== "na mesa") return anterior;
        // O `ate` anda mesmo quando o Evento não veio: esta tela não tinha
        // direito de vê-lo, e o número de ordem é a única coisa que atravessa.
        const estado =
          evento === null ? anterior.estado : reducer(anterior.estado, evento);
        return { ...anterior, estado, ate };
      });
    });
  }, []);

  const enviar = useCallback(
    async (comando: Comando): Promise<Resposta> =>
      (await socket.current?.emitWithAck("comando", comando)) ?? {
        aceito: false,
        motivo: "A tela não está ligada na Mesa",
      },
    [],
  );

  /** A linha digitada, lida pela mesma gramática que o `mesa:demo` usa. */
  const digitar = useCallback(
    async (linha: string): Promise<Resposta> => {
      const leitura = lerLinha(linha);
      if ("erro" in leitura) return { aceito: false, motivo: leitura.erro };
      return enviar(leitura.comando);
    },
    [enviar],
  );

  /**
   * O Catálogo, pelo mesmo socket e fora do fluxo de Comando: a regra do SRD não
   * é fato da Mesa e não entra no Log. Devolve `null` para o que não está lá —
   * Catálogo não semeado não derruba a tela.
   */
  const consultar = useCallback(
    async (consulta: Consulta): Promise<Entrada | null> =>
      (await socket.current?.emitWithAck("consultar", consulta)) ?? null,
    [],
  );

  /**
   * A Ficha desta tela. Não leva personagem no pedido: quem ela é já está
   * amarrado no socket desde o handshake, e é isso que faz não existir pedir a
   * Ficha do colega.
   */
  const minhaFicha = useCallback(
    async (): Promise<Ficha | null> =>
      (await socket.current?.emitWithAck("minhaFicha")) ?? null,
    [],
  );

  /**
   * O Log inteiro, para a tela do mestre. `null` em qualquer outra tela: ele não
   * sai do servidor para mais ninguém, e a porta é lá.
   *
   * Vem inteiro a cada pedido, sem `desde`: o Log de uma campanha cabe folgado
   * numa mensagem, e uma segunda cópia mantida em dia aqui seria uma segunda
   * verdade sobre o que aconteceu.
   */
  const pedirLog = useCallback(
    async (): Promise<LogDaMesa | null> =>
      (await socket.current?.emitWithAck("log")) ?? null,
    [],
  );

  return { ligacao, entrar, enviar, digitar, consultar, minhaFicha, pedirLog };
};
