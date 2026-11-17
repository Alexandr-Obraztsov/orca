import type { TuiAgent } from '../../../../shared/agent-launch/catalog/tui-agent'

/** Query replies (ESC/DCS control sequences) are always forwarded for current agents. */
export function shouldForwardHeadlessTerminalQueryReply(
  _launchAgent: TuiAgent | null | undefined,
  _reply: string
): boolean {
  return true
}