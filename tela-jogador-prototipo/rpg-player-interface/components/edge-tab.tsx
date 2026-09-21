'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type EdgeTabProps = {
  side: 'left' | 'right'
  label: string
  onClick: () => void
  offset?: string
}

/**
 * Aba-setinha na borda da tela. Não é um botão de menu: é a "alça"
 * que puxa uma gaveta (mochila, grimório, notas) para dentro da tela.
 */
export function EdgeTab({ side, label, onClick, offset = '50%' }: EdgeTabProps) {
  const Chevron = side === 'left' ? ChevronRight : ChevronLeft

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Abrir ${label}`}
      style={{ top: offset }}
      className={cn(
        'absolute z-20 -translate-y-1/2 flex items-center gap-1 border border-primary/35 bg-card/95 py-3 text-primary shadow-lg backdrop-blur-sm transition-all active:bg-primary/20',
        side === 'left'
          ? 'left-0 rounded-r-md border-l-0 pl-1 pr-1.5'
          : 'right-0 rounded-l-md border-r-0 pl-1.5 pr-1',
      )}
    >
      {side === 'right' ? <Chevron className="size-4 shrink-0" /> : null}
      <span
        className="engraved font-serif text-[10px] font-bold tracking-[0.2em] uppercase"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        {label}
      </span>
      {side === 'left' ? <Chevron className="size-4 shrink-0" /> : null}
    </button>
  )
}
