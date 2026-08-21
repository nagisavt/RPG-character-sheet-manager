import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type Ref,
} from "react";
import type {
  Consulta,
  Entrada,
  TipoDoCatalogo,
} from "../../shared/catalogo.js";
import type { Comando, Resposta } from "../../shared/comandos.js";
import { mesmo } from "../../shared/combate.js";
import type {
  Combate,
  Ficha,
  Personagem,
  PersonagemId,
} from "../../shared/tipos.js";
import { BarraDeVida, ImagemOuRotulo, Moedas, Numeros } from "../pecas.js";
import { usarMesa } from "../usar-mesa.js";

/**
 * O celular do jogador. Um hub com o personagem e a vida, e três botões que
 * abrem modais e sempre voltam para cá.
 *
 * **Não é uma ficha de D&D digitalizada — é uma tela de inventário de
 * videogame.** O que está aqui é o que o jogador olha no meio do combate, com o
 * celular na mão: quem ele é, quanto aguenta, e o que tem. A folha de papel
 * continua na mesa.
 *
 * Modo leitura, inteiro: não existe conjurar, equipar nem desequipar. O que
 * acontece na mesa é declarado pelo mestre (ADR-0001), e a Ficha só muda quando
 * ele edita o arquivo e reinicia (ADR-0002).
 */
export const TelaDoJogador = () => {
  const { ligacao, entrar, enviar, consultar, minhaFicha } = usarMesa();
  const [escolhido, setEscolhido] = useState<PersonagemId | null>(null);
  const [ficha, setFicha] = useState<Ficha | null>(null);

  // Entra primeiro como a TV entra: sem senha e só lendo. É o que dá a lista de
  // quem existe — a mesma que está na TV, no meio da mesa, para todo mundo ver.
  useEffect(() => entrar({ como: "mesa" }), [entrar]);

  // Escolhido o personagem, o socket é refeito com a identidade dele. Daí para
  // frente é ele que o servidor vê, e é a Ficha dele que volta.
  useEffect(() => {
    if (escolhido === null) return;
    entrar({ como: "jogador", personagem: escolhido });
  }, [escolhido, entrar]);

  const { situacao } = ligacao;

  useEffect(() => {
    if (escolhido === null || situacao !== "na mesa") return;

    let vivo = true;
    void minhaFicha().then((recebida) => {
      // Duas respostas podem estar no ar ao mesmo tempo: trocar de identidade
      // refaz o socket, e a primeira volta do socket velho, que ainda era a TV.
      // A Ficha só entra na tela se for de quem está nela.
      if (vivo && recebida?.id === escolhido) setFicha(recebida);
    });
    return () => {
      vivo = false;
    };
  }, [escolhido, situacao, minhaFicha]);

  if (ligacao.situacao !== "na mesa") {
    return (
      <main className="jogador">
        <p className="avisando">
          {ligacao.situacao === "recusado"
            ? ligacao.motivo
            : "Ligando na Mesa…"}
        </p>
      </main>
    );
  }

  if (escolhido === null) {
    return (
      <Escolha
        personagens={Object.values(ligacao.estado.personagens)}
        escolher={setEscolhido}
      />
    );
  }

  const personagem = ligacao.estado.personagens[escolhido];
  if (personagem === undefined || ficha === null) {
    return (
      <main className="jogador">
        <p className="avisando">Abrindo a Ficha…</p>
      </main>
    );
  }

  return (
    <Hub
      personagem={personagem}
      ficha={ficha}
      combate={ligacao.estado.combate}
      consultar={consultar}
      enviar={enviar}
    />
  );
};

/**
 * Quem é você. Sem cadastro e sem senha: são cinco pessoas na mesma sala, e a
 * identidade do jogador é declarada, não provada — a mesma regra do handshake.
 */
const Escolha = ({
  personagens,
  escolher,
}: {
  personagens: readonly Personagem[];
  escolher: (id: PersonagemId) => void;
}) => (
  <main className="jogador escolha">
    <h1>Quem é você?</h1>
    <ul>
      {personagens.map((personagem) => (
        <li key={personagem.id}>
          <button type="button" onClick={() => escolher(personagem.id)}>
            <ImagemOuRotulo
              className="retrato"
              caminho={`/personagens/${personagem.id}.png`}
              rotulo={personagem.nome}
            />
            <span>{personagem.nome}</span>
          </button>
        </li>
      ))}
    </ul>
  </main>
);

/**
 * O hub: o personagem, a vida, e **exatamente três** botões.
 *
 * A vida dos colegas não aparece aqui. Ela mora na TV, que é onde a mesa inteira
 * olha junto — repetir no celular seria cada um acompanhando o grupo de cabeça
 * baixa, no telefone, em vez de na mesa.
 */
const Hub = ({
  personagem,
  ficha,
  combate,
  consultar,
  enviar,
}: {
  personagem: Personagem;
  ficha: Ficha;
  combate: Combate | null;
  consultar: (consulta: Consulta) => Promise<Entrada | null>;
  enviar: (comando: Comando) => Promise<Resposta>;
}) => {
  const inventario = useRef<HTMLDialogElement>(null);
  const magias = useRef<HTMLDialogElement>(null);
  const notas = useRef<HTMLDialogElement>(null);

  return (
    <main className="jogador">
      <header className="eu">
        <ImagemOuRotulo
          className="retrato"
          caminho={`/personagens/${personagem.id}.png`}
          rotulo={personagem.nome}
        />
        <div>
          <h1>{personagem.nome}</h1>
          <p className="numeros">
            <Numeros personagem={personagem} />
          </p>
          <BarraDeVida personagem={personagem} />
          <Moedas personagem={personagem} />
        </div>
      </header>

      <Iniciativa personagem={personagem} combate={combate} enviar={enviar} />

      <nav className="tres">
        <button type="button" onClick={() => inventario.current?.showModal()}>
          Inventário
        </button>
        <button type="button" onClick={() => magias.current?.showModal()}>
          Magias
        </button>
        <button type="button" onClick={() => notas.current?.showModal()}>
          Bloco de notas
        </button>
      </nav>

      <Prateleira
        ref={inventario}
        titulo="Inventário"
        tipo="item"
        pasta="itens"
        vazio="Nada no bolso."
        linhas={ficha.inventario.map((item) => ({
          chave: item.chave,
          quantidade: item.quantidade,
        }))}
        consultar={consultar}
      />

      <Prateleira
        ref={magias}
        titulo="Magias"
        tipo="magia"
        pasta="magias"
        vazio="Nenhuma magia nesta Ficha."
        linhas={ficha.magias.map((magia) => ({
          chave: magia.chave,
          quantidade: 1,
        }))}
        consultar={consultar}
      />

      <BlocoDeNotas
        ref={notas}
        anotacao={personagem.anotacao}
        enviar={enviar}
      />
    </main>
  );
};

/**
 * O d20 que o jogador rolou **na mesa**, com o dado dele, na frente de todo
 * mundo. O celular só transporta o número: o servidor soma o bônus da Ficha, e
 * não existe gerador aleatório em lugar nenhum do caminho (ADR-0001).
 *
 * O popup abre sozinho quando o Combate começa e ainda falta a dele. Fechar é
 * permitido, e a faixa continua ali para reabrir — inclusive depois de
 * declarado, porque quem digitou 7 e queria 17 precisa de um jeito de corrigir.
 */
const Iniciativa = ({
  personagem,
  combate,
  enviar,
}: {
  personagem: Personagem;
  combate: Combate | null;
  enviar: (comando: Comando) => Promise<Resposta>;
}) => {
  const popup = useRef<HTMLDialogElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const [d20, setD20] = useState("");
  const [recusa, setRecusa] = useState<string | null>(null);

  const minha =
    combate?.iniciativas.find((qual) =>
      mesmo(qual.participante, {
        tipo: "personagem",
        personagem: personagem.id,
      }),
    ) ?? null;

  const esperando = combate !== null && minha === null;

  useEffect(() => {
    // O Combate começou e a mesa está esperando por este celular. Abrir sozinho
    // é o ponto: ninguém devia ter que procurar onde digitar.
    if (esperando) {
      popup.current?.showModal();
      campo.current?.focus();
    }
  }, [esperando]);

  const abrir = () => {
    // A recusa de antes some ao reabrir: ela era sobre o que foi digitado
    // naquela vez, e ficar na tela faria o mestre achar que falhou de novo.
    setRecusa(null);
    popup.current?.showModal();
    // O `<dialog>` que abre já deixa o cursor no campo: quem está com o d20 na
    // mão digita o número sem procurar onde. Antes isso era um `autofocus` no
    // `<input>`; agora é aqui, no mesmo instante em que a caixa aparece.
    campo.current?.focus();
  };

  if (combate === null) return null;

  return (
    <>
      <button type="button" className="faixa" onClick={abrir}>
        {minha === null ? (
          "Declare sua iniciativa"
        ) : (
          <>
            Iniciativa <strong>{minha.resultado}</strong>{" "}
            <span className="apagado">
              (d20 {minha.d20}) — toque para corrigir
            </span>
          </>
        )}
      </button>

      <Modal ref={popup} titulo="Sua iniciativa">
        <p className="apagado">
          Role o d20 na mesa e digite o que saiu no dado. O bônus quem soma é o
          servidor.
        </p>
        <form
          className="dado"
          onSubmit={async (evento: FormEvent) => {
            evento.preventDefault();
            const resposta = await enviar({
              tipo: "declararIniciativa",
              d20: Number(d20),
            });
            setRecusa(resposta.aceito ? null : resposta.motivo);
            if (resposta.aceito) {
              setD20("");
              popup.current?.close();
            }
          }}
        >
          <input
            value={d20}
            onChange={(evento) => setD20(evento.target.value)}
            inputMode="numeric"
            placeholder="14"
            aria-label="O d20 que saiu"
            ref={campo}
          />
          <button type="submit">declarar</button>
        </form>
        {recusa !== null && <p className="resposta recusada">{recusa}</p>}
      </Modal>
    </>
  );
};

/** Uma linha da grade: a chave que o Catálogo responde, e quantas o jogador tem. */
type LinhaDaPrateleira = { chave: string; quantidade: number };

/**
 * Uma grade de coisas do Catálogo. Tocar num item abre o detalhe **dentro do
 * mesmo modal**: no celular não existe hover, então não existe descrição que
 * aparece ao passar o mouse — ou o dedo abre, ou a informação não existe.
 */
const Prateleira = ({
  ref,
  titulo,
  tipo,
  pasta,
  vazio,
  linhas,
  consultar,
}: {
  ref: Ref<HTMLDialogElement>;
  titulo: string;
  tipo: TipoDoCatalogo;
  pasta: string;
  vazio: string;
  linhas: readonly LinhaDaPrateleira[];
  consultar: (consulta: Consulta) => Promise<Entrada | null>;
}) => {
  const [entradas, setEntradas] = useState<Map<string, Entrada | null>>(
    new Map(),
  );
  const [aberta, setAberta] = useState<string | null>(null);

  // A dependência é a assinatura e não o array: `linhas` é remontado a cada
  // render do hub, e depender dele faria o efeito pedir o Catálogo de novo por
  // ter pedido o Catálogo. O que importa é quais chaves são, não qual array é.
  const assinatura = linhas.map(({ chave }) => chave).join(" ");

  useEffect(() => {
    let vivo = true;
    void Promise.all(
      [...new Set(assinatura.split(" ").filter((chave) => chave !== ""))].map(
        async (chave) => [chave, await consultar({ tipo, chave })] as const,
      ),
    ).then((lidas) => {
      // O modal pode ter fechado, ou a Ficha ter trocado, enquanto o Catálogo
      // respondia. Escrever aqui depois disso seria encher a tela de outro.
      if (vivo) setEntradas(new Map(lidas));
    });
    return () => {
      vivo = false;
    };
  }, [assinatura, consultar, tipo]);

  const detalhe = aberta === null ? null : (entradas.get(aberta) ?? null);

  return (
    <Modal
      ref={ref}
      titulo={titulo}
      voltar={aberta === null ? null : () => setAberta(null)}
    >
      {linhas.length === 0 && <p className="apagado">{vazio}</p>}

      {aberta !== null ? (
        <article className="detalhe">
          <ImagemOuRotulo
            className="retrato"
            caminho={`/${pasta}/${aberta}.png`}
            rotulo={detalhe?.nome ?? aberta}
          />
          <h3>{detalhe?.nome ?? aberta}</h3>
          {/* A descrição é do Catálogo, sempre. Uma chave que ele não tem aparece
              como a chave que é — some da tela seria pior do que ficar feio. */}
          <p>{detalhe?.descricao ?? "Esta chave não está no Catálogo."}</p>
        </article>
      ) : (
        <ul className="grade">
          {linhas.map(({ chave, quantidade }, ordem) => (
            // A mesma chave pode aparecer duas vezes na Ficha — duas pilhas da
            // mesma corda —, então quem separa as linhas é a ordem, não a chave.
            <li key={`${ordem}-${chave}`}>
              <button type="button" onClick={() => setAberta(chave)}>
                <ImagemOuRotulo
                  className="retrato"
                  caminho={`/${pasta}/${chave}.png`}
                  rotulo={entradas.get(chave)?.nome ?? chave}
                />
                <span>{entradas.get(chave)?.nome ?? chave}</span>
                {quantidade > 1 && (
                  <span className="quanto">×{quantidade}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};

/**
 * O bloco de notas: onde o jogador escreve a Anotação dele. Privada de verdade —
 * o que se escreve aqui não chega no celular de mais ninguém, e não é escondido
 * lá: nunca sai do servidor para lá.
 *
 * **Salva no botão, não a cada tecla.** Cada gravada é um Evento num Log que
 * nunca é apagado; salvar enquanto se digita encheria a campanha inteira de
 * versões de meia frase. O botão é o jogador dizendo que terminou de escrever.
 */
const BlocoDeNotas = ({
  ref,
  anotacao,
  enviar,
}: {
  ref: Ref<HTMLDialogElement>;
  anotacao: string;
  enviar: (comando: Comando) => Promise<Resposta>;
}) => {
  const [rascunho, setRascunho] = useState(anotacao);
  const [servidor, setServidor] = useState(anotacao);
  const [salvando, setSalvando] = useState(false);
  const [recusa, setRecusa] = useState<string | null>(null);

  // A Anotação mudou no servidor — o mesmo jogador salvou de outro aparelho, ou
  // um snapshot de reconexão chegou. O rascunho só é substituído se ninguém
  // tiver mexido nele: quem está escrevendo agora não perde o que digitou, e
  // quem não está para de ver "não salvo" num texto que está salvo — e de
  // sobrescrever o texto mais novo do servidor ao salvar por cima.
  if (anotacao !== servidor) {
    setServidor(anotacao);
    if (rascunho === servidor) setRascunho(anotacao);
  }

  const salvo = rascunho === anotacao;

  return (
    <Modal ref={ref} titulo="Bloco de notas">
      <textarea
        className="bloco"
        value={rascunho}
        onChange={(evento) => setRascunho(evento.target.value)}
        placeholder="o taverneiro mentiu sobre o poço"
        aria-label="Bloco de notas"
        rows={12}
      />
      <div className="salvamento">
        <span className={recusa === null ? "apagado" : "resposta recusada"}>
          {recusa ?? (salvo ? "salvo" : "não salvo")}
        </span>
        <button
          type="button"
          disabled={salvo || salvando}
          onClick={async () => {
            setSalvando(true);
            const resposta = await enviar({
              tipo: "atualizarAnotacao",
              texto: rascunho,
            });
            // Uma recusa some da tela sem isto, e o jogador fica achando que
            // escreveu no Log uma coisa que não entrou nele.
            setRecusa(resposta.aceito ? null : resposta.motivo);
            setSalvando(false);
          }}
        >
          {salvando ? "salvando…" : "salvar"}
        </button>
      </div>
    </Modal>
  );
};

/**
 * `<dialog>` do próprio navegador: Esc fecha, o foco fica preso dentro e o fundo
 * escurece sem uma linha de JavaScript para isso. No celular ele ocupa a tela
 * inteira e no notebook fica centralizado — mesma interface, um breakpoint, que
 * é a mesma regra do modal de Comandos do mestre.
 */
const Modal = ({
  ref,
  titulo,
  voltar,
  children,
}: {
  ref: Ref<HTMLDialogElement>;
  titulo: string;
  voltar?: (() => void) | null;
  children: ReactNode;
}) => (
  <dialog className="modal" ref={ref}>
    <header>
      {voltar ? (
        <button
          type="button"
          className="voltar"
          onClick={voltar}
          aria-label="Voltar"
        >
          ‹
        </button>
      ) : (
        <span className="voltar" aria-hidden="true" />
      )}
      <h2>{titulo}</h2>
      <form method="dialog">
        <button type="submit" aria-label="Fechar">
          ×
        </button>
      </form>
    </header>
    {children}
  </dialog>
);
