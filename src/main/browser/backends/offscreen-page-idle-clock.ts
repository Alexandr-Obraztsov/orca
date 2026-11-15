import type { WebContents } from 'electron'
import { rendererPublicationThrottle } from '../../window/visibility/renderer-publication-throttle'

export const SERVE_BROWSER_TAB_IDLE_MINUTES_ENV = 'ORCA_SERVE_BROWSER_TAB_IDLE_MINUTES'
const DEFAULT_IDLE_MINUTES = 30

/** How long a serve page may go unused before its renderer is freed; 0 keeps every page. */
export function resolveServeBrowserTabIdleMs(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env[SERVE_BROWSER_TAB_IDLE_MINUTES_ENV]?.trim()
  const minutes = raw ? Number(raw) : DEFAULT_IDLE_MINUTES
  return Number.isFinite(minutes) && minutes >= 0 ? minutes * 60_000 : DEFAULT_IDLE_MINUTES * 60_000
}

/** Fires once a page has gone the idle time without a command, capture or viewer lease. */
export class OffscreenPageIdleClock {
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>()
  private readonly untracks = new Map<string, () => void>()

  constructor(private readonly idleMs: number) {}

  track(browserPageId: string, contents: WebContents, onIdle: () => void): void {
    if (this.idleMs <= 0) {
      return
    }
    const arm = (): void => {
      this.clear(browserPageId)
      this.timers.set(
        browserPageId,
        setTimeout(() => {
          this.timers.delete(browserPageId)
          onIdle()
        }, this.idleMs)
      )
    }
    const stopObserving = rendererPublicationThrottle.observe(contents, (leased) =>
      leased ? this.clear(browserPageId) : arm()
    )
    this.untracks.set(browserPageId, () => {
      stopObserving()
      this.clear(browserPageId)
    })
    arm()
  }

  /** Starts the idle time over, as when a page that could not be freed is checked again. */
  restart(browserPageId: string, contents: WebContents, onIdle: () => void): void {
    this.untrack(browserPageId)
    this.track(browserPageId, contents, onIdle)
  }

  untrack(browserPageId: string): void {
    this.untracks.get(browserPageId)?.()
    this.untracks.delete(browserPageId)
  }

  private clear(browserPageId: string): void {
    const timer = this.timers.get(browserPageId)
    if (timer !== undefined) {
      clearTimeout(timer)
      this.timers.delete(browserPageId)
    }
  }
}
