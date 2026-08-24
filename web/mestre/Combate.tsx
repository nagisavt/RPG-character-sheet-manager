import { type FormEvent, type Ref, useRef, useState } from "react";
import type { Comando, Resposta } from "../../shared/comandos.js";
import { chamada, chaveDe, nomeDe } from "../../shared/combate.js";
import type {
  Estado,
  Iniciativa,
  Monstro,
  Participante,
} from "../../shared/tipos.js";

/**
 * O Combate no notebook do mestre: declarar os Monstros, ver as iniciativas
 * chegando de vários celulares ao mesmo tempo, saber de quem ainda falta cobrar,
 * e montar a Fila para publicar de uma vez na TV.
 *
 * Nada nesta tela rola nada. O d20 do Monstro é digitado do mesmo jeito que o
 * do jogador: o dado é rolado na mesa, por uma pessoa (ADR-0001).
 */
export const Combate = ({
  estado,
  enviar,
}: {
  estado: Estado;
  enviar: (comando: Comando) => Promise<Resposta>;
}) => {
  const [recusa, setRecusa] = useState<string | null>(null);
  const montar = useRef<HTMLDialogElement>(null);

  /**
   * Devolve se deu certo, e guarda o motivo quando não. Sem isto, uma recusa de
   * regra — dois Monstros com o mesmo nome, um d20 de 23 — sumia da tela e o
   * mestre ficava achando que tinha declarado.
   */
  const tentar = async (comando: Comando): Promise<boolean> => {
    const resposta = await enviar(comando);
    setRecusa(resposta.aceito ? null : resposta.motivo);
    return resposta.aceito;
  };

  if (estado.combate === null) {
    return (
      <section className="combate">
        <button
          type="button"
          onClick={() => void tentar({ tipo: "iniciarCombate" })}
        >
          iniciar Combate
        </button>
        {recusa !== null && <p className="resposta recusada">{recusa}</p>}
      </section>
    );
  }

  const combate = estado.combate;
  const linhas = chamada(estado, combate);
  const quantosFaltam = linhas.filter(
    (linha) => linha.iniciativa === null,
  ).length;

  return (
    <section className="combate">
      <header>
        <h2>Combate</h2>
        <span className="apagado">
          {quantosFaltam === 0 ? "todos declararam" : `faltam ${quantosFaltam}`}
        </span>
      </header>

      <ul className="chamada">
        {linhas.map(({ participante, iniciativa }) => (
          <li key={chaveDe(participante)}>
            <span>{nomeDe(estado, combate, participante)}</span>
            {participante.tipo === "monstro" ? (
              <DadoDoMonstro
                nome={participante.nome}
                iniciativa={iniciativa}
                declarar={(d20) =>
                  tentar({
                    tipo: "declararIniciativaDoMonstro",
                    nome: participante.nome,
                    d20,
                  })
                }
              />
            ) : iniciativa === null ? (
              <span className="apagado">esperando</span>
            ) : (
              <Resultado iniciativa={iniciativa} />
            )}
          </li>
        ))}
      </ul>

      <DeclararMonstros
        monstros={combate.monstros}
        declarar={(monstros) => tentar({ tipo: "declararMonstros", monstros })}
      />

      <div className="acoes">
        <button type="button" onClick={() => montar.current?.showModal()}>
          {combate.fila === null ? "montar a Fila" : "remontar a Fila"}
        </button>
        <button
          type="button"
          onClick={() => void tentar({ tipo: "encerrarCombate" })}
        >
          encerrar Combate
        </button>
      </div>

      <MontarFila
        ref={montar}
        estado={estado}
        publicar={async (fila) => {
          const aceito = await tentar({ tipo: "publicarFila", fila });
          if (aceito) montar.current?.close();
          return aceito;
        }}
      />

      {recusa !== null && <p className="resposta recusada">{recusa}</p>}
    </section>
  );
};

/**
 * O modal onde a Fila é montada: a lista dos Participantes, e uma seta para
 * cima e uma para baixo em cada um.
 *
 * **O app não ordena.** Nem por iniciativa, nem como sugestão: a Fila é uma
 * ordem escolhida, não uma ordem calculada (`CONTEXT.md`), e um "já deixei
 * ordenado para você" seria o app decidindo o empate que é da mesa. O que ele
 * mostra é o que cada um tirou, do lado do nome, para o mestre decidir olhando.
 */
const MontarFila = ({
  ref,
  estado,
  publicar,
}: {
  ref: Ref<HTMLDialogElement>;
  estado: Estado;
  publicar: (fila: readonly Participante[]) => Promise<boolean>;
}) => {
  const combate = estado.combate;
  const [ordem, setOrdem] = useState<readonly Participante[] | null>(null);

  if (combate === null) return null;

  // Enquanto o mestre não mexeu, a lista é a da chamada — os personagens e
  // depois os Monstros, na ordem em que foram declarados.
  const daChamada = chamada(estado, combate).map(
    ({ participante }) => participante,
  );
  const atual = ordem === null ? daChamada : reconciliar(ordem, daChamada);

  const mover = (de: number, para: number) => {
    if (para < 0 || para >= atual.length) return;
    const movida = [...atual];
    const [saiu] = movida.splice(de, 1);
    movida.splice(para, 0, saiu!);
    setOrdem(movida);
  };

  return (
    <dialog className="modal" ref={ref}>
      <header>
        <h2>Fila de iniciativa</h2>
        <form method="dialog">
          <button type="submit" aria-label="Fechar">
            ×
          </button>
        </form>
      </header>

      <ol className="montagem">
        {atual.map((participante, posicao) => {
          const rolou = combate.iniciativas.find(
            (qual) => chaveDe(qual.participante) === chaveDe(participante),
          );

          return (
            <li key={chaveDe(participante)}>
              <span>{nomeDe(estado, combate, participante)}</span>
              <span className="apagado">
                {rolou === undefined ? "—" : rolou.resultado}
              </span>
              <button
                type="button"
                onClick={() => mover(posicao, posicao - 1)}
                disabled={posicao === 0}
                aria-label={`Subir ${nomeDe(estado, combate, participante)}`}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => mover(posicao, posicao + 1)}
                disabled={posicao === atual.length - 1}
                aria-label={`Descer ${nomeDe(estado, combate, participante)}`}
              >
                ↓
              </button>
            </li>
          );
        })}
      </ol>

      <div className="acoes">
        <button type="button" onClick={() => void publicar(atual)}>
          publicar para a Mesa
        </button>
      </div>
    </dialog>
  );
};

/**
 * A ordem que o mestre montou, mais o que apareceu depois dela.
 *
 * O reforço declarado no meio do Combate entra **no fim**, e não desmancha o que
 * ele já tinha arrastado: arrumar sete Participantes e ver tudo voltar ao lugar
 * porque um ogro chegou é o tipo de coisa que faz o mestre desistir da tela e ir
 * gritar a ordem. Quem saiu da chamada some daqui junto.
 */
const reconciliar = (
  ordem: readonly Participante[],
  daChamada: readonly Participante[],
): readonly Participante[] => {
  const existe = new Set(daChamada.map(chaveDe));
  const jaOrdenados = new Set(ordem.map(chaveDe));

  return [
    ...ordem.filter((participante) => existe.has(chaveDe(participante))),
    ...daChamada.filter(
      (participante) => !jaOrdenados.has(chaveDe(participante)),
    ),
  ];
};

/**
 * O d20 cru fica do lado do resultado: é o número que a pessoa gritou na mesa, e
 * é por ele que ela reclama se o total parecer errado.
 */
const Resultado = ({ iniciativa }: { iniciativa: Iniciativa }) => (
  <strong>
    {iniciativa.resultado}{" "}
    <span className="apagado">(d20 {iniciativa.d20})</span>
  </strong>
);

/**
 * O d20 que o mestre rolou atrás do biombo por aquele Monstro.
 *
 * Continua alcançável depois de declarado: quem digitou 7 e queria 17 corrige
 * aqui, do mesmo jeito que o jogador corrige no celular dele.
 */
const DadoDoMonstro = ({
  nome,
  iniciativa,
  declarar,
}: {
  nome: string;
  iniciativa: Iniciativa | null;
  declarar: (d20: number) => Promise<boolean>;
}) => {
  const [d20, setD20] = useState("");
  const [corrigindo, setCorrigindo] = useState(false);

  if (iniciativa !== null && !corrigindo) {
    return (
      <span className="declarado">
        <Resultado iniciativa={iniciativa} />
        <button type="button" onClick={() => setCorrigindo(true)}>
          corrigir
        </button>
      </span>
    );
  }

  return (
    <form
      className="dado"
      onSubmit={async (evento: FormEvent) => {
        evento.preventDefault();
        // Só limpa o que foi aceito: uma recusa que apagasse o campo faria o
        // mestre digitar tudo de novo sem saber o que estava errado.
        if (await declarar(Number(d20))) {
          setD20("");
          setCorrigindo(false);
        }
      }}
    >
      <input
        value={d20}
        onChange={(evento) => setD20(evento.target.value)}
        inputMode="numeric"
        placeholder="d20"
        aria-label={`d20 de ${nome}`}
      />
      <button type="submit">ok</button>
    </form>
  );
};

/**
 * Declarar é mandar a lista inteira, não acrescentar: é assim que declarar
 * reforço no meio do Combate substitui o que estava lá (issue #11).
 */
const DeclararMonstros = ({
  monstros,
  declarar,
}: {
  monstros: readonly Monstro[];
  declarar: (monstros: readonly Monstro[]) => Promise<boolean>;
}) => {
  const [nome, setNome] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [bonus, setBonus] = useState("0");

  return (
    <form
      className="declarar"
      onSubmit={async (evento: FormEvent) => {
        evento.preventDefault();
        const aceito = await declarar([
          ...monstros,
          {
            nome: nome.trim(),
            quantidade: Number(quantidade),
            bonusDeIniciativa: Number(bonus),
          },
        ]);
        if (!aceito) return;
        setNome("");
        setQuantidade("1");
        setBonus("0");
      }}
    >
      <input
        value={nome}
        onChange={(evento) => setNome(evento.target.value)}
        placeholder="Goblin arqueiro"
        aria-label="Nome do Monstro"
      />
      <input
        value={quantidade}
        onChange={(evento) => setQuantidade(evento.target.value)}
        inputMode="numeric"
        aria-label="Quantos"
        className="curto"
      />
      <input
        value={bonus}
        onChange={(evento) => setBonus(evento.target.value)}
        inputMode="numeric"
        aria-label="Bônus de iniciativa"
        className="curto"
      />
      <button type="submit" disabled={nome.trim() === ""}>
        declarar
      </button>
    </form>
  );
};
