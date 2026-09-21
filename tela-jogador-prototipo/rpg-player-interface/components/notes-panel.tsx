'use client'

import { ChevronDown, ScrollText } from 'lucide-react'
import { useState } from 'react'
import type { Note } from '@/lib/character-data'
import { cn } from '@/lib/utils'
import { SideDrawer } from './side-drawer'

type NotesPanelProps = {
  open: boolean
  onClose: () => void
  notes: Note[]
}

export function NotesPanel({ open, onClose, notes }: NotesPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(notes[0]?.id ?? null)

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      side="right"
      title="Notas"
      subtitle={`${notes.length} anotações de campanha`}
      icon={<ScrollText className="size-5" />}
    >
      <ul>
        {notes.map((note) => {
          const isOpen = expanded === note.id
          return (
            <li key={note.id} className="border-b border-primary/10">
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : note.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors active:bg-primary/5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-sm font-semibold text-foreground">
                    {note.title}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {note.date}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    'size-4 shrink-0 text-muted-foreground transition-transform',
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
                  <p className="border-t border-primary/10 bg-background/50 px-3 py-3 text-[12.5px] leading-relaxed text-foreground/85">
                    {note.body}
                  </p>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </SideDrawer>
  )
}
