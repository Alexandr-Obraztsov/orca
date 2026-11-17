import type { TuiAgent } from './tui-agent'

/** English names for shared/nonlocalized keybinding surfaces; keep aligned with renderer agent-catalog.tsx labels. */
export const TUI_AGENT_DISPLAY_NAMES: Record<TuiAgent, string> = {
  claude: 'Claude',
  'claude-agent-teams': 'Claude Agent Teams',
  codex: 'Codex',
  'qwen-code': 'Qwen Code',
  nessy: 'Nessy'
}

/** Derive the exhaustive list here so shared modules need no renderer import. */
export const ALL_TUI_AGENTS = Object.keys(TUI_AGENT_DISPLAY_NAMES) as readonly TuiAgent[]

/** The display name of `agent`, or null when it names no TUI agent. */
export function tuiAgentDisplayName(agent: string): string | null {
  return Object.entries(TUI_AGENT_DISPLAY_NAMES).find(([id]) => id === agent)?.[1] ?? null
}
