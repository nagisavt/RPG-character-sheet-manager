// Dados da ficha. Futuramente isto vem das outras duas telas / de um banco.

export type SpellLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export type Spell = {
  id: string
  name: string
  level: SpellLevel
  school: string
  castingTime: string
  range: string
  components: string
  duration: string
  concentration?: boolean
  ritual?: boolean
  description: string
}

export type ItemType = 'arma' | 'armadura' | 'consumível' | 'ferramenta' | 'tesouro' | 'diverso'

export type Item = {
  id: string
  name: string
  type: ItemType
  qty: number
  weight: number
  description: string
  equipped?: boolean
}

export type Note = {
  id: string
  title: string
  body: string
  date: string
}

export type SlotTable = Record<number, { max: number }>

/** Slots de equipamento no palco, estilo Diablo. */
export type EquipSlotId =
  | 'cabeca'
  | 'amuleto'
  | 'peito'
  | 'bracadeira'
  | 'luvas'
  | 'anel'
  | 'perna'
  | 'botas'
  | 'mao-esquerda'
  | 'mao-direita'

export type Rarity = 'comum' | 'incomum' | 'raro' | 'lendário'

export type EquipItem = {
  id: string
  name: string
  rarity: Rarity
  /** Linhas curtas de bônus mostradas no detalhe do slot. */
  stats: string[]
  description: string
}

export type EquipSlotDef = {
  id: EquipSlotId
  label: string
  /** Coluna onde a moldura aparece ao redor do personagem. */
  column: 'left' | 'right' | 'weapon-left' | 'weapon-right'
}

export type Skill = {
  id: string
  name: string
  ability: 'FOR' | 'DES' | 'CON' | 'INT' | 'SAB' | 'CAR'
  proficient: boolean
  expertise?: boolean
}

export type FeatureSource = 'Raça' | 'Classe' | 'Subclasse' | 'Antecedente'

export type Feature = {
  id: string
  name: string
  source: FeatureSource
  /** Nível em que foi adquirida, quando aplicável. */
  level?: number
  /** Recurso limitado, quando a habilidade tem usos. */
  uses?: { current: number; max: number; reset: 'curto' | 'longo' }
  description: string
}

export const character = {
  name: 'Vaelin Sombraluz',
  class: 'Feiticiço',
  subclass: 'Linhagem Dracônica',
  level: 9,
  race: 'Meio-elfo',
  background: 'Sábio',
  ac: 15,
  initiative: 3,
  speed: 9,
  profBonus: 4,
  spellDc: 17,
  spellAttack: 9,
  hp: { current: 47, max: 62, temp: 0 },
  hitDice: { current: 6, max: 9, die: 'd6' },
  sorceryPoints: { current: 5, max: 9 },
  abilities: [
    { name: 'FOR', score: 8, mod: -1 },
    { name: 'DES', score: 16, mod: 3 },
    { name: 'CON', score: 14, mod: 2 },
    { name: 'INT', score: 13, mod: 1 },
    { name: 'SAB', score: 10, mod: 0 },
    { name: 'CAR', score: 20, mod: 5 },
  ],
}

// Espaços de magia por círculo (D&D 5e), feiticeiro nível 9.
// O "círculo 0" (truques) é ilimitado e não usa espaço.
export const slotTable: SlotTable = {
  1: { max: 4 },
  2: { max: 3 },
  3: { max: 3 },
  4: { max: 3 },
  5: { max: 1 },
  6: { max: 0 },
  7: { max: 0 },
  8: { max: 0 },
  9: { max: 0 },
}

export const initialUsedSlots: Record<number, number> = {
  1: 2,
  2: 1,
  3: 0,
  4: 0,
  5: 0,
  6: 0,
  7: 0,
  8: 0,
  9: 0,
}

export const ordinal = [
  'Truques',
  '1º Círculo',
  '2º Círculo',
  '3º Círculo',
  '4º Círculo',
  '5º Círculo',
  '6º Círculo',
  '7º Círculo',
  '8º Círculo',
  '9º Círculo',
] as const

export const spells: Spell[] = [
  {
    id: 'prestidigitacao',
    name: 'Prestidigitação',
    level: 0,
    school: 'Transmutação',
    castingTime: '1 ação',
    range: '3 m',
    components: 'V, G',
    duration: 'Até 1 hora',
    description:
      'Truque mágico menor. Você pode criar um efeito sensorial inofensivo, acender ou apagar uma vela, limpar ou sujar um objeto, esfriar ou esquentar até 0,5 kg de matéria, ou criar uma marca ou símbolo por 1 hora.',
  },
  {
    id: 'raio-de-fogo',
    name: 'Raio de Fogo',
    level: 0,
    school: 'Evocação',
    castingTime: '1 ação',
    range: '36 m',
    components: 'V, G',
    duration: 'Instantânea',
    description:
      'Você arremessa uma chama contra uma criatura ou objeto ao alcance. Faça um ataque de magia à distância. Se acertar, o alvo sofre 2d10 de dano de fogo. Objetos inflamáveis atingidos entram em combustão.',
  },
  {
    id: 'toque-arrepiante',
    name: 'Toque Arrepiante',
    level: 0,
    school: 'Necromancia',
    castingTime: '1 ação',
    range: '36 m',
    components: 'V, G',
    duration: '1 rodada',
    description:
      'Uma mão espectral atinge o alvo, causando 2d8 de dano necrótico. A criatura não pode recuperar pontos de vida até o início do seu próximo turno.',
  },
  {
    id: 'escudo-arcano',
    name: 'Escudo Arcano',
    level: 1,
    school: 'Abjuração',
    castingTime: '1 reação',
    range: 'Pessoal',
    components: 'V, G',
    duration: '1 rodada',
    description:
      'Uma barreira invisível de força mágica te protege. Você recebe +5 de bônus na CA, incluindo contra o ataque que disparou a reação, e recebe resistência contra Míssil Mágico.',
  },
  {
    id: 'missil-magico',
    name: 'Míssil Mágico',
    level: 1,
    school: 'Evocação',
    castingTime: '1 ação',
    range: '36 m',
    components: 'V, G',
    duration: 'Instantânea',
    description:
      'Você cria três dardos brilhantes de força mágica. Cada dardo atinge uma criatura à sua escolha que você possa ver, causando 1d4+1 de dano de energia. Em círculos superiores: mais um dardo por círculo acima do 1º.',
  },
  {
    id: 'absorver-elementos',
    name: 'Absorver Elementos',
    level: 1,
    school: 'Abjuração',
    castingTime: '1 reação',
    range: 'Pessoal',
    components: 'G',
    duration: '1 rodada',
    description:
      'A magia captura parte da energia elemental que chega, concedendo resistência ao tipo de dano até o início do seu próximo turno. No próximo ataque corpo a corpo, você causa 1d6 extra do mesmo tipo.',
  },
  {
    id: 'imagem-espelhada',
    name: 'Imagem Espelhada',
    level: 2,
    school: 'Ilusão',
    castingTime: '1 ação',
    range: 'Pessoal',
    components: 'V, G',
    duration: '1 minuto',
    description:
      'Três duplicatas ilusórias suas aparecem no seu espaço. Sempre que uma criatura te atinge, role um d20 para determinar se o ataque acerta uma duplicata em vez de você. A CA de cada duplicata é 10 + seu modificador de Destreza.',
  },
  {
    id: 'aumentar-reduzir',
    name: 'Aumentar/Reduzir',
    level: 2,
    school: 'Transmutação',
    castingTime: '1 ação',
    range: '9 m',
    components: 'V, G, M',
    duration: '1 minuto',
    concentration: true,
    description:
      'Você faz uma criatura ou objeto crescer ou encolher pela duração. Aumentar: tamanho dobra, +1d4 de dano, vantagem em testes de Força. Reduzir: tamanho pela metade, −1d4 de dano, desvantagem em testes de Força.',
  },
  {
    id: 'bola-de-fogo',
    name: 'Bola de Fogo',
    level: 3,
    school: 'Evocação',
    castingTime: '1 ação',
    range: '45 m',
    components: 'V, G, M',
    duration: 'Instantânea',
    description:
      'Um clarão surge de seu dedo em direção a um ponto escolhido, explodindo em chamas num raio de 6 m. Cada criatura na área faz um teste de resistência de Destreza, sofrendo 8d6 de dano de fogo, ou metade em caso de sucesso.',
  },
  {
    id: 'contramagia',
    name: 'Contramagia',
    level: 3,
    school: 'Abjuração',
    castingTime: '1 reação',
    range: '18 m',
    components: 'G',
    duration: 'Instantânea',
    description:
      'Você interrompe uma criatura no processo de conjurar uma magia. Se a magia for de 3º círculo ou inferior, ela falha. Se for superior, faça um teste de habilidade com sua característica de conjuração contra CD 10 + o círculo da magia.',
  },
  {
    id: 'voo',
    name: 'Voo',
    level: 3,
    school: 'Transmutação',
    castingTime: '1 ação',
    range: 'Toque',
    components: 'V, G, M',
    duration: '10 minutos',
    concentration: true,
    description:
      'A criatura tocada recebe deslocamento de voo de 18 m pela duração. Quando a magia acaba, o alvo cai se ainda estiver no ar, a não ser que possa impedir a queda.',
  },
  {
    id: 'porta-dimensional',
    name: 'Porta Dimensional',
    level: 4,
    school: 'Conjuração',
    castingTime: '1 ação',
    range: '150 m',
    components: 'V',
    duration: 'Instantânea',
    description:
      'Você se teletransporta instantaneamente para um local ao alcance, especificando a distância e direção. Você pode levar uma criatura voluntária de tamanho igual ou menor que carregue até a capacidade máxima.',
  },
  {
    id: 'muralha-de-fogo',
    name: 'Muralha de Fogo',
    level: 4,
    school: 'Evocação',
    castingTime: '1 ação',
    range: '36 m',
    components: 'V, G, M',
    duration: '1 minuto',
    concentration: true,
    description:
      'Você cria uma parede de fogo sobre uma superfície sólida ao alcance. Criaturas na área sofrem 5d8 de dano de fogo, metade com resistência de Destreza bem-sucedida. Um lado da parede causa dano a quem terminar o turno a 3 m dele.',
  },
  {
    id: 'cone-de-frio',
    name: 'Cone de Frio',
    level: 5,
    school: 'Evocação',
    castingTime: '1 ação',
    range: 'Cone de 18 m',
    components: 'V, G, M',
    duration: 'Instantânea',
    description:
      'Uma explosão de ar frio irrompe das suas mãos. Cada criatura na área faz um teste de resistência de Constituição, sofrendo 8d8 de dano de frio, ou metade em caso de sucesso. Criaturas mortas pela magia se transformam em estátuas de gelo.',
  },
  {
    id: 'telecinesia',
    name: 'Telecinesia',
    level: 5,
    school: 'Transmutação',
    castingTime: '1 ação',
    range: '18 m',
    components: 'V, G',
    duration: '10 minutos',
    concentration: true,
    description:
      'Você ganha a habilidade de mover ou manipular criaturas e objetos com o pensamento. A cada rodada você pode usar sua ação para tentar agarrar e mover uma criatura Enorme ou menor, ou mover um objeto de até 500 kg.',
  },
]

export const items: Item[] = [
  {
    id: 'adaga-runica',
    name: 'Adaga Rúnica',
    type: 'arma',
    qty: 1,
    weight: 0.5,
    equipped: true,
    description: 'Adaga +1. Dano 1d4+1 perfurante. Acesa, emite luz fraca em 3 m quando há magia por perto.',
  },
  {
    id: 'cajado-carvalho',
    name: 'Cajado de Carvalho Negro',
    type: 'arma',
    qty: 1,
    weight: 2,
    equipped: true,
    description: 'Foco arcano. Dano 1d6 de concussão. Pode ser usado como componente material para suas magias.',
  },
  {
    id: 'robes-viajante',
    name: 'Vestes do Viajante',
    type: 'armadura',
    qty: 1,
    weight: 4,
    equipped: true,
    description: 'CA 11 + Destreza. Costurada com fio de prata, resistente a intempéries.',
  },
  {
    id: 'pocao-cura',
    name: 'Poção de Cura',
    type: 'consumível',
    qty: 3,
    weight: 0.25,
    description: 'Recupera 2d4+2 pontos de vida quando bebida. Ação para usar.',
  },
  {
    id: 'pocao-maior',
    name: 'Poção de Cura Maior',
    type: 'consumível',
    qty: 1,
    weight: 0.25,
    description: 'Recupera 4d4+4 pontos de vida. Guardada para emergências.',
  },
  {
    id: 'pergaminho-identificar',
    name: 'Pergaminho de Identificação',
    type: 'consumível',
    qty: 2,
    weight: 0.1,
    description: 'Conjura Identificação sem gastar espaço de magia. Consumido no uso.',
  },
  {
    id: 'corda-seda',
    name: 'Corda de Seda (15 m)',
    type: 'ferramenta',
    qty: 1,
    weight: 2.5,
    description: 'Resistente e leve. Suporta até 900 kg.',
  },
  {
    id: 'kit-ladrao',
    name: 'Ferramentas de Ladrão',
    type: 'ferramenta',
    qty: 1,
    weight: 0.5,
    description: 'Limas, gazuas, espelho e tesoura. Requer proficiência.',
  },
  {
    id: 'tocha',
    name: 'Tocha',
    type: 'ferramenta',
    qty: 5,
    weight: 0.5,
    description: 'Queima por 1 hora, luz brilhante em 6 m e fraca por 6 m adicionais.',
  },
  {
    id: 'racoes',
    name: 'Rações de Viagem',
    type: 'consumível',
    qty: 7,
    weight: 1,
    description: 'Comida seca para um dia de viagem.',
  },
  {
    id: 'diario-arcano',
    name: 'Diário Arcano',
    type: 'diverso',
    qty: 1,
    weight: 1.5,
    description: 'Suas anotações de pesquisa. Metade das páginas está em cifra que só você entende.',
  },
  {
    id: 'amuleto-escama',
    name: 'Amuleto de Escama Dracônica',
    type: 'tesouro',
    qty: 1,
    weight: 0.2,
    equipped: true,
    description: 'Herança da sua linhagem. Aquece contra o peito quando há um dragão a menos de 1 km.',
  },
  {
    id: 'moedas',
    name: 'Peças de Ouro',
    type: 'tesouro',
    qty: 143,
    weight: 0.01,
    description: 'Bolsa de couro com moedas de várias cidades-estado.',
  },
]

export const notes: Note[] = [
  {
    id: 'n1',
    title: 'O contrato de Marrowgate',
    body: 'A guilda paga 500 po pela recuperação do selo. Prazo: até a lua cheia. Desconfio que o intermediário, Halric, esteja escondendo o verdadeiro cliente — ele evitou olhar para o amuleto.',
    date: '14º dia de Rethe',
  },
  {
    id: 'n2',
    title: 'A cripta sob a torre',
    body: 'Três portas de ferro, todas com o mesmo símbolo do meu amuleto. A do meio estava quente ao toque. NÃO abrir sem contramagia preparada.',
    date: '11º dia de Rethe',
  },
  {
    id: 'n3',
    title: 'Sobre a linhagem',
    body: 'A bibliotecária confirmou: Sombraluz não é nome de família, é um título dado a quem sobreviveu ao Sopro. Preciso encontrar os outros dois nomes na lista.',
    date: '3º dia de Rethe',
  },
  {
    id: 'n4',
    title: 'Aliados e dívidas',
    body: 'Devo um favor à Kessa (ela cobriu minha fuga em Aldenmoor). Thorn continua achando que sou um risco para o grupo — provavelmente está certo.',
    date: '28º dia de Ches',
  },
]

// ── Equipamento ──────────────────────────────────────────────
// A ordem define a posição das molduras ao redor do personagem.
export const equipSlots: EquipSlotDef[] = [
  { id: 'cabeca', label: 'Cabeça', column: 'left' },
  { id: 'amuleto', label: 'Amuleto', column: 'left' },
  { id: 'peito', label: 'Peito', column: 'left' },
  { id: 'bracadeira', label: 'Braçadeira', column: 'left' },
  { id: 'luvas', label: 'Luvas', column: 'right' },
  { id: 'anel', label: 'Anel', column: 'right' },
  { id: 'perna', label: 'Perna', column: 'right' },
  { id: 'botas', label: 'Pés', column: 'right' },
  { id: 'mao-esquerda', label: 'Mão Esquerda', column: 'weapon-left' },
  { id: 'mao-direita', label: 'Mão Direita', column: 'weapon-right' },
]

export const initialEquipment: Record<EquipSlotId, EquipItem | null> = {
  cabeca: {
    id: 'capuz-vidente',
    name: 'Capuz do Vidente',
    rarity: 'incomum',
    stats: ['+1 CD de magia', 'Vantagem contra ilusões'],
    description:
      'Capuz de linho escuro bordado com olhos fechados. Enquanto usado, você percebe quando uma ilusão tenta te enganar, embora não saiba de onde ela vem.',
  },
  amuleto: {
    id: 'amuleto-escama',
    name: 'Amuleto de Escama Dracônica',
    rarity: 'raro',
    stats: ['+1 CA', 'Resistência a fogo'],
    description:
      'Herança da sua linhagem. Aquece contra o peito quando há um dragão a menos de 1 km.',
  },
  peito: {
    id: 'robes-viajante',
    name: 'Vestes do Viajante',
    rarity: 'comum',
    stats: ['CA 11 + DES', 'Resistente a intempéries'],
    description:
      'Camadas de lã e couro costuradas com fio de prata. Secam sozinhas antes do amanhecer.',
  },
  bracadeira: {
    id: 'bracadeiras-selo',
    name: 'Braçadeiras do Selo Partido',
    rarity: 'incomum',
    stats: ['+1 em resistências de CON', 'Concentração: +2'],
    description:
      'Duas metades do mesmo selo, uma em cada braço. Vibram quando você mantém concentração sob dano.',
  },
  luvas: {
    id: 'luvas-tecelao',
    name: 'Luvas do Tecelão',
    rarity: 'incomum',
    stats: ['+1 ataque de magia', 'Componentes materiais livres'],
    description:
      'Dedos sem ponta, com fios de cobre costurados nas juntas. Dispensam componentes materiais baratos.',
  },
  anel: {
    id: 'anel-brasa',
    name: 'Anel de Brasa Contida',
    rarity: 'raro',
    stats: ['3 cargas', 'Gasta 1: +1d6 de fogo'],
    description:
      'Um carvão vivo suspenso no aro. Recupera todas as cargas ao amanhecer.',
  },
  perna: {
    id: 'calcas-couro',
    name: 'Grevas de Couro Batido',
    rarity: 'comum',
    stats: ['+0 CA', 'Sem penalidade de furtividade'],
    description: 'Reforço leve nas coxas e canelas. Não faz ruído ao caminhar.',
  },
  botas: {
    id: 'botas-passo',
    name: 'Botas do Passo Ligeiro',
    rarity: 'incomum',
    stats: ['+3 m de deslocamento', 'Ignora terreno difícil'],
    description:
      'A sola nunca encosta de verdade no chão. Deixa marcas um instante depois de você passar.',
  },
  'mao-esquerda': {
    id: 'adaga-runica',
    name: 'Adaga Rúnica',
    rarity: 'incomum',
    stats: ['1d4+1 perfurante', 'Acesa perto de magia'],
    description:
      'Adaga +1. Emite luz fraca em 3 m quando há magia ativa por perto.',
  },
  'mao-direita': {
    id: 'cajado-carvalho',
    name: 'Cajado de Carvalho Negro',
    rarity: 'raro',
    stats: ['Foco arcano', '1d6 concussão'],
    description:
      'Serve como componente material para todas as suas magias. A ponta guarda uma faísca que nunca apaga.',
  },
}

// ── Perícias (D&D 5e) ────────────────────────────────────────
export const skills: Skill[] = [
  { id: 'acrobacia', name: 'Acrobacia', ability: 'DES', proficient: false },
  { id: 'adestrar', name: 'Adestrar Animais', ability: 'SAB', proficient: false },
  { id: 'arcanismo', name: 'Arcanismo', ability: 'INT', proficient: true, expertise: true },
  { id: 'atletismo', name: 'Atletismo', ability: 'FOR', proficient: false },
  { id: 'atuacao', name: 'Atuação', ability: 'CAR', proficient: false },
  { id: 'enganacao', name: 'Enganação', ability: 'CAR', proficient: true },
  { id: 'furtividade', name: 'Furtividade', ability: 'DES', proficient: true },
  { id: 'historia', name: 'História', ability: 'INT', proficient: true },
  { id: 'intimidacao', name: 'Intimidação', ability: 'CAR', proficient: false },
  { id: 'intuicao', name: 'Intuição', ability: 'SAB', proficient: true },
  { id: 'investigacao', name: 'Investigação', ability: 'INT', proficient: false },
  { id: 'medicina', name: 'Medicina', ability: 'SAB', proficient: false },
  { id: 'natureza', name: 'Natureza', ability: 'INT', proficient: false },
  { id: 'percepcao', name: 'Percepção', ability: 'SAB', proficient: false },
  { id: 'persuasao', name: 'Persuasão', ability: 'CAR', proficient: true },
  { id: 'prestidigitacao', name: 'Prestidigitação', ability: 'DES', proficient: false },
  { id: 'religiao', name: 'Religião', ability: 'INT', proficient: false },
  { id: 'sobrevivencia', name: 'Sobrevivência', ability: 'SAB', proficient: false },
]

/** Resistências com proficiência — feiticeiro: CON e CAR. */
export const savingThrowProficiencies = ['CON', 'CAR'] as const

// ── Habilidades passivas ─────────────────────────────────────
export const features: Feature[] = [
  {
    id: 'visao-no-escuro',
    name: 'Visão no Escuro',
    source: 'Raça',
    description:
      'Você vê na penumbra a até 18 m como se fosse luz plena, e no escuro como se fosse penumbra. No escuro você não distingue cores, apenas tons de cinza.',
  },
  {
    id: 'ancestralidade-feerica',
    name: 'Ancestralidade Feérica',
    source: 'Raça',
    description:
      'Você tem vantagem em resistências contra ficar encantado, e magia não pode te colocar para dormir.',
  },
  {
    id: 'versatilidade',
    name: 'Versatilidade de Habilidades',
    source: 'Raça',
    description:
      'Você ganha proficiência em duas perícias à sua escolha. Aqui: Furtividade e Intuição.',
  },
  {
    id: 'feiticaria',
    name: 'Fonte de Magia',
    source: 'Classe',
    level: 2,
    uses: { current: 5, max: 9, reset: 'longo' },
    description:
      'Você tem uma reserva de pontos de feitiçaria. Pode gastá-los para criar espaços de magia, ou sacrificar espaços para recuperar pontos, uma vez por turno.',
  },
  {
    id: 'metamagia-sutil',
    name: 'Metamagia: Magia Sutil',
    source: 'Classe',
    level: 3,
    description:
      'Ao conjurar uma magia, gaste 1 ponto de feitiçaria para conjurá-la sem componentes verbais ou gestuais.',
  },
  {
    id: 'metamagia-acelerada',
    name: 'Metamagia: Magia Acelerada',
    source: 'Classe',
    level: 3,
    description:
      'Ao conjurar uma magia com tempo de 1 ação, gaste 2 pontos de feitiçaria para conjurá-la como ação bônus.',
  },
  {
    id: 'restauracao-arcana',
    name: 'Restauração Arcana',
    source: 'Classe',
    level: 5,
    uses: { current: 1, max: 1, reset: 'longo' },
    description:
      'Uma vez por descanso longo, recupere pontos de feitiçaria iguais a metade do seu nível de feiticeiro.',
  },
  {
    id: 'ancestral-draconico',
    name: 'Ancestral Dracônico',
    source: 'Subclasse',
    level: 1,
    description:
      'Escolha um tipo de dragão — fogo, no seu caso. Você fala Dracônico e tem vantagem em testes de Carisma ao interagir com dragões.',
  },
  {
    id: 'resiliencia-draconica',
    name: 'Resiliência Dracônica',
    source: 'Subclasse',
    level: 1,
    description:
      'Seu máximo de pontos de vida aumenta em 1 por nível de feiticeiro. Sem armadura, sua CA é 13 + modificador de Destreza.',
  },
  {
    id: 'afinidade-elemental',
    name: 'Afinidade Elemental',
    source: 'Subclasse',
    level: 6,
    description:
      'Some seu modificador de Carisma a uma rolagem de dano de fogo. Gaste 1 ponto de feitiçaria para ganhar resistência a fogo por 1 hora.',
  },
  {
    id: 'asas-draconicas',
    name: 'Asas Dracônicas',
    source: 'Subclasse',
    level: 14,
    description:
      'Trancada. No 14º nível, você brota asas e ganha deslocamento de voo igual ao seu deslocamento atual.',
  },
  {
    id: 'pesquisador',
    name: 'Pesquisador',
    source: 'Antecedente',
    description:
      'Quando você não sabe uma informação, costuma saber onde ou com quem obtê-la — uma biblioteca, um sábio, um arquivo trancado.',
  },
]
