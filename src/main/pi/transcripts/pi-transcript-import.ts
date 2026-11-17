import { homedir } from 'node:os'
import { join } from 'node:path'
import type { AiVaultAgent } from '../../../shared/ai-vault/contracts/ai-vault-types'
import { sessionIdFromFileName } from '../../ai-vault/parsing/session-scanner-accumulator'
import { walkSessionFiles } from '../../ai-vault/discovery/session-scanner-discovery'
import { normalizeAgentSessionsDir } from '../../ai-vault/discovery/agent-session-directories'
import { directoryTranscriptImport } from '../../native-chat/conversation-adoption/structured-agent-cli-conversations'
import { readPiSessionHeader } from '../rpc/launch/rpc-launch-resolution'

export const PI_TRANSCRIPT_IMPORT = directoryTranscriptImport({
  // pi is no longer an AiVaultAgent; resolve its sessions dir directly here.
  conversationStore: () =>
    normalizeAgentSessionsDir(
      process.env.PI_CODING_AGENT_DIR?.trim() || join(homedir(), '.pi', 'agent', 'sessions'),
      '.pi'
    ),
  // Session History's host source is authoritative, including when the chat chose another home.
  accountHomeCandidates: () => [
    process.env.PI_CODING_AGENT_DIR?.trim() || join(homedir(), '.pi', 'agent')
  ],
  findTranscript: async ({ providerSessionId, store, strictErrors }) => {
    const files = await walkSessionFiles(store, 'pi' as AiVaultAgent, [], {
      extensions: new Set(['.jsonl']),
      strictErrors,
      filePredicate: (path) => sessionIdFromFileName(path) === providerSessionId
    })
    if (files.length !== 1) {
      return null
    }
    const file = files[0]
    if (!file) {
      return null
    }
    const header = await readPiSessionHeader(file)
    if (header?.id !== providerSessionId) {
      return null
    }
    return file
  },
  handleNamesTranscript: true
})
