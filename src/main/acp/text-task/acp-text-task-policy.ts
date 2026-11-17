import { AcpRpcError } from '../transport/acp-errors'
import { waitForPromiseWithSignal } from '../../../shared/abort-signal-reason'
import type { AcpStructuredSessionAdapterDeps } from '../session/acp-structured-session-adapter-deps'
import { STRUCTURED_CHILD_ENV_TO_DELETE } from '../../runtime/agent-session/environment/structured-session-child-env'
import { z } from 'zod'
import type { AcpLaunchSpec } from '../launch/acp-launch-contract'

const envelope = z.looseObject({ sessionId: z.string() })

export function acpTextTaskCompletion(
  dialect: AcpLaunchSpec['dialect'],
  sessionId: string,
  promptId: string,
  method: string,
  params: unknown
): { stopReason: string } | undefined {
  if (!sessionId || envelope.safeParse(params).data?.sessionId !== sessionId) {
    return undefined
  }
  const completion = dialect.textTaskCompletion?.(method, params)
  if (completion?.promptId === promptId) {
    return completion
  }
  const mapped = dialect.notification?.(method, params, Date.now())
  return mapped?.disposition === 'map' && mapped.turn === promptId && !mapped.replay && mapped.end
    ? mapped.end
    : undefined
}

export const TASK_ENV_TO_DELETE = [
  ...STRUCTURED_CHILD_ENV_TO_DELETE,
  'ORCA_AGENT_SESSION_ID',
  'ORCA_AGENT_SESSION_SPAWN_TOKEN',
  'ORCA_STRUCTURED_SESSION',
  'ORCA_CHAT_SCRATCH_DIR',
  'ORCA_CHAT_VISUALS_DIR'
]

export async function cleanupAcpTextTaskProtocol(
  work: () => Promise<unknown>,
  logger: AcpStructuredSessionAdapterDeps['logger']
): Promise<void> {
  try {
    await waitForPromiseWithSignal(work(), AbortSignal.timeout(2_000))
  } catch (error) {
    logger?.warn('Naming helper protocol cleanup failed', { scope: 'acp-text-task', error })
  }
}

export function acpTextTaskArgs(spec: AcpLaunchSpec): string[] {
  return spec.args({ fullAccess: false, pluginDir: null })
}

export function acpTextTaskEnv(env: Record<string, string>): Record<string, string> {
  return env
}

export function rejectAcpTextTaskWork(failed: AbortController): never {
  const error = new AcpRpcError(-32601, 'Tools and user input are unavailable during chat naming')
  failed.abort(error)
  throw error
}
