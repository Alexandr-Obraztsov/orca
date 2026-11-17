import type {
  AiVaultSessionHandoffArgs,
  AiVaultSessionHandoffResult
} from '../../shared/ai-vault/contracts/ai-vault-session-handoff'

/** Copies one database-backed conversation into its own hand-off snapshot on this host,
 *  so the new agent never gets a path to the account-wide database.
 *
 *  OpenCode/OpenCode2/ZCode are no longer AiVault agents, so no AiVault row is account-wide:
 *  every hand-off keeps its preview copy and no database snapshot is written. */
export async function writeAiVaultSessionHandoffSnapshot(
  _args: Pick<AiVaultSessionHandoffArgs, 'agent' | 'filePath' | 'sessionId'>
): Promise<AiVaultSessionHandoffResult> {
  return {}
}