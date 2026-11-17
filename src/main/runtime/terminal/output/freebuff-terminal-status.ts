import { FreebuffScreenStatusTracker } from '../../../../shared/freebuff-screen-status'
import type { HeadlessEmulator } from '../../../daemon/emulation/headless-emulator'

const trackers = new WeakMap<HeadlessEmulator, FreebuffScreenStatusTracker>()

export function observeFreebuffTerminalStatus(
  emulator: HeadlessEmulator,
  data: string,
  _startupCommand: string | undefined,
  launchAgent?: string | null
) {
  let tracker = trackers.get(emulator)
  if (!tracker) {
    const identified = launchAgent === 'freebuff'
    tracker = new FreebuffScreenStatusTracker(identified)
    trackers.set(emulator, tracker)
  }
  return tracker.observe(data, () => ({
    lines: emulator.getVisibleLines(),
    alternate: emulator.isAlternateScreen
  }))
}
