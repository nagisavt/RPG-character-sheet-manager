import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";
import { catalogoDeExemplo, misselMagico } from "../harness/catalogo-exemplo.js";
import { criarMesa, type Mesa } from "../harness/criar-mesa.js";
import { elara, fichasDeExemplo, thorin } from "../harness/fichas-exemplo.js";

let mesa: Mesa;

afterEach(async () => {
  await mesa?.encerrar();
});

it("uma Sessão iniciada pelo mestre chega na TV", async () => {
  mesa = await criarMesa({ fichas: fichasDeExemplo });

  const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });
  const tv = await mesa.conectar({ como: "mesa" });

  await mestre.enviar({ tipo: "iniciarSessao" });

  expect(tv.estado.sessaoAtiva).toBe(true);
});

it("a Sessão vai até o fim e os dois Eventos ficam no Log, carimbados em ordem", async () => {
  mesa = await criarMesa({ fichas: fichasDeExemplo });

  const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });
  const tv = await mesa.conectar({ como: "mesa" });

  await mestre.enviar({ tipo: "iniciarSessao" });
  await mestre.enviar({ tipo: "finalizarSessao" });

  expect(tv.estado.sessaoAtiva).toBe(false);
  expect(tv.eventos.map((evento) => evento.tipo)).toEqual(["SessaoIniciada", "SessaoFinalizada"]);

  // O decisor devolve o corpo do Evento; quem carimba `id` e `timestamp` é o store.
  expect(tv.eventos.map((evento) => evento.id)).toEqual([1, 2]);
  for (const evento of tv.eventos) {
    expect(evento.autor).toEqual({ tipo: "mestre" });
    expect(evento.audiencia).toEqual(["publico"]);
    expect(Date.parse(evento.timestamp)).not.toBeNaN();
  }
});

describe("Vida", () => {
  it("o dano declarado pelo mestre chega na TV, e o Evento grava a diferença e o resultado", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });
    const tv = await mesa.conectar({ como: "mesa" });

    await mestre.enviar({ tipo: "alterarVida", personagem: "thorin", diferenca: -8 });

    expect(tv.estado.personagens["thorin"]?.vida).toBe(20);
    expect(tv.eventos.at(-1)).toMatchObject({
      tipo: "VidaAlterada",
      personagem: "thorin",
      declarado: -8,
      vida: 20,
    });
  });

  it("uma cura não passa da vida máxima, e o Evento guarda o declarado junto do limitado", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });
    const tv = await mesa.conectar({ como: "mesa" });

    await mestre.enviar({ tipo: "alterarVida", personagem: "thorin", diferenca: -3 });
    await mestre.enviar({ tipo: "alterarVida", personagem: "thorin", diferenca: 30 });

    expect(tv.estado.personagens["thorin"]?.vida).toBe(28);
    // A cura de 30 aconteceu; 5 se perderam no teto, e o Log conta as duas coisas.
    expect(tv.eventos.at(-1)).toMatchObject({ declarado: 30, vida: 28 });
  });

  it("o dano para em zero: ninguém fica com vida negativa", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });
    const tv = await mesa.conectar({ como: "mesa" });

    await mestre.enviar({ tipo: "alterarVida", personagem: "thorin", diferenca: -99 });

    expect(tv.estado.personagens["thorin"]?.vida).toBe(0);
    expect(tv.eventos.at(-1)).toMatchObject({ declarado: -99, vida: 0 });
  });

  it("a vida de um personagem não mexe na do outro", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });
    const tv = await mesa.conectar({ como: "mesa" });

    await mestre.enviar({ tipo: "alterarVida", personagem: "thorin", diferenca: -8 });

    expect(tv.estado.personagens["elara"]?.vida).toBe(22);
  });

  it("recusa um personagem que não está nas Fichas, sem gravar nada", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });

    const resposta = await mestre.enviar({
      tipo: "alterarVida",
      personagem: "gandalf",
      diferenca: -8,
    });

    expect(resposta).toEqual({ aceito: false, motivo: "Personagem desconhecido: gandalf" });
    expect(mestre.eventos).toEqual([]);
  });

  it("o jogador não altera vida, nem a própria: quem declara o que aconteceu é o mestre", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    const celular = await mesa.conectar({ como: "jogador", personagem: "thorin" });

    const resposta = await celular.enviar({
      tipo: "alterarVida",
      personagem: "thorin",
      diferenca: -8,
    });

    expect(resposta).toEqual({ aceito: false, motivo: "Só o mestre pode enviar 'alterarVida'" });
    expect(celular.estado.personagens["thorin"]?.vida).toBe(28);
  });
});

describe("Catálogo", () => {
  it("qualquer tela consulta uma magia por identificador, com a descrição inteira", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo, catalogo: catalogoDeExemplo });

    const celular = await mesa.conectar({ como: "jogador", personagem: "thorin" });

    expect(await celular.consultar({ tipo: "magia", chave: "srd-2024_magic-missile" })).toEqual(
      misselMagico,
    );
  });

  it("o que não está no Catálogo volta nulo, sem derrubar a conexão", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo, catalogo: catalogoDeExemplo });

    const celular = await mesa.conectar({ como: "jogador", personagem: "thorin" });

    expect(await celular.consultar({ tipo: "magia", chave: "bola-de-fogo" })).toBeNull();
    // Mesma chave, tipo errado: `tipo` faz parte da identidade da entrada.
    expect(await celular.consultar({ tipo: "item", chave: "srd-2024_magic-missile" })).toBeNull();
  });

  it("consultar o Catálogo não vira Evento: ele não entra no Log", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo, catalogo: catalogoDeExemplo });

    const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });
    await mestre.digitar("/iniciar");

    await mestre.consultar({ tipo: "magia", chave: "srd-2024_magic-missile" });

    // Só a Sessão que começou. A regra do SRD não é fato da Mesa.
    expect(mestre.eventos.map((evento) => evento.tipo)).toEqual(["SessaoIniciada"]);
  });

  it("o Catálogo sobrevive ao reinício sem ser semeado de novo", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo, catalogo: catalogoDeExemplo });

    const celular = await mesa.conectar({ como: "jogador", personagem: "thorin" });
    await mesa.reiniciar();

    expect(await celular.consultar({ tipo: "magia", chave: "srd-2024_magic-missile" })).toEqual(
      misselMagico,
    );
  });
});

describe("Cena", () => {
  it("o mestre troca a Cena e a TV muda", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });
    const tv = await mesa.conectar({ como: "mesa" });

    // Antes da primeira escolha da noite não há Cena nenhuma no ar.
    expect(tv.estado.cena).toBeNull();

    await mestre.digitar("/cena taverna-do-javali");

    expect(tv.estado.cena).toBe("taverna-do-javali");
    // O Evento grava o nome do arquivo, e nada mais: se aquele arquivo tem
    // desenho ou é placeholder não é assunto do Log.
    expect(tv.eventos.at(-1)).toMatchObject({
      tipo: "CenaTrocada",
      cena: "taverna-do-javali",
    });
  });

  it("a Cena sobrevive ao reinício, porque ela está no Log", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });
    const tv = await mesa.conectar({ como: "mesa" });
    await mestre.digitar("/cena estrada-para-o-norte");

    await mesa.reiniciar();

    expect(tv.estado.cena).toBe("estrada-para-o-norte");
  });

  it("recusa um nome que sairia de assets/cenas/", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });

    const resposta = await mestre.enviar({ tipo: "trocarCena", cena: "../../.env" });

    expect(resposta.aceito).toBe(false);
    expect(mestre.eventos).toEqual([]);
  });

  it("recusa trocar para a Cena que já está no ar, sem sujar o Log", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });
    await mestre.digitar("/cena taverna-do-javali");

    const resposta = await mestre.digitar("/cena taverna-do-javali");

    expect(resposta).toEqual({
      aceito: false,
      motivo: "A Cena 'taverna-do-javali' já está no ar",
    });
    expect(mestre.eventos).toHaveLength(1);
  });

  it("o jogador não troca a Cena: a TV é do mestre", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    const celular = await mesa.conectar({ como: "jogador", personagem: "thorin" });

    const resposta = await celular.enviar({ tipo: "trocarCena", cena: "taverna-do-javali" });

    expect(resposta).toEqual({ aceito: false, motivo: "Só o mestre pode enviar 'trocarCena'" });
  });
});

describe("a linha que o mestre digita", () => {
  it("'/dano thorin 8' derruba a vida do Thorin", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });
    const tv = await mesa.conectar({ como: "mesa" });

    const resposta = await mestre.digitar("/dano thorin 8");

    expect(resposta).toEqual({ aceito: true });
    expect(tv.estado.personagens["thorin"]?.vida).toBe(20);
  });

  it("'/cura thorin 5' sobe, e o sinal vem do verbo e não do número", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });
    const tv = await mesa.conectar({ como: "mesa" });

    await mestre.digitar("/dano thorin 10");
    await mestre.digitar("/cura thorin 5");

    expect(tv.estado.personagens["thorin"]?.vida).toBe(23);
    expect(tv.eventos.map((evento) => "declarado" in evento && evento.declarado)).toEqual([-10, 5]);
  });

  it("'/dano thorin -8' é erro de digitação, não uma cura", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });

    const resposta = await mestre.digitar("/dano thorin -8");

    expect(resposta.aceito).toBe(false);
    expect(mestre.estado.personagens["thorin"]?.vida).toBe(28);
    expect(mestre.eventos).toEqual([]);
  });

  it("'/iniciar' e '/finalizar' atravessam a Sessão inteira", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });
    const tv = await mesa.conectar({ como: "mesa" });

    await mestre.digitar("/iniciar");
    expect(tv.estado.sessaoAtiva).toBe(true);

    await mestre.digitar("/finalizar");
    expect(tv.estado.sessaoAtiva).toBe(false);
  });

  it("uma linha que não é comando não chega no servidor", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });

    const resposta = await mestre.digitar("/dano");

    expect(resposta).toEqual({
      aceito: false,
      motivo: "Escreva '/dano <personagem> <quantidade>'",
    });
    expect(mestre.eventos).toEqual([]);
  });
});

/**
 * O ADR-0003 em cena. A Ficha muda entre sessões; o Log nunca muda. O que estes
 * testes provam é que a segunda parte continua valendo depois da primeira.
 */
describe("a Ficha editada entre duas subidas", () => {
  it("subir a vida máxima e reiniciar não altera a vida já registrada", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });
    const tv = await mesa.conectar({ como: "mesa" });

    await mestre.digitar("/dano thorin 8");
    expect(tv.estado.personagens["thorin"]?.vida).toBe(20);

    // Thorin sobe de nível: o mestre edita `fichas/mesa.ts` e reinicia.
    await mesa.reiniciar([{ ...thorin, vidaMaxima: 35 }, elara]);

    // O teto subiu, o machucado continua o mesmo. Se o Evento guardasse só a
    // diferença, o replay teria recomeçado em 35 e dado 27.
    expect(tv.estado.personagens["thorin"]).toEqual({
      id: "thorin",
      nome: "Thorin",
      vida: 20,
      vidaMaxima: 35,
    });
  });

  it("uma cura antiga não muda de sentido quando o teto sobe", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });
    const tv = await mesa.conectar({ como: "mesa" });

    await mestre.digitar("/dano thorin 8");
    await mestre.digitar("/cura thorin 99");
    // Curou até o teto de janeiro, que era 28.
    expect(tv.estado.personagens["thorin"]?.vida).toBe(28);

    await mesa.reiniciar([{ ...thorin, vidaMaxima: 35 }, elara]);

    // E continua sendo 28: aquela cura aconteceu quando o teto era 28, e o Log
    // não é reinterpretado à luz da Ficha de hoje.
    expect(tv.estado.personagens["thorin"]?.vida).toBe(28);
  });

  it("corrigir um erro de digitação é editar o arquivo e reiniciar, sem gravar nada", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });
    const tv = await mesa.conectar({ como: "mesa" });
    await mestre.digitar("/dano thorin 8");

    // O nome estava escrito errado desde o começo da campanha.
    await mesa.reiniciar([{ ...thorin, nome: "Thorim" }, elara]);

    expect(tv.estado.personagens["thorin"]?.nome).toBe("Thorim");
    // E o Log não cresceu: não existe Comando de correção, e é por isso que não
    // existe tela de cadastro de Ficha entrando pela porta dos fundos.
    expect(mestre.eventos).toHaveLength(1);
  });
});

describe("identidade e autorização", () => {
  it("recusa um Comando de mestre vindo de um socket de jogador", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    const celular = await mesa.conectar({ como: "jogador", personagem: "thorin" });

    const resposta = await celular.enviar({ tipo: "iniciarSessao" });

    expect(resposta).toEqual({ aceito: false, motivo: "Só o mestre pode enviar 'iniciarSessao'" });
    expect(celular.estado.sessaoAtiva).toBe(false);
    expect(celular.eventos).toEqual([]);
  });

  it("a TV só lê: um Comando vindo dela é recusado", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    const tv = await mesa.conectar({ como: "mesa" });

    const resposta = await tv.enviar({ tipo: "iniciarSessao" });

    expect(resposta.aceito).toBe(false);
    expect(tv.estado.sessaoAtiva).toBe(false);
  });

  it("recusa o handshake do mestre com a senha errada", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo, senhaDoMestre: "abracadabra" });

    await expect(mesa.conectar({ como: "mestre", senha: "1234" })).rejects.toThrow(
      "Senha incorreta",
    );
  });

  it("recusa o handshake de um personagem que não está nas Fichas", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    await expect(mesa.conectar({ como: "jogador", personagem: "gandalf" })).rejects.toThrow(
      "Personagem desconhecido: gandalf",
    );
  });
});

describe("o Log", () => {
  it("reiniciar reconstrói o estado do Log e chega no mesmo lugar", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });
    const tv = await mesa.conectar({ como: "mesa" });
    await mestre.enviar({ tipo: "iniciarSessao" });

    await mesa.reiniciar();

    // A Sessão continua em curso: o estado não estava no processo que caiu.
    expect(tv.estado.sessaoAtiva).toBe(true);
    // E as Fichas voltaram como posição inicial, sem terem virado Evento.
    expect(tv.estado.personagens["thorin"]).toEqual({
      id: "thorin",
      nome: "Thorin",
      vida: 28,
      vidaMaxima: 28,
    });

    // E a Mesa continua de onde parou: o Log seguiu, não recomeçou.
    await mestre.enviar({ tipo: "finalizarSessao" });
    expect(tv.estado.sessaoAtiva).toBe(false);
  });

  it("é append-only: nada apaga, nada edita", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });
    const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });
    await mestre.enviar({ tipo: "iniciarSessao" });

    // Direto no arquivo do Log, por fora da aplicação: a garantia tem que valer
    // mesmo para quem não passa pelo servidor.
    const sqlite = new DatabaseSync(mesa.caminhoDoLog);
    try {
      expect(() => sqlite.exec("UPDATE eventos SET corpo = '{}'")).toThrow(/append-only/);
      expect(() => sqlite.exec("DELETE FROM eventos")).toThrow(/append-only/);
      expect(sqlite.prepare("SELECT COUNT(*) AS total FROM eventos").get()!["total"]).toBe(1);
    } finally {
      sqlite.close();
    }
  });

  it("recusa um Comando que a regra da Mesa não permite, sem gravar nada", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });
    const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });
    await mestre.enviar({ tipo: "iniciarSessao" });

    const resposta = await mestre.enviar({ tipo: "iniciarSessao" });

    expect(resposta).toEqual({ aceito: false, motivo: "A Sessão já está em curso" });
    expect(mestre.eventos).toHaveLength(1);
  });
});

describe("reconexão", () => {
  it("o celular que dormiu volta com snapshot e converge para o mesmo estado", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });
    const celular = await mesa.conectar({ como: "jogador", personagem: "thorin" });

    await celular.reconectar();

    // Voltou em dia com o que já tinha acontecido...
    expect(celular.estado.sessaoAtiva).toBe(false);

    // ...e continua recebendo os deltas.
    await mestre.enviar({ tipo: "iniciarSessao" });
    expect(celular.estado.sessaoAtiva).toBe(true);
  });

  it("volta em dia mesmo se a Mesa andou enquanto ele estava fora", async () => {
    mesa = await criarMesa({ fichas: fichasDeExemplo });

    const mestre = await mesa.conectar({ como: "mestre", senha: "1234" });
    const celular = await mesa.conectar({ como: "jogador", personagem: "thorin" });

    celular.desconectar();
    await mestre.enviar({ tipo: "iniciarSessao" });
    await celular.reconectar();

    // O snapshot é completo, não um replay dos deltas perdidos.
    expect(celular.estado.sessaoAtiva).toBe(true);
  });
});
