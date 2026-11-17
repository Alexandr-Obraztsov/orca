import type { AiVaultSession } from '../../../shared/ai-vault/contracts/ai-vault-types'
import type { SessionFileCandidate } from '../session-scanner-types'

/** Reapply sibling metadata to the transcript fold so rewritten sidecars replace earlier enrichment. */

export type SidecarEnrichment = {
  session: AiVaultSession | null
  /** Keep unreadable sidecars unknown so later scans retry. */
  refused: boolean
}

// Re-enrichment changes only these fields; retain other cached metadata and no-op identity.
export function reuseUnchangedSidecarSession(
  previous: AiVaultSession | null,
  next: AiVaultSession | null
): AiVaultSession | null {
  if (!previous || !next) {
    return next
  }
  if (
    previous.title === next.title &&
    previous.cwd === next.cwd &&
    previous.createdAt === next.createdAt &&
    previous.updatedAt === next.updatedAt &&
    previous.resumeCommand === next.resumeCommand &&
    previous.model === next.model
  ) {
    return previous
  }
  return {
    ...previous,
    title: next.title,
    cwd: next.cwd,
    createdAt: next.createdAt,
    updatedAt: next.updatedAt,
    resumeCommand: next.resumeCommand,
    model: next.model
  }
}

// Only Cursor and Devin used sibling sidecar metadata; neither is a live AiVault agent anymore.
export function sidecarEnrichesWithoutReparse(_candidate: SessionFileCandidate): boolean {
  return false
}

export async function enrichSessionFromSidecar(
  _candidate: SessionFileCandidate,
  foldSession: AiVaultSession | null,
  _platform: NodeJS.Platform,
  _signal?: AbortSignal
): Promise<SidecarEnrichment> {
  return { session: foldSession, refused: false }
}