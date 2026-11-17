import { translate } from '@/i18n/i18n'
import type { AgentCatalogEntry } from './agent-catalog'

export function secondaryAgentCatalogEntries(): AgentCatalogEntry[] {
  return [
    {
      id: 'qwen-code',
      label: translate('auto.lib.agent.catalog.bee242fe3d', 'Qwen Code'),
      // QwenLM/qwen-code installs as qwen; retain the catalog id for stable identity.
      cmd: 'qwen',
      homepageUrl: 'https://github.com/QwenLM/qwen-code'
    }
  ]
}