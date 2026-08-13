/**
 * O vocabulário do domínio, em um lugar só. Os termos são os do glossário em
 * `CONTEXT.md` — Mesa, Sessão, Comando, Evento, Log, Audiência, Ficha.
 */

export type PersonagemId = string;

/** Existe uma Mesa só. O handshake carrega o id, mas o servidor aceita um valor constante. */
export const MESA_ID = "mesa-unica";

/** Quem criou o Evento. Não existe autor `sistema`: todo Evento nasce de um Comando humano. */
export type Autor = { tipo: "mestre" } | { tipo: "jogador"; personagem: PersonagemId };

/** Quem pode ver um Evento. É uma lista porque um Evento pode ser do mestre *e* de um personagem. */
export type Audiencia = "publico" | "mestre" | { privado: PersonagemId };

/**
 * O que aconteceu, com os campos que só aquele Evento tem. Moedas, Cena e
 * Combate entram nas issues seguintes, cada um como mais um caso daqui.
 */
export type Corpo =
  | { tipo: "SessaoIniciada" }
  | { tipo: "SessaoFinalizada" }
  | VidaAlterada
  | CenaTrocada;

/**
 * O grupo mudou de lugar. Grava o **nome do arquivo** em `assets/cenas/`, sem
 * extensão e sem caminho: `taverna-do-javali` é `assets/cenas/taverna-do-javali.png`.
 *
 * O que o Evento não diz é se aquele arquivo tem desenho ou é placeholder. O
 * código sempre pede o arquivo; o que muda com o tempo é o que tem dentro dele.
 */
export type CenaTrocada = { tipo: "CenaTrocada"; cena: string };

/**
 * A vida de um personagem mudou. Grava as duas coisas (ADR-0003):
 *
 * - `declarado` é a diferença que a mesa declarou — `-8` num dano, `+5` numa cura;
 * - `vida` é onde o personagem ficou depois dela.
 *
 * O reducer lê `vida` e ignora `declarado`, e é por isso que nenhum Evento
 * antigo muda de sentido quando a vida máxima sobe na Ficha. `declarado` fica
 * para a tela de Log poder escrever `cura 8 (25 → 28)` e mostrar honestamente
 * que cinco se perderam no teto.
 */
export type VidaAlterada = {
  tipo: "VidaAlterada";
  personagem: PersonagemId;
  declarado: number;
  vida: number;
};

/**
 * O Evento como o decisor o devolve — sem `id` e sem `timestamp`. É o que
 * mantém o decisor puro: sem relógio e sem contador.
 */
export type EventoNovo = Corpo & { autor: Autor; audiencia: Audiencia[] };

/** O Evento já gravado no Log. `id` é sequencial do banco: o Log tem escritor único. */
export type Evento = EventoNovo & { id: number; timestamp: string };

export type TipoDeEvento = Corpo["tipo"];

/**
 * A Ficha é a folha de papel digitada à mão pelo mestre num arquivo versionado.
 * É a posição inicial do estado da Mesa e nunca vira Evento (ADR-0002).
 */
export type Ficha = {
  id: PersonagemId;
  nome: string;
  /** Muda entre sessões, ao subir de nível: por isso mora aqui e não no Log (ADR-0002). */
  vidaMaxima: number;
};

/** O estado da Mesa: `eventos.reduce(reducer, estadoInicial(fichas))`. Vive em memória. */
export type Estado = {
  sessaoAtiva: boolean;
  personagens: Record<PersonagemId, Personagem>;
  /** A Cena no ar, ou `null` antes de o mestre escolher a primeira da noite. */
  cena: string | null;
};

/** Vida bônus e Moedas entram aqui nas issues que as trazem. */
export type Personagem = {
  id: PersonagemId;
  nome: string;
  /** O que o Log diz. Começa cheia e só se move por `VidaAlterada`. */
  vida: number;
  /** Cópia do que a Ficha dizia na subida. Nenhum Evento depende dela para ser lido (ADR-0003). */
  vidaMaxima: number;
};
