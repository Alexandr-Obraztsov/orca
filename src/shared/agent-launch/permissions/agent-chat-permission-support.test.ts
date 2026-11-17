import { describe, expect, it } from 'vitest'
import { agentChatPermissionModes } from './agent-chat-permission-support'

describe('agent chat permission support', () => {
  it('offers nessy chats every mode so the Permissions selector is shown', () => {
    expect(agentChatPermissionModes('nessy')).toEqual({
      modes: ['ask', 'accept-edits', 'auto', 'full-access']
    })
  })
})
