import { DatabaseSync } from "node:sqlite";
import type { Evento, EventoNovo } from "../shared/tipos.js";

/**
 * O Log: a sequência completa e append-only de todos os Eventos da Mesa.
 *
 * O store é o único lugar do sistema que conhece o relógio e o contador. O
 * decisor devolve o corpo do Evento; aqui ele ganha `id` e `timestamp`. É o que
 * mantém o decisor puro e testável sem relógio falso.
 */
export type Store = {
  gravar: (novo: EventoNovo) => Evento;
  ler: () => Evento[];
  fechar: () => void;
};

type Opcoes = {
  caminho: string;
  /** Injetado para que o carimbo seja observável. O default é o relógio de verdade. */
  agora?: () => string;
};

export const abrirStore = ({ caminho, agora = () => new Date().toISOString() }: Opcoes): Store => {
  const banco = new DatabaseSync(caminho);
  criarEsquema(banco);

  const inserir = banco.prepare("INSERT INTO eventos (timestamp, corpo) VALUES (?, ?)");
  const selecionar = banco.prepare("SELECT id, timestamp, corpo FROM eventos ORDER BY id");

  return {
    gravar: (novo) => {
      const timestamp = agora();
      const { lastInsertRowid } = inserir.run(timestamp, JSON.stringify(novo));
      return { ...novo, id: Number(lastInsertRowid), timestamp };
    },
    ler: () => selecionar.all().map(hidratar),
    fechar: () => banco.close(),
  };
};

/**
 * `id` é sequencial do banco, não UUID: o Log tem escritor único e o que importa
 * é a ordem total. O corpo inteiro do Evento mora em JSON, sem coluna espelhada,
 * para que acrescentar um tipo de Evento não seja uma migração de esquema.
 *
 * Os dois gatilhos são o append-only escrito onde ele não depende de ninguém
 * lembrar dele: nada apaga, nada edita, nem por engano nem por outro processo.
 */
const criarEsquema = (banco: DatabaseSync): void => {
  banco.exec(`
    CREATE TABLE IF NOT EXISTS eventos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      corpo TEXT NOT NULL
    );

    CREATE TRIGGER IF NOT EXISTS eventos_nao_editam
    BEFORE UPDATE ON eventos
    BEGIN SELECT RAISE(ABORT, 'O Log é append-only: nada edita'); END;

    CREATE TRIGGER IF NOT EXISTS eventos_nao_apagam
    BEFORE DELETE ON eventos
    BEGIN SELECT RAISE(ABORT, 'O Log é append-only: nada apaga'); END;
  `);
};

const hidratar = (linha: Record<string, unknown>): Evento => ({
  ...(JSON.parse(String(linha["corpo"])) as EventoNovo),
  id: Number(linha["id"]),
  timestamp: String(linha["timestamp"]),
});
