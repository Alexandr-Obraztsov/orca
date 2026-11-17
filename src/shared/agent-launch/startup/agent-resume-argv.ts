import type {
  AgentProviderSessionMetadata,
  ResumableTuiAgent
} from '../../agent-session/lifecycle/agent-session-resume'

/** Keep per-agent resume argv separate from session metadata; type-only imports avoid runtime cycles. */
export function getAgentResumeArgv(
  agent: ResumableTuiAgent,
  providerSession: AgentProviderSessionMetadata
): string[] | null {
  const id = providerSession.id
  switch (agent) {
    case 'claude':
      return providerSession.key === 'session_id'
        ? [
            'claude',
            ...(providerSession.effort ? ['--effort', providerSession.effort] : []),
            '--resume',
            id
          ]
        : null
    case 'codex':
      return providerSession.key === 'session_id' ? ['codex', 'resume', id] : null
    case 'qwen-code':
      return providerSession.key === 'session_id' ? ['qwen', '--resume', id] : null
  }
}

/** CLI fork creates a new conversation ID so chat and terminal cannot write the same one. */
const FORK_ARGV: Partial<
  Record<ResumableTuiAgent, (providerSession: AgentProviderSessionMetadata) => string[] | null>
> = {
  claude: ({ id }) => ['claude', '--resume', id, '--fork-session'],
  codex: ({ id }) => ['codex', 'fork', id]
}

/** OpenCode2.0.14/OMP17.0.5 fork through ACP session/fork then resume the copy. Refuse without host-advertised fork; OpenCode2 chats list as opencode2. */
const FORKS_THROUGH_CHAT: ReadonlySet<string> = new Set<ResumableTuiAgent>([])

/** Whether "Resume in New CLI" can open a copy of this agent's conversations at all. A row's own
 *  gate (`aiVaultSessionCliForkWorktreeId`) also checks that its copy can be made. */
export function agentForksConversations(agent: string): boolean {
  return Object.hasOwn(FORK_ARGV, agent) || FORKS_THROUGH_CHAT.has(agent)
}

export function agentForksThroughChat(agent: string): boolean {
  return FORKS_THROUGH_CHAT.has(agent)
}

export function getAgentForkArgv(
  agent: ResumableTuiAgent,
  providerSession: AgentProviderSessionMetadata
): string[] | null {
  const forkArgv = FORK_ARGV[agent]
  return forkArgv && providerSession.key === 'session_id' ? forkArgv(providerSession) : null
}
