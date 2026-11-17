import qwenCodeUrl from '../../../../../shared/agent-icons/qwen-code.png?url'
import type { TuiAgent } from '../../../../../shared/agent-launch/catalog/tui-agent'

// Bundle favicons for offline/Google-blocked regions (#8451); shared/agent-icons also supplies mobile-agent-icon-assets.ts.
export const AGENT_FAVICON_ASSETS: Partial<Record<TuiAgent, string>> = {
  'qwen-code': qwenCodeUrl
}
