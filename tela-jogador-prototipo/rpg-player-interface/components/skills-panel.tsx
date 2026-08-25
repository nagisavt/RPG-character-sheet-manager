'use client'

import { Eye } from 'lucide-react'
import { useMemo, useState } from 'react'
import { character, type Skill } from '@/lib/character-data'
import { cn } from '@/lib/utils'
import { SideDrawer } from './side-drawer'

type Props = {
  open: boolean
  onClose: () => void
  skills: Skill[]
  profBonus: number
}

/** Nível de proficiência de uma perícia. */
type Rank = 'nenhuma' | 'proficiente' | 'especialista'

function rankOf(skill: Skill): Rank {
  if (skill.expertise) return 'especialista'
  if (skill.proficient) return 'proficiente'
  return 'nenhuma'
}

export function SkillsPanel({ open, onClose, skills, profBonus }: Props) {
  const [onlyProficient, setOnlyProficient] = useState(false)

  const abilityMod = useMemo(() => {
    const map: Record<string, number> = {}
    for (const a of character.abilities) map[a.name] = a.mod
    return map
  }, [])

  const rows = useMemo(() => {
    return skills
      .map((s) => {
        const rank = rankOf(s)
        const bonus =
          rank === 'especialista'
            ? profBonus * 2
            : rank === 'proficiente'
              ? profBonus
              : 0
        return { ...s, rank, total: (abilityMod[s.ability] ?? 0) + bonus }
      })
      .filter((s) => (onlyProficient ? s.rank !== 'nenhuma' : true))
  }, [skills, profBonus, abilityMod, onlyProficient])

  const perception = useMemo(() => {
    const p = skills.find((s) => s.id === 'percepcao')
    if (!p) return 10
    const rank = p ? rankOf(p) : 'nenhuma'
    const bonus =
      rank === 'especialista'
        ? profBonus * 2
        : rank === 'proficiente'
          ? profBonus
          : 0
    return 10 + (abilityMod[p.ability] ?? 0) + bonus
  }, [skills, profBonus, abilityMod])

  const profCount = skills.filter((s) => rankOf(s) !== 'nenhuma').length

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      side="right"
      title="Perícias"
      subtitle={`${profCount} com proficiência · bônus +${profBonus}`}
    >
      {/* resumo de atributos */}
      <div className="grid grid-cols-6 gap-1 border-b border-primary/20 px-3 py-2.5">
        {character.abilities.map((a) => (
          <div
            key={a.name}
            className="flex flex-col items-center rounded-sm border border-primary/25 bg-secondary/40 py-1"
          >
            <span className="font-serif text-[8.5px] font-bold tracking-[0.08em] text-muted-foreground">
              {a.name}
            </span>
            <span className="font-serif text-xs font-bold tabular-nums text-primary">
              {a.mod >= 0 ? `+${a.mod}` : a.mod}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-primary/20 px-3 py-2">
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Eye className="size-3.5 shrink-0 text-arcane" />
          Percepção passiva
          <span className="font-serif font-bold tabular-nums text-arcane">
            {perception}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setOnlyProficient((v) => !v)}
          aria-pressed={onlyProficient}
          className={cn(
            'shrink-0 rounded-sm border px-2 py-1 font-serif text-[9px] font-bold tracking-[0.1em] uppercase transition-colors',
            onlyProficient
              ? 'border-primary bg-primary/20 text-primary'
              : 'border-primary/30 text-muted-foreground',
          )}
        >
          Só proficientes
        </button>
      </div>

      <ul className="divide-y divide-primary/10">
        {rows.map((s) => (
          <li key={s.id} className="flex items-center gap-2.5 px-3 py-2.5">
            {/* marcador de proficiência */}
            <span
              aria-hidden
              className={cn(
                'size-2.5 shrink-0 rotate-45 rounded-[1px] border',
                s.rank === 'especialista'
                  ? 'border-primary bg-primary'
                  : s.rank === 'proficiente'
                    ? 'border-primary bg-primary/40'
                    : 'border-muted-foreground/35',
              )}
            />
            <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
              {s.name}
              {s.rank === 'especialista' ? (
                <span className="ml-1.5 font-serif text-[8.5px] font-bold tracking-[0.1em] uppercase text-primary">
                  especialista
                </span>
              ) : null}
            </span>
            <span className="shrink-0 font-serif text-[9px] font-bold tracking-[0.08em] text-muted-foreground">
              {s.ability}
            </span>
            <span
              className={cn(
                'w-9 shrink-0 rounded-sm border py-0.5 text-center font-serif text-xs font-bold tabular-nums',
                s.rank !== 'nenhuma'
                  ? 'border-primary/45 bg-primary/10 text-primary'
                  : 'border-muted-foreground/25 text-muted-foreground',
              )}
            >
              {s.total >= 0 ? `+${s.total}` : s.total}
            </span>
          </li>
        ))}
      </ul>

      <p className="px-3 py-3 text-[10.5px] leading-relaxed text-muted-foreground">
        Losango cheio = especialista (bônus dobrado). Losango pela metade =
        proficiente. Vazio = apenas o modificador do atributo.
      </p>
    </SideDrawer>
  )
}
