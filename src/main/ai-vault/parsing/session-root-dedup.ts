import type { AiVaultSession } from '../../../shared/ai-vault/contracts/ai-vault-types'
import {
  codexSessionAliasKey,
  codexSessionAliasBeats
} from '../scanners/codex/codex-session-root-dedup'

function sessionAliasKey(session: AiVaultSession): string | null {
  const codexKey = codexSessionAliasKey(session)
  return codexKey ? `codex\0${codexKey}` : null
}

function sessionAliasBeats(candidate: AiVaultSession, best: AiVaultSession): boolean {
  return codexSessionAliasBeats(candidate, best)
}

export function dedupeScannedSessions(sessions: readonly AiVaultSession[]): AiVaultSession[] {
  const bestByKey = new Map<string, AiVaultSession>()
  for (const session of sessions) {
    const key = sessionAliasKey(session)
    if (!key) {
      continue
    }
    const best = bestByKey.get(key)
    if (!best || sessionAliasBeats(session, best)) {
      bestByKey.set(key, session)
    }
  }
  return sessions.filter((session) => {
    const key = sessionAliasKey(session)
    if (!key) {
      return true
    }
    return bestByKey.get(key) === session
  })
}

type SessionWinner = { session: AiVaultSession; indices: number | number[] }

/** Scan-local accumulation; parsed rows must not be mutated after admission. */
export class ScannedSessionCollection {
  private readonly sessions = new Map<number, AiVaultSession>()
  // Reuse sessionId keys; allocate alias maps only for IDs spanning hosts, namespaces, or rollouts.
  private readonly winnersBySessionId = new Map<
    string,
    SessionWinner | Map<string, SessionWinner>
  >()
  private nextIndex = 0

  get size(): number {
    return this.sessions.size
  }

  values(): IterableIterator<AiVaultSession> {
    return this.sessions.values()
  }

  add(session: AiVaultSession): void {
    const key = sessionAliasKey(session)
    const index = this.nextIndex++
    if (key && !this.admit(session, key, index)) {
      return
    }
    this.sessions.set(index, session)
  }

  private admit(session: AiVaultSession, key: string, index: number): boolean {
    const bucket = this.winnersBySessionId.get(session.sessionId)
    if (bucket instanceof Map) {
      const winner = this.contest(bucket.get(key), session, index)
      if (winner) {
        bucket.set(key, winner)
      }
      return winner !== null
    }
    const bucketKey = bucket && sessionAliasKey(bucket.session)
    if (bucket && bucketKey && bucketKey !== key) {
      this.winnersBySessionId.set(
        session.sessionId,
        new Map([
          [bucketKey, bucket],
          [key, { session, indices: index }]
        ])
      )
      return true
    }
    const winner = this.contest(bucket, session, index)
    if (winner) {
      this.winnersBySessionId.set(session.sessionId, winner)
    }
    return winner !== null
  }

  private contest(
    best: SessionWinner | undefined,
    session: AiVaultSession,
    index: number
  ): SessionWinner | null {
    if (!best) {
      return { session, indices: index }
    }
    if (best.session === session) {
      // The batch filter retains every occurrence of the winning object.
      if (typeof best.indices === 'number') {
        best.indices = [best.indices, index]
      } else {
        best.indices.push(index)
      }
      return best
    }
    if (!sessionAliasBeats(session, best.session)) {
      return null
    }
    if (typeof best.indices === 'number') {
      this.sessions.delete(best.indices)
    } else {
      for (const previousIndex of best.indices) {
        this.sessions.delete(previousIndex)
      }
    }
    return { session, indices: index }
  }
}
