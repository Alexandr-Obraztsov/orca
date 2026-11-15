import { app, BrowserWindow } from 'electron'
import { createServer } from 'node:http'

const RAF = (ms: number): string => `new Promise((resolve) => {
  requestAnimationFrame(() => resolve(true))
  setTimeout(() => resolve(false), ${ms})
})`

async function probe(mode: string, port: number, preloadBlank: boolean): Promise<unknown> {
  const win = new BrowserWindow({
    show: false,
    width: 1280,
    height: 800,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      ...(mode === 'fix' ? { show: false } : {})
    }
  })
  const wc = win.webContents
  const events: string[] = []
  const t0 = Date.now()
  for (const name of ['did-start-loading', 'did-finish-load', 'did-navigate', 'did-fail-load']) {
    wc.on(name as 'did-finish-load', () => events.push(`${name}@${Date.now() - t0}`))
  }
  if (preloadBlank) {
    void wc.loadURL('about:blank').catch(() => {})
  }
  await wc.loadURL(`http://127.0.0.1:${port}/`)
  const vis1 = await wc.executeJavaScript('document.visibilityState')
  const unleased = await wc.executeJavaScript(RAF(800))
  wc.setBackgroundThrottling(false)
  const leased = await wc.executeJavaScript(RAF(3000))
  const vis2 = await wc.executeJavaScript('document.visibilityState')
  let cdpBytes: unknown = null
  try {
    wc.debugger.attach('1.3')
    const shot = await Promise.race([
      wc.debugger.sendCommand('Page.captureScreenshot', { format: 'png' }),
      new Promise((resolve) => setTimeout(() => resolve('timeout'), 4000))
    ])
    cdpBytes = typeof shot === 'object' && shot && 'data' in shot ? String(shot.data).length : shot
    wc.debugger.detach()
  } catch (error) {
    cdpBytes = String(error)
  }
  win.destroy()
  return { mode, preloadBlank, vis1, unleased, leased, vis2, cdpBytes, events: events.join(' ') }
}

async function run(): Promise<void> {
  app.on('window-all-closed', () => {})
  await app.whenReady()
  const server = createServer((_q, r) => {
    r.setHeader('content-type', 'text/html')
    r.end('<h1>x</h1>')
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  const port = address && typeof address !== 'string' ? address.port : 0
  const results: unknown[] = []
  for (const preloadBlank of [true, false]) {
    for (const mode of ['control', 'fix', 'control', 'fix']) {
      results.push(await probe(mode, port, preloadBlank))
    }
  }
  server.close()
  console.log(JSON.stringify(results))
  app.exit(0)
}

setTimeout(() => app.exit(2), 100_000)
void run().catch((error: unknown) => {
  console.error(error)
  app.exit(1)
})
