import { claudeHookService } from '../../claude/hook-service'
import { codexHookService } from '../../codex/hooks/installation/hook-service'
import { qwenCodeHookService } from '../../qwen-code/hook-service'
import type { AgentHookInstallStatus } from '../../../shared/agent-hook-listener/configuration/agent-hook-types'
import type { HookInstallAgent } from '../../../shared/telemetry/schemas/telemetry-daemon-event-schemas'

export type ManagedAgentHookInstallOptions = { userInitiated?: boolean; cliVersion?: string }
export type ManagedAgentHookInstaller = readonly [
  HookInstallAgent,
  (
    options?: ManagedAgentHookInstallOptions
  ) => AgentHookInstallStatus | Promise<AgentHookInstallStatus>
]
export type ManagedAgentHookScriptRefresher = readonly [HookInstallAgent, () => Promise<void>]
export type ManagedAgentHookRemover = readonly [
  HookInstallAgent,
  () => AgentHookInstallStatus | Promise<AgentHookInstallStatus>
]
export type ManagedAgentHookAsyncRemover = readonly [
  HookInstallAgent,
  () => Promise<AgentHookInstallStatus>
]
export type ManagedAgentHookStatusReader = readonly [HookInstallAgent, () => AgentHookInstallStatus]

export const MANAGED_AGENT_HOOK_INSTALLERS: readonly ManagedAgentHookInstaller[] = [
  ['claude', (options) => claudeHookService.install({ claudeVersion: options?.cliVersion })],
  ['codex', () => codexHookService.reconcileHooks()],
  ['qwen-code', () => qwenCodeHookService.install()]
]

export const MANAGED_AGENT_HOOK_SCRIPT_REFRESHERS: readonly ManagedAgentHookScriptRefresher[] = [
  ['claude', () => claudeHookService.refreshManagedScripts()],
  ['codex', () => codexHookService.refreshManagedScripts()],
  ['qwen-code', () => qwenCodeHookService.refreshManagedScripts()]
]

export const MANAGED_AGENT_HOOK_REMOVERS: readonly ManagedAgentHookRemover[] = [
  ['claude', () => claudeHookService.remove()],
  ['codex', () => codexHookService.remove()],
  ['qwen-code', () => qwenCodeHookService.remove()]
]

export const MANAGED_AGENT_HOOK_ASYNC_REMOVERS: readonly ManagedAgentHookAsyncRemover[] = []

export const MANAGED_AGENT_HOOK_STATUS_READERS: readonly ManagedAgentHookStatusReader[] = [
  ['claude', () => claudeHookService.getStatus()],
  ['codex', () => codexHookService.getStatus()],
  ['qwen-code', () => qwenCodeHookService.getStatus()]
]