---
tags: [projeto, rpg, dnd]
---

# RPG Mesa - Ideias

> Captura rápida. Nada sai de "Depois" pra "v1" antes da sessão 1 acontecer.

## Funcionalidades - Jogador

- Ver a própria ficha completa
- Vida atual (botões de toque, sem digitar)
- Mochila com itens
- Sistema de cintos/bolso/pochete (itens preparados)
- Clicar no item → descrição do que ele faz
- Magias com descrição
- Slots de magia visíveis por círculo (gastos/total)
- Botão de conjurar: desconta o slot, avisa se falta mão livre ou componente
- Buffs e debuffs ativos (ícone, clicou → descrição)
- Ver os colegas: vida dos outros
- Anotações pessoais
- Ao entrar em combate: popup pra digitar o resultado DO DADO da iniciativa (não o total, o app soma)

## Funcionalidades - Mestre

- Controle de tudo por comando (`/dano thorin 12`)
- Alterar moedas/vida/itens de qualquer personagem via comando (registra como mestre no log)
- Tela de log: quem fez o quê e quando
- Trocar a cena/background que todos veem
- Entrar em modo combate
- Cálculo da iniciativa (monstros rolam automático, jogadores digitam o dado)
- Ver quem tá concentrando em qual magia

## Funcionalidades - TV da mesa

- Cena atual
- Ordem de iniciativa, com destaque em quem tá na vez
- Barra de vida de todo mundo
- Fileira de ícones de efeito embaixo da barra de vida (só leitura, ninguém levanta pra clicar)
- Fonte grande (testar a 2m de distância)

## Inventário (containers)

- Não modelar "mochila" e "cinto" separado — é `Container { nome, capacidade, custoDeAcesso }`
- Mochila: limite por **peso**, acesso custa **ação**
- Cinto: limite por **slots** (3 no básico), acesso custa **ação bônus**
- Equipado ("na mão"): sem limite de container, acesso **livre**
- Container é item: tem peso, preço, pode ser comprado/trocado por um melhor
- Container dentro de container: **proibido no v1** (vira recursão)
- Servidor **informa** o custo de ação, não policia turno

### Dois limites, naturezas diferentes

- `peso(container)` → **BLOQUEIA** (é volume, não cabe não entra)
- `peso(personagem)` = containers + equipado + moedas → **SOBRECARREGA** (Força × 15, deixa passar)
- Contar o que não tá em container: armadura vestida, arma na mão, escudo (placa = 65 lb)
- Moedas pesam: 50 moedas = 1 lb — é o que enche depois de limpar masmorra
- Loja generosa: mochilas de 60-80 lb, pro limite do corpo virar gargalo do personagem fraco
- `Sobrecarregado` é **derivado no reducer**, não é evento (senão dessincroniza)
- Sobrecarga é regra opcional do DMG → house rule minha de qualquer jeito
- Avisar a galera antes da sessão 1: nas regras de 2024 já existe 1 interação livre com objeto por turno, meu sistema é mais duro que o livro

### Banco

- `peso` mora no **catálogo** (espada longa = 3 lb, nunca muda)
- O que tá na mochila é **instância**: item + qtd + container
- Peso carregado é sempre **calculado**, nunca armazenado
- 50 flechas = 1 registro com `qtd: 50`

## Magias

- Botão pra ver as magias que sabe, ler descrição
- Botão de conjurar → desconta o slot e aplica efeito se tiver
- **Três listas, não uma**: conhecidas (grimório) / preparadas / slots. Confundir conhecidas com preparadas é metade da confusão da mesa
- Botão de conjurar só nas preparadas
- Slots: `slots[circulo] = { total, gastos }` — contabilidade pura, maior ganho pelo menor esforço
- Ao conjurar, escolher **em qual círculo** (senão perde upcast)
- Truque não gasta slot, ritual não gasta, bruxo tem pool separado (recarrega em descanso curto)

### Componentes

- Material **sem custo em PO** → abstraído pela bolsa de componentes ou foco. **Não existe no inventário**, app não checa nada (galho de raio, casca de ovo, etc.)
- Material **com custo em PO** → item de verdade no inventário. Se a descrição diz consumido, some ao conjurar
- Foco e bolsa **não** cobrem componente com custo
- Foco/bolsa é item **equipado** — se tá na mochila, não serve
- Símbolo sagrado (clérigo/paladino), foco arcano (mago/bruxo/feiticeiro), foco druídico — mesmo mecanismo
- Magia sem componente material ainda exige mão livre (gesto somático)
- Resultado prático: a maioria esmagadora das magias não puxa nada do inventário

### Mãos

- 2 slots. Arma de duas mãos ocupa os dois, escudo ocupa um
- Precisa de **1 mão livre** pra maioria das magias (gesto + alcance do foco usam a mesma mão)
- Vincula com container: pegar o escudo gasta ação → muda a mão → muda o que pode conjurar
- "Inventário" = soma dos containers, não só a mochila. A pergunta é **onde está o item**, não se tem:
  - equipado → conjura direto
  - cinto → ação bônus pra sacar
  - mochila → ação pra sacar
- ⚠️ Pela regra, pegar componente é parte da conjuração e não custa ação. Meu sistema é mais duro — house rule proposital, faz o cinto valer pro conjurador. **Avisar a mesa.**

### Princípio

- **Avisar, não bloquear.** "Você não tem mão livre" em vermelho, botão continua clicável. Vai ter exceção de classe, item mágico, ou eu simplesmente vou querer deixar passar.

## Buffs e debuffs

- Tipo único `Efeito`: condição do SRD, magia, item, e **improviso meu na hora**
- Campo de texto livre é obrigatório (metade do que rola na mesa é inventado)
- Duração é **texto**, não automação ("1 minuto", "concentração") — limpo na mão
- Flag `concentracao: true` → tela do mestre mostra quem tá concentrando em quê
- Descrição mora no celular, TV só mostra o ícone
- Passa pelo filtro de audiência — maldição oculta é `mestre` + `privado:personagem`
- Ícone v1: borda verde/vermelha + letra ou emoji. Arte depois.

## Implementação

- Servidor no notebook, rede local, sem hospedagem
- Node + TypeScript + Socket.IO + SQLite + React
- Três telas: `/mesa` (TV), `/jogador` (celular), `/mestre` (notebook)
- Comando → evento → broadcast → reducer
- Evento gravado append-only (log sai de graça)
- `reducer` roda no servidor e no cliente (mesmo arquivo em `shared/`)
- Filtro de audiência: `publico` / `privado:personagem` / `mestre`
- Reconexão: snapshot completo, depois só deltas
- Identidade no handshake, não no comando
- Dados do SRD 5.2.1 (2024) via Open5e v2 → seed local no SQLite
- Wake Lock API pra tela do celular não apagar
- Regra dura: nada no v1 pode ser ponto único de falha da sessão. Caiu, volta pro papel.

## Depois

- PWA / instalar como app (precisa HTTPS, chato em rede local)
- Catálogo de venda de NPC gerado automático (é gerador de conteúdo, não gerência de mesa)
- Importador de ficha
- Undo de evento
- Replay da sessão
- Mapa e tokens
- Magias fora do SRD (por enquanto na mão)
- Container dentro de container (bolsa de contenção)
- Motor de turno / duração automática de efeitos
- Controle de economia de ação (quem já usou bônus no turno)
- Arte de verdade pros ícones de efeito

## Descartado

- **Rolagem de dado dos jogadores no app** — o dado físico na mesa é o que mais importa num RPG. O app existe pra tirar burocracia do caminho, não pra substituir o momento de rolar. (Monstro do mestre rola automático: é burocracia atrás do biombo, não é o momento de ninguém.)
- **Modo "entrar no personagem" na UI** — o comando já faz isso e registra como mestre no log. Entrar pelo link dele mascara quem agiu e conflita com identidade no handshake.
