// A message the next send replies to, kept per draft scope apart from the draft record so the
// draft schema stays unchanged; small and bounded, so localStorage holds it across reloads.

import { useSyncExternalStore } from 'react'

export type NativeChatReplyTarget = {
  /** Unique per Reply click: a send consumes only the target it captured, never a newer one. */
  readonly id: string
  readonly messageId: string
  readonly author: 'agent' | 'user'
  /** What the strip shows and the quote carries; the agent already holds the full message. */
  readonly excerpt: string
}

/** Quote length: enough to identify the message without resending it. */
export const NATIVE_CHAT_REPLY_EXCERPT_MAX = 500
/** Scopes remembered at once; older targets are dropped first. */
export const NATIVE_CHAT_REPLY_TARGETS_MAX = 30
const STORAGE_KEY = 'orca.nativeChat.replyTargets.v1'

const targets = new Map<string, NativeChatReplyTarget>()
const listeners = new Map<string, Set<() => void>>()
let loaded = false
let sequence = 0

function isTarget(value: unknown): value is NativeChatReplyTarget {
  if (!value || typeof value !== 'object') {
    return false
  }
  const target = value as Record<string, unknown>
  return (
    typeof target.id === 'string' &&
    typeof target.messageId === 'string' &&
    (target.author === 'agent' || target.author === 'user') &&
    typeof target.excerpt === 'string'
  )
}

function load(): void {
  if (loaded) {
    return
  }
  loaded = true
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY)
    const entries: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(entries)) {
      return
    }
    for (const entry of entries) {
      if (Array.isArray(entry) && typeof entry[0] === 'string' && isTarget(entry[1])) {
        targets.set(entry[0], {
          ...entry[1],
          excerpt: entry[1].excerpt.slice(0, NATIVE_CHAT_REPLY_EXCERPT_MAX + 1)
        })
      }
    }
  } catch {
    // Unreadable or blocked storage only costs the remembered strip, never the draft.
  }
}

function save(): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify([...targets]))
  } catch {
    // Quota or blocked storage: the target still works for this session.
  }
}

function notify(scopeKey: string): void {
  for (const listener of listeners.get(scopeKey) ?? []) {
    listener()
  }
}

/** The first non-empty lines up to the cap, with an ellipsis when cut. */
export function nativeChatReplyExcerpt(text: string): string {
  const trimmed = text.trim()
  if (trimmed.length <= NATIVE_CHAT_REPLY_EXCERPT_MAX) {
    return trimmed
  }
  return `${trimmed.slice(0, NATIVE_CHAT_REPLY_EXCERPT_MAX).trimEnd()}…`
}

export function createNativeChatReplyTarget(
  message: Omit<NativeChatReplyTarget, 'id' | 'excerpt'> & { text: string }
): NativeChatReplyTarget {
  sequence += 1
  return {
    id: `${Date.now().toString(36)}-${sequence}`,
    messageId: message.messageId,
    author: message.author,
    excerpt: nativeChatReplyExcerpt(message.text)
  }
}

export function readNativeChatReplyTarget(scopeKey: string): NativeChatReplyTarget | null {
  load()
  return targets.get(scopeKey) ?? null
}

export function setNativeChatReplyTarget(scopeKey: string, target: NativeChatReplyTarget): void {
  load()
  targets.delete(scopeKey)
  targets.set(scopeKey, target)
  while (targets.size > NATIVE_CHAT_REPLY_TARGETS_MAX) {
    const oldest = targets.keys().next().value
    if (oldest === undefined) {
      break
    }
    targets.delete(oldest)
  }
  save()
  notify(scopeKey)
}

/** Clears the scope's target; with `id`, only when it is still that target, so a newer Reply survives a send. */
export function clearNativeChatReplyTarget(scopeKey: string, id?: string): void {
  load()
  const current = targets.get(scopeKey)
  if (!current || (id !== undefined && current.id !== id)) {
    return
  }
  targets.delete(scopeKey)
  save()
  notify(scopeKey)
}

function subscribe(scopeKey: string, listener: () => void): () => void {
  let set = listeners.get(scopeKey)
  if (!set) {
    set = new Set()
    listeners.set(scopeKey, set)
  }
  set.add(listener)
  return () => {
    set.delete(listener)
    if (set.size === 0) {
      listeners.delete(scopeKey)
    }
  }
}

export function useNativeChatReplyTarget(scopeKey: string): NativeChatReplyTarget | null {
  return useSyncExternalStore(
    (listener) => subscribe(scopeKey, listener),
    () => readNativeChatReplyTarget(scopeKey)
  )
}

/** The text a reply sends: a quote of the message it answers, written for the agent, then the user's words. */
export function withNativeChatReplyContext(
  text: string,
  target: Pick<NativeChatReplyTarget, 'author' | 'excerpt'> | null
): string {
  if (!target) {
    return text
  }
  const quoted = target.excerpt
    .split(/\r?\n/)
    .map((line) => (line.trim() ? `> ${line}` : '>'))
    .join('\n')
  const head =
    target.author === 'agent' ? '> Replying to your message:' : '> Replying to my earlier message:'
  const body = text.trim()
  return body ? `${head}\n${quoted}\n\n${text}` : `${head}\n${quoted}`
}

/** Test-only: forget all targets and reload from storage on next read. */
export function resetNativeChatReplyTargetsForTests(): void {
  targets.clear()
  listeners.clear()
  loaded = false
}
