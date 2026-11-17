import { join } from 'node:path'
import type { AcpLaunchSpec } from '../acp/launch/acp-launch-contract'
import { GENERIC_ACP_DIALECT } from '../acp/acp-dialects/acp-dialect'
import { directoryAccountBinding } from '../acp/launch/acp-account-binding'
import { agentSessionSetupFor } from '../../shared/agent-session/lifecycle/launch/agent-session-setup-commands'
import {
  resumeInvocationFromOptions,
  type StructuredAgentSessionHistory
} from '../native-chat/conversation-adoption/structured-agent-cli-conversations'

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
  // nessy serves ACP over stdio when launched with --acp.
  args: () => ['--acp'],
  env: {},
  dialect: GENERIC_ACP_DIALECT,
  loginCommand: agentSessionSetupFor('nessy')?.loginCommand ?? [],
  account: directoryAccountBinding('NESSY_HOME', (homePath) => join(homePath, '.nessy')),
  installDirectories: () => [],
  // nessy has no CLI/session model-listing hook; leave the chat's model selection to the session.
  modelDiscovery: { kind: 'unavailable', reason: 'nessy does not expose a model listing over ACP' },
  transcriptImport: null,
  sessionHistory: NESSY_SESSION_HISTORY
}