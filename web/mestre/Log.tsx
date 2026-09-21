import { useEffect, useRef, useState } from "react";
import type { LogDaMesa } from "../../shared/identidade.js";
import { daSessaoAtual, type Linha, ler } from "../../shared/log.js";

/**
 * A tela de Log do mestre: tudo que aconteceu, em português, para ele
 * reconstruir qualquer momento da Sessão.
 *
 * O que aparece aqui inclui o que é privado dos jogadores — o bloco de notas e
 * as Moedas. Filtrar seria filtrar do mestre: a porta é o pedido `log` do
 * servidor, que não responde a mais ninguém.
 */
export const Log = ({
  ate,
  pedirLog,
}: {
  /** Até onde a Mesa andou. Muda a cada Evento, e é o que faz o Log ser pedido de novo. */
  ate: number;
  pedirLog: () => Promise<LogDaMesa | null>;
}) => {
  // `null` é "o Log ainda não chegou", e não "não aconteceu nada": um pedido que
  // falhou não pode virar uma tela dizendo que a noite está vazia.
  const [linhas, setLinhas] = useState<readonly Linha[] | null>(null);
  const [campanha, setCampanha] = useState(false);
  const fim = useRef<HTMLLIElement>(null);

  // `ate` não é lido dentro do efeito, ele é o gatilho: o Log cresceu, então ele
  // é pedido de novo. Um Evento que não muda nada visível na tela — a Anotação
  // de um jogador — também move o `ate`, e também precisa aparecer aqui.
  // biome-ignore lint/correctness/useExhaustiveDependencies: ver acima.
  useEffect(() => {
    let atual = true;
    void pedirLog().then((log) => {
      // A resposta que chegou depois de outra mais nova é descartada: o servidor
      // responde na ordem que quiser, e a última a chegar não é a mais recente.
      if (atual && log !== null) setLinhas(ler(log.inicial, log.eventos));
    });
    return () => {
      atual = false;
    };
  }, [ate, pedirLog]);

  // A noite de hoje por padrão. A campanha inteira é para quando ele procura o
  // que aconteceu em janeiro — e ela continua inteira, porque o Log nunca é
  // apagado nem arquivado.
  const mostradas =
    linhas === null ? null : campanha ? linhas : daSessaoAtual(linhas);

  // `mostradas` é gatilho também, e pelo mesmo motivo: o que interessa é que a
  // lista mudou, para a última linha continuar à vista com a mesa esperando.
  // biome-ignore lint/correctness/useExhaustiveDependencies: ver acima.
  useEffect(
    () => fim.current?.scrollIntoView({ block: "nearest" }),
    [mostradas],
  );

  return (
    <section className="log">
      <header>
        <h2>Log</h2>
        <div className="corte">
          <label>
            <input
              type="radio"
              name="corte-do-log"
              checked={!campanha}
              onChange={() => setCampanha(false)}
            />
            Sessão atual
          </label>
          <label>
            <input
              type="radio"
              name="corte-do-log"
              checked={campanha}
              onChange={() => setCampanha(true)}
            />
            campanha inteira
          </label>
        </div>
      </header>

      {mostradas === null ? (
        <p className="apagado">abrindo o Log…</p>
      ) : mostradas.length === 0 ? (
        <p className="apagado">Nada registrado ainda.</p>
      ) : (
        <ol className="linhas">
          {mostradas.map((linha, ordem) => (
            // O `id` do Evento é do banco e é único no Log inteiro: não existe
            // aqui a dúvida de chave repetida que a Prateleira do jogador tem.
            <li
              key={linha.evento.id}
              ref={ordem === mostradas.length - 1 ? fim : null}
            >
              <span className="hora">{hora(linha.evento.timestamp)}</span>
              <span>{linha.texto}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

/**
 * `20:14`. O Evento carimba o instante inteiro, em ISO; o que o mestre procura
 * na tela é a hora da noite, e o resto é ruído entre uma linha e a seguinte.
 */
const hora = (timestamp: string): string =>
  new Date(timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
