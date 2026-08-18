import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import type { Consulta, Entrada, TipoDoCatalogo } from "../../shared/catalogo.js";
import type { Ficha, Personagem, PersonagemId } from "../../shared/tipos.js";
import { BarraDeVida, ImagemOuRotulo, Numeros } from "../pecas.js";
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
  const { ligacao, entrar, consultar, minhaFicha } = usarMesa();
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
          {ligacao.situacao === "recusado" ? ligacao.motivo : "Ligando na Mesa…"}
        </p>
      </main>
    );
  }

  if (escolhido === null) {
    return (
      <Escolha personagens={Object.values(ligacao.estado.personagens)} escolher={setEscolhido} />
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

  return <Hub personagem={personagem} ficha={ficha} consultar={consultar} />;
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
          <button onClick={() => escolher(personagem.id)}>
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
  consultar,
}: {
  personagem: Personagem;
  ficha: Ficha;
  consultar: (consulta: Consulta) => Promise<Entrada | null>;
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
        </div>
      </header>

      <nav className="tres">
        <button onClick={() => inventario.current?.showModal()}>Inventário</button>
        <button onClick={() => magias.current?.showModal()}>Magias</button>
        <button onClick={() => notas.current?.showModal()}>Bloco de notas</button>
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
        linhas={ficha.magias.map((magia) => ({ chave: magia.chave, quantidade: 1 }))}
        consultar={consultar}
      />

      <Modal ref={notas} titulo="Bloco de notas">
        <p className="apagado">
          Escrever aqui é a issue #9. A anotação vai ser privada de verdade — não escondida na
          tela do outro, mas nunca enviada para ele.
        </p>
      </Modal>
    </main>
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
  const [entradas, setEntradas] = useState<Map<string, Entrada | null>>(new Map());
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
    <Modal ref={ref} titulo={titulo} voltar={aberta === null ? null : () => setAberta(null)}>
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
              <button onClick={() => setAberta(chave)}>
                <ImagemOuRotulo
                  className="retrato"
                  caminho={`/${pasta}/${chave}.png`}
                  rotulo={entradas.get(chave)?.nome ?? chave}
                />
                <span>{entradas.get(chave)?.nome ?? chave}</span>
                {quantidade > 1 && <span className="quanto">×{quantidade}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
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
        <button className="voltar" onClick={voltar} aria-label="Voltar">
          ‹
        </button>
      ) : (
        <span className="voltar" aria-hidden="true" />
      )}
      <h2>{titulo}</h2>
      <form method="dialog">
        <button aria-label="Fechar">×</button>
      </form>
    </header>
    {children}
  </dialog>
);
