'use client'

import {
  BookMarked,
  Moon,
  ScrollText,
  Shield,
  Sparkles,
  Star,
  Target,
} from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  character,
  equipSlots,
  features,
  initialEquipment,
  initialUsedSlots,
  items as initialItems,
  notes,
  skills,
  slotTable,
  spells,
  type EquipItem,
  type EquipSlotId,
  type Spell,
} from '@/lib/character-data'
import { cn } from '@/lib/utils'
import { BackpackPanel } from './backpack-panel'
import { EdgeTab } from './edge-tab'
import { EquipmentOverlay } from './equipment-overlay'
import { FeaturesPanel } from './features-panel'
import { NotesPanel } from './notes-panel'
import { SkillsPanel } from './skills-panel'
import { SpellSlots } from './spell-slots'
import { SpellbookPanel } from './spellbook-panel'
import { Vitals } from './vitals'

type PanelId = 'mochila' | 'grimorio' | 'notas' | 'pericias' | 'habilidades' | null

const defaultPrepared = [
  'escudo-arcano',
  'missil-magico',
  'imagem-espelhada',
  'bola-de-fogo',
  'contramagia',
  'muralha-de-fogo',
  'cone-de-frio',
]

export function CharacterScreen() {
  const [panel, setPanel] = useState<PanelId>(null)
  const [hp, setHp] = useState(character.hp.current)
  const [tempHp] = useState(character.hp.temp)
  const [sorcery, setSorcery] = useState(character.sorceryPoints.current)
  const [usedSlots, setUsedSlots] = useState<Record<number, number>>(initialUsedSlots)
  const [prepared, setPrepared] = useState<string[]>(defaultPrepared)
  const [items, setItems] = useState(initialItems)
  const [flash, setFlash] = useState<string | null>(null)
  const [glow, setGlow] = useState(false)

  // Modo equipar: o botão Inventário "acende" e revela os slots ao redor.
  const [equipMode, setEquipMode] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<EquipSlotId | null>(null)
  const [equipment, setEquipment] =
    useState<Record<EquipSlotId, EquipItem | null>>(initialEquipment)

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), 2600)
    return () => clearTimeout(t)
  }, [flash])

  useEffect(() => {
    if (!glow) return
    const t = setTimeout(() => setGlow(false), 900)
    return () => clearTimeout(t)
  }, [glow])

  const closePanel = useCallback(() => setPanel(null), [])

  const toggleEquipMode = useCallback(() => {
    setEquipMode((v) => {
      if (v) setSelectedSlot(null)
      return !v
    })
  }, [])

  const openPanel = useCallback((id: PanelId) => {
    setSelectedSlot(null)
    setPanel(id)
  }, [])

  const unequip = useCallback((id: EquipSlotId) => {
    setEquipment((prev) => {
      const removed = prev[id]
      if (removed) setFlash(`${removed.name} desequipado`)
      return { ...prev, [id]: null }
    })
    setSelectedSlot(null)
  }, [])

  /** Menor círculo disponível capaz de conjurar uma magia daquele nível. */
  const castCircleFor = useCallback(
    (level: number) => {
      for (let l = level; l <= 9; l++) {
        const max = slotTable[l]?.max ?? 0
        if (max - (usedSlots[l] ?? 0) > 0) return l
      }
      return null
    },
    [usedSlots],
  )

  const handleCast = useCallback(
    (spell: Spell) => {
      if (spell.level === 0) {
        setFlash(`${spell.name} conjurada — truque, nenhum espaço gasto`)
        setGlow(true)
        return
      }
      const circle = castCircleFor(spell.level)
      if (circle === null) return
      setUsedSlots((prev) => ({ ...prev, [circle]: (prev[circle] ?? 0) + 1 }))
      setFlash(
        circle > spell.level
          ? `${spell.name} ampliada no ${circle}º círculo — 1 espaço gasto`
          : `${spell.name} conjurada — 1 espaço do ${circle}º círculo gasto`,
      )
      setGlow(true)
    },
    [castCircleFor],
  )

  const toggleSlot = useCallback((level: number, index: number) => {
    setUsedSlots((prev) => {
      const spent = prev[level] ?? 0
      // Marcar um pip: gasta até ele; desmarcar: libera dele em diante.
      const next = index < spent ? index : index + 1
      return { ...prev, [level]: next }
    })
  }, [])

  const longRest = useCallback(() => {
    setUsedSlots({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 })
    setHp(character.hp.max)
    setSorcery(character.sorceryPoints.max)
    setFlash('Descanso longo — vida, feitiçaria e círculos restaurados')
  }, [])

  const togglePrepared = useCallback((id: string) => {
    setPrepared((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    )
  }, [])

  const changeQty = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i,
      ),
    )
  }, [])

  const freeSlots = useMemo(
    () =>
      [1, 2, 3, 4, 5, 6, 7, 8, 9].reduce(
        (acc, l) => acc + ((slotTable[l]?.max ?? 0) - (usedSlots[l] ?? 0)),
        0,
      ),
    [usedSlots],
  )

  const equippedCount = useMemo(
    () => Object.values(equipment).filter(Boolean).length,
    [equipment],
  )

  return (
    <main className="relative flex h-dvh w-full flex-col overflow-hidden bg-background">
      {/* textura de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 38%, oklch(0.28 0.04 250) 0%, transparent 62%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, oklch(1 0 0) 0 1px, transparent 1px 3px)',
        }}
      />

      {/* ── Cabeçalho ── */}
      <header className="relative z-10 flex items-center gap-3 border-b border-primary/25 px-3 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-sm border border-primary/40 bg-primary/10">
          <span className="font-serif text-base font-bold text-primary tabular-nums">
            {character.level}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="engraved truncate font-serif text-base font-bold tracking-[0.06em] text-primary">
            {character.name}
          </h1>
          <p className="truncate text-[11px] tracking-wide text-muted-foreground">
            {character.race} · {character.class} — {character.subclass}
          </p>
        </div>
        <button
          type="button"
          onClick={longRest}
          aria-label="Descanso longo"
          className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-primary/35 text-primary transition-colors active:bg-primary/20"
        >
          <Moon className="size-4" />
        </button>
      </header>

      {/* ── Vitalidade ── */}
      <div className="relative z-10 pt-2.5">
        <Vitals
          hp={hp}
          maxHp={character.hp.max}
          tempHp={tempHp}
          onDamage={() => setHp((v) => Math.max(0, v - 1))}
          onHeal={() => setHp((v) => Math.min(character.hp.max, v + 1))}
          sorcery={sorcery}
          maxSorcery={character.sorceryPoints.max}
        />
      </div>

      {/* ── Palco do personagem ── */}
      <div className="relative z-10 min-h-0 flex-1 overflow-hidden">
        {/* moldura */}
        <div className="pointer-events-none absolute inset-x-3 inset-y-2 rounded-sm border border-primary/15" />

        {/* única alça lateral: a mochila */}
        <EdgeTab
          side="left"
          label="Mochila"
          onClick={() => openPanel('mochila')}
          offset="50%"
        />

        {/* aviso de conjuração / equipamento */}
        <div
          className={cn(
            'pointer-events-none absolute inset-x-6 top-2 z-40 transition-all duration-300',
            flash ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0',
          )}
        >
          <p className="flex items-center justify-center gap-2 rounded-sm border border-arcane/40 bg-card/95 px-3 py-2 text-center text-[11px] leading-tight text-arcane backdrop-blur">
            <Sparkles className="size-3.5 shrink-0" />
            {flash ?? ''}
          </p>
        </div>

        {/* círculo arcano sob os pés */}
        <div
          aria-hidden
          className={cn(
            'absolute bottom-[20%] left-1/2 h-8 w-40 -translate-x-1/2 rounded-[50%] border border-arcane/30 transition-all duration-700',
            glow ? 'opacity-100' : 'opacity-40',
          )}
          style={{
            background:
              'radial-gradient(ellipse at center, oklch(0.72 0.115 205 / 0.28) 0%, transparent 70%)',
            boxShadow: glow ? '0 0 40px oklch(0.72 0.115 205 / 0.45)' : undefined,
          }}
        />

        <div className="pointer-events-none relative flex h-full items-center justify-center px-10 pb-[4%]">
          <Image
            src="/character-full-body.png"
            alt={`Retrato de corpo inteiro de ${character.name}, ${character.class} ${character.race}`}
            width={600}
            height={900}
            priority
            className={cn(
              'h-full w-auto object-contain transition-all duration-500',
              equipMode ? 'scale-[1.02]' : 'scale-[1.22]',
              glow
                ? 'drop-shadow-[0_0_26px_oklch(0.72_0.115_205_/_0.55)]'
                : 'drop-shadow-[0_8px_20px_oklch(0_0_0_/_0.5)]',
            )}
            style={{
              mixBlendMode: 'screen',
              maskImage:
                'radial-gradient(ellipse 62% 66% at 50% 48%, oklch(0 0 0) 58%, transparent 100%)',
              WebkitMaskImage:
                'radial-gradient(ellipse 62% 66% at 50% 48%, oklch(0 0 0) 58%, transparent 100%)',
            }}
          />
        </div>

        {/* ── Slots de equipamento ── */}
        <EquipmentOverlay
          active={equipMode}
          slots={equipSlots}
          equipment={equipment}
          selected={selectedSlot}
          onSelect={setSelectedSlot}
          onUnequip={unequip}
        />
      </div>

      {/* ── Círculos de magia ── */}
      <div className="relative z-10 border-t border-primary/20 pt-2.5">
        <SpellSlots table={slotTable} used={usedSlots} onToggle={toggleSlot} />
      </div>

      {/* ── Barra de ações ── */}
      <nav
        aria-label="Ações"
        className="relative z-10 grid grid-cols-5 gap-1 border-t border-primary/25 bg-secondary/25 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5"
      >
        <ActionButton
          icon={<Shield className="size-[18px]" />}
          label="Inventário"
          onClick={toggleEquipMode}
          on={equipMode}
          badge={equipMode ? equippedCount : undefined}
        />
        <ActionButton
          icon={<BookMarked className="size-[18px]" />}
          label="Magia"
          badge={freeSlots}
          onClick={() => openPanel('grimorio')}
        />
        <ActionButton
          icon={<Target className="size-[18px]" />}
          label="Perícias"
          onClick={() => openPanel('pericias')}
        />
        <ActionButton
          icon={<Star className="size-[18px]" />}
          label="Habilidades"
          onClick={() => openPanel('habilidades')}
        />
        <ActionButton
          icon={<ScrollText className="size-[18px]" />}
          label="Notas"
          onClick={() => openPanel('notas')}
        />
      </nav>

      {/* ── Gavetas ── */}
      <BackpackPanel
        open={panel === 'mochila'}
        onClose={closePanel}
        items={items}
        onChangeQty={changeQty}
      />
      <SpellbookPanel
        open={panel === 'grimorio'}
        onClose={closePanel}
        spells={spells}
        prepared={prepared}
        onTogglePrepared={togglePrepared}
        table={slotTable}
        used={usedSlots}
        onCast={handleCast}
        castCircleFor={castCircleFor}
      />
      <SkillsPanel
        open={panel === 'pericias'}
        onClose={closePanel}
        skills={skills}
        profBonus={character.profBonus}
      />
      <FeaturesPanel
        open={panel === 'habilidades'}
        onClose={closePanel}
        features={features}
      />
      <NotesPanel open={panel === 'notas'} onClose={closePanel} notes={notes} />
    </main>
  )
}

function ActionButton({
  icon,
  label,
  onClick,
  badge,
  on,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  badge?: number
  /** Botão de alternância aceso (usado pelo Inventário). */
  on?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        'relative flex flex-col items-center gap-1 rounded-sm border px-0.5 py-2 transition-all active:scale-[0.97]',
        on
          ? 'border-primary bg-primary/25 text-primary shadow-[0_0_14px_oklch(0.76_0.1_85_/_0.3)]'
          : 'border-primary/35 bg-card/70 text-primary active:bg-primary/20',
      )}
    >
      {icon}
      <span className="engraved max-w-full truncate font-serif text-[8px] font-bold tracking-[0.04em] uppercase">
        {label}
      </span>
      {badge !== undefined && badge > 0 ? (
        <span className="absolute -top-1.5 right-0.5 flex min-w-4 items-center justify-center rounded-full border border-arcane bg-background px-1 text-[9px] font-bold tabular-nums text-arcane">
          {badge}
        </span>
      ) : null}
    </button>
  )
}
