import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runElectronFixture } from '../electron-fixtures/electron-fixture-run'

describe('offscreen browser page painting', () => {
  // Builds a fixture bundle and launches real Electron, which is slow on CI runners.
  it('keeps unwatched pages hidden and paints leased pages across a site swap', async () => {
    const result = await runElectronFixture(
      join(import.meta.dirname, 'testing/offscreen-page-paint-electron-fixture.ts')
    )
    expect(result.timedOut).toBe(false)
    expect(result.code, `${result.signal}\n${result.stdout}\n${result.stderr}`).toBe(0)
    expect(result.output).toEqual({
      unwatchedVisibility: 'hidden',
      leasedPaints: true,
      swappedProcess: true,
      paintsAfterSiteSwap: true,
      paintsOnErrorPage: true
    })
  }, 60_000)
})
