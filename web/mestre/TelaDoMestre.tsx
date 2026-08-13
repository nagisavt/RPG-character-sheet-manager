import { useState, type FormEvent } from "react";
import type { Resposta } from "../../shared/comandos.js";
import type { Personagem } from "../../shared/tipos.js";
import { usarMesa } from "../usar-mesa.js";

/**
 * O notebook do mestre. Ele entra com a senha, digita `/dano thorin 8` e vê a
 * vida cair — ou toca nos botões, que é o que se usa com o livro na outra mão.
 *
 * A tela de Log inteira é a issue #12; aqui só aparece a resposta do último
 * Comando, que é o que diz se ele foi aceito.
 */
export const TelaDoMestre = () => {
  const { ligacao, entrar, enviar, digitar } = usarMesa();
  const [resposta, setResposta] = useState<Resposta | null>(null);

  if (ligacao.situacao !== "na mesa") {
    return (
      <Portao
        entrar={(senha) => entrar({ como: "mestre", senha })}
        entrando={ligacao.situacao === "entrando"}
        recusa={ligacao.situacao === "recusado" ? ligacao.motivo : null}
      />
    );
  }

  const personagens = Object.values(ligacao.estado.personagens);

  return (
    <main className="mestre">
      <header>
        <h1>Mesa</h1>
        <span className={ligacao.estado.sessaoAtiva ? "sessao ativa" : "sessao"}>
          {ligacao.estado.sessaoAtiva ? "Sessão em curso" : "Fora de sessão"}
        </span>
      </header>

      <ul className="personagens">
        {personagens.map((personagem) => (
          <Vida
            key={personagem.id}
            personagem={personagem}
            alterar={async (diferenca) =>
              setResposta(
                await enviar({ tipo: "alterarVida", personagem: personagem.id, diferenca }),
              )
            }
          />
        ))}
      </ul>

      <LinhaDeComando digitar={async (linha) => setResposta(await digitar(linha))} />

      {resposta !== null && (
        <p className={resposta.aceito ? "resposta aceita" : "resposta recusada"}>
          {resposta.aceito ? "aceito" : resposta.motivo}
        </p>
      )}
    </main>
  );
};

/** A senha do mestre vem de variável de ambiente no servidor e é conferida no handshake. */
const Portao = ({
  entrar,
  entrando,
  recusa,
}: {
  entrar: (senha: string) => void;
  entrando: boolean;
  recusa: string | null;
}) => {
  const [senha, setSenha] = useState("");

  return (
    <main className="portao">
      <h1>Mesa</h1>
      <form
        onSubmit={(evento: FormEvent) => {
          evento.preventDefault();
          entrar(senha);
        }}
      >
        <input
          type="password"
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
          placeholder="senha do mestre"
          autoFocus
        />
        <button type="submit" disabled={entrando}>
          {entrando ? "entrando…" : "entrar"}
        </button>
      </form>
      {recusa !== null && <p className="resposta recusada">{recusa}</p>}
    </main>
  );
};

/**
 * Os passos são os que a mesa usa de verdade: 1 para acerto de conta e 5 para o
 * dano que já foi declarado em voz alta. Digitar número é para a linha de comando.
 */
const PASSOS = [-5, -1, 1, 5] as const;

const Vida = ({
  personagem,
  alterar,
}: {
  personagem: Personagem;
  alterar: (diferenca: number) => void;
}) => (
  <li>
    <div className="nome">
      <strong>{personagem.nome}</strong>
      <span>
        {personagem.vida} / {personagem.vidaMaxima}
      </span>
    </div>

    <div
      className="barra"
      role="meter"
      aria-label={`Vida de ${personagem.nome}`}
      aria-valuenow={personagem.vida}
      aria-valuemin={0}
      aria-valuemax={personagem.vidaMaxima}
    >
      <div style={{ width: `${(personagem.vida / personagem.vidaMaxima) * 100}%` }} />
    </div>

    <div className="passos">
      {PASSOS.map((passo) => (
        <button
          key={passo}
          onClick={() => alterar(passo)}
          aria-label={`${passo < 0 ? "Dano" : "Cura"} de ${Math.abs(passo)} em ${personagem.nome}`}
        >
          {passo > 0 ? `+${passo}` : passo}
        </button>
      ))}
    </div>
  </li>
);

const LinhaDeComando = ({ digitar }: { digitar: (linha: string) => void }) => {
  const [linha, setLinha] = useState("");

  return (
    <form
      className="linha"
      onSubmit={(evento: FormEvent) => {
        evento.preventDefault();
        digitar(linha);
        setLinha("");
      }}
    >
      <input
        value={linha}
        onChange={(evento) => setLinha(evento.target.value)}
        placeholder="/dano thorin 8"
        aria-label="Comando"
        autoComplete="off"
        spellCheck={false}
      />
      <button type="submit">enviar</button>
    </form>
  );
};
