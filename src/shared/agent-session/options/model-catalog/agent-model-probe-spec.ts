import {
  getCommitMessageAgentSpec,
  type CommitMessageAgentSpec
} from '../../../source-control/ai/generation/commit-message-agent-spec'
import type { TuiAgent } from '../../../agent-launch/catalog/tui-agent'

/** Exclude generation inputs so discovery-only agents stay outside the commit-message registry. */
export type AgentModelProbeSpec = Omit<
  CommitMessageAgentSpec,
  'promptDelivery' | 'buildArgs' | 'modelFlag' | 'effortFlag'
>

export function getAgentModelProbeSpec(agentId: TuiAgent): AgentModelProbeSpec | undefined {
  return getCommitMessageAgentSpec(agentId)
}
