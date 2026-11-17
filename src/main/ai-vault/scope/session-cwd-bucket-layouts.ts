import { basename, join } from 'node:path'
import type { AiVaultAgent } from '../../../shared/ai-vault/contracts/ai-vault-types'
import {
  claudeProjectBucketScopePrefixes,
  isClaudeProjectBucketInScope
} from '../scanners/claude/claude-project-dir-encoding'

export type CwdBucketLayout = {
  agent: AiVaultAgent
  encodeScopePrefixes: (scopePath: string) => string[]
  isDirInScope: (dirName: string, prefixes: ReadonlySet<string>) => boolean
  /** Folders whose children are cwd buckets; defaults to the root itself. */
  bucketDirs?: (rootDir: string) => string[]
}

export const CLAUDE_CWD_BUCKET_LAYOUT: CwdBucketLayout = {
  agent: 'claude',
  encodeScopePrefixes: claudeProjectBucketScopePrefixes,
  isDirInScope: isClaudeProjectBucketInScope
}
function encodePiSessionDirPrefix(pathValue: string): string {
  const trimmed = pathValue.length > 1 ? pathValue.replace(/[/\\]+$/, '') : pathValue
  return `--${trimmed.replace(/^[/\\]/, '').replace(/[/\\:]/g, '-')}`
}

export const PI_CWD_BUCKET_LAYOUT: CwdBucketLayout = {
  // Non-AiVault layout consumed by the OMP subsystem via encodeScopePrefixes only;
  // `agent` is unused there and is assigned a valid AiVaultAgent solely to satisfy the type.
  agent: 'claude',
  // PI_CODING_AGENT_DIR=<dir> makes Pi's root the agent folder, whose buckets sit under sessions/.
  bucketDirs: (rootDir) =>
    basename(rootDir) === 'sessions' ? [rootDir] : [rootDir, join(rootDir, 'sessions')],
  encodeScopePrefixes: (pathValue) => {
    const raw = encodePiSessionDirPrefix(pathValue)
    const composed = encodePiSessionDirPrefix(pathValue.normalize('NFC'))
    return raw === composed ? [raw] : [raw, composed]
  },
  isDirInScope: (dirName, prefixes) => {
    for (const prefix of prefixes) {
      // Root scope encodes to -- and includes every Pi bucket.
      if (prefix === '--' && dirName.startsWith('--') && dirName.endsWith('--')) {
        return true
      }
      if (dirName === `${prefix}--` || dirName.startsWith(`${prefix}-`)) {
        return true
      }
    }
    return false
  }
}
