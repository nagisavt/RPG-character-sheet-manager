import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";
import { criarMesa, type Mesa } from "../harness/criar-mesa.js";
import { fichasDeExemplo } from "../harness/fichas-exemplo.js";

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
