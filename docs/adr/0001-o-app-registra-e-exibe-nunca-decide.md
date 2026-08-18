# O app registra e exibe, nunca decide o que aconteceu

O RPG acontece no papel e na mesa. Este app é um registrador e um painel: ele guarda o que a mesa declara e mostra pra quem tem direito de ver. Escolhemos isso porque um app que arbitra regras vira ponto único de falha da sessão — se ele erra ou cai, a mesa para pra discutir o app em vez de jogar — e porque rolar o dado é a parte boa do jogo, não burocracia a ser automatizada.

A fronteira não é "o app não calcula". É: **o app nunca decide o que aconteceu na ficção.** Depois que a mesa declarou um fato, a contabilidade que decorre dele pode ser feita pelo app, porque é determinística e não tem julgamento dentro.

## O que o app nunca faz

- Rolar dado. Pra ninguém, nem pros monstros, nem pra desempatar iniciativa.
- Dizer se acertou, quanto doeu, ou se o efeito pegou.
- Aplicar efeito, duração ou condição automaticamente.
- Policiar economia de ação.

## A aritmética permitida

Esta lista é fechada. Ela é curta de propósito, e crescer nela é uma decisão, não um detalhe de implementação.

- Somar o bônus de iniciativa no d20 que foi digitado.
- Limitar a cura na vida máxima — vida atual acima da máxima é um estado que não existe.
- Limitar o dano em zero — vida negativa também é um estado que não existe. Em D&D você cai a zero e começa a rolar contra a morte; o excedente não é guardado em lugar nenhum, e quanto passou disso é assunto da mesa, não do app.
- Distribuir um dano já declarado: consome a vida bônus primeiro, o que sobrar sai da vida.

## Consequências

- `/dano thorin 8` registra oito. Não descobre oito, mas divide os oito entre os dois potes de vida.
- O Evento guarda a diferença declarada inteira mesmo quando parte dela se perde num dos dois limites: `Thorin: dano 8 (5 → 0)` mostra honestamente que três não tinham onde cair. Ver [ADR-0003](./0003-o-evento-grava-a-diferenca-e-o-resultado.md).
- Vida de monstro fica no papel do mestre. O app conhece o monstro só como nome e bônus de iniciativa na Fila.
- O decisor não tem gerador aleatório, do mesmo jeito que não tem relógio — as duas coisas o tornariam impuro e não-testável.

## Alternativa rejeitada

Automatizar o que acontece "atrás do biombo" — rolagem de ataque e de iniciativa dos monstros — sob o argumento de que não é o momento de ninguém. Rejeitada porque qualquer rolagem no servidor exige que ele conheça o bloco de estatísticas do monstro, e aí a entidade inteira entra, trazendo junto vida, efeitos e cálculo de dano. A economia não compensa a superfície.
