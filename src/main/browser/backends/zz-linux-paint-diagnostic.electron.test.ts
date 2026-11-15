import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runElectronFixture } from '../electron-fixtures/electron-fixture-run'

describe('TEMP linux paint diagnostic', () => {
  // Temporary CI diagnostic; launches real Electron several times.
  it('prints hidden-window paint facts', async () => {
    const result = await runElectronFixture(
      join(import.meta.dirname, 'testing/zz-linux-paint-diagnostic-electron-fixture.ts')
    )
    expect(
      `ZZDIAG ${process.platform} ${result.code} ${JSON.stringify(result.output, null, 1)} ${result.stderr.slice(-800)}`
    ).toBe('show')
  }, 150_000)
})
