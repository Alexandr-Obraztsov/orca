import type { AgentStartupPlan } from './tui-agent-startup'
import type { SleepingAgentLaunchConfig } from '../../agent-session/lifecycle/agent-session-resume'
import type { SessionOptionValue } from '../../native-chat/input/native-chat-session-options'
import type { TuiAgent } from '../catalog/tui-agent'
import { TUI_AGENT_CONFIG } from '../catalog/tui-agent-config'
import type { AgentStartupShell } from './tui-agent-startup-shell'

export function appliedSessionOptionProps(values: Record<string, SessionOptionValue>) {
  return Object.keys(values).length > 0 ? { sessionOptions: { ...values } } : {}
}

export function buildFlagPromptStartupPlan(args: {
  agent: TuiAgent
  launchCommand: string
  quotedPrompt: string
  prompt: string
  shell: AgentStartupShell
  launchConfig: SleepingAgentLaunchConfig
  sessionOptions: Record<string, SessionOptionValue>
  agentEnv: Record<string, string> | null | undefined
}): AgentStartupPlan {
  const promptSuffix = ` --prompt ${args.quotedPrompt}`
  return {
    agent: args.agent,
    launchCommand: `${args.launchCommand}${promptSuffix}`,
    expectedProcess: TUI_AGENT_CONFIG[args.agent].expectedProcess,
    followupPrompt: null,
    launchConfig: args.launchConfig,
    ...appliedSessionOptionProps(args.sessionOptions),
    ...(args.agentEnv ? { env: { ...args.agentEnv } } : {})
  }
}
