import type {
  AiVaultAgent,
  AiVaultSession,
  AiVaultFirstUserPromptResult as ReadAiVaultFirstUserPromptResult
} from '../../../shared/ai-vault/contracts/ai-vault-types'
import { LOCAL_EXECUTION_HOST_ID, type ExecutionHostId } from '../../../shared/execution-host'
import { wslGatedStat } from '../../native-chat/transcript-filesystem/wsl-transcript-fs-access'
import { parseAgentSessionFile } from '../parsing/session-scanner-agent-parser'
import { withFullFirstUserPromptCapture } from './session-scanner-first-user-prompt-capture'
import type { FileWithMtime } from '../session-scanner-types'
import type { OpenCodeWslRuntime } from '../scanners/opencode/reader-transport/session-scanner-opencode-wsl-runtime'
import { configureOpenCodeWslReaders } from '../scanners/opencode/reader-transport/session-scanner-opencode-wsl-client'

export type ReadAiVaultFirstUserPromptArgs = {
  agent: AiVaultAgent
  filePath: string
  sessionId?: string
  executionHostId?: ExecutionHostId
  codexHome?: string | null
  wslOpenCodeReaders?: readonly OpenCodeWslRuntime[]
}

/** Reparse one transcript with full first-prompt capture instead of listing preview limits. */
export async function readAiVaultFirstUserPrompt(
  args: ReadAiVaultFirstUserPromptArgs
): Promise<ReadAiVaultFirstUserPromptResult> {
  const filePath = args.filePath.trim()
  if (!filePath || !args.agent) {
    return { prompt: null }
  }

  // Transcript bodies belong to their execution host; remote rows fall back to preview text.
  const executionHostId = args.executionHostId ?? LOCAL_EXECUTION_HOST_ID
  if (executionHostId !== LOCAL_EXECUTION_HOST_ID) {
    return { prompt: null }
  }
  if (args.wslOpenCodeReaders) {
    configureOpenCodeWslReaders(args.wslOpenCodeReaders)
  }

  // Treat corrupt or partial transcripts as unavailable instead of rejecting the IPC call.
  let session: AiVaultSession | null
  try {
    session = await withFullFirstUserPromptCapture(() =>
      parseSessionForFullFirstUserPrompt({
        agent: args.agent,
        filePath,
        sessionId: args.sessionId?.trim() || undefined,
        codexHome: args.codexHome ?? null
      })
    )
  } catch {
    return { prompt: null }
  }

  const prompt = session?.firstUserPrompt?.trim() || null
  return { prompt }
}

async function parseSessionForFullFirstUserPrompt(args: {
  agent: AiVaultAgent
  filePath: string
  sessionId?: string
  codexHome: string | null
}): Promise<AiVaultSession | null> {
  // Full capture must run in the actual reader, including WSL guests.
  const file = await fileWithMtimeForPath(args.filePath)
  if (!file) {
    return null
  }

  return parseAgentSessionFile(
    {
      agent: args.agent,
      file,
      codexHome: args.codexHome
    },
    process.platform
  )
}

async function fileWithMtimeForPath(filePath: string): Promise<FileWithMtime | null> {
  try {
    // Use the parser's scan lane so stat cannot jump the live-transcript queue.
    const info = await wslGatedStat(filePath, 'scan')
    return {
      path: filePath,
      mtimeMs: info.mtimeMs,
      modifiedAt: info.mtime.toISOString(),
      sizeBytes: info.size
    }
  } catch {
    return null
  }
}
