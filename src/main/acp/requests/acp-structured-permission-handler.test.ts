import { describe, expect, it } from 'vitest'
import { acpStructuredPermissionHandler } from './acp-structured-permission-handler'
import { NESSY_LAUNCH_SPEC } from '../../nessy/nessy-acp-launch-spec'
import type { AcpStructuredChild } from '../session/children/acp-structured-child'

function readyChild(permission: 'full-access' | 'accept-edits' | 'ask'): AcpStructuredChild {
  return {
    lane: {},
    turns: { acceptsRequests: true },
    permission
  } as unknown as AcpStructuredChild
}

function allowOnceRequest() {
  return {
    sessionId: 'session-1',
    toolCall: { toolCallId: 't1', status: 'pending', kind: 'edit', content: [], locations: [] },
    options: [{ optionId: 'proceed_once', name: 'Allow', kind: 'allow_once' }]
  }
}

describe('acp structured permission handler', () => {
  it('auto-approves nessy requests under auto-edit as under full access', () => {
    const handler = acpStructuredPermissionHandler(
      () => readyChild('accept-edits'),
      NESSY_LAUNCH_SPEC,
      { handle: () => Promise.resolve({}) } as never
    )
    const reply = handler(allowOnceRequest() as never, { id: 1 } as never)
    expect(reply).toEqual({
      outcome: { outcome: 'selected', optionId: 'proceed_once' }
    })
  })

  it('still auto-approves under full access', () => {
    const handler = acpStructuredPermissionHandler(
      () => readyChild('full-access'),
      NESSY_LAUNCH_SPEC,
      { handle: () => Promise.resolve({}) } as never
    )
    const reply = handler(allowOnceRequest() as never, { id: 1 } as never)
    expect(reply).toEqual({
      outcome: { outcome: 'selected', optionId: 'proceed_once' }
    })
  })

  it('asks the person under ask', async () => {
    let opened = false
    const handler = acpStructuredPermissionHandler(() => readyChild('ask'), NESSY_LAUNCH_SPEC, {
      handle: () => {
        opened = true
        return Promise.resolve({ outcome: { outcome: 'cancelled' } })
      }
    } as never)
    await handler(allowOnceRequest() as never, { id: 1 } as never)
    expect(opened).toBe(true)
  })
})
