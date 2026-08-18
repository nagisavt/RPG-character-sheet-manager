import type { Comando } from "../shared/comandos.js";
import type {
  Autor,
  Estado,
  EventoNovo,
  Monstro,
  Participante,
  Personagem,
} from "../shared/tipos.js";

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

    case "iniciarCombate":
      if (estado.combate !== null) return { recusa: "O Combate já está em curso" };
      return { eventos: [{ tipo: "CombateIniciado", autor, audiencia: ["publico"] }] };

    case "declararMonstros": {
      if (estado.combate === null) return { recusa: "Nenhum Combate em curso" };

      const problema = conferirMonstros(comando.monstros);
      if (problema !== null) return { recusa: problema };

      return {
        eventos: [
          {
            tipo: "MonstrosDeclarados",
            monstros: comando.monstros,
            autor,
            // O nome é público: a Fila vai mostrar ele na TV. Os números da
            // rolagem é que não são da Mesa (ver `IniciativaDeclarada`).
            audiencia: ["publico"],
          },
        ],
      };
    }

    case "declararIniciativa": {
      if (autor.tipo !== "jogador") return { recusa: "A iniciativa é de quem rolou o dado" };
      const personagem = estado.personagens[autor.personagem];
      if (personagem === undefined) {
        return { recusa: `Personagem desconhecido: ${autor.personagem}` };
      }

      return iniciativa(
        estado,
        { tipo: "personagem", personagem: autor.personagem },
        comando.d20,
        // O bônus sai da Ficha, pelo estado, e nunca do que o cliente mandou.
        personagem.bonusDeIniciativa,
        autor,
        // O dono vê a própria rolagem confirmada; o mestre vê todas por ser o
        // mestre. A Mesa não vê número nenhum — ela vê nomes em ordem.
        [{ privado: autor.personagem }],
      );
    }

    case "declararIniciativaDoMonstro": {
      const monstro = estado.combate?.monstros.find((qual) => qual.nome === comando.nome);
      if (monstro === undefined) {
        return { recusa: `Monstro não declarado: ${comando.nome}` };
      }

      return iniciativa(
        estado,
        { tipo: "monstro", nome: monstro.nome },
        comando.d20,
        monstro.bonusDeIniciativa,
        autor,
        // Só o mestre: o d20 do Monstro é o que ele rolou atrás do biombo.
        [],
      );
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
 * Uma iniciativa que entrou, com o bônus já somado — a primeira linha da
 * aritmética permitida (ADR-0001). O d20 cru fica gravado junto, porque foi ele
 * que a mesa rolou e digitou.
 *
 * `audiencia` chega com quem mais vê além do mestre, que vê tudo por ser o
 * mestre e não por estar numa lista.
 */
const iniciativa = (
  estado: Estado,
  participante: Participante,
  d20: number,
  bonus: number,
  autor: Autor,
  audiencia: EventoNovo["audiencia"],
): Decisao => {
  if (estado.combate === null) return { recusa: "Nenhum Combate em curso" };
  // Um d20 é um d20. Vinte e três não foi rolado num dado, foi digitado errado —
  // e o Log é append-only, então não dá para corrigir depois.
  if (!Number.isInteger(d20) || d20 < 1 || d20 > 20) {
    return { recusa: "O d20 é um inteiro de 1 a 20" };
  }

  return {
    eventos: [
      {
        tipo: "IniciativaDeclarada",
        participante,
        d20,
        resultado: d20 + bonus,
        autor,
        audiencia: ["mestre", ...audiencia],
      },
    ],
  };
};

/** O que impede uma lista de Monstros de virar Fila, ou `null` se ela serve. */
const conferirMonstros = (monstros: readonly Monstro[]): string | null => {
  for (const monstro of monstros) {
    if (monstro.nome.trim() === "") return "Todo Monstro precisa de nome";
    if (!Number.isInteger(monstro.quantidade) || monstro.quantidade < 1) {
      return `'${monstro.nome}': a quantidade é um inteiro de 1 para cima`;
    }
    if (!Number.isInteger(monstro.bonusDeIniciativa)) {
      return `'${monstro.nome}': o bônus de iniciativa é um número inteiro`;
    }
  }

  // Dois Monstros com o mesmo nome seriam um Participante só na Fila, e a
  // iniciativa de um sobrescreveria a do outro. "Goblin arqueiro" e "Goblin
  // lanceiro" é o que a mesa já fala em voz alta.
  const nomes = monstros.map((monstro) => monstro.nome);
  const repetido = nomes.find((nome, ordem) => nomes.indexOf(nome) !== ordem);
  return repetido === undefined ? null : `Dois Monstros chamados '${repetido}'`;
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
