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

    case "/cena": {
      const [nome, ...sobra] = argumentos;
      if (nome === undefined || sobra.length > 0) return { erro: "Escreva '/cena <nome>'" };
      return { comando: { tipo: "trocarCena", cena: nome } };
    }

    case "/dano":
    case "/cura":
      return lerVida(verbo, argumentos);

    default:
      return { erro: `Não conheço '${verbo}'. Conheço: ${AJUDA}` };
  }
};

/**
 * O sinal vem do verbo, nunca do número: `/dano thorin -8` é um erro de digitação
 * do mestre, e curar por engano quem devia levar dano é o tipo de coisa que só se
 * descobre três turnos depois.
 */
const lerVida = (verbo: "/dano" | "/cura", argumentos: readonly string[]): Leitura => {
  const [personagem, quantidade, ...sobra] = argumentos;

  if (personagem === undefined || quantidade === undefined || sobra.length > 0) {
    return { erro: `Escreva '${verbo} <personagem> <quantidade>'` };
  }

  const numero = Number(quantidade);
  if (!Number.isInteger(numero) || numero < 0) {
    return { erro: `'${quantidade}' não é uma quantidade: escreva um inteiro, sem sinal` };
  }

  return {
    comando: {
      tipo: "alterarVida",
      personagem,
      diferenca: verbo === "/dano" ? -numero : numero,
    },
  };
};
