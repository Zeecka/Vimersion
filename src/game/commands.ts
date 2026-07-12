import type { Tier } from './types'

/** A Vim command the game teaches. Powers the "command belt" and mastery display. */
export interface VimCommand {
  id: string
  keys: string
  label: string
  tier: Tier
  category: string
}

/**
 * Catalog of commands, grouped by the tier that introduces them. This is the
 * canonical curriculum spine — challenges credit `taughtCommands` by `id`.
 */
export const COMMANDS: VimCommand[] = [
  // Tier 1 — Survive
  { id: 'i', keys: 'i', label: 'insert before cursor', tier: 1, category: 'modes' },
  { id: 'esc', keys: 'Esc', label: 'back to normal mode', tier: 1, category: 'modes' },
  { id: 'h', keys: 'h', label: 'move left', tier: 1, category: 'motion' },
  { id: 'j', keys: 'j', label: 'move down', tier: 1, category: 'motion' },
  { id: 'k', keys: 'k', label: 'move up', tier: 1, category: 'motion' },
  { id: 'l', keys: 'l', label: 'move right', tier: 1, category: 'motion' },
  { id: 'x', keys: 'x', label: 'delete char', tier: 1, category: 'edit' },
  { id: 'dd', keys: 'dd', label: 'delete line', tier: 1, category: 'edit' },
  { id: 'u', keys: 'u', label: 'undo', tier: 1, category: 'edit' },
  { id: 'a', keys: 'a', label: 'insert after cursor', tier: 1, category: 'modes' },
  { id: 'o', keys: 'o', label: 'open line below', tier: 1, category: 'modes' },

  // Tier 2 — Comfortable
  { id: 'w', keys: 'w', label: 'next word', tier: 2, category: 'motion' },
  { id: 'b', keys: 'b', label: 'previous word', tier: 2, category: 'motion' },
  { id: 'e', keys: 'e', label: 'end of word', tier: 2, category: 'motion' },
  { id: '0', keys: '0', label: 'start of line', tier: 2, category: 'motion' },
  { id: '$', keys: '$', label: 'end of line', tier: 2, category: 'motion' },
  { id: 'gg', keys: 'gg', label: 'top of file', tier: 2, category: 'motion' },
  { id: 'G', keys: 'G', label: 'bottom of file', tier: 2, category: 'motion' },
  { id: 'f', keys: 'f{c}', label: 'find char', tier: 2, category: 'motion' },
  { id: 'cw', keys: 'cw', label: 'change word', tier: 2, category: 'edit' },

  // Tier 3 — Faster
  { id: 'd-motion', keys: 'd{m}', label: 'delete + motion', tier: 3, category: 'operator' },
  { id: 'c-motion', keys: 'c{m}', label: 'change + motion', tier: 3, category: 'operator' },
  { id: 'y-motion', keys: 'y{m}', label: 'yank + motion', tier: 3, category: 'operator' },
  { id: 'iw', keys: 'ciw', label: 'inner word', tier: 3, category: 'text-object' },
  { id: 'i(', keys: 'ci(', label: 'inner parens', tier: 3, category: 'text-object' },
  { id: 'v', keys: 'v', label: 'visual mode', tier: 3, category: 'modes' },
  { id: 'search', keys: '/', label: 'search', tier: 3, category: 'motion' },

  // Tier 4 — Superpowers
  { id: 'macro', keys: 'q{r}', label: 'record macro', tier: 4, category: 'power' },
  { id: 'dot', keys: '.', label: 'repeat', tier: 4, category: 'power' },
  { id: 'marks', keys: "m{r}", label: 'set mark', tier: 4, category: 'power' },
  { id: 'registers', keys: '"{r}', label: 'registers', tier: 4, category: 'power' },
]

export const COMMANDS_BY_ID: Record<string, VimCommand> = Object.fromEntries(
  COMMANDS.map((c) => [c.id, c]),
)

export function commandsForTier(tier: Tier): VimCommand[] {
  return COMMANDS.filter((c) => c.tier === tier)
}
