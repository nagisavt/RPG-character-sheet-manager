import type { Autor, Estado, Evento, PersonagemId } from "./tipos.js";

/**
 * Quem o socket é. Amarrada no handshake, uma vez, e lida do socket a cada
 * Comando — nunca do conteúdo do Comando.
 */
export type Identidade =
  | { como: "mestre" }
  | { como: "jogador"; personagem: PersonagemId }
  | { como: "mesa" };

/**
 * O que cada tela tem para se apresentar. A senha só existe para o mestre; o
 * jogador diz quem é, e a TV não apresenta nada.
 */
export type Credencial =
  | { como: "mestre"; senha: string }
  | { como: "jogador"; personagem: PersonagemId }
  | { como: "mesa" };

/** A credencial mais a Mesa a que ela se apresenta. É o conteúdo do handshake. */
export type Handshake = { mesaId: string } & Credencial;

/**
 * O handshake como ele chega do socket: dados de rede, ainda não confiáveis.
 * `identificar` no servidor é quem transforma isto numa `Identidade` — ou recusa.
 */
export type Apresentacao = {
  mesaId?: unknown;
  como?: unknown;
  personagem?: unknown;
  senha?: unknown;
};

/**
 * A TV não é autora de nada: ela só lê. Um Comando vindo dela é recusado antes
 * de chegar aqui, então o tipo não precisa representar esse caso.
 */
export const autorDe = (identidade: Identidade): Autor | null => {
  switch (identidade.como) {
    case "mestre":
      return { tipo: "mestre" };
    case "jogador":
      return { tipo: "jogador", personagem: identidade.personagem };
    case "mesa":
      return null;
  }
};

/** O que o servidor manda ao cliente que acabou de conectar: o estado já filtrado. */
export type Snapshot = { estado: Estado; ate: number };

/**
 * Um delta. `evento` vem `null` quando o socket não tem direito de ver o que
 * aconteceu: o conteúdo privado não sai do servidor, e só o número de ordem
 * atravessa, para que todo cliente saiba até onde já está em dia.
 */
export type Transmissao = { ate: number; evento: Evento | null };
