import { describe, expect, it, vi } from 'vitest'
import { agentSessionRecordFixture } from '../../native-chat/testing/agent-session-record-test-fixture'
import { createAcpStructuredLaunchResolver } from '../../runtime/agent-session/launch/structured-agent-launch-composition.test-support'
import type { AgentSessionRecord } from '../../../shared/agent-session/lifecycle/agent-session-record'
import { LOCAL_EXECUTION_HOST_ID } from '../../../shared/execution-host'
import { NESSY_LAUNCH_SPEC } from '../../nessy/nessy-acp-launch-spec'

const SESSION_ID = 'session-1'
type AcpResolver = ReturnType<typeof createAcpStructuredLaunchResolver>
const IDENTITY = { sessionId: SESSION_ID } as Parameters<AcpResolver>[0]['identity']

function record(overrides: Partial<AgentSessionRecord> = {}): AgentSessionRecord {
  return agentSessionRecordFixture({
    sessionId: SESSION_ID,
    provider: 'nessy',
    location: {
      executionHostId: LOCAL_EXECUTION_HOST_ID,
      wslDistro: null,
      workspaceId: 'workspace-1',
      workspaceKind: 'git-worktree'
    },
    accountHome: { variable: 'NESSY_HOME', path: '/home/work/.nessy' },
    providerHandleChain: [],
    ...overrides
  })
}

function resolver() {
  return createAcpStructuredLaunchResolver(NESSY_LAUNCH_SPEC, {
    store: { getRecord: () => record(), pinLaunchDirectory: vi.fn() },
    resolveWorkspacePath: async (id) => `/repos/${id}`,
    resolveEnvironment: async () => ({}),
    resolveCommand: () => '/opt/bin/nessy',
    savedSession: { hasProviderTurn: async () => false },
    dataDirectory: '/orca-data'
  })
}

describe('nessy acp launch permission', () => {
  it.each(['full-access', 'accept-edits'] as const)(
    'runs with full access (auto-approve) under %s',
    async (permissionMode) => {
      const launch = await resolver()({
        identity: IDENTITY,
        spawnToken: 'token',
        permissionMode
      })
      expect(launch.fullAccess).toBe(true)
    }
  )

  it('does not auto-approve under ask', async () => {
    const launch = await resolver()({
      identity: IDENTITY,
      spawnToken: 'token',
      permissionMode: 'ask'
    })
    expect(launch.fullAccess).toBe(false)
  })
})
