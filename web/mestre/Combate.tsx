import { useState, type FormEvent } from "react";
import { chamada, chaveDe, nomeDe } from "../../shared/combate.js";
import type { Comando, Resposta } from "../../shared/comandos.js";
import type { Estado, Iniciativa, Monstro } from "../../shared/tipos.js";

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
  const [recusa, setRecusa] = useState<string | null>(null);

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
        <button onClick={() => void tentar({ tipo: "iniciarCombate" })}>iniciar Combate</button>
        {recusa !== null && <p className="resposta recusada">{recusa}</p>}
      </section>
    );
  }

  const combate = estado.combate;
  const linhas = chamada(estado, combate);
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
          <li key={chaveDe(participante)}>
            <span>{nomeDe(estado, combate, participante)}</span>
            {participante.tipo === "monstro" ? (
              <DadoDoMonstro
                nome={participante.nome}
                iniciativa={iniciativa}
                declarar={(d20) =>
                  tentar({ tipo: "declararIniciativaDoMonstro", nome: participante.nome, d20 })
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

      {recusa !== null && <p className="resposta recusada">{recusa}</p>}
    </section>
  );
};

/**
 * O d20 cru fica do lado do resultado: é o número que a pessoa gritou na mesa, e
 * é por ele que ela reclama se o total parecer errado.
 */
const Resultado = ({ iniciativa }: { iniciativa: Iniciativa }) => (
  <strong>
    {iniciativa.resultado} <span className="apagado">(d20 {iniciativa.d20})</span>
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
          { nome: nome.trim(), quantidade: Number(quantidade), bonusDeIniciativa: Number(bonus) },
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
