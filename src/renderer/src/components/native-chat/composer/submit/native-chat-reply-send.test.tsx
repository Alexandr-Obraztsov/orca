// @vitest-environment happy-dom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearNativeChatComposerDraftsForTests } from '../../drafts/native-chat-draft-reset'
import { hydrateNativeChatComposerDrafts } from '../../drafts/native-chat-composer-draft-load'
import {
  createMemoryNativeChatComposerDraftStorage,
  setNativeChatComposerDraftStorageForTests
} from '../../drafts/native-chat-composer-draft-storage'
import { useNativeChatDraft } from '../../drafts/use-native-chat-draft'
import { dispatchStructuredAgentSessionComposerCommand } from '../../../../../../shared/agent-session/view/structured-agent-session-composer'
import type { NativeChatStructuredComposerTransport } from './native-chat-structured-composer-transport'
import { useNativeChatStructuredComposerSend } from './use-native-chat-structured-composer-send'
import { useNativeChatPtyComposerSend } from './use-native-chat-pty-composer-send'
import type { NativeChatResolvedTarget } from './native-chat-composer-target'
import {
  readNativeChatReplyTarget,
  resetNativeChatReplyTargetsForTests,
  setNativeChatReplyTarget
} from '../reply/native-chat-reply-target'

vi.mock('@/components/native-chat/telemetry/native-chat-telemetry', () => ({
  emitNativeChatMessageSent: vi.fn()
}))

const scope = 'agent-session:reply'
const target = {
  id: 'reply-1',
  messageId: 'm-7',
  author: 'agent' as const,
  excerpt: 'Updated the three cards.\nThe Continue button is blue now.'
}

function fixture(accept: boolean | (() => Promise<boolean>)) {
  const transport: NativeChatStructuredComposerTransport = {
    capturePresentation: () => () => true,
    send: vi.fn(() => (typeof accept === 'function' ? accept() : accept)),
    dispatchCommand: (text) =>
      dispatchStructuredAgentSessionComposerCommand(text, {
        agent: 'codex',
        snapshot: [],
        invokeAction: async () => true,
        setOption: async () => true
      }),
    optionsSurface: {
      getSnapshot: () => [],
      setOption: vi.fn(),
      invokeAction: vi.fn(),
      subscribe: () => () => {}
    },
    optionSnapshot: [],
    onError: vi.fn(),
    runtime: 'local',
    sessionId: 'reply',
    runtimeEnvironmentId: null
  }
  const hook = renderHook(() => {
    const draft = useNativeChatDraft(scope, () => false)
    return useNativeChatStructuredComposerSend({
      agent: 'codex',
      draftScopeKey: scope,
      imageAttachments: [],
      structuredTransport: transport,
      isComposing: () => false,
      clearSkillOrigin: vi.fn(),
      setDraft: draft.setDraft,
      setCaret: vi.fn()
    })
  })
  return { transport, send: (text: string) => hook.result.current(text, []) }
}

describe('replying to a message from a structured chat', () => {
  beforeEach(async () => {
    localStorage.clear()
    resetNativeChatReplyTargetsForTests()
    clearNativeChatComposerDraftsForTests()
    setNativeChatComposerDraftStorageForTests(createMemoryNativeChatComposerDraftStorage())
    await hydrateNativeChatComposerDrafts()
  })
  afterEach(() => {
    cleanup()
    clearNativeChatComposerDraftsForTests()
  })

  it('sends the quote once before the text and clears the reply when accepted', async () => {
    setNativeChatReplyTarget(scope, target)
    const { transport, send } = fixture(true)
    await act(async () => {
      await send('Why blue?')
    })
    expect(transport.send).toHaveBeenCalledWith(
      '> Replying to your message:\n> Updated the three cards.\n> The Continue button is blue now.\n\nWhy blue?',
      []
    )
    expect(readNativeChatReplyTarget(scope)).toBeNull()
  })

  it('keeps the reply when the send is refused', async () => {
    setNativeChatReplyTarget(scope, target)
    const { send } = fixture(false)
    await act(async () => {
      await send('Why blue?')
    })
    expect(readNativeChatReplyTarget(scope)?.id).toBe('reply-1')
  })

  it('keeps a newer reply picked while the send was in flight', async () => {
    setNativeChatReplyTarget(scope, target)
    const admission = Promise.withResolvers<boolean>()
    const { send } = fixture(() => admission.promise)
    let pending: Promise<boolean> | undefined
    act(() => {
      pending = send('Why blue?')
    })
    setNativeChatReplyTarget(scope, { ...target, id: 'reply-2', messageId: 'm-9' })
    await act(async () => {
      admission.resolve(true)
      await pending
    })
    expect(readNativeChatReplyTarget(scope)?.id).toBe('reply-2')
  })

  it('never quotes a command and leaves the reply for the next message', async () => {
    setNativeChatReplyTarget(scope, target)
    const { transport, send } = fixture(true)
    await act(async () => {
      await send('/compact')
    })
    expect(transport.send).not.toHaveBeenCalled()
    expect(readNativeChatReplyTarget(scope)?.id).toBe('reply-1')
  })
})

const runtimeSend = vi.hoisted(() => ({ sendNativeChatMessage: vi.fn(() => ({})) }))
vi.mock('../../session/terminal/send/native-chat-runtime-send', async (load) => ({
  ...(await load<object>()),
  sendNativeChatMessage: runtimeSend.sendNativeChatMessage
}))

describe('replying to a message from a terminal chat', () => {
  const ptyScope = 'pane:reply'
  beforeEach(async () => {
    localStorage.clear()
    resetNativeChatReplyTargetsForTests()
    clearNativeChatComposerDraftsForTests()
    setNativeChatComposerDraftStorageForTests(createMemoryNativeChatComposerDraftStorage())
    await hydrateNativeChatComposerDrafts()
    runtimeSend.sendNativeChatMessage.mockClear()
  })
  afterEach(() => cleanup())

  function ptySend(draft: string) {
    const hook = renderHook(() =>
      useNativeChatPtyComposerSend({
        agent: 'codex',
        draft,
        draftScopeKey: ptyScope,
        imageAttachments: [],
        disabled: false,
        isDispatchingSessionOption: false,
        launchDraftResolved: true,
        resolveTarget: (): NativeChatResolvedTarget => ({ ptyId: 'pty-1' }),
        classifySend: () => 'chat',
        sessionOptionsSurface: null,
        terminalTabId: 'tab-1',
        trackPendingSend: vi.fn(),
        setDraft: vi.fn(),
        setCaret: vi.fn(),
        clearSkillOrigin: vi.fn(),
        clearImageAttachments: vi.fn(),
        setNotice: vi.fn()
      })
    )
    return hook.result.current
  }

  it('quotes once, clears the reply, and a retry resends its own text without the newer reply', () => {
    setNativeChatReplyTarget(ptyScope, target)
    const send = ptySend('Why blue?')
    act(() => {
      send()
    })
    const quoted =
      '> Replying to your message:\n> Updated the three cards.\n> The Continue button is blue now.\n\nWhy blue?'
    expect(runtimeSend.sendNativeChatMessage).toHaveBeenLastCalledWith(
      'pty-1',
      quoted,
      expect.anything()
    )
    expect(readNativeChatReplyTarget(ptyScope)).toBeNull()
    setNativeChatReplyTarget(ptyScope, { ...target, id: 'reply-2', author: 'user' })
    act(() => {
      send({ text: quoted })
    })
    expect(runtimeSend.sendNativeChatMessage).toHaveBeenLastCalledWith(
      'pty-1',
      quoted,
      expect.anything()
    )
    expect(readNativeChatReplyTarget(ptyScope)?.id).toBe('reply-2')
  })
})
