'use client'

import { Heart, Minus, Plus, Shield, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type VitalsProps = {
  hp: number
  maxHp: number
  tempHp: number
  onDamage: () => void
  onHeal: () => void
  sorcery: number
  maxSorcery: number
}

export function Vitals({
  hp,
  maxHp,
  tempHp,
  onDamage,
  onHeal,
  sorcery,
  maxSorcery,
}: VitalsProps) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  const tempPct = Math.max(0, Math.min(100 - pct, (tempHp / maxHp) * 100))
  const critical = hp / maxHp <= 0.25

  return (
    <section aria-label="Vitalidade" className="px-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDamage}
          aria-label="Sofrer 1 de dano"
          className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-hp/45 bg-hp/10 text-hp transition-colors active:bg-hp/30"
        >
          <Minus className="size-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              <Heart className={cn('size-3', critical ? 'text-hp' : 'text-hp/70')} />
              Vida
            </span>
            <span className="font-serif text-sm font-bold tabular-nums text-foreground">
              {hp}
              <span className="text-muted-foreground">/{maxHp}</span>
              {tempHp > 0 ? (
                <span className="ml-1.5 text-arcane">+{tempHp}</span>
              ) : null}
            </span>
          </div>

          <div className="relative h-3 overflow-hidden rounded-sm border border-primary/30 bg-secondary/70">
            {/* hachura de fundo */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, transparent 0 3px, oklch(0 0 0 / 0.45) 3px 6px)',
              }}
            />
            <div
              className={cn(
                'absolute inset-y-0 left-0 transition-[width] duration-500 ease-out',
                critical && 'animate-pulse',
              )}
              style={{
                width: `${pct}%`,
                background:
                  'linear-gradient(180deg, oklch(0.62 0.19 25) 0%, oklch(0.44 0.16 25) 100%)',
              }}
            />
            <div
              className="absolute inset-y-0 transition-all duration-500 ease-out"
              style={{
                left: `${pct}%`,
                width: `${tempPct}%`,
                background:
                  'linear-gradient(180deg, oklch(0.78 0.11 205) 0%, oklch(0.5 0.1 205) 100%)',
              }}
            />
            <div className="absolute inset-x-0 top-0 h-px bg-foreground/20" />
          </div>
        </div>

        <button
          type="button"
          onClick={onHeal}
          aria-label="Curar 1 ponto de vida"
          className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-primary/45 bg-primary/10 text-primary transition-colors active:bg-primary/30"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2 text-[10px] tracking-wide">
        <Chip icon={<Shield className="size-3" />} label="CA" value="15" />
        <Chip label="INIC" value="+3" />
        <Chip label="CD MAGIA" value="17" />
        <Chip
          icon={<Sparkles className="size-3 text-arcane" />}
          label="FEIT"
          value={`${sorcery}/${maxSorcery}`}
        />
      </div>
    </section>
  )
}

function Chip({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-sm border border-primary/20 bg-secondary/40 px-1 py-1">
      {icon}
      <span className="truncate text-muted-foreground uppercase">{label}</span>
      <span className="font-serif font-bold tabular-nums text-primary">{value}</span>
    </div>
  )
}
