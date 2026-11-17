import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../ipc/command-path/agent-detection-shell-path', () => ({
  hydrateShellPathForAgentDetection: vi.fn()
}))

import { detectInstalledAgents } from './installed-agent-detection'

describe('detectInstalledAgents command overrides', () => {
  let dir: string
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'orca agent override '))
  })
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('lists an agent outside PATH only when its override executable exists', async () => {
    const executable = path.join(dir, process.platform === 'win32' ? 'codex.exe' : 'codex')
    await writeFile(executable, '#!/bin/sh\n')
    await chmod(executable, 0o755)

    // A resolvable override executable counts as installed even when the agent is otherwise absent.
    await expect(
      detectInstalledAgents(undefined, { agentCmdOverrides: { codex: `"${executable}"` } })
    ).resolves.toContain('codex')
    // A missing override adds nothing beyond the plain environment detection: codex/claude/qwen-code/nessy
    // may be genuinely installed, so only the override-driven delta is asserted.
    const baseline = await detectInstalledAgents(undefined, {})
    await expect(
      detectInstalledAgents(undefined, {
        agentCmdOverrides: { codex: `"${path.join(dir, 'missing', 'codex')}"` }
      })
    ).resolves.toEqual(baseline)
  })
})