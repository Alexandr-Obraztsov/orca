import type { TuiAgent } from '../agent-launch/catalog/tui-agent'

export type NativeChatTranscriptAgent = 'claude' | 'codex'

/** Agents whose transcripts the native chat view can parse and render. */
export const NATIVE_CHAT_SUPPORTED_AGENT_LIST: readonly TuiAgent[] = ['claude', 'codex']

export const NATIVE_CHAT_SUPPORTED_AGENTS: ReadonlySet<string> = new Set(
  NATIVE_CHAT_SUPPORTED_AGENT_LIST
)

export function isNativeChatSupportedAgent(agent: string | null | undefined): boolean {
  return agent != null && NATIVE_CHAT_SUPPORTED_AGENTS.has(agent)
}

/** Agents whose Model-A SSH transcript reader is not supported. A hook path alone
 *  does not establish owning-host reads. */
export function nativeChatRequiresLocalTranscript(agent: string | null | undefined): boolean {
  const transcriptAgent = resolveNativeChatTranscriptAgent(agent)
  return transcriptAgent === null
}

/** Selector TUIs require key steps rather than pasted option labels. */
export function shouldStepNativeChatAskAnswer(agent: string | null | undefined): boolean {
  const transcriptAgent = resolveNativeChatTranscriptAgent(agent)
  return transcriptAgent === 'claude' || transcriptAgent === 'codex'
}

/** Native chat ask requires a terminal only for TUIs with configurable keys. */
export function nativeChatAskRequiresTerminal(_agent: string | null | undefined): boolean {
  return false
}

/** Whether an interrupt needs a second Escape; Claude Code and Codex read Esc-Esc at an idle prompt as rewind. */
export function nativeChatStopSendsSecondEscape(_agent: string | null | undefined): boolean {
  return false
}

export function resolveNativeChatTranscriptAgent(
  agent: string | null | undefined
): NativeChatTranscriptAgent | null {
  if (agent === 'claude') {
    return 'claude'
  }
  if (agent === 'codex') {
    return 'codex'
  }
  return null
}

export function nativeChatApprovalAcceptKey(_agent: string | null | undefined): string {
  return '1'
}