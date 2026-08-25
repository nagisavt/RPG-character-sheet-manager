'use client'

import {
  CircleDot,
  Footprints,
  Gem,
  Hand,
  HardHat,
  PersonStanding,
  Plus,
  Shield,
  Shirt,
  Sword,
  Wand2,
  X,
} from 'lucide-react'
import type { EquipItem, EquipSlotDef, EquipSlotId, Rarity } from '@/lib/character-data'
import { cn } from '@/lib/utils'

const slotIcon: Record<EquipSlotId, React.ElementType> = {
  cabeca: HardHat,
  amuleto: Gem,
  peito: Shirt,
  bracadeira: Shield,
  luvas: Hand,
  anel: CircleDot,
  perna: PersonStanding,
  botas: Footprints,
  'mao-esquerda': Sword,
  'mao-direita': Wand2,
}

/** Cores de raridade restritas à paleta do tema. */
const rarityRing: Record<Rarity, string> = {
  comum: 'border-muted-foreground/40 text-muted-foreground',
  incomum: 'border-foreground/45 text-foreground',
  raro: 'border-arcane/60 text-arcane',
  lendário: 'border-primary/70 text-primary',
}

const rarityText: Record<Rarity, string> = {
  comum: 'text-muted-foreground',
  incomum: 'text-foreground',
  raro: 'text-arcane',
  lendário: 'text-primary',
}

const rarityGlow: Record<Rarity, string> = {
  comum: '',
  incomum: '',
  raro: 'shadow-[0_0_12px_oklch(0.72_0.115_205_/_0.35)]',
  lendário: 'shadow-[0_0_14px_oklch(0.76_0.1_85_/_0.4)]',
}

type Props = {
  active: boolean
  slots: EquipSlotDef[]
  equipment: Record<EquipSlotId, EquipItem | null>
  selected: EquipSlotId | null
  onSelect: (id: EquipSlotId | null) => void
  onUnequip: (id: EquipSlotId) => void
}

export function EquipmentOverlay({
  active,
  slots,
  equipment,
  selected,
  onSelect,
  onUnequip,
}: Props) {
  const left = slots.filter((s) => s.column === 'left')
  const right = slots.filter((s) => s.column === 'right')
  const weaponLeft = slots.find((s) => s.column === 'weapon-left')
  const weaponRight = slots.find((s) => s.column === 'weapon-right')

  const selectedDef = selected ? slots.find((s) => s.id === selected) : null
  const selectedItem = selected ? equipment[selected] : null

  return (
    <div
      className={cn(
        'absolute inset-0 z-30 transition-opacity duration-300',
        active ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
      inert={!active}
    >
      {/* escurece o palco para as molduras ganharem contraste */}
      <div
        aria-hidden
        className="absolute inset-0 bg-background/45 backdrop-blur-[1px]"
      />

      <div
        role="group"
        aria-label="Slots de equipamento"
        className="absolute inset-0"
      >
        {/* coluna esquerda — depois da alça da mochila */}
        <div className="absolute left-8 top-3 flex flex-col gap-2">
          {left.map((slot, i) => (
            <Slot
              key={slot.id}
              def={slot}
              item={equipment[slot.id]}
              selected={selected === slot.id}
              onSelect={onSelect}
              delay={i * 45}
              active={active}
            />
          ))}
        </div>

        {/* coluna direita */}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          {right.map((slot, i) => (
            <Slot
              key={slot.id}
              def={slot}
              item={equipment[slot.id]}
              selected={selected === slot.id}
              onSelect={onSelect}
              delay={i * 45}
              active={active}
            />
          ))}
        </div>

        {/* armas nos cantos inferiores, como no Diablo */}
        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between">
          {weaponLeft ? (
            <Slot
              def={weaponLeft}
              item={equipment[weaponLeft.id]}
              selected={selected === weaponLeft.id}
              onSelect={onSelect}
              delay={200}
              active={active}
              large
            />
          ) : null}
          {weaponRight ? (
            <Slot
              def={weaponRight}
              item={equipment[weaponRight.id]}
              selected={selected === weaponRight.id}
              onSelect={onSelect}
              delay={240}
              active={active}
              large
            />
          ) : null}
        </div>
      </div>

      {/* detalhe do slot escolhido */}
      <div
        className={cn(
          'absolute inset-x-4 bottom-24 transition-all duration-200',
          selected
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-2 opacity-0',
        )}
        inert={!selected}
      >
        {selectedDef ? (
          <div className="rounded-sm border border-primary/40 bg-card/95 p-3 shadow-xl backdrop-blur">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="engraved font-serif text-[9px] font-bold tracking-[0.18em] uppercase text-muted-foreground">
                  {selectedDef.label}
                </p>
                <p
                  className={cn(
                    'truncate font-serif text-sm font-bold',
                    selectedItem
                      ? rarityText[selectedItem.rarity]
                      : 'text-muted-foreground',
                  )}
                >
                  {selectedItem ? selectedItem.name : 'Slot vazio'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelect(null)}
                aria-label="Fechar detalhe do slot"
                className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-primary/30 text-primary active:bg-primary/20"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {selectedItem ? (
              <>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedItem.stats.map((s) => (
                    <span
                      key={s}
                      className="rounded-sm border border-arcane/35 bg-arcane/10 px-1.5 py-0.5 text-[10px] font-medium text-arcane"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  {selectedItem.description}
                </p>
                <button
                  type="button"
                  onClick={() => onUnequip(selectedDef.id)}
                  className="mt-2.5 w-full rounded-sm border border-hp/40 py-1.5 font-serif text-[10px] font-bold tracking-[0.14em] uppercase text-hp active:bg-hp/15"
                >
                  Desequipar
                </button>
              </>
            ) : (
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                Nada equipado aqui. Abra a mochila para escolher um item para
                este slot.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Slot({
  def,
  item,
  selected,
  onSelect,
  delay,
  active,
  large,
}: {
  def: EquipSlotDef
  item: EquipItem | null
  selected: boolean
  onSelect: (id: EquipSlotId | null) => void
  delay: number
  active: boolean
  large?: boolean
}) {
  const Icon = slotIcon[def.id]
  const filled = item !== null

  return (
    <button
      type="button"
      onClick={() => onSelect(selected ? null : def.id)}
      aria-label={`${def.label}: ${item ? item.name : 'vazio'}`}
      aria-pressed={selected}
      style={{ transitionDelay: active ? `${delay}ms` : '0ms' }}
      className={cn(
        'group relative flex shrink-0 items-center justify-center rounded-sm border-2 bg-card/85 transition-all duration-300',
        large ? 'size-14' : 'size-12',
        active ? 'scale-100 opacity-100' : 'scale-90 opacity-0',
        filled
          ? cn(rarityRing[item.rarity], rarityGlow[item.rarity])
          : 'border-dashed border-muted-foreground/30 text-muted-foreground/40',
        selected && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
      )}
    >
      {/* cantos gravados, referência à moldura em losango */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[3px] rotate-45 border border-current opacity-20"
      />
      {filled ? (
        <Icon className={large ? 'size-6' : 'size-5'} />
      ) : (
        <Plus className="size-4" />
      )}
      <span className="engraved absolute -bottom-[7px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-background px-1 font-serif text-[7.5px] font-bold tracking-[0.1em] uppercase text-muted-foreground">
        {def.label}
      </span>
    </button>
  )
}
