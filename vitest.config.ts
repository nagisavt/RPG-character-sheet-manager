import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["testes/**/*.test.ts"],
    // Cada teste sobe um servidor de verdade num banco temporário. Rodar os
    // arquivos em sequência mantém as portas e os arquivos previsíveis.
    fileParallelism: false,
    testTimeout: 15_000,
  },
});
