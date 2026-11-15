import { app, webContents } from 'electron'
import { rendererPublicationThrottle } from '../../../window/visibility/renderer-publication-throttle'
import type { BrowserManager } from '../../guest-lifecycle/manager/browser-manager'
import { OffscreenBrowserBackend } from '../offscreen-browser-backend'

async function run(): Promise<void> {
  // Serve must survive with no page open; keep Electron alive after last-window close.
  app.on('window-all-closed', () => {})
  await app.whenReady()
  const browserManager = {
    registerOffscreenGuest: () => true,
    unregisterGuest: () => {}
  }
  // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: createTab and closeTab only call these two members.
  const backend = new OffscreenBrowserBackend(browserManager as unknown as BrowserManager)
  const { browserPageId } = await backend.createTab({
    url: 'data:text/html,<body style="background:rgb(0,128,128)"><h1>Offscreen page</h1></body>'
  })
  const guest = webContents.fromId(backend.getWebContentsId(browserPageId) ?? -1)
  if (!guest) {
    throw new Error('Offscreen page has no WebContents')
  }
  if (guest.isLoading()) {
    await new Promise((resolve) => guest.once('did-stop-loading', resolve))
  }
  const unwatchedVisibility: unknown = await guest.executeJavaScript('document.visibilityState')

  // Agent screenshots hold this lease around CDP capture; it must still draw a hidden page.
  const release = rendererPublicationThrottle.acquire(guest)
  guest.debugger.attach('1.3')
  const capture: unknown = await guest.debugger.sendCommand('Page.captureScreenshot', {
    format: 'png'
  })
  guest.debugger.detach()
  release()
  const leasedCaptureBytes =
    typeof capture === 'object' && capture !== null && 'data' in capture
      ? Buffer.from(String(capture.data), 'base64').length
      : 0

  await backend.closeTab(browserPageId)
  console.log(JSON.stringify({ unwatchedVisibility, leasedCaptureBytes }))
  app.exit(0)
}

const deadline = setTimeout(() => app.exit(2), 30_000)
void run().catch((error: unknown) => {
  clearTimeout(deadline)
  console.error(error)
  app.exit(1)
})
