import { useCallback, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { Comando, Resposta } from "../shared/comandos.js";
import type { Credencial, Snapshot, Transmissao } from "../shared/identidade.js";
import { lerLinha } from "../shared/linha-de-comando.js";
import { reducer } from "../shared/reducer.js";
import { MESA_ID, type Estado } from "../shared/tipos.js";

/**
 * A ligação de uma tela com a Mesa. É o outro lado exato do harness de teste:
 * handshake, snapshot, deltas, e o `reducer` de `shared/` rodando aqui no
 * navegador — o mesmo arquivo que roda no servidor.
 */
export type Ligacao =
  | { situacao: "na porta" }
  | { situacao: "entrando" }
  | { situacao: "recusado"; motivo: string }
  | { situacao: "na mesa"; estado: Estado };

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
    ligado.on("snapshot", ({ estado }: Snapshot) => setLigacao({ situacao: "na mesa", estado }));

    ligado.on("transmissao", ({ evento }: Transmissao) => {
      if (evento === null) return;
      setLigacao((anterior) =>
        anterior.situacao === "na mesa"
          ? { ...anterior, estado: reducer(anterior.estado, evento) }
          : anterior,
      );
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

  return { ligacao, entrar, enviar, digitar };
};
