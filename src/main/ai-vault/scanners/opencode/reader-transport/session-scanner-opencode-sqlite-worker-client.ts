import type { WorkerThreadFactory } from '../../../../worker-threads/worker-thread-transport'
import { WorkerThreadRequestQueue } from '../../../../worker-threads/worker-thread-request-queue'
import type {
  OpenCodeForkCoverageRequest,
  OpenCodeNativeChatReadRequest,
  OpenCodeNativeChatReadValue,
  OpenCodeSqliteWorkerRequest,
  OpenCodeSqliteWorkerResponse
} from './session-scanner-opencode-sqlite-worker-protocol'
import { errorMessage } from '../../../../../shared/error-message'
import { runOpenCodeSqliteScanRequest } from '../sqlite/session-scanner-opencode-sqlite-scan-scope'

// Adapt OpenCode reads to the shared worker queue and lazy host; spawning is wired in worker-spawn.

export const LIST_TIMEOUT_MS = 30_000
export const PARSE_TIMEOUT_MS = 15_000
// Full captures need more time than previews but must not block the FIFO queue indefinitely.
export const CAPTURE_TIMEOUT_MS = 30_000
export const IDLE_TEARDOWN_MS = 30_000
// Bound crash loops per active burst; successful responses or a fresh idle burst reset the death count.
export const MAX_CONSECUTIVE_DEATHS = 3

class OpenCodeSqliteWorkerUnavailableError extends Error {}

/** Serialize timed worker reads and fail closed; never run synchronous SQLite on the main thread. */
export class OpenCodeSqliteWorkerClient {
  private readonly requestTimeoutMs: number | undefined
  private readonly requests: WorkerThreadRequestQueue<
    OpenCodeSqliteWorkerRequest,
    OpenCodeSqliteWorkerResponse
  >

  constructor(options: {
    workerFactory: WorkerThreadFactory
    log?: (message: string) => void
    idleTeardownMs?: number
    requestTimeoutMs?: number
  }) {
    this.requestTimeoutMs = options.requestTimeoutMs
    const log = options.log ?? ((message: string) => console.warn(message))
    this.requests = new WorkerThreadRequestQueue({
      factory: options.workerFactory,
      idleTeardownMs: options.idleTeardownMs ?? IDLE_TEARDOWN_MS,
      queueCap: { maxQueuedCalls: 64, describeFull: () => 'OpenCode SQLite reader queue is full.' },
      maxConsecutiveDeaths: MAX_CONSECUTIVE_DEATHS,
      createUnavailableError: (message) => new OpenCodeSqliteWorkerUnavailableError(message),
      describeTimeout: (timeoutMs) => `OpenCode SQLite worker timed out after ${timeoutMs}ms`,
      describeExit: (code) => `OpenCode SQLite worker exited with code ${code}`,
      describeCrashLoop: (lastError) =>
        `OpenCode SQLite worker crashed repeatedly; skipping remaining sessions (${lastError})`,
      // Missing bundles or failed spawns must not reintroduce main-thread SQLite hangs (#8864).
      onUnavailable: (err) =>
        log(`OpenCode SQLite worker unavailable; skipping its history. ${errorMessage(err)}`)
    })
  }

  async readNativeChat(
    args: Omit<OpenCodeNativeChatReadRequest, 'id'>,
    signal?: AbortSignal
  ): Promise<OpenCodeNativeChatReadValue> {
    const value = await this.dispatch(
      (id) => ({ ...args, id }),
      PARSE_TIMEOUT_MS,
      signal,
      'native-chat'
    )
    // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: Only this build's internal worker dispatch constructs page/signal results; they are not client-supplied paths or frames.
    return value as OpenCodeNativeChatReadValue
  }

  async readForkCoverage(
    args: Omit<OpenCodeForkCoverageRequest, 'id' | 'kind'>,
    signal?: AbortSignal
  ): Promise<string[]> {
    const value = await this.dispatch(
      (id) => ({ ...args, id, kind: 'fork-coverage' }),
      PARSE_TIMEOUT_MS,
      signal,
      'native-chat'
    )
    // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: This build's bundled reader constructs the private coverage result.
    return value as string[]
  }

  dispose(): void {
    this.requests.dispose()
  }

  private async dispatch(
    buildRequest: (id: number) => OpenCodeSqliteWorkerRequest,
    timeoutMs: number,
    signal?: AbortSignal,
    agent: 'native-chat' = 'native-chat'
  ): Promise<unknown> {
    const deadline = this.requestTimeoutMs ?? timeoutMs
    const response = await runOpenCodeSqliteScanRequest(
      signal,
      (requestSignal, owner) =>
        this.requests.dispatch(
          (id) => ({ ...buildRequest(id), timeoutMs: deadline }),
          deadline,
          requestSignal,
          owner
        ),
      agent
    )
    if (!response.ok) {
      throw new Error(response.error)
    }
    return response.value
  }
}