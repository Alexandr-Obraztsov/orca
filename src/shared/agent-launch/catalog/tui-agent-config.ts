import type { TuiAgent } from './tui-agent'
import {
  getOrcaCliCommandNameForPlatform,
  skipsLinuxOrcaCliRename
} from '../../orca-cli-command-name'
import type { TuiAgentConfig, TuiAgentConfigSource } from './tui-agent-config-types'

function resolveTuiAgentConfig(source: TuiAgentConfigSource): TuiAgentConfig {
  return {
    ...source,
    launchCmd: source.launchCmd ?? source.detectCmd,
    expectedProcess: source.expectedProcess ?? source.detectCmd
  }
}

const TUI_AGENT_CONFIG_SOURCE: Record<TuiAgent, TuiAgentConfigSource> = {
  claude: {
    // Claude runs through the tclaude wrapper (T-Bank harness).
    detectCmd: 'tclaude',
    promptInjectionMode: 'argv',
    pasteNeedsTypedRequest: true,
    // Native --prefill avoids paste-after-ready races (https://github.com/stablyai/orca/pull/926).
    draftPromptFlag: '--prefill',
    preflightTrust: 'claude',
    // Why: CLAUDE_CODE_DISABLE_TERMINAL_TITLE drops the `✳` title tui-idle waits on (#22655).
    draftPasteReadySignal: 'claude-composer-prompt',
    workerStartReadsComposerMarker: true,
    // Why: Claude decodes CSI-u Ctrl+Enter on local ConPTY; CR made a remapped ctrl+enter act as Enter (#29711).
    ctrlEnterEncoding: 'csi-u'
  },
  'claude-agent-teams': {
    // This launch mode uses Orca’s CLI wrapper rather than a separate agent binary.
    detectCmd: 'orca',
    detectCmdAliases: ['orca-dev', 'orca-ide'],
    // Orca’s always-present shim alone must not report installed Agent Teams without Claude.
    detectRequiredCommands: ['claude'],
    // Windows/WSL use Claude’s in-process fallback, not this native-pane/tmux wrapper.
    detectUnsupportedRuntimes: ['win32', 'wsl'],
    launchCmd: 'orca claude-teams',
    launchCmdByPlatform: {
      linux: `${getOrcaCliCommandNameForPlatform('linux')} claude-teams`,
      win32: `${getOrcaCliCommandNameForPlatform('win32')} claude-teams`
    },
    expectedProcess: 'claude',
    promptInjectionMode: 'stdin-after-start',
    pasteNeedsTypedRequest: true,
    preflightTrust: 'claude',
    draftPasteReadySignal: 'claude-composer-prompt',
    workerStartReadsComposerMarker: true,
    // Why: runs the same Claude binary, so Ctrl+Enter must match `claude`.
    ctrlEnterEncoding: 'csi-u'
  },
  codex: {
    detectCmd: 'codex',
    promptInjectionMode: 'argv',
    windowsInputRecordPasteNewline: 'alt-enter',
    preflightTrust: 'codex',
    draftPasteReadySignal: 'codex-composer-prompt',
    draftPasteReadyTimeoutMs: 20_000,
    submitRetryDelayMs: 1200
  },
  'qwen-code': {
    detectCmd: 'qwen',
    promptInjectionMode: 'stdin-after-start',
    // Qwen 0.24.7 drops Enter for 500ms after paste on Windows/Node <20; delayed retry is harmless if the first submit landed.
    submitRetryDelayMs: 1200
  },
  // prettier-ignore
  nessy: { detectCmd: 'nessy', promptInjectionMode: 'flag-prompt-interactive' }
}

export const TUI_AGENT_CONFIG: Record<TuiAgent, TuiAgentConfig> = Object.fromEntries(
  Object.entries(TUI_AGENT_CONFIG_SOURCE).map(([agent, source]) => [
    agent,
    resolveTuiAgentConfig(source)
  ])
) as Record<TuiAgent, TuiAgentConfig>

export function isTuiAgent(value: unknown): value is TuiAgent {
  return typeof value === 'string' && Object.hasOwn(TUI_AGENT_CONFIG, value)
}

export function getTuiAgentDetectCommands(config: TuiAgentConfig): string[] {
  return [config.detectCmd, ...(config.detectCmdAliases ?? [])]
}

export function getTuiAgentLaunchCommand(
  config: TuiAgentConfig,
  platform: NodeJS.Platform,
  opts?: { isRemote?: boolean }
): string {
  if (platform === 'linux' && skipsLinuxOrcaCliRename(opts?.isRemote)) {
    return config.launchCmd
  }
  return config.launchCmdByPlatform?.[platform] ?? config.launchCmd
}
