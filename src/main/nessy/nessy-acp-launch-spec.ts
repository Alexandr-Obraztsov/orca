import { join } from 'node:path'
import type { AcpLaunchSpec } from '../acp/launch/acp-launch-contract'
import { GENERIC_ACP_DIALECT } from '../acp/acp-dialects/acp-dialect'
import { directoryAccountBinding } from '../acp/launch/acp-account-binding'
import { agentSessionSetupFor } from '../../shared/agent-session/lifecycle/launch/agent-session-setup-commands'
import {
  resumeInvocationFromOptions,
  type StructuredAgentSessionHistory
} from '../native-chat/conversation-adoption/structured-agent-cli-conversations'

// Nessy chats and terminals share ~/.nessy/projects and `--resume`/`--session-id` ids.
const NESSY_SESSION_HISTORY: StructuredAgentSessionHistory = {
  rowAgents: ['nessy'],
  rowSessionId: (link) => link.handle.nativeId,
  parseResumeArgs: (args) =>
    resumeInvocationFromOptions(args, {
      targetless: ['-c', '--continue'],
      markers: ['-r', '--resume', '--session-id']
    })
}

export const NESSY_LAUNCH_SPEC: AcpLaunchSpec = {
  agent: 'nessy',
  command: 'nessy',
  args: () => ['--acp'],
  // Nessy runs headless ACP; answer forms would otherwise open a TUI overlay ACP cannot draw.
  env: { NESSY_ACP: '1' },
  dialect: GENERIC_ACP_DIALECT,
  loginCommand: agentSessionSetupFor('nessy')?.loginCommand ?? [],
  account: directoryAccountBinding('NESSY_HOME', (homePath) => join(homePath, '.nessy')),
  installDirectories: ({ homePath }) => [join(homePath, '.nessy', 'bin')],
  modelDiscovery: {
    kind: 'session',
    // Nessy lists models inside a disposable ACP session; it advertises model-specific reasoning efforts.
    listingNamesConfiguredModel: false
  },
  transcriptImport: null,
  sessionHistory: NESSY_SESSION_HISTORY
}
