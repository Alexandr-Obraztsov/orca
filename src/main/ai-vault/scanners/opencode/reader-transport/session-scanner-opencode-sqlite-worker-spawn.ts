import { existsSync } from 'node:fs'
import type { Worker } from 'node:worker_threads'
import { spawnWorkerThread } from '../../../../worker-threads/worker-thread-spawn'
import { openCodeTranscriptPageLimit } from '../../../../../shared/agent-session/lifecycle/provider-handles/opencode-transcript-page-limit'
import { OpenCodeSqliteWorkerClient } from './session-scanner-opencode-sqlite-worker-client'
import {
  openCodeWslClient,
  openCodeWslPath
} from './session-scanner-opencode-wsl-client'
import { findForeignSqliteReaderEntry } from '../../../../foreign-sqlite-readers/foreign-sqlite-reader-entry-path'

export function resolveOpenCodeSqliteWorkerEntryPath(
  runtimeDir = __dirname,
  pathExists: (path: string) => boolean = existsSync
): string {
  return findForeignSqliteReaderEntry(runtimeDir, pathExists)
}

function defaultWorkerFactory(): Worker {
  const workerPath = resolveOpenCodeSqliteWorkerEntryPath()
  // Fail synchronously for missing bundles rather than waiting for an impossible worker response.
  if (!existsSync(workerPath)) {
    throw new Error(`OpenCode SQLite worker entry not found: ${workerPath}`)
  }
  return spawnWorkerThread(workerPath)
}

let sharedClient: OpenCodeSqliteWorkerClient | null = null

function getSharedClient(): OpenCodeSqliteWorkerClient {
  sharedClient ??= new OpenCodeSqliteWorkerClient({
    workerFactory: defaultWorkerFactory
  })
  return sharedClient
}

export async function readOpenCodeTranscriptPageViaWorker(
  args: {
    dbPath: string
    sessionId: string
    limit: number
    beforeMessageRowId?: number
    agent?: 'zcode'
  },
  signal?: AbortSignal
) {
  const wsl = openCodeWslPath(args.dbPath)
  const client = wsl ? await openCodeWslClient(wsl.distro, args.dbPath, signal) : getSharedClient()
  const value = await client.readNativeChat(
    {
      ...args,
      limit: openCodeTranscriptPageLimit(args.limit),
      dbPath: wsl?.linuxPath ?? args.dbPath,
      kind: 'native-page'
    },
    signal
  )
  if (value !== null && !('items' in value)) {
    throw new Error('Invalid OpenCode transcript page')
  }
  return value
}

export async function readOpenCodeTranscriptSignalViaWorker(
  args: {
    dbPath: string
    sessionId: string
    agent?: 'zcode'
  },
  signal?: AbortSignal
) {
  const wsl = openCodeWslPath(args.dbPath)
  const client = wsl ? await openCodeWslClient(wsl.distro, args.dbPath, signal) : getSharedClient()
  const value = await client.readNativeChat(
    { ...args, dbPath: wsl?.linuxPath ?? args.dbPath, kind: 'native-signal' },
    signal
  )
  if (value !== null && !('messageCount' in value)) {
    throw new Error('Invalid OpenCode transcript signal')
  }
  return value
}

export async function readOpenCodeForkCoverageViaWorker(
  args: { dbPath: string; sessionId: string; sourceSessionId: string },
  signal?: AbortSignal
): Promise<string[]> {
  const wsl = openCodeWslPath(args.dbPath)
  const client = wsl ? await openCodeWslClient(wsl.distro, args.dbPath, signal) : getSharedClient()
  return client.readForkCoverage({ ...args, dbPath: wsl?.linuxPath ?? args.dbPath }, signal)
}