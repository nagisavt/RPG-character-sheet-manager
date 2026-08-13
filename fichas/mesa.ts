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
 */
export const fichasDaMesa: readonly Ficha[] = [
  { id: "thorin", nome: "Thorin", vidaMaxima: 28 },
  { id: "elara", nome: "Elara", vidaMaxima: 22 },
];
