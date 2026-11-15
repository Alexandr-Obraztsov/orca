import type { FileLinkActions } from '@/components/terminal-pane/links/files/terminal-file-link-actions'
import type { NativeChatComposerHandle } from '../../composer/native-chat-composer-types'
import type { NativeChatFileLinkContext } from '../../links/actions/native-chat-file-link-context'
import { nativeChatLinkActions } from '../../links/actions/native-chat-link-target-actions'
import { readNativeChatQuotableSelection } from '../../selection-quotes/native-chat-quote-selection'
import type { NativeChatMessageListHandle } from '../../messages/actions/use-native-chat-reveal-latest'
import type { NativeChatReplySource } from '../../composer/reply/native-chat-reply-context'

export type NativeChatContextMenuTarget = {
  /** The selection the "Add to chat" offer would quote. */
  quoteText: string | null
  link: FileLinkActions | null
  codeText: string | null
  messageText: string | null
  rewindItemId: string | null
  /** The message a Reply would answer, and where in the chat it was right-clicked. */
  replyTo: { source: NativeChatReplySource; from: Element } | null
}

export const noNativeChatContextMenuTarget: NativeChatContextMenuTarget = {
  quoteText: null,
  link: null,
  codeText: null,
  messageText: null,
  rewindItemId: null,
  replyTo: null
}

export type NativeChatContextMenuTargetSources = {
  root: HTMLElement | null
  composer: Pick<NativeChatComposerHandle, 'acceptsText'> | null
  messageList: Pick<NativeChatMessageListHandle, 'messageCopyText'> | null
  linkContext: NativeChatFileLinkContext | null
}

/** Rows mark themselves with ids only; their text comes from the transcript the rows draw. */
export function readNativeChatContextMenuTarget(
  target: EventTarget | null,
  { root, composer, messageList, linkContext }: NativeChatContextMenuTargetSources
): NativeChatContextMenuTarget {
  const element = target instanceof Element ? target : null
  const quotable = root && composer?.acceptsText() ? readNativeChatQuotableSelection(root) : null
  // The attribute, not the resolved `href` property, which rewrites chat file links into page URLs.
  const link = element?.closest('a[href], [data-native-chat-link-href]')
  const href = link?.getAttribute('data-native-chat-link-href') ?? link?.getAttribute('href')
  const messageRow = element?.closest('[data-native-chat-message-id]')
  const messageId = messageRow?.getAttribute('data-native-chat-message-id')
  const author = messageRow?.getAttribute('data-native-chat-message-author')
  const messageText = (messageId && messageList?.messageCopyText(messageId)) || null
  return {
    quoteText: quotable?.text ?? null,
    link: href ? nativeChatLinkActions(href, linkContext) : null,
    codeText:
      element
        ?.closest('[data-native-chat-code-block]')
        ?.querySelector('[data-native-chat-code-content]')?.textContent || null,
    messageText,
    rewindItemId:
      element
        ?.closest('[data-native-chat-rewind-item]')
        ?.getAttribute('data-native-chat-rewind-item') ?? null,
    replyTo:
      element && messageId && messageText && (author === 'agent' || author === 'user')
        ? { source: { messageId, author, text: messageText }, from: element }
        : null
  }
}
