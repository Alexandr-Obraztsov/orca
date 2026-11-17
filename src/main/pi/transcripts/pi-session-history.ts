import { sessionIdFromFileName } from '../../ai-vault/parsing/session-scanner-accumulator'
import {
  resumeInvocationFromOptions,
  sessionFileResumeTargetMatches,
  type StructuredAgentSessionHistory
} from '../../native-chat/conversation-adoption/structured-agent-cli-conversations'

export const PI_SESSION_HISTORY: StructuredAgentSessionHistory = {
  // pi is retained as a runtime but is no longer an AiVaultAgent.
  rowAgents: ['pi' as unknown as StructuredAgentSessionHistory['rowAgents'][number]],
  // Chat handles name the file path; Session History rows use its filename ID.
  rowSessionId: (link) => sessionIdFromFileName(link.handle.nativeId),
  // --resume opens a picker; --session-id reopens an ID; --fork creates a new session.
  parseResumeArgs: (args) =>
    resumeInvocationFromOptions(args, {
      targetless: ['-c', '--continue', '-r', '--resume'],
      markers: ['--session', '--session-id']
    }),
  resumeTargetMatches: sessionFileResumeTargetMatches
}
