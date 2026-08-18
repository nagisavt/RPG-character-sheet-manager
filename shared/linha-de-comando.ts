import { ehD20 } from "./combate.js";
import type { Comando } from "./comandos.js";

/**
 * A linha que o mestre digita, virando Comando. Puro: texto entra, Comando sai.
 *
 * Mora em `shared/` porque quem digita é a tela do mestre e quem confere é o
 * servidor — e um `/dano` que significasse coisas diferentes nos dois lados
 * seria um Evento errado gravado num Log que não se apaga.
 *
 * O que **não** se decide aqui: se o personagem existe e se a vida pode chegar
 * lá. Isso é regra da Mesa, precisa do estado, e é do decisor. Aqui é gramática.
 */
export type Leitura = { comando: Comando } | { erro: string };

/**
 * O que o mestre pode digitar, descrito uma vez só. A tela lê daqui para montar
 * a lista de comandos, e as mensagens de erro daqui saem também: um Comando novo
 * aparece nos dois lugares por ter sido acrescentado num.
 */
export type Verbete = {
  uso: string;
  descricao: string;
  exemplo: string;
};

export const VERBETES: readonly Verbete[] = [
  {
    uso: "/iniciar",
    descricao: "Abre a Sessão. É o primeiro Comando da noite.",
    exemplo: "/iniciar",
  },
  {
    uso: "/finalizar",
    descricao: "Fecha a Sessão. O Log continua: é a noite que acabou, não a campanha.",
    exemplo: "/finalizar",
  },
  {
    uso: "/cena <nome>",
    descricao: "Troca o fundo da TV. O nome é o do arquivo em assets/cenas/, sem .png.",
    exemplo: "/cena taverna-do-javali",
  },
  {
    uso: "/dano <personagem> <quantidade>",
    descricao: "Tira vida. Para em zero, e o Log guarda o que foi declarado.",
    exemplo: "/dano thorin 8",
  },
  {
    uso: "/cura <personagem> <quantidade>",
    descricao: "Devolve vida, até o máximo da Ficha. O que passar do teto fica registrado.",
    exemplo: "/cura thorin 5",
  },
  {
    uso: "/combate",
    descricao: "Entra em Combate. Os Monstros e as iniciativas entram depois.",
    exemplo: "/combate",
  },
  {
    uso: "/encerra",
    descricao: "Encerra o Combate. A TV volta para a Cena.",
    exemplo: "/encerra",
  },
  {
    uso: "/iniciativa <monstro> <d20>",
    descricao: "O d20 que você rolou por um Monstro. O bônus dele o servidor soma.",
    exemplo: "/iniciativa goblin-arqueiro 14",
  },
  {
    uso: "/ganha <personagem> <quantidade>",
    descricao: "Põe Moedas no bolso. Um número só: a conversão acontece antes, na sua cabeça.",
    exemplo: "/ganha thorin 50",
  },
  {
    uso: "/gasta <personagem> <quantidade>",
    descricao: "Tira Moedas. Para em zero, e o Log guarda o que foi declarado.",
    exemplo: "/gasta thorin 20",
  },
  {
    uso: "/bonus <personagem> <quantidade>",
    descricao:
      "Concede Vida bônus. Substitui o valor de antes em vez de somar, e o dano come dela primeiro. Zero tira.",
    exemplo: "/bonus thorin 10",
  },
];

const AJUDA = VERBETES.map((verbete) => verbete.uso).join(", ");

export const lerLinha = (linha: string): Leitura => {
  const [verbo = "", ...argumentos] = linha.trim().split(/\s+/);

  switch (verbo) {
    case "":
      return { erro: `Escreva um comando. Conheço: ${AJUDA}` };

    case "/iniciar":
      return { comando: { tipo: "iniciarSessao" } };

    case "/finalizar":
      return { comando: { tipo: "finalizarSessao" } };

    case "/combate":
      return { comando: { tipo: "iniciarCombate" } };

    case "/encerra":
      return { comando: { tipo: "encerrarCombate" } };

    case "/iniciativa": {
      // O nome do Monstro tem espaço — "Goblin arqueiro" é o que a mesa fala —,
      // então o que se lê da direita é o d20 e o resto todo é o nome. Declarar
      // os Monstros é na tela do mestre, onde nome, quantidade e bônus cabem
      // numa linha cada.
      const ultimo = argumentos.at(-1);
      const d20 = Number(ultimo);
      const nome = argumentos.slice(0, -1).join(" ");

      if (nome === "") return { erro: "Escreva '/iniciativa <monstro> <d20>'" };
      if (!ehD20(d20)) return { erro: `'${ultimo}' não é um d20: escreva um inteiro de 1 a 20` };

      return { comando: { tipo: "declararIniciativaDoMonstro", nome, d20 } };
    }

    case "/cena": {
      const [nome, ...sobra] = argumentos;
      if (nome === undefined || sobra.length > 0) return { erro: "Escreva '/cena <nome>'" };
      return { comando: { tipo: "trocarCena", cena: nome } };
    }

    case "/dano":
    case "/cura": {
      const leitura = lerAlvoEQuantidade(verbo, argumentos);
      if ("erro" in leitura) return leitura;
      const diferenca = verbo === "/dano" ? -leitura.quantidade : leitura.quantidade;
      return { comando: { tipo: "alterarVida", personagem: leitura.personagem, diferenca } };
    }

    case "/ganha":
    case "/gasta": {
      const leitura = lerAlvoEQuantidade(verbo, argumentos);
      if ("erro" in leitura) return leitura;
      const diferenca = verbo === "/gasta" ? -leitura.quantidade : leitura.quantidade;
      return { comando: { tipo: "alterarMoedas", personagem: leitura.personagem, diferenca } };
    }

    case "/bonus": {
      const leitura = lerAlvoEQuantidade(verbo, argumentos);
      if ("erro" in leitura) return leitura;
      return {
        comando: {
          tipo: "concederVidaBonus",
          personagem: leitura.personagem,
          vidaBonus: leitura.quantidade,
        },
      };
    }

    default:
      return { erro: `Não conheço '${verbo}'. Conheço: ${AJUDA}` };
  }
};

/**
 * `<alvo> <quantidade>`, a forma de todo Comando que mexe em número.
 *
 * A quantidade vai **sem sinal**: quem diz para que lado é o verbo. Um `-8`
 * aceito aqui viraria um `/dano` que cura, e um Log não se apaga.
 */
const lerAlvoEQuantidade = (
  verbo: "/dano" | "/cura" | "/bonus" | "/ganha" | "/gasta",
  argumentos: readonly string[],
): { personagem: string; quantidade: number } | { erro: string } => {
  const [personagem, quantidade, ...sobra] = argumentos;

  if (personagem === undefined || quantidade === undefined || sobra.length > 0) {
    return { erro: `Escreva '${verbo} <personagem> <quantidade>'` };
  }

  const numero = Number(quantidade);
  if (!Number.isInteger(numero) || numero < 0) {
    return { erro: `'${quantidade}' não é uma quantidade: escreva um inteiro, sem sinal` };
  }

  return { personagem, quantidade: numero };
};
