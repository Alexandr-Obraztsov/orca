import type { ResumableTuiAgent } from '../../../../../../shared/agent-session/lifecycle/agent-session-resume'
import type { TuiAgent } from '../../../../../../shared/agent-launch/catalog/tui-agent'
import { AGENT_SESSION_QWEN_CODE_RESUME_RUNTIME_CAPABILITY } from '../../../../../../shared/agent-session/lifecycle/resume/agent-session-resume-runtime-capabilities'
import type { RuntimeCapability } from '../../../../../../shared/protocol-version'

// New resumable enum members can make older hosts return invalid_argument instead of legacy fallback, killing panes. Probe per-agent capability; exhaustive Record requires an explicit gate or deliberate undefined for additions.
const RESUME_HOST_AUTHORITY_CAPABILITY_BY_AGENT = {
  // These shipped inside agent-session.host-authority.v1's enum, so the generic probe covers them.
  claude: undefined,
  codex: undefined,
  'qwen-code': AGENT_SESSION_QWEN_CODE_RESUME_RUNTIME_CAPABILITY
} satisfies Record<ResumableTuiAgent, RuntimeCapability | undefined>

export function agentResumeHostAuthorityCapability(
  agent: TuiAgent | null | undefined
): RuntimeCapability | undefined {
  if (!agent) {
    return undefined
  }
  return (
    RESUME_HOST_AUTHORITY_CAPABILITY_BY_AGENT as Partial<Record<TuiAgent, RuntimeCapability>>
  )[agent]
}
