# O evento grava a diferença declarada e o resultado

Quando o mestre declara `/dano thorin 8`, o Evento guarda as duas coisas: a **diferença** que foi declarada (`8`) e o **resultado** do estado depois dela (vida `19`, vida bônus `0`). O reducer lê o resultado e ignora a diferença. Escolhemos isso porque a diferença sozinha faz o Log depender da Ficha para ser interpretado, e a Ficha muda.

## O problema que isso evita

Thorin sobe de nível e a vida máxima vai de 28 para 35 no arquivo da Ficha. Na próxima subida do servidor, o Log inteiro é replicado por cima da posição inicial nova.

Se os eventos fossem só diferenças, o replay começaria em 35 e reaplicaria todo dano e toda cura desde o começo da campanha — o número final seria lixo. Pior: um evento antigo de cura até o teto passaria a significar 35, tendo acontecido quando o teto era 28. O Log mudaria de sentido retroativamente, num Log que nunca é apagado.

Gravando o resultado, nenhum evento depende da Ficha. Janeiro continua dizendo o que dizia.

## Por que guardar a diferença também

Porque é o que a mesa declarou, e registrar o que a mesa declarou é a função deste app ([ADR-0001](./0001-o-app-registra-e-exibe-nunca-decide.md)). A tela de log do mestre lê a diferença e escreve em português — `Thorin: cura 8 (25 → 28)` mostra honestamente que cinco se perderam no teto.

## Consequências

- O reducer **atribui**, não acumula.
- O decisor precisa do estado atual para calcular o resultado — o que a assinatura `decisor(estado, comando) => evento[]` já garante.
- Vale para todo evento que muda número: vida, vida bônus e moedas.
