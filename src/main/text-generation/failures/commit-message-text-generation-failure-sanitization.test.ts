import { describe, expect, it } from 'vitest'
import { generateCommitMessageFromContext } from '../commit-message-text-generation'

describe('generateCommitMessageFromContext', () => {
  it('formats nonzero exit failures with extracted sanitized CLI details', async () => {
    const result = await generateCommitMessageFromContext(
      {
        branch: 'main',
        stagedSummary: 'M\tREADME.md',
        stagedPatch: '+hello'
      },
      {
        agentId: 'custom',
        model: '',
        customAgentCommand: 'agent'
      },
      {
        kind: 'remote',
        cwd: '/repo',
        missingBinaryLocation: 'remote PATH',
        execute: async () => ({
          stdout: 'ERROR: fatal: C:\\Users\\Brennan Doe\\secret\\file.ts failed',
          stderr: '',
          exitCode: 1,
          timedOut: false
        })
      }
    )

    expect(result).toMatchObject({
      success: false,
      error: 'agent CLI command failed with code 1: ERROR: fatal: [path] failed'
    })
  })

  it('redacts UNC paths in CLI failure details', async () => {
    const result = await generateCommitMessageFromContext(
      {
        branch: 'main',
        stagedSummary: 'M\tREADME.md',
        stagedPatch: '+hello'
      },
      {
        agentId: 'custom',
        model: '',
        customAgentCommand: 'agent'
      },
      {
        kind: 'remote',
        cwd: '/repo',
        missingBinaryLocation: 'remote PATH',
        execute: async () => ({
          stdout: '',
          stderr: 'ERROR: failed at \\\\server\\share\\Brennan Repo\\secret\\file.ts',
          exitCode: 1,
          timedOut: false
        })
      }
    )

    expect(result).toMatchObject({
      success: false,
      error: 'agent CLI command failed with code 1: ERROR: failed at [path]'
    })
  })

  it('preserves slash-commands while redacting multi-segment paths in failure detail', async () => {
    const result = await generateCommitMessageFromContext(
      {
        branch: 'main',
        stagedSummary: 'M\tREADME.md',
        stagedPatch: '+hello'
      },
      {
        agentId: 'custom',
        model: '',
        customAgentCommand: 'agent'
      },
      {
        kind: 'remote',
        cwd: '/repo',
        missingBinaryLocation: 'remote PATH',
        execute: async () => ({
          stdout: '',
          stderr: 'ERROR: run /login then check /Users/name/repo',
          exitCode: 1,
          timedOut: false
        })
      }
    )

    expect(result).toMatchObject({
      success: false,
      error: 'agent CLI command failed with code 1: ERROR: run /login then check [path]'
    })
  })
})