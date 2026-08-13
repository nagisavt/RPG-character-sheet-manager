import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * O `web/` roda dentro do processo do servidor, em middleware mode: um `npm run
 * dev` sobe o Node, o SQLite e as telas de uma vez só. É o monolito da decisão
 * de arquitetura — são cinco pessoas numa sala, não um cluster.
 */
export default defineConfig({
  root: import.meta.dirname,
  plugins: [react()],
  // `assets/cenas/taverna-do-javali.png` sai em `/cenas/taverna-do-javali.png`.
  // Os arquivos entram na pasta antes da Sessão: não existe upload pela tela.
  publicDir: "../assets",
  server: {
    // O celular do jogador entra pelo IP do notebook na rede local.
    host: true,
    fs: {
      // `shared/` mora fora de `web/`: o reducer é o mesmo arquivo nos dois lados.
      allow: [".."],
    },
  },
});
