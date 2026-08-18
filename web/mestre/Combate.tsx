import { useState, type FormEvent } from "react";
import { chamada, nomeDe } from "../../shared/combate.js";
import type { Comando, Resposta } from "../../shared/comandos.js";
import type { Estado, Monstro } from "../../shared/tipos.js";

/**
 * O Combate no notebook do mestre: declarar os Monstros, ver as iniciativas
 * chegando de vários celulares ao mesmo tempo, e saber de quem ainda falta
 * cobrar.
 *
 * A Fila — pegar isto e escolher a ordem — é a issue #11. Aqui só se junta.
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
  if (estado.combate === null) {
    return (
      <section className="combate">
        <button onClick={() => void enviar({ tipo: "iniciarCombate" })}>iniciar Combate</button>
      </section>
    );
  }

  const linhas = chamada(estado, estado.combate);
  const quantosFaltam = linhas.filter((linha) => linha.iniciativa === null).length;

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
          <li key={`${participante.tipo}-${nomeDe(estado, participante)}`}>
            <span>{nomeDe(estado, participante)}</span>
            {iniciativa === null ? (
              participante.tipo === "monstro" ? (
                <DadoDoMonstro
                  nome={participante.nome}
                  enviar={(d20) =>
                    void enviar({
                      tipo: "declararIniciativaDoMonstro",
                      nome: participante.nome,
                      d20,
                    })
                  }
                />
              ) : (
                <span className="apagado">esperando</span>
              )
            ) : (
              // O d20 cru fica do lado do resultado: é o que a pessoa gritou na
              // mesa, e é por ele que ela reclama se o número parecer errado.
              <strong>
                {iniciativa.resultado} <span className="apagado">(d20 {iniciativa.d20})</span>
              </strong>
            )}
          </li>
        ))}
      </ul>

      <DeclararMonstros
        monstros={estado.combate.monstros}
        declarar={(monstros) => void enviar({ tipo: "declararMonstros", monstros })}
      />
    </section>
  );
};

/** O d20 que o mestre rolou atrás do biombo por aquele Monstro. */
const DadoDoMonstro = ({ nome, enviar }: { nome: string; enviar: (d20: number) => void }) => {
  const [d20, setD20] = useState("");

  return (
    <form
      className="dado"
      onSubmit={(evento: FormEvent) => {
        evento.preventDefault();
        enviar(Number(d20));
        setD20("");
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
  declarar: (monstros: readonly Monstro[]) => void;
}) => {
  const [nome, setNome] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [bonus, setBonus] = useState("0");

  return (
    <form
      className="declarar"
      onSubmit={(evento: FormEvent) => {
        evento.preventDefault();
        declarar([
          ...monstros,
          { nome: nome.trim(), quantidade: Number(quantidade), bonusDeIniciativa: Number(bonus) },
        ]);
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
