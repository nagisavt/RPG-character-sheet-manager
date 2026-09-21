import { nomeDe } from "./combate.js";
import { reducer } from "./reducer.js";
import type {
  Combate,
  Corpo,
  Estado,
  Evento,
  Monstro,
  Participante,
  PersonagemId,
} from "./tipos.js";

/**
 * O Log lido em português, para a tela do mestre.
 *
 * Puro, e em `shared/` pelo mesmo motivo do `reducer`: quem lê o Log é o
 * notebook do mestre, e quem confere a leitura é um teste pela costura do
 * harness. Duas leituras escritas em dois lugares diriam coisas diferentes
 * sobre a mesma noite.
 *
 * Não filtra audiência nenhuma porque não tem o que filtrar: quem fecha essa
 * porta é o pedido `log` do servidor, que só responde ao mestre.
 */
export type Linha = {
  evento: Evento;
  /** A frase que o mestre lê: `Thorin: cura 8 (25 → 28)`. */
  texto: string;
  /**
   * A quantas Sessões a noite deste Evento estava. Começa em `0` — o que
   * aconteceu antes de a primeira Sessão ser iniciada — e sobe a cada
   * `SessaoIniciada`.
   *
   * É **recorte de leitura**, e não divisão do estado (`CONTEXT.md`): o estado
   * continua sendo a soma de todos os Eventos desde o começo da campanha, e
   * esconder a noite passada da tela não desfaz um único dano dela.
   */
  sessao: number;
};

/**
 * O Log inteiro, dobrado uma vez.
 *
 * A leitura é um `fold` e não um `map` porque um Evento sozinho não se explica:
 * `cura 8` com resultado `28` só vira `(25 → 28)` — e só mostra os cinco que se
 * perderam no teto — se quem lê souber onde o personagem estava antes dele
 * (ADR-0003). Quem sabe isso é o estado, replicado aqui pelo mesmo `reducer`
 * que roda no servidor.
 *
 * `inicial` é a posição de onde o Log parte: as Fichas, e nada mais (ADR-0002).
 */
export const ler = (
  inicial: Estado,
  eventos: readonly Evento[],
): readonly Linha[] => {
  let estado = inicial;
  let sessao = 0;

  return eventos.map((evento) => {
    if (evento.tipo === "SessaoIniciada") sessao += 1;
    // O texto é escrito **antes** de o Evento entrar: é o estado de antes que
    // sabe de onde a vida saiu.
    const texto = emPortugues(estado, evento);
    estado = reducer(estado, evento);
    return { evento, texto, sessao };
  });
};

/**
 * Só a noite de hoje. É o que a tela mostra por padrão: o mestre está no meio da
 * Sessão, e a campanha inteira é para quando ele procura o que aconteceu em
 * janeiro.
 *
 * A Sessão atual é a da última linha porque `sessao` nunca desce — o Log é
 * append-only, e a noite mais recente é a que está no fim dele.
 *
 * A noite **finalizada** continua sendo a atual até a seguinte começar, e é de
 * propósito: o mestre que fecha a Sessão e registra as Moedas do saque logo
 * depois não pode ver a tela se limpar embaixo da mão. O que ele acabou de
 * anotar é da noite que ele acabou de jogar.
 */
export const daSessaoAtual = (linhas: readonly Linha[]): readonly Linha[] => {
  const atual = linhas.at(-1)?.sessao ?? 0;
  return linhas.filter((linha) => linha.sessao === atual);
};

/**
 * Um Evento em uma frase. O `estado` é o de **antes** dele.
 *
 * O `switch` é exaustivo de propósito: um tipo de Evento novo sem frase vira
 * erro de tipo aqui, e não uma linha em branco no meio da noite do mestre.
 *
 * A palavra de cada linha é a do Comando que a mesa declarou — `dano`, `cura`,
 * `gasta`, `ganha`. O mestre lê o Log procurando o que ele digitou, e traduzir
 * para outro vocabulário seria a tela contando a noite com palavras dela.
 */
const emPortugues = (estado: Estado, corpo: Corpo): string => {
  switch (corpo.tipo) {
    case "SessaoIniciada":
      return "Sessão iniciada";
    case "SessaoFinalizada":
      return "Sessão finalizada";

    case "CenaTrocada":
      return `Cena: ${corpo.cena}`;

    case "CombateIniciado":
      return "Combate iniciado";
    case "CombateEncerrado":
      return "Combate encerrado";

    case "MonstrosDeclarados":
      return `Monstros: ${corpo.monstros.map(quantos).join(", ")}`;

    case "IniciativaDeclarada": {
      const nome = doParticipante(estado, corpo.participante);
      // O d20 cru junto do resultado, como o Evento os guarda: o bônus somado
      // pelo servidor aparece na conta, e não escondido dentro do total.
      return `${nome}: iniciativa ${corpo.resultado} (d20 ${corpo.d20})`;
    }

    case "FilaPublicada": {
      const nomes = corpo.fila.map((quem) => doParticipante(estado, quem));
      return `Fila: ${nomes.join(", ")}`;
    }

    case "VidaAlterada": {
      const quem = estado.personagens[corpo.personagem];
      // O sinal decide o verbo, e o tamanho vai sem ele: "dano 12", nunca
      // "dano -12". Quem diz se a vida sobe ou desce é a palavra.
      const verbo = corpo.declarado < 0 ? "dano" : "cura";
      const vida = deveu(quem?.vida, corpo.vida);

      // O segundo pote só aparece quando ele se mexeu: um dano que não encostou
      // na Vida bônus não tem por que falar dela.
      const bonusAntes = quem?.vidaBonus;
      const bonusDepois = corpo.vidaBonus ?? bonusAntes;
      const bonus =
        bonusDepois !== undefined && bonusDepois !== bonusAntes
          ? `; vida bônus ${deveu(bonusAntes, bonusDepois)}`
          : "";

      return `${doPersonagem(estado, corpo.personagem)}: ${verbo} ${Math.abs(corpo.declarado)} (${vida}${bonus})`;
    }

    case "VidaBonusConcedida":
      // Substitui o pote anterior, então não há diferença e resultado para
      // contar: o que a mesa declarou já é onde o pote ficou.
      return `${doPersonagem(estado, corpo.personagem)}: vida bônus ${corpo.vidaBonus}`;

    case "MoedasAlteradas": {
      const quem = estado.personagens[corpo.personagem];
      const verbo = corpo.declarado < 0 ? "gasta" : "ganha";
      const quanto = Math.abs(corpo.declarado);
      // `null` é o sigilo da projeção, e não um bolso vazio. Ele não acontece
      // aqui — o mestre lê o Log a partir do estado inteiro —, e se acontecer, a
      // linha diz o que sabe em vez de inventar um número.
      const moedas = deveu(quem?.moedas ?? undefined, corpo.moedas);
      return `${doPersonagem(estado, corpo.personagem)}: ${verbo} ${quanto} (${moedas})`;
    }

    case "AnotacaoAtualizada": {
      const nome = doPersonagem(estado, corpo.personagem);
      // Apagar o bloco é escrever nada nele, e isso também é um fato: a linha
      // conta o que aconteceu em vez de sumir com aspas vazias.
      return corpo.texto === ""
        ? `${nome}: anotação apagada`
        : `${nome}: anotação — "${corpo.texto}"`;
    }
  }
};

/**
 * `25 → 28`, ou só `28` quando não se sabe de onde saiu.
 *
 * O buraco acontece com o personagem que saiu das Fichas: o Log dele continua
 * lá, porque a campanha em que ele esteve aconteceu, mas não há mais de onde
 * tirar onde ele estava antes. A linha então conta só o que o Evento guarda.
 */
const deveu = (antes: number | undefined, depois: number): string =>
  antes === undefined ? `${depois}` : `${antes} → ${depois}`;

/** O nome de quem está nas Fichas. Quem saiu delas fica pelo identificador. */
const doPersonagem = (estado: Estado, id: PersonagemId): string =>
  estado.personagens[id]?.nome ?? id;

/**
 * O nome de um Participante, com o `nomeDe` que o notebook e a TV já usam — é
 * ele que sabe que "Goblin ×3" é uma linha só, e não três.
 *
 * Fora de Combate não existe Participante nenhum para nomear, mas o Log é lido
 * depois: um Combate já encerrado deixa Eventos que ainda precisam de nome. O
 * Combate vazio serve de tabela para eles.
 */
const SEM_COMBATE: Combate = { monstros: [], iniciativas: [], fila: null };

const doParticipante = (estado: Estado, participante: Participante): string =>
  nomeDe(estado, estado.combate ?? SEM_COMBATE, participante);

/** "Goblin ×3" quando são três, e "Ogro" quando é um. */
const quantos = (monstro: Monstro): string =>
  monstro.quantidade > 1
    ? `${monstro.nome} ×${monstro.quantidade}`
    : monstro.nome;
