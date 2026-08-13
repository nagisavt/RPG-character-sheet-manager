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
  server: {
    // O celular do jogador entra pelo IP do notebook na rede local.
    host: true,
    fs: {
      // `shared/` mora fora de `web/`: o reducer é o mesmo arquivo nos dois lados.
      allow: [".."],
    },
  },
});
