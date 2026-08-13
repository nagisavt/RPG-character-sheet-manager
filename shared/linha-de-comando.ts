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

const AJUDA = "/iniciar, /finalizar, /dano <personagem> <quantidade>, /cura <personagem> <quantidade>";

export const lerLinha = (linha: string): Leitura => {
  const [verbo = "", ...argumentos] = linha.trim().split(/\s+/);

  switch (verbo) {
    case "":
      return { erro: `Escreva um comando. Conheço: ${AJUDA}` };

    case "/iniciar":
      return { comando: { tipo: "iniciarSessao" } };

    case "/finalizar":
      return { comando: { tipo: "finalizarSessao" } };

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
