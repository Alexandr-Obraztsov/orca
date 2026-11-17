import type { AiVaultAgent, AiVaultSession } from '../contracts/ai-vault-types'

type LogFileResolver = (filePath: string) => string | null

const jsonlLog: LogFileResolver = (filePath) => (/\.jsonl$/i.test(filePath) ? filePath : null)

// Storage locators may name metadata or a shared database, rather than one conversation's log.
const logFileResolvers = {
  claude: jsonlLog,
  codex: jsonlLog,
  nessy: jsonlLog
} satisfies Record<AiVaultAgent, LogFileResolver>

export function aiVaultSessionLogFilePath(
  session: Pick<AiVaultSession, 'agent' | 'filePath'>
): string | null {
  const filePath = session.filePath.trim()
  return filePath ? logFileResolvers[session.agent](filePath) : null
}
