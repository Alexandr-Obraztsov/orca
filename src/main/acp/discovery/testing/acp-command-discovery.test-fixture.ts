import { mkdirSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import capture from '../../../../shared/__fixtures__/nessy-native-commands.json'
import { agentSessionRecordFixture } from '../../../native-chat/testing/agent-session-record-test-fixture'
import type { ProviderProcessCloseResult } from '../../../provider-process/provider-process-close'
import { AcpAtRestCommandCatalog, type AcpAtRestCommandDeps } from '../acp-at-rest-commands'
import { acpLaunchSpecFor } from '../../launch/acp-launch-registry'
import { FakeAcpChild } from '../../process/testing/acp-scripted-connection.test-fixture'

export const SPEC = acpLaunchSpecFor('nessy')!
export const DISCOVERY_SESSION = 'command-discovery'
export const record = (workspaceId = 'workspace-1') =>
  agentSessionRecordFixture({
    sessionId: `chat-${workspaceId}`,
    provider: 'nessy',
    accountHome: { variable: 'NESSY_HOME', path: '/accounts/nessy' },
    location: { workspaceId, workspaceKind: 'folder' }
  })

export class CommandDiscoveryChild extends FakeAcpChild {
  evidence: ProviderProcessCloseResult | null = null
  get rootVerdict(): ProviderProcessCloseResult['root'] {
    return this.exited ? 'exited' : 'live'
  }
  get lastCloseResult() {
    return this.evidence
  }
  override proveClose = async () => {
    this.exit()
    this.evidence = { root: 'exited' as const, tree: null }
    return true
  }
}

export async function commandDiscoveryRig(
  script?: (child: CommandDiscoveryChild) => void,
  overrides: Partial<AcpAtRestCommandDeps> = {},
  spec = SPEC
) {
  const root = await mkdtemp(join(tmpdir(), 'orca-31999-commands-'))
  const workspacePath = (id: string) => join(root, 'work', id)
  const children: CommandDiscoveryChild[] = []
  const catalog = new AcpAtRestCommandCatalog(spec, {
    dataDirectory: root,
    resolveWorkspacePath: async (id) => {
      const path = workspacePath(id)
      mkdirSync(path, { recursive: true })
      return path
    },
    resolveEnvironment: async () => ({ PATH: '/bin', NESSY_HOME: '/accounts/nessy' }),
    resolveCommand: () => '/configured/nessy',
    probeVersion: async () => ({ version: '18.12.6' }),
    resolveVisualsSkill: async () => ({
      pluginDir: '/installed/plugin',
      skillsRoot: '/installed/plugin/skills'
    }),
    isWindowsProcessStartTimeAvailable: () => true,
    connect: (launch) => {
      const child = new CommandDiscoveryChild(launch, {})
      children.push(child)
      child.agent.on('initialize', (frame) =>
        child.agent.reply(frame, { protocolVersion: 1, agentCapabilities: {} })
      )
      child.agent.on('session/new', (frame) => {
        child.agent.notify('session/update', {
          sessionId: DISCOVERY_SESSION,
          update: capture.enabled
        })
        child.agent.reply(frame, { sessionId: DISCOVERY_SESSION })
      })
      script?.(child)
      return child
    },
    ...overrides
  })
  return {
    catalog,
    children,
    root,
    workspacePath,
    dispose: async () => {
      await catalog.closeAll()
      children.forEach((child) => child.agent.close())
      await rm(root, { recursive: true, force: true })
    }
  }
}
