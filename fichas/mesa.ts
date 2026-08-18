import type { Ficha } from "../shared/tipos.js";

/**
 * **As Fichas da Mesa. Este arquivo é digitado à mão pelo mestre** — é a folha de
 * papel de cada personagem, digitalizada, e a posição inicial do estado (ADR-0002).
 *
 * Subir de nível, corrigir um erro de digitação ou trocar um nome é editar aqui e
 * reiniciar o servidor. Custa uns dez segundos e não perde nada: o estado é
 * reconstruído do Log, e nenhum Evento depende deste arquivo para ser lido
 * (ADR-0003). Não existe, nem existirá, tela de cadastro de Ficha.
 *
 * O que muda **durante** a sessão não entra aqui: isso é Log.
 *
 * `moedas` é com quanto o personagem chegou no começo da campanha, num número
 * só e sem denominação. O que ele ganhou e gastou depois é Log, e editar aqui
 * não reescreve nada disso.
 *
 * Inventário, magias e equipado guardam a **chave do Catálogo**. O nome e a
 * descrição saem de lá na hora de exibir: quem digita a Ficha não redigita a
 * regra. Uma chave que o Catálogo não tem aparece como o que ela é — uma chave
 * sem entrada — em vez de sumir da tela.
 */
export const fichasDaMesa: readonly Ficha[] = [
  {
    id: "thorin",
    nome: "Thorin",
    vidaMaxima: 28,
    moedas: 120,
    inventario: [
      { chave: "srd-2024_longsword", quantidade: 1 },
      { chave: "srd-2024_shield", quantidade: 1 },
      { chave: "srd-2024_chain-mail", quantidade: 1 },
      { chave: "srd-2024_rope", quantidade: 1 },
    ],
    magias: [],
    // A mesma chave pode ser item e magia sem se atrapalhar: o Catálogo é
    // indexado por tipo **e** chave. Aqui `srd-2024_shield` é o escudo de metal.
    equipado: {
      maoPrincipal: "srd-2024_longsword",
      maoSecundaria: "srd-2024_shield",
      corpo: "srd-2024_chain-mail",
    },
  },
  {
    id: "elara",
    nome: "Elara",
    vidaMaxima: 22,
    moedas: 35,
    inventario: [{ chave: "srd-2024_quarterstaff", quantidade: 1 }],
    magias: [
      { chave: "srd-2024_fire-bolt", conhecida: true },
      { chave: "srd-2024_magic-missile", conhecida: true },
    ],
    equipado: {
      maoPrincipal: "srd-2024_quarterstaff",
      maoSecundaria: null,
      corpo: null,
    },
  },
];
