import type { Comando } from "../shared/comandos.js";
import type { Autor, Estado, EventoNovo, Personagem } from "../shared/tipos.js";

/**
 * A decisão sobre um Comando: os Eventos que ele produz, ou a recusa.
 *
 * Uma recusa aqui é de regra da Mesa ("a Sessão já está em curso"), não de
 * permissão — a autorização já recusou antes o que nem devia ter chegado.
 */
export type Decisao = { eventos: EventoNovo[] } | { recusa: string };

/**
 * `decisor(estado, comando, autor) => EventoNovo[]`. Puro: sem banco, sem
 * socket, sem relógio e sem gerador aleatório.
 *
 * O `autor` é o terceiro argumento, e não um campo do Comando, porque ele vem
 * da identidade do socket: um Comando que carregasse o próprio autor seria um
 * jogador podendo se declarar mestre.
 */
export const decisor = (estado: Estado, comando: Comando, autor: Autor): Decisao => {
  switch (comando.tipo) {
    case "iniciarSessao":
      if (estado.sessaoAtiva) return { recusa: "A Sessão já está em curso" };
      return { eventos: [{ tipo: "SessaoIniciada", autor, audiencia: ["publico"] }] };

    case "finalizarSessao":
      if (!estado.sessaoAtiva) return { recusa: "Nenhuma Sessão em curso" };
      return { eventos: [{ tipo: "SessaoFinalizada", autor, audiencia: ["publico"] }] };

    case "trocarCena": {
      // O nome vira caminho de arquivo e URL. Um `../` daqui sairia de
      // `assets/cenas/` e ficaria gravado para sempre num Log que não se apaga.
      if (!/^[a-z0-9-]+$/.test(comando.cena)) {
        return { recusa: `'${comando.cena}' não é nome de Cena: só minúsculas, números e hífen` };
      }
      if (estado.cena === comando.cena) {
        return { recusa: `A Cena '${comando.cena}' já está no ar` };
      }
      return {
        eventos: [{ tipo: "CenaTrocada", cena: comando.cena, autor, audiencia: ["publico"] }],
      };
    }

    case "alterarVida": {
      const personagem = estado.personagens[comando.personagem];
      if (personagem === undefined) {
        return { recusa: `Personagem desconhecido: ${comando.personagem}` };
      }
      // O Log é append-only: um `NaN` gravado aqui não tem como ser corrigido
      // depois, e passaria a envenenar todo replay da campanha.
      if (!Number.isInteger(comando.diferenca)) {
        return { recusa: "A diferença de vida precisa ser um número inteiro" };
      }

      // Os limites não recusam o Comando, limitam o resultado: uma cura de 8 em
      // quem está a 3 do máximo aconteceu, e o Evento registra as duas coisas.
      const { vida, vidaBonus } = distribuir(personagem, comando.diferenca);
      return {
        eventos: [
          {
            tipo: "VidaAlterada",
            personagem: comando.personagem,
            declarado: comando.diferenca,
            vida,
            vidaBonus,
            autor,
            // A vida é pública: ela está na TV, em barra, para a mesa inteira ver.
            audiencia: ["publico"],
          },
        ],
      };
    }

    case "alterarMoedas": {
      const personagem = estado.personagens[comando.personagem];
      if (personagem === undefined) {
        return { recusa: `Personagem desconhecido: ${comando.personagem}` };
      }
      // Mesmo motivo do `alterarVida`: um `NaN` gravado num Log append-only não
      // tem como ser corrigido depois, e envenena todo replay da campanha.
      if (!Number.isInteger(comando.diferenca)) {
        return { recusa: "A diferença de Moedas precisa ser um número inteiro" };
      }
      // `null` é o sigilo da projeção, e o decisor roda no servidor, sobre o
      // estado inteiro — aqui ele nunca aparece. A guarda existe para que o dia
      // em que alguém decidir por um Evento a partir de um estado projetado
      // seja uma recusa alta, e não uma conta feita com o buraco.
      if (personagem.moedas === null) {
        return { recusa: "Este estado não conhece as Moedas deste personagem" };
      }

      // Para em zero, como o dano (ADR-0001): bolso negativo é um estado que não
      // existe. O gasto declarado inteiro fica gravado do mesmo jeito.
      const moedas = Math.max(personagem.moedas + comando.diferenca, 0);
      return {
        eventos: [
          {
            tipo: "MoedasAlteradas",
            personagem: comando.personagem,
            declarado: comando.diferenca,
            moedas,
            autor,
            // O bolso é de quem o carrega. A vida é pública porque está na TV,
            // em barra; as Moedas não estão em tela nenhuma que a mesa olhe
            // junto, então não há motivo para elas saírem daqui para os outros.
            // O mestre lê tudo por ser o mestre, não por estar nesta lista.
            audiencia: [{ privado: comando.personagem }],
          },
        ],
      };
    }

    case "atualizarAnotacao": {
      // O personagem sai do autor, que sai do socket. Um Comando que carregasse
      // o próprio personagem seria um jogador escrevendo no bloco de outro.
      if (autor.tipo !== "jogador") {
        return { recusa: "O bloco de notas é do jogador" };
      }

      return {
        eventos: [
          {
            tipo: "AnotacaoAtualizada",
            personagem: autor.personagem,
            texto: comando.texto,
            autor,
            // A audiência é gravada aqui, uma vez, e é o que faz o Evento não
            // sair do servidor para mais ninguém. O mestre lê tudo por ser o
            // mestre, não por estar nesta lista.
            audiencia: [{ privado: autor.personagem }],
          },
        ],
      };
    }

    case "concederVidaBonus": {
      const personagem = estado.personagens[comando.personagem];
      if (personagem === undefined) {
        return { recusa: `Personagem desconhecido: ${comando.personagem}` };
      }
      // Zero é válido: é o efeito que acabou. Negativo não — tirar vida é
      // `/dano`, e um pote negativo é um estado que não existe.
      if (!Number.isInteger(comando.vidaBonus) || comando.vidaBonus < 0) {
        return { recusa: "A Vida bônus precisa ser um inteiro de zero para cima" };
      }

      return {
        eventos: [
          {
            tipo: "VidaBonusConcedida",
            personagem: comando.personagem,
            vidaBonus: comando.vidaBonus,
            autor,
            // Pública pelo mesmo motivo da vida: ela é uma barra na TV.
            audiencia: ["publico"],
          },
        ],
      };
    }
  }
};

/**
 * Onde os dois potes ficam depois de uma diferença declarada (ADR-0001).
 *
 * O dano come a Vida bônus primeiro e só o que sobra encosta na vida. A cura não
 * a devolve: ela não é vida machucada, é um pote que só o mestre enche.
 */
const distribuir = (
  personagem: Personagem,
  diferenca: number,
): { vida: number; vidaBonus: number } => {
  if (diferenca >= 0) {
    return {
      vida: Math.min(personagem.vida + diferenca, personagem.vidaMaxima),
      vidaBonus: personagem.vidaBonus,
    };
  }

  const dano = -diferenca;
  const doBonus = Math.min(dano, personagem.vidaBonus);
  return {
    vida: Math.max(personagem.vida - (dano - doBonus), 0),
    vidaBonus: personagem.vidaBonus - doBonus,
  };
};
