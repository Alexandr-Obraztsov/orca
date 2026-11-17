import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  deliverStartupFollowupPrompt,
  type WorktreeStartupReadinessHost
} from './runtime-worktree-startup-readiness'

describe('startup follow-up prompt', () => {
  afterEach(() => vi.useRealTimers())

  function fixture(
    foreground: string,
    hostProvesAgent: boolean,
    hostProvesShellAlone = !hostProvesAgent,
    launchedForeground: 'agent' | 'unknown' = 'agent'
  ) {
    const write = vi.fn()
    const host: WorktreeStartupReadinessHost = {
      getPtyId: () => 'pty-1',
      getForegroundProcess: async () => foreground,
      hasChildProcesses: async () => false,
      subscribeToData: () => () => {},
      readRecentOutput: () => undefined,
      write
    }
    const sendTerminalAgentPrompt = vi.fn(async (handle: string) => ({
      handle,
      accepted: true,
      bytesWritten: 12
    }))
    const waitForFreshWorkerComposer = vi.fn(async () => ({ satisfied: true, status: 'running' }))
    // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: delivery reaches only these runtime methods; any other would throw.
    const runtime = {
      waitForFreshWorkerComposer,
      waitForTerminal: vi.fn(async () => ({ satisfied: true, status: 'idle' })),
      sendTerminalAgentPrompt,
      readLaunchedAgentForeground: vi.fn(async () => launchedForeground),
      subscribeToTerminalData: vi.fn(() => () => {}),
      launchedAgentHostProvesAgent: vi.fn(() => hostProvesAgent),
      launchedAgentHostProvesShellAlone: vi.fn(() => hostProvesShellAlone)
    } as unknown as Parameters<typeof deliverStartupFollowupPrompt>[0]
    return { host, write, runtime, sendTerminalAgentPrompt, waitForFreshWorkerComposer }
  }

  it('still refuses an agent.launch prompt on WSL or SSH-to-Windows, as before', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const f = fixture('codex', false, false, 'unknown')
    f.sendTerminalAgentPrompt.mockImplementation(async (handle: string, ...rest: unknown[]) => {
      const options = rest[1]
      if (options && typeof options === 'object' && 'beforeWrite' in options) {
        const { beforeWrite } = options
        if (typeof beforeWrite === 'function') {
          await beforeWrite('pty-1')
        }
      }
      return { handle, accepted: true, bytesWritten: 2 }
    })

    await expect(
      deliverStartupFollowupPrompt(
        f.runtime,
        f.host,
        'term-1',
        { agent: 'codex', prompt: 'go' },
        { agentLaunch: true }
      )
    ).resolves.toBe(false)
    expect(f.write).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('writes nothing on a Windows host while the shell stays in front', async () => {
    vi.useFakeTimers()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const f = fixture('pwsh', false)

    const delivered = deliverStartupFollowupPrompt(f.runtime, f.host, 'term-1', {
      agent: 'codex',
      prompt: 'fix the flaky test'
    })
    await vi.advanceTimersByTimeAsync(30 * 150)

    await expect(delivered).resolves.toBe(false)
    expect(f.sendTerminalAgentPrompt).not.toHaveBeenCalled()
    expect(f.write).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})