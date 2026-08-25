'use client'

import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

type SideDrawerProps = {
  open: boolean
  onClose: () => void
  side: 'left' | 'right'
  title: string
  subtitle?: string
  icon?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

export function SideDrawer({
  open,
  onClose,
  side,
  title,
  subtitle,
  icon,
  footer,
  children,
}: SideDrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div
      className={cn(
        'fixed inset-0 z-50',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!open}
    >
      {/* backdrop */}
      <button
        type="button"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
        aria-label="Fechar painel"
        className={cn(
          'absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />

      <aside
        role="dialog"
        aria-modal="true"
        inert={!open}
        aria-label={title}
        className={cn(
          'absolute inset-y-0 flex w-[89%] max-w-sm flex-col bg-card transition-transform duration-300 ease-out',
          side === 'left'
            ? 'left-0 border-r border-primary/30'
            : 'right-0 border-l border-primary/30',
          open
            ? 'translate-x-0'
            : side === 'left'
              ? '-translate-x-full'
              : 'translate-x-full',
        )}
        style={{
          boxShadow:
            side === 'left'
              ? '12px 0 40px -8px oklch(0 0 0 / 0.7)'
              : '-12px 0 40px -8px oklch(0 0 0 / 0.7)',
        }}
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-primary/25 bg-secondary/40 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          {icon ? <span className="text-primary">{icon}</span> : null}
          <div className="min-w-0 flex-1">
            <h2 className="engraved truncate font-serif text-base font-bold tracking-[0.14em] text-primary uppercase">
              {title}
            </h2>
            {subtitle ? (
              <p className="truncate text-[11px] tracking-wide text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-9 items-center justify-center rounded-sm border border-primary/30 text-primary transition-colors active:bg-primary/15"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="panel-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 border-t border-primary/25 bg-secondary/40 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        ) : null}
      </aside>
    </div>
  )
}
