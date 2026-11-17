import type { AgentStartupPlanInputs } from '../../../../shared/agent-launch/startup/agent-startup-plan-inputs'
import type { SleepingAgentLaunchConfig } from '../../../../shared/agent-session/lifecycle/agent-session-resume'

type WorktreeModelStartupScope = {
  inputs: AgentStartupPlanInputs
  cwd: string
  isWsl?: boolean
  hostIdentity?: string
  signal?: AbortSignal
}

/** OpenCode was removed from the TuiAgent catalog, so startup inputs pass through unchanged. */
export async function prepareWorktreeModelStartupInputs(
  options: WorktreeModelStartupScope
): Promise<{ inputs: AgentStartupPlanInputs; launchConfig?: SleepingAgentLaunchConfig }> {
  return { inputs: options.inputs }
}