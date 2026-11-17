import type { TuiAgent } from '../../agent-launch/catalog/tui-agent'

/** Community skills --agent keys differ from Orca IDs (claude-code, rovodev, augment).
 * Unknown mappings are null because guessed keys abort installation; aider-desk and openclaw are different products. */
export const SKILLS_CLI_AGENT_KEY_BY_TUI_AGENT = {
  claude: 'claude-code',
  'claude-agent-teams': 'claude-code',
  codex: 'codex',
  'qwen-code': 'qwen-code',
  nessy: null
} satisfies Record<TuiAgent, string | null>
