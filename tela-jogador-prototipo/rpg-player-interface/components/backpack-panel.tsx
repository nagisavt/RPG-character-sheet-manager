'use client'

import {
  Backpack,
  ChevronDown,
  FlaskConical,
  Gem,
  Minus,
  Package,
  Plus,
  Shield,
  Swords,
  Wrench,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Item, ItemType } from '@/lib/character-data'
import { cn } from '@/lib/utils'
import { SideDrawer } from './side-drawer'

const typeIcon: Record<ItemType, React.ElementType> = {
  arma: Swords,
  armadura: Shield,
  consumível: FlaskConical,
  ferramenta: Wrench,
  tesouro: Gem,
  diverso: Package,
}

const filters: Array<{ key: 'todos' | ItemType; label: string }> = [
  { key: 'todos', label: 'Tudo' },
  { key: 'arma', label: 'Armas' },
  { key: 'armadura', label: 'Armaduras' },
  { key: 'consumível', label: 'Consumíveis' },
  { key: 'ferramenta', label: 'Ferramentas' },
  { key: 'tesouro', label: 'Tesouros' },
  { key: 'diverso', label: 'Diversos' },
]

type BackpackPanelProps = {
  open: boolean
  onClose: () => void
  items: Item[]
  onChangeQty: (id: string, delta: number) => void
}

export function BackpackPanel({
  open,
  onClose,
  items,
  onChangeQty,
}: BackpackPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'todos' | ItemType>('todos')

  const visible = useMemo(
    () => (filter === 'todos' ? items : items.filter((i) => i.type === filter)),
    [items, filter],
  )

  const totalWeight = items.reduce((acc, i) => acc + i.weight * i.qty, 0)
  const capacity = 60

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      side="left"
      title="Mochila"
      subtitle={`${items.length} tipos de item · ${totalWeight.toFixed(1)} kg`}
      icon={<Backpack className="size-5" />}
      footer={
        <div>
          <div className="mb-1 flex items-center justify-between text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            <span>Carga</span>
            <span className="tabular-nums text-primary">
              {totalWeight.toFixed(1)} / {capacity} kg
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-sm border border-primary/25 bg-background">
            <div
              className="h-full bg-primary transition-[width] duration-500"
              style={{
                width: `${Math.min(100, (totalWeight / capacity) * 100)}%`,
              }}
            />
          </div>
        </div>
      }
    >
      <div className="panel-scroll sticky top-0 z-10 flex gap-1.5 overflow-x-auto border-b border-primary/20 bg-card/95 px-3 py-2.5 backdrop-blur">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={cn(
              'shrink-0 rounded-sm border px-2.5 py-1 font-serif text-[10px] font-bold tracking-[0.1em] uppercase transition-colors',
              filter === f.key
                ? 'border-primary bg-primary/20 text-primary'
                : 'border-primary/25 text-muted-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul>
        {visible.map((item) => {
          const Icon = typeIcon[item.type]
          const isOpen = expanded === item.id
          return (
            <li key={item.id} className="border-b border-primary/10">
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors active:bg-primary/5"
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-sm border',
                    item.equipped
                      ? 'border-primary/60 bg-primary/15 text-primary'
                      : 'border-primary/20 bg-secondary/50 text-muted-foreground',
                  )}
                >
                  <Icon className="size-4" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate font-serif text-sm font-semibold text-foreground">
                      {item.name}
                    </span>
                    {item.equipped ? (
                      <span className="shrink-0 rounded-[2px] border border-primary/40 px-1 text-[9px] font-bold tracking-wide text-primary uppercase">
                        Equip
                      </span>
                    ) : null}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    <span className="capitalize">{item.type}</span> ·{' '}
                    {(item.weight * item.qty).toFixed(2)} kg
                  </span>
                </span>

                <span className="shrink-0 font-serif text-sm font-bold tabular-nums text-primary">
                  ×{item.qty}
                </span>
                <ChevronDown
                  className={cn(
                    'size-3.5 shrink-0 text-muted-foreground transition-transform',
                    isOpen && 'rotate-180',
                  )}
                />
              </button>

              <div
                className={cn(
                  'grid transition-[grid-template-rows] duration-300 ease-out',
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
              >
                <div className="overflow-hidden" inert={!isOpen}>
                  <div className="border-t border-primary/10 bg-background/50 px-3 py-3">
                    <p className="mb-3 text-[12.5px] leading-relaxed text-foreground/85">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                        Quantidade
                      </span>
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onChangeQty(item.id, -1)}
                          aria-label={`Remover uma unidade de ${item.name}`}
                          className="flex size-8 items-center justify-center rounded-sm border border-primary/35 text-primary active:bg-primary/20"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-10 text-center font-serif text-sm font-bold tabular-nums text-foreground">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onChangeQty(item.id, 1)}
                          aria-label={`Adicionar uma unidade de ${item.name}`}
                          className="flex size-8 items-center justify-center rounded-sm border border-primary/35 text-primary active:bg-primary/20"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {visible.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          Nada nesta categoria.
        </p>
      ) : null}
    </SideDrawer>
  )
}
