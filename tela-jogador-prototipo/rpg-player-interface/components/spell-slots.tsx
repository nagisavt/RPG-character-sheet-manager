'use client'

import { Infinity as InfinityIcon } from 'lucide-react'
import type { SlotTable } from '@/lib/character-data'
import { cn } from '@/lib/utils'

type SpellSlotsProps = {
  table: SlotTable
  used: Record<number, number>
  onToggle: (level: number, index: number) => void
  compact?: boolean
}

/**
 * Círculos de magia no padrão D&D 5e: truques (círculo 0) são ilimitados,
 * do 1º ao 9º círculo cada espaço é consumido ao conjurar.
 */
export function SpellSlots({ table, used, onToggle, compact }: SpellSlotsProps) {
  const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((l) => table[l]?.max > 0)

  return (
    <section aria-label="Círculos de magia" className="px-3">
      {!compact ? (
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Círculos de magia
          </span>
          <span className="h-px flex-1 bg-primary/20" />
        </div>
      ) : null}

      <div className="panel-scroll -mx-1 flex items-stretch gap-1.5 overflow-x-auto px-1 pb-1">
        <div className="flex shrink-0 flex-col items-center justify-between gap-1 rounded-sm border border-arcane/30 bg-arcane/5 px-2 py-1.5">
          <span className="font-serif text-[10px] font-bold text-arcane">0º</span>
          <InfinityIcon className="size-3.5 text-arcane" />
        </div>

        {levels.map((level) => {
          const max = table[level].max
          const spent = used[level] ?? 0
          return (
            <div
              key={level}
              className="flex shrink-0 flex-col items-center gap-1 rounded-sm border border-primary/25 bg-secondary/40 px-1.5 py-1.5"
            >
              <span className="font-serif text-[10px] font-bold text-primary">
                {level}º
              </span>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: max }).map((_, i) => {
                  const isSpent = i < spent
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onToggle(level, i)}
                      aria-label={`${isSpent ? 'Recuperar' : 'Gastar'} espaço ${i + 1} do ${level}º círculo`}
                      aria-pressed={!isSpent}
                      className={cn(
                        'size-3 rotate-45 rounded-[1px] border transition-all duration-200',
                        isSpent
                          ? 'border-muted-foreground/40 bg-transparent'
                          : 'border-arcane bg-arcane',
                      )}
                      style={
                        isSpent
                          ? undefined
                          : { boxShadow: '0 0 6px oklch(0.72 0.115 205 / 0.7)' }
                      }
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
