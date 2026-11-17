import type { PreflightRuntimeContext } from '../../../ipc/preflight-runtime-target'
import type { AgentStartupShell } from '../../../../shared/agent-launch/startup/tui-agent-startup-shell'
import type { TerminalCreateOptions } from './terminal-create-options'

/** Qoder was removed from the TuiAgent catalog; the launch command is left untouched. */
export async function resolveQoderTerminalCommand<
  T extends Pick<TerminalCreateOptions, 'launchAgent' | 'command' | 'launchConfig'>
>(
  options: T,
  _host: {
    connectionId?: string | null
    context?: PreflightRuntimeContext
    shell: AgentStartupShell
  }
): Promise<T> {
  return options
}