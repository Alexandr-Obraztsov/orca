import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Reply, X } from 'lucide-react'
import { cn } from '@/lib/class-names'
import { useTranslate } from '@/i18n/use-translate'
import { formatAgentTypeLabel } from '../../../../../../shared/agent-status/presentation/agent-type-label'
import {
  clearNativeChatReplyTarget,
  useNativeChatReplyTarget,
  type NativeChatReplyTarget
} from './native-chat-reply-target'
import { requestNativeChatMessageReveal } from './native-chat-reply-context'

/** "Replying to …" at the top of the message box: names the message the next send answers. */
export function NativeChatReplyStrip({
  scopeKey,
  agent,
  onDone
}: {
  scopeKey: string
  agent?: string
  /** Hands the user back to the message box after Cancel. */
  onDone: () => void
}): React.JSX.Element | null {
  const target = useNativeChatReplyTarget(scopeKey)
  if (!target) {
    return null
  }
  return (
    <ReplyStripRow
      key={target.id}
      scopeKey={scopeKey}
      agent={agent}
      target={target}
      onDone={onDone}
    />
  )
}

function ReplyStripRow({
  scopeKey,
  agent,
  target,
  onDone
}: {
  scopeKey: string
  agent?: string
  target: NativeChatReplyTarget
  onDone: () => void
}): React.JSX.Element {
  const t = useTranslate()
  const ref = useRef<HTMLDivElement>(null)
  // A rewind or clear can take the message out of this chat.
  const [available, setAvailable] = useState(true)
  // Passive, so the transcript's layout-time answer is already listening.
  useEffect(() => {
    setAvailable(requestNativeChatMessageReveal(ref.current, target.messageId, true))
  }, [target.messageId])
  // Esc clears the reply before it can interrupt the agent; an open picker takes Esc first.
  useEffect(() => {
    const composer = ref.current?.closest<HTMLElement>('[data-native-chat-composer-scope]')
    if (!composer) {
      return
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      const input = event.target instanceof Element ? event.target : null
      if (
        event.key !== 'Escape' ||
        event.isComposing ||
        !input?.closest('[contenteditable="true"], textarea') ||
        composer.querySelector('[role="listbox"]')
      ) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      clearNativeChatReplyTarget(scopeKey, target.id)
    }
    composer.addEventListener('keydown', onKeyDown, true)
    return () => composer.removeEventListener('keydown', onKeyDown, true)
  }, [scopeKey, target.id])
  const label =
    target.author === 'agent'
      ? formatAgentTypeLabel(agent)
      : t('components.native-chat.reply.you', 'You')
  const snippet = target.excerpt.split(/\r?\n/).find((line) => line.trim()) ?? ''
  const showOriginal = t('components.native-chat.reply.showOriginal', 'Show the original message')
  const unavailable = t('components.native-chat.reply.originalUnavailable', 'Message unavailable')
  const cancelLabel = t('components.native-chat.reply.cancel', 'Cancel reply')
  return (
    <div
      ref={ref}
      role="group"
      aria-label={t('components.native-chat.reply.replyingToLabel', 'Replying to {{name}}', {
        name: label
      })}
      className="mb-1.5 flex min-w-0 items-center gap-1.5 rounded-lg bg-muted/70 py-1 pr-1 pl-2 text-xs text-muted-foreground"
    >
      <Reply aria-hidden className="size-3.5 shrink-0" />
      <span className="shrink-0">
        {t('components.native-chat.reply.replyingTo', 'Replying to')}
      </span>
      <span className="shrink-0 font-medium text-foreground">{label}</span>
      {available ? (
        <button
          type="button"
          title={showOriginal}
          aria-label={`${showOriginal}: ${snippet}`}
          onClick={() => {
            if (!requestNativeChatMessageReveal(ref.current, target.messageId, false)) {
              setAvailable(false)
            }
          }}
          className={cn(
            'group/snip flex min-w-0 flex-1 items-center gap-1 rounded-sm text-left text-muted-foreground',
            'hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
        >
          <span className="truncate group-hover/snip:underline group-focus-visible/snip:underline">
            {snippet}
          </span>
          <ArrowUpRight aria-hidden className="size-3 shrink-0 opacity-70" />
        </button>
      ) : (
        // The cue never truncates; only the snippet after it does.
        <span className="flex min-w-0 flex-1 items-center gap-1" title={unavailable}>
          <span className="shrink-0 italic">{unavailable}</span>
          {snippet ? <span className="min-w-0 truncate">· {snippet}</span> : null}
        </span>
      )}
      <button
        type="button"
        aria-label={cancelLabel}
        title={cancelLabel}
        onClick={() => {
          clearNativeChatReplyTarget(scopeKey, target.id)
          onDone()
        }}
        className="flex size-6 shrink-0 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}
