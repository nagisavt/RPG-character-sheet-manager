import { type FormEvent, type Ref, useEffect, useRef, useState } from "react";
import type { Resposta } from "../../shared/comandos.js";
import { VERBETES } from "../../shared/linha-de-comando.js";
import type { Personagem } from "../../shared/tipos.js";
import { Barreira } from "../barreira.js";
import { BarraDeVida, Moedas, Numeros } from "../pecas.js";
import { usarMesa } from "../usar-mesa.js";
import { Combate } from "./Combate.js";
import { Log } from "./Log.js";

/**
 * O notebook do mestre. Ele entra com a senha, digita `/dano thorin 8` e vê a
 * vida cair — ou toca nos botões, que é o que se usa com o livro na outra mão.
 *
 * Embaixo, fixo, o Log da noite: o que ele registrou, em português, sem filtro
 * de audiência nenhum. A resposta do último Comando fica logo acima dele, que é
 * o que diz se ele foi aceito.
 */
export const TelaDoMestre = () => {
  const { ligacao, entrar, enviar, digitar, pedirLog } = usarMesa();
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
        <span
          className={ligacao.estado.sessaoAtiva ? "sessao ativa" : "sessao"}
        >
          {ligacao.estado.sessaoAtiva ? "Sessão em curso" : "Fora de sessão"}
        </span>
      </header>

      {/* Cada seção na sua cerca: a que cair cai sozinha. A linha de comando
          fica fora de propósito — ela é o último recurso do mestre, e é o que
          tem que continuar de pé mesmo quando o resto da tela não está. */}
      <Barreira nome="personagens">
        <ul className="personagens">
          {personagens.map((personagem) => (
            <Painel
              key={personagem.id}
              personagem={personagem}
              alterar={async (diferenca) =>
                setResposta(
                  await enviar({
                    tipo: "alterarVida",
                    personagem: personagem.id,
                    diferenca,
                  }),
                )
              }
            />
          ))}
        </ul>
      </Barreira>

      <Barreira nome="Combate">
        <Combate estado={ligacao.estado} enviar={enviar} />
      </Barreira>

      <LinhaDeComando
        digitar={async (linha) => setResposta(await digitar(linha))}
      />

      {resposta !== null && (
        <p
          className={resposta.aceito ? "resposta aceita" : "resposta recusada"}
        >
          {resposta.aceito ? "aceito" : resposta.motivo}
        </p>
      )}

      <Barreira nome="Log">
        <Log ate={ligacao.ate} pedirLog={pedirLog} />
      </Barreira>
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
  const campo = useRef<HTMLInputElement>(null);

  // O portão é a primeira tela do mestre e só tem um campo: o cursor já nasce
  // dentro dele, para a senha ser digitada sem um clique antes. Era um
  // `autofocus` no `<input>`, e é a mesma coisa feita por nós.
  useEffect(() => campo.current?.focus(), []);

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
          ref={campo}
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

/** A faixa de um personagem no notebook do mestre: os números, as barras, as
 * Moedas e os botões que declaram dano e cura. */
const Painel = ({
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
        <Numeros personagem={personagem} />
      </span>
    </div>

    <BarraDeVida personagem={personagem} />

    <Moedas personagem={personagem} />

    <div className="passos">
      {PASSOS.map((passo) => (
        <button
          type="button"
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
  const ajuda = useRef<HTMLDialogElement>(null);

  return (
    <>
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
        <button
          type="button"
          onClick={() => ajuda.current?.showModal()}
          aria-label="Comandos"
        >
          ?
        </button>
      </form>

      <Ajuda ref={ajuda} />
    </>
  );
};

/**
 * A lista de Comandos, saída do `shared/linha-de-comando.ts`. É `<dialog>` do
 * próprio navegador: Esc fecha, o foco fica preso dentro e o fundo escurece sem
 * uma linha de JavaScript para isso.
 */
const Ajuda = ({ ref }: { ref: Ref<HTMLDialogElement> }) => (
  <dialog className="ajuda" ref={ref}>
    <header>
      <h2>Comandos</h2>
      <form method="dialog">
        <button type="submit" aria-label="Fechar">
          ×
        </button>
      </form>
    </header>

    <dl>
      {VERBETES.map((verbete) => (
        <div key={verbete.uso}>
          <dt>
            <code>{verbete.uso}</code>
          </dt>
          <dd>
            {verbete.descricao}
            <span className="exemplo">
              <code>{verbete.exemplo}</code>
            </span>
          </dd>
        </div>
      ))}
    </dl>

    <p className="apagado">
      A quantidade vai sem sinal: quem diz se a vida sobe ou desce é o verbo. Os
      botões de cada personagem fazem o mesmo que <code>/dano</code> e{" "}
      <code>/cura</code>.
    </p>
  </dialog>
);
