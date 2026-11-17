/** Renderer and orchestration share launch feasibility/defaults; changes here must move both surfaces together. */

import { describe, expect, it } from 'vitest'
import { STRUCTURED_AGENT_SESSION_RUNTIME_CAPABILITY } from '../../agent-session/agent-session-runtime-capabilities'
import {
  resolveStructuredNativeChatSupport,
  type StructuredNativeChatSupportInput
} from './structured-native-chat-launch-route'

function support(overrides: Partial<StructuredNativeChatSupportInput> = {}) {
  return resolveStructuredNativeChatSupport({
    agent: 'claude',
    executionHostId: 'local',
    hostCapabilities: [STRUCTURED_AGENT_SESSION_RUNTIME_CAPABILITY],
    workspaceKind: 'git-worktree',
    ...overrides
  })
}

describe('per-launch structured feasibility', () => {
  const blockerCases: [string, Partial<StructuredNativeChatSupportInput>, string][] = [
    ['a reused PTY agent', { reusesTerminal: true }, 'reused-terminal'],
    ['a custom start directory', { startsOutsideWorkspaceRoot: true }, 'custom-start-directory'],
    ['a host-nested SSH project', { projectExecutionKind: 'ssh' }, 'remote-execution-host'],
    ['an SSH host', { executionHostId: 'ssh:host-a' }, 'remote-execution-host'],
    ['a missing capability', { hostCapabilities: [] }, 'runtime-capability'],
    ['an unanswered host', { hostCapabilities: null }, 'runtime-capability-unknown']
  ]

  it.each(blockerCases)('names %s as the blocker', (_name, overrides, blocker) => {
    expect(support(overrides)).toEqual({ supported: false, blocker })
  })

  it('blocks a WSL or repair-required project runtime', () => {
    expect(
      support({
        projectRuntime: {
          status: 'resolved',
          runtime: {
            kind: 'wsl',
            hostPlatform: 'wsl',
            projectId: 'repo-1',
            distro: 'Ubuntu',
            reason: 'project-override',
            cacheKey: 'wsl'
          }
        }
      })
    ).toEqual({ supported: false, blocker: 'project-runtime' })
    expect(
      support({
        projectRuntime: {
          status: 'repair-required',
          repair: {
            projectId: 'repo-1',
            preferredRuntime: { kind: 'wsl', distro: null },
            reason: 'wsl-distro-required',
            source: 'project-override',
            cacheKey: 'repair'
          }
        }
      })
    ).toEqual({ supported: false, blocker: 'project-runtime' })
  })
})
