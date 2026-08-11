# RPG Mesa

Gerenciamento de uma mesa presencial de D&D 5.5 (regras 2024): três telas (TV, celular do jogador, notebook do mestre) sobre um único estado compartilhado.

## Language

**Mesa**:
O grupo, seus personagens e o estado compartilhado de uma campanha. Existe uma só.
_Avoid_: sala, sessão, campanha, jogo

**Sessão**:
Uma noite de jogo, delimitada pelos eventos `SessaoIniciada` e `SessaoFinalizada`. É um recorte de leitura sobre o Log, não uma divisão do estado.
_Avoid_: partida, encontro

**Comando**:
A intenção que um cliente envia ao servidor. Pode ser recusada.
_Avoid_: ação, request, mutation

**Evento**:
Um fato consumado sobre o estado da Mesa. Só o decisor cria eventos, a partir de um Comando, e um evento nunca é recusado nem alterado depois.
_Avoid_: log entry, mensagem, ação

**Log**:
A sequência completa e append-only de todos os Eventos da Mesa desde o início da campanha. Nunca é apagado nem arquivado.
_Avoid_: histórico, banco, timeline

**Audiência**:
Quem pode ver um Evento: `publico`, `privado:<personagem>` ou `mestre`. O servidor projeta uma visão diferente por cliente a partir dela.
_Avoid_: visibilidade, permissão, escopo

**Combate**:
O modo em que a Mesa entra quando o mestre declara os monstros, e do qual só sai quando o mestre encerra. Enquanto dura, a TV mostra a Fila de iniciativa no lugar da cena.
_Avoid_: encontro, batalha, luta

**Participante**:
Quem está na Fila de iniciativa — um personagem ou um Monstro. É o único lugar em que os dois são tratados como a mesma coisa.
_Avoid_: combatente, ator, entidade

**Monstro**:
Um adversário na Fila de iniciativa. Tem nome e um bônus de iniciativa, ambos declarados pelo mestre na hora: vida e estatísticas ficam no papel dele, e o monstro não vem do Catálogo.
_Avoid_: inimigo, criatura, NPC

**Fila de iniciativa**:
A ordem dos Participantes de um Combate. O mestre monta ela à mão a partir das iniciativas recebidas e publica de uma vez para a Mesa — ela é uma ordem escolhida, não uma ordem calculada. A Mesa vê só os nomes em ordem, nunca os números.
_Avoid_: ordem de turno, lista de turnos (não existe noção de turno)

**Cena**:
A imagem de fundo da tela da Mesa fora de combate — o lugar onde o grupo está. É um arquivo em `assets/cenas/`, colocado lá antes da sessão; o mestre só escolhe qual está no ar.
_Avoid_: background, mapa, ambiente

**Vida bônus**:
Um segundo pote de pontos de vida, concedido pelo mestre e desenhado como uma barra branca depois da barra de vida. Todo dano consome ela antes de encostar na vida.
_Avoid_: vida temporária, pontos temporários, escudo

**Moedas**:
O dinheiro de um personagem, guardado como um número só. Não existe denominação: converter prata em ouro acontece na cabeça do mestre, antes de registrar.
_Avoid_: PO, ouro, dinheiro, tesouro

**Catálogo**:
Os dados de regra do SRD — magias, itens, monstros. Somente leitura, iguais para qualquer mesa, e nunca entram no Log.
_Avoid_: compêndio, biblioteca, referência

**Ficha**:
A folha de papel de um personagem, digitalizada à mão pelo mestre e versionada no repositório. É entrada do sistema, não algo que o app edita — não existe, nem existirá, tela de cadastro de ficha.
_Avoid_: personagem (a Ficha é só a parte estática dele), cadastro, perfil
