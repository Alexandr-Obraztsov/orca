import type { AgentStatus } from '../agent-title-core'
import type { TerminalAgent } from '../../identity/terminal-agent'

/** Hermes was removed; the title provider is a null stub for its live caller. */
export function hermesNativeTitleStatus(
  _title: string,
  _agent: TerminalAgent | null
): AgentStatus | null {
  return null
}
