# A Ficha é entrada versionada, não estado editável

As fichas existem em papel e são digitadas à mão pelo mestre num arquivo versionado do repositório. Esse arquivo é a **posição inicial** do estado da Mesa — o `inicial` de `eventos.reduce(reducer, inicial)` — e não vira evento no Log. Escolhemos isso porque o git já é o histórico da ficha e o Log é o histórico da mesa: cada um com a ferramenta certa, e nenhum dos dois fazendo o trabalho do outro.

A consequência mais importante é intencional: **não existe, nem existirá, tela de cadastro de ficha.** Este app não é um cadastrador.

## Três fontes de dado, não duas

| Onde mora | Exemplo | Muda |
| --- | --- | --- |
| Catálogo (SRD) | "Míssil Mágico: 1º círculo, três dardos de 1d4+1" | Nunca |
| Ficha (arquivo) | "Thorin, guerreiro nível 3, CA 16, vida máxima 28" | Entre sessões |
| Estado de mesa (Log) | "Thorin está com 19, tem 45 moedas, tirou 17" | Durante a sessão |

A régua para qualquer campo novo: **muda durante a sessão → Log. Entre sessões → Ficha. Nunca → Catálogo.**

## Consequências

- Subir de nível ou corrigir um erro de digitação é editar o arquivo e reiniciar o servidor. No meio de uma sessão isso custa uns dez segundos e ninguém perde nada, porque o estado é reconstruído do Log.
- Se a Ficha virasse evento, corrigir um typo exigiria um comando de correção — e um comando de correção é a tela de cadastro entrando pela porta dos fundos.
- Editar a Ficha não reescreve o passado, porque nenhum evento depende dela para ser interpretado. Ver [ADR-0003](./0003-o-evento-grava-a-diferenca-e-o-resultado.md).
- Estruturas que só serão escritas em versões futuras já nascem com a forma final na Ficha — `equipado` como mapa de slots, magias marcadas como conhecidas — mesmo que o v1 só leia. Custa nada agora e evita refatoração depois.
