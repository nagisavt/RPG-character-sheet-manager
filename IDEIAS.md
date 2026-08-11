# RPG Mesa - Ideias

> **Este arquivo é backlog de ideias, não especificação.**
>
> - O v1 é **só** o que está marcado `[v1]`. Todo o resto é contexto futuro.
> - Itens em **Decisões fechadas** não precisam ser revisitados — foram discutidos e resolvidos.
> - Itens em **Em aberto** são onde o grill deve gastar tempo.
> - Nada sai de `[s2]`/`[s3]`/Depois pra `[v1]` antes da sessão 1 acontecer.

## Contexto

App de gerenciamento de mesa de D&D 5.5 (regras 2024) pra uso **presencial**, grupo joga a cada ~15 dias.
Servidor roda no notebook do mestre, rede local, sem hospedagem.

Três clientes no mesmo servidor:

- `/mesa` — TV no meio da mesa, só leitura, informação pública
- `/jogador` — celular, ficha privada, mobile-first
- `/mestre` — notebook, comandos, log, controle total

Prazo: primeira sessão em ~2 meses. Sessão de teste 1 mês antes.

---

## Decisões fechadas

*Não revisitar. Já discutido.*

### Arquitetura

- Monolito: um processo Node, um SQLite, um `npm run dev`. Sem Redis, sem fila, sem microserviço — são 5 pessoas numa sala.
- Node + TypeScript + Socket.IO + SQLite + React
- Fluxo único: **comando → decisor → evento → broadcast → reducer**
- `decisor(estado, comando) => evento[]` e `reducer(estado, evento) => estado` são **funções puras**, sem banco/socket/relógio
- `reducer` roda no servidor **e** no cliente, mesmo arquivo em `shared/` (é o motivo de TS nos dois lados)
- Estado vive em memória; SQLite guarda só o log **append-only**. Na subida: `eventos.reduce(reducer, inicial)`
- Filtro de audiência por evento: `publico` / `privado:personagem` / `mestre` — servidor projeta visão diferente por socket, não esconde no CSS
- Reconexão: snapshot completo filtrado, depois só deltas
- Identidade amarrada no **handshake** (`mesaId`, `personagem`, `pin`), nunca no conteúdo do comando
- Catálogo (magia/item/monstro do SRD) é read-only e **não** vira evento. Só estado da mesa entra no log.
- Dados do SRD 5.2.1 (2024, CC-BY) via Open5e v2 → seed local no SQLite, sem chamar API durante a sessão

### Estrutura de pastas

```
shared/    comandos.ts, eventos.ts, estado.ts, reducer.ts
server/    socket.ts, autorizacao.ts, decisor.ts, store.ts, audiencia.ts, catalogo/
web/       mesa/, jogador/, mestre/
```

### Produto

- **Regra dura:** nada no v1 pode ser ponto único de falha da sessão. Caiu, volta pro papel.
- **Este app não é um cadastrador de fichas.** Tela de CRUD de ficha está fora do escopo, agora e depois. A ficha é digitalizada à mão num arquivo versionado do repo.
- **Princípio: avisar, não bloquear.** "Você não tem mão livre" em vermelho, botão continua clicável.
- Servidor **informa** custo de ação, não policia economia de turno.
- **O app registra e exibe, nunca decide o que aconteceu.** Sem rolagem de dado pra ninguém, sem decidir acerto ou dano, sem efeito automático. Contabilidade que decorre de um fato já declarado é permitida, e a lista dela é fechada. Ver [ADR-0001](docs/adr/0001-o-app-registra-e-exibe-nunca-decide.md).
  - ~~Monstro do mestre rola automático~~ — derrubado. O mestre digita a iniciativa do monstro, como todo mundo.
  - Iniciativa do jogador: popup pra digitar **o resultado do dado**, app faz a soma. É a única aritmética que existe.
- Sem modo "entrar no personagem" na UI — o comando já faz e registra como mestre no log.

### House rules (avisar a mesa antes da sessão 1)

1. Acesso a container custa ação (mochila) / ação bônus (cinto). O livro dá 1 interação livre por turno.
2. Sobrecarga por peso (regra opcional do DMG, não padrão).
3. Componente material com custo segue a regra de container acima.

---

## Interface — tela do jogador

*Decisões fechadas. Detalhe visual sai do protótipo, não deste arquivo.*

### O que ela não é

**Não é uma ficha de D&D digitalizada.** É uma tela de inventário de videogame. Sem tabelas, sem planilha, sem formulário.

### Navegação: hub + modais

- **Hub**: personagem de corpo inteiro + vida atual. Só isso.
- Botões do hub abrem **modais**, e sempre volta pro hub:
  - Inventário
  - Magias
  - Bloco de notas
- No celular o modal ocupa a tela inteira; no notebook fica centralizado. **Mesma interface, um breakpoint** — não são dois apps.
- Quem tiver notebook usa notebook, quem não tiver usa o navegador do celular.

### Inventário

- **Abas dentro do modal**: Equipado / Mochila / Cinto
- **Equipado**: slots fixos estilo Diablo (luvas, botas, peito, etc.) sobre uma silhueta padrão
  - slots são **posições fixas na tela**, não coordenadas relativas ao desenho — anão e meio-elfo não podem mover slot de lugar
  - trocar a silhueta depois é trocar uma imagem de fundo, nada se mexe
- **Mochila**: lista (nome, peso, valor). A mochila em si é um item equipável, trocável por uma melhor.
- **Cinto**: lista curta, com os slots visíveis
- **Tocar no item abre o detalhe.** Sem hover — hover não existe no celular, e a interação tem que ser a mesma nos dois aparelhos.

### Assets e placeholders

- **Todo asset tem caminho e nome desde o dia 1**: `assets/personagens/thorin.png`, `assets/itens/mochila.png`, `assets/slots/luvas.png`
- O código **sempre** pede o arquivo. O que muda com o tempo é se aquele arquivo tem desenho ou é placeholder — nunca o código.
- Placeholder no protótipo: retângulo **preto** com rótulo em cinza claro. Fundo do app é escuro (mesa mal iluminada + visual de inventário de jogo), então quadrado branco vira lanterna na cara.
- Gerar os PNGs de placeholder de verdade e commitar — evita caminho quebrado e estado especial no código.
- Ícones: intenção é usar os do WoW. ⚠️ É Blizzard, não é livre. Pra uma mesa presencial de 5 amigos, tudo bem — se um dia virar produto ou portfólio público, é o primeiro problema. Plano B livre: game-icons.net (CC-BY).

### Cortado por consequência de design

- **Vida dos colegas na tela do jogador** — mora na TV. Se alguém pedir, a resposta é olhar pra mesa. Toda informação pública que sai do celular empurra o olhar de volta pro grupo.
- Como consequência, o hub tem 3 botões, não 4.

### Depois

- Sistema de troca de peças de armadura estilo WoW/Diablo (house rule própria) — mas modelar `equipado` como **mapa de slots** desde já, não como lista, senão vira refatoração

---

## [v1] Sessão 1

*O PRD é disso aqui e só disso.*

- Personagens da mesa (fichas carregadas na mão, sem importador)
- Vida: botões de toque, sem digitar
- Vida bônus: barra branca depois da barra de vida; dano consome ela primeiro
- Moedas (um número só, sem denominação)
- Tela de log do mestre: quem fez o quê e quando
- Comandos do mestre (`/dano thorin 12`)
- Trocar cena/background que todos veem
- Modo combate + ordem de iniciativa
- TV: cena, fila de iniciativa (só a ordem, sem marcar de quem é a vez), barras de vida, fonte grande
- **Ficha em modo leitura**: magias e itens com descrição, sem botão de conjurar
- Anotações pessoais
- Hub do jogador com placeholders de arte (silhueta com slots fica pra quando o sistema de armadura entrar)

Ficha só-leitura já resolve boa parte da confusão da mesa (ler o que a magia faz sem folhear livro) e custa quase nada de lógica.

---

## [s2] Inventário

- `Container { nome, capacidade, custoDeAcesso }` — não modelar "mochila" e "cinto" separado
  - mochila: limite por **peso**, acesso custa **ação**
  - cinto: limite por **slots** (3 no básico), acesso custa **ação bônus**
  - equipado ("na mão"): sem limite, acesso **livre**
- Container é item: tem peso, preço, pode ser comprado/trocado por um melhor
- Container dentro de container: **proibido** (vira recursão)
- Dois limites de naturezas diferentes:
  - `peso(container)` → **BLOQUEIA** (é volume)
  - `peso(personagem)` = containers + equipado + moedas → **SOBRECARREGA** (Força × 15, deixa passar)
- Contar o que não está em container: armadura vestida, arma na mão, escudo (placa = 65 lb)
- Moedas pesam: 50 moedas = 1 lb — é o que enche depois de limpar masmorra
- Loja generosa (mochilas de 60-80 lb) pro limite do corpo virar gargalo do personagem fraco
- `Sobrecarregado` é **derivado no reducer**, não é evento (é o único efeito automático)
- Banco: `peso` no **catálogo**; o que está na mochila é **instância** (item + qtd + container); peso carregado sempre **calculado**
- 50 flechas = 1 registro com `qtd: 50`

## [s2] Magias

- **Três listas, não uma**: conhecidas (grimório) / preparadas / slots
- `slots[circulo] = { total, gastos }` — contabilidade pura, maior ganho pelo menor esforço
- Botão de conjurar só nas preparadas; ao conjurar, escolher **em qual círculo** (senão perde upcast)
- Truque não gasta, ritual não gasta, bruxo tem pool separado (recarrega em descanso curto)

## [s3] Efeitos, conjuração e mãos

- Tipo único `Efeito`: condição do SRD, magia, item, e **improviso do mestre na hora**
  - campo de texto livre é obrigatório (metade do que rola na mesa é inventado)
  - duração é **texto**, não automação ("1 minuto", "concentração") — limpa na mão
  - flag `concentracao: true` → tela do mestre mostra quem concentra em quê
  - ícone no celular com descrição ao clicar; TV só mostra o ícone
  - passa pelo filtro de audiência (maldição oculta é `mestre` + `privado:personagem`)
  - ícone v1: borda verde/vermelha + letra ou emoji
- Mãos: 2 slots. Arma de duas mãos ocupa dois, escudo ocupa um. **1 mão livre** pra maioria das magias.
- Componentes:
  - material **sem custo em PO** → abstraído por foco/bolsa, **não existe no inventário**, app não checa
  - material **com custo em PO** → item real; se a descrição diz consumido, some ao conjurar
  - foco/bolsa não cobrem componente com custo, e são item **equipado** (na mochila não servem)
  - magia sem componente material ainda exige mão livre (gesto somático)
  - resultado prático: a maioria esmagadora das magias não puxa nada do inventário
- Conjurar desconta o slot e avisa se falta mão livre ou componente

---

## Depois

- PWA / instalar como app (precisa HTTPS, chato em rede local)
- Catálogo de venda de NPC gerado automático (é gerador de conteúdo, não gerência de mesa)
- Importador de ficha
- Undo de evento
- Replay da sessão
- Mapa e tokens
- Magias fora do SRD (por enquanto digitadas na mão)
- Motor de turno / duração automática de efeitos
- Controle de economia de ação
- Arte de verdade pros ícones de efeito

---

## Em aberto

*Aqui o grill deve gastar tempo.*

- Modelo de `Personagem`: quais campos ficam no estado da mesa e quais vêm do catálogo
- Formato exato do evento (campos comuns: id, tipo, autor, timestamp, audiência)
- Como o mestre autentica (PIN? nada, já que é rede local?)
- Fichas atuais dos jogadores: existem em algum formato digital ou é tudo papel?
- Uma mesa só ou o servidor precisa suportar várias campanhas?
- O que acontece com o log entre sessões (zera? acumula? marca sessão?)
- Tamanho de fonte da TV — decidir no protótipo, olhando de 2m
