import { BrowserWindow } from 'electron'

/** Linux under Xvfb can bring a fresh process's first hidden window up visible and frameless; spend it on a throwaway page. */
export async function settleFirstWindow(): Promise<void> {
  const win = new BrowserWindow({ show: false, width: 320, height: 240 })
  await win.loadURL('about:blank')
  win.destroy()
}
