'use client'

import { ChevronDown, Lock } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  character,
  type Feature,
  type FeatureSource,
} from '@/lib/character-data'
import { cn } from '@/lib/utils'
import { SideDrawer } from './side-drawer'

type Props = {
  open: boolean
  onClose: () => void
  features: Feature[]
}

const order: FeatureSource[] = ['Raça', 'Classe', 'Subclasse', 'Antecedente']

const sourceLabel: Record<FeatureSource, string> = {
  Raça: character.race,
  Classe: character.class,
  Subclasse: character.subclass,
  Antecedente: character.background,
}

export function FeaturesPanel({ open, onClose, features }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const groups = useMemo(
    () =>
      order
        .map((source) => ({
          source,
          list: features.filter((f) => f.source === source),
        }))
        .filter((g) => g.list.length > 0),
    [features],
  )

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      side="right"
      title="Habilidades"
      subtitle={`${features.length} passivas · nível ${character.level}`}
    >
      {groups.map((group) => (
        <section key={group.source}>
          <h3 className="sticky top-0 z-10 flex items-baseline gap-2 border-y border-primary/20 bg-secondary/90 px-3 py-1.5 backdrop-blur">
            <span className="engraved font-serif text-[10px] font-bold tracking-[0.2em] uppercase text-primary">
              {group.source}
            </span>
            <span className="truncate text-[10px] text-muted-foreground">
              {sourceLabel[group.source]}
            </span>
          </h3>

          <ul className="divide-y divide-primary/10">
            {group.list.map((f) => {
              const locked = (f.level ?? 0) > character.level
              const isOpen = expanded === f.id
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : f.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left active:bg-primary/10"
                  >
                    {locked ? (
                      <Lock className="size-3.5 shrink-0 text-muted-foreground/50" />
                    ) : (
                      <span
                        aria-hidden
                        className="size-2 shrink-0 rotate-45 rounded-[1px] bg-primary"
                      />
                    )}
                    <span
                      className={cn(
                        'min-w-0 flex-1 truncate font-serif text-[13px] font-bold',
                        locked ? 'text-muted-foreground/60' : 'text-foreground',
                      )}
                    >
                      {f.name}
                    </span>

                    {f.uses ? (
                      <span className="shrink-0 rounded-sm border border-arcane/40 bg-arcane/10 px-1.5 py-0.5 font-serif text-[10px] font-bold tabular-nums text-arcane">
                        {f.uses.current}/{f.uses.max}
                      </span>
                    ) : null}
                    {f.level ? (
                      <span className="shrink-0 font-serif text-[9.5px] font-bold tabular-nums text-muted-foreground">
                        N{f.level}
                      </span>
                    ) : null}
                    <ChevronDown
                      className={cn(
                        'size-4 shrink-0 text-primary/60 transition-transform',
                        isOpen && 'rotate-180',
                      )}
                    />
                  </button>

                  <div
                    className={cn(
                      'grid transition-[grid-template-rows] duration-200',
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                    )}
                  >
                    <div className="overflow-hidden" inert={!isOpen}>
                      <div className="border-l-2 border-primary/30 px-3 pb-3 pt-0.5">
                        <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                          {f.description}
                        </p>
                        {f.uses ? (
                          <p className="mt-1.5 font-serif text-[10px] tracking-wide text-arcane">
                            Recarrega em descanso {f.uses.reset}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      <p className="px-3 py-3 text-[10.5px] leading-relaxed text-muted-foreground">
        Habilidades com cadeado ainda não foram destravadas no seu nível atual.
      </p>
    </SideDrawer>
  )
}
