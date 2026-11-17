import type { AiVaultSession } from '../../../shared/ai-vault/contracts/ai-vault-types'
import { parseClaudeSessionFile } from '../scanners/claude/session-scanner-primary-parsers'
import { parseCodexSessionFile } from '../scanners/codex/session-scanner-codex-parser'
import type { SessionFileCandidate } from '../session-scanner-types'
import type { TranscriptMessageSink } from '../transcripts/session-transcript-consumers'
import type { SkippedTranscriptRecord } from '../transcripts/session-transcript-record-budget'

export async function parseAgentSessionFile(
  candidate: SessionFileCandidate,
  platform: NodeJS.Platform,
  messages?: TranscriptMessageSink,
  _signal?: AbortSignal,
  _onSkippedRecords?: (records: SkippedTranscriptRecord[]) => void
): Promise<AiVaultSession | null> {
  switch (candidate.agent) {
    case 'claude':
      return parseClaudeSessionFile(candidate.file, platform, messages)
    case 'codex':
      return parseCodexSessionFile(
        candidate.file,
        platform,
        candidate.codexHome,
        undefined,
        messages
      )
    case 'nessy':
      return parseClaudeSessionFile(candidate.file, platform, messages)
  }
}
