'use client'

import { BookMarked, Check, ChevronDown, Search, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ordinal, type SlotTable, type Spell } from '@/lib/character-data'
import { cn } from '@/lib/utils'
import { SideDrawer } from './side-drawer'

type SpellbookPanelProps = {
  open: boolean
  onClose: () => void
  spells: Spell[]
  prepared: string[]
  onTogglePrepared: (id: string) => void
  table: SlotTable
  used: Record<number, number>
  onCast: (spell: Spell) => void
  castCircleFor: (level: number) => number | null
}

export function SpellbookPanel({
  open,
  onClose,
  spells,
  prepared,
  onTogglePrepared,
  table,
  used,
  onCast,
  castCircleFor,
}: SpellbookPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [onlyPrepared, setOnlyPrepared] = useState(false)

  const grouped = useMemo(() => {
    const filtered = spells.filter((s) => {
      if (onlyPrepared && s.level !== 0 && !prepared.includes(s.id)) return false
      if (!query.trim()) return true
      return s.name.toLowerCase().includes(query.trim().toLowerCase())
    })
    const map = new Map<number, Spell[]>()
    for (const s of filtered) {
      const list = map.get(s.level) ?? []
      list.push(s)
      map.set(s.level, list)
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [spells, prepared, onlyPrepared, query])

  const totalFree = [1, 2, 3, 4, 5, 6, 7, 8, 9].reduce(
    (acc, l) => acc + ((table[l]?.max ?? 0) - (used[l] ?? 0)),
    0,
  )

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      side="right"
      title="Grimório"
      subtitle={`${prepared.length} magias preparadas · ${totalFree} espaços livres`}
      icon={<BookMarked className="size-5" />}
    >
      <div className="sticky top-0 z-10 border-b border-primary/20 bg-card/95 px-3 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-sm border border-primary/25 bg-secondary/50 px-2.5 py-1.5">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar magia"
              aria-label="Buscar magia"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
            />
          </div>
          <button
            type="button"
            onClick={() => setOnlyPrepared((v) => !v)}
            aria-pressed={onlyPrepared}
            className={cn(
              'shrink-0 rounded-sm border px-2.5 py-1.5 font-serif text-[10px] font-bold tracking-[0.1em] uppercase transition-colors',
              onlyPrepared
                ? 'border-primary bg-primary/20 text-primary'
                : 'border-primary/25 text-muted-foreground',
            )}
          >
            Preparadas
          </button>
        </div>
      </div>

      <ul className="divide-y divide-primary/10">
        {grouped.map(([level, list]) => (
          <li key={level}>
            <div className="flex items-center gap-2 bg-secondary/30 px-3 py-1.5">
              <span
                className={cn(
                  'engraved font-serif text-[11px] font-bold tracking-[0.16em] uppercase',
                  level === 0 ? 'text-arcane' : 'text-primary',
                )}
              >
                {ordinal[level]}
              </span>
              <span className="h-px flex-1 bg-primary/15" />
              {level > 0 ? (
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {(table[level]?.max ?? 0) - (used[level] ?? 0)}/{table[level]?.max ?? 0}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground">à vontade</span>
              )}
            </div>

            <ul>
              {list.map((spell) => {
                const isOpen = expanded === spell.id
                const isPrepared = spell.level === 0 || prepared.includes(spell.id)
                const circle = spell.level === 0 ? 0 : castCircleFor(spell.level)
                const canCast = circle !== null && isPrepared
                const upcast = circle !== null && circle > spell.level

                return (
                  <li key={spell.id} className="border-b border-primary/10 last:border-0">
                    <div className="flex items-stretch">
                      <button
                        type="button"
                        onClick={() => onTogglePrepared(spell.id)}
                        disabled={spell.level === 0}
                        aria-label={`${isPrepared ? 'Despreparar' : 'Preparar'} ${spell.name}`}
                        aria-pressed={isPrepared}
                        className={cn(
                          'flex w-10 shrink-0 items-center justify-center border-r border-primary/10 transition-colors',
                          isPrepared ? 'text-arcane' : 'text-muted-foreground/40',
                          spell.level === 0 && 'opacity-60',
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-5 items-center justify-center rounded-full border',
                            isPrepared
                              ? 'border-arcane bg-arcane/20'
                              : 'border-muted-foreground/40',
                          )}
                        >
                          {isPrepared ? <Check className="size-3" /> : null}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : spell.id)}
                        aria-expanded={isOpen}
                        className="min-w-0 flex-1 px-3 py-2.5 text-left transition-colors active:bg-primary/5"
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'truncate font-serif text-sm font-semibold',
                              isPrepared ? 'text-foreground' : 'text-muted-foreground',
                            )}
                          >
                            {spell.name}
                          </span>
                          {spell.concentration ? (
                            <span className="shrink-0 rounded-[2px] border border-arcane/40 px-1 text-[9px] font-bold text-arcane">
                              C
                            </span>
                          ) : null}
                          <ChevronDown
                            className={cn(
                              'ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform',
                              isOpen && 'rotate-180',
                            )}
                          />
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {spell.school} · {spell.castingTime} · {spell.range}
                        </p>
                      </button>
                    </div>

                    <div
                      className={cn(
                        'grid transition-[grid-template-rows] duration-300 ease-out',
                        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                      )}
                    >
                      <div className="overflow-hidden" inert={!isOpen}>
                        <div className="border-t border-primary/10 bg-background/50 px-3 py-3">
                          <dl className="mb-2.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                            <Meta label="Componentes" value={spell.components} />
                            <Meta label="Duração" value={spell.duration} />
                          </dl>
                          <p className="mb-3 text-[12.5px] leading-relaxed text-foreground/85">
                            {spell.description}
                          </p>

                          <button
                            type="button"
                            onClick={() => onCast(spell)}
                            disabled={!canCast}
                            className={cn(
                              'flex w-full items-center justify-center gap-2 rounded-sm border py-2.5 font-serif text-xs font-bold tracking-[0.16em] uppercase transition-all',
                              canCast
                                ? 'border-arcane bg-arcane/15 text-arcane active:bg-arcane/35'
                                : 'border-muted-foreground/25 text-muted-foreground/50',
                            )}
                          >
                            <Sparkles className="size-3.5" />
                            {spell.level === 0
                              ? 'Conjurar (truque)'
                              : !isPrepared
                                ? 'Não preparada'
                                : circle === null
                                  ? 'Sem espaços'
                                  : upcast
                                    ? `Conjurar no ${circle}º círculo`
                                    : `Conjurar · ${circle}º círculo`}
                          </button>
                          {upcast && canCast ? (
                            <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
                              Sem espaços de {spell.level}º — será ampliada
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ul>

      {grouped.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          Nenhuma magia encontrada.
        </p>
      ) : null}
    </SideDrawer>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[9px] tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="text-foreground/80">{value}</dd>
    </div>
  )
}
