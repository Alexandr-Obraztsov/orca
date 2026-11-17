import { getCatalogPlatform } from './agent-catalog-platform'
import {
  getTuiAgentLaunchCommand,
  TUI_AGENT_CONFIG
} from '../../../../shared/agent-launch/catalog/tui-agent-config'
import { translate } from '@/i18n/i18n'
import type { AgentCatalogEntry } from './agent-catalog'

/** Keep first-party entries separate from the community tail to stay within module budgets; buildAgentCatalogEntries preserves their order. */
export function primaryAgentCatalogEntries(): AgentCatalogEntry[] {
  return [
    {
      id: 'claude',
      label: translate('auto.lib.agent.catalog.0708ed89f1', 'Claude'),
      cmd: 'claude',
      homepageUrl: 'https://code.claude.com/docs'
    },
    {
      id: 'claude-agent-teams',
      label: translate('auto.lib.agent.catalog.bf53f09bf8', 'Claude Agent Teams'),
      cmd: getTuiAgentLaunchCommand(TUI_AGENT_CONFIG['claude-agent-teams'], getCatalogPlatform()),
      homepageUrl: 'https://code.claude.com/docs/en/agent-teams'
    },
    {
      id: 'codex',
      label: translate('auto.lib.agent.catalog.760bc6883d', 'Codex'),
      cmd: 'codex',
      homepageUrl: 'https://github.com/openai/codex'
    }
  ]
}