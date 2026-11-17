import type { TuiAgent } from '../../agent-launch/catalog/tui-agent'

// Node CLIs whose shims launch a generic script (cli.js, versioned index.js), so
// only the exact install path is an authoritative identity signal.
export const EXACT_NODE_ENTRYPOINT_IDENTITIES: readonly {
  pattern: RegExp
  agent: TuiAgent
  processName: string
}[] = [
  // npm Claude's historical cli.js still appears behind pnpm/yarn/npx shims.
  {
    pattern: /(?:^|\/)node_modules\/@anthropic-ai\/claude-code\/cli\.js$/,
    agent: 'claude',
    processName: 'claude'
  },
  // Why: Qwen's npm bin is a generic `cli-entry` script that re-runs `cli` in a child node on
  // Windows; the standalone installer ships the same pair under `qwen-code/lib/`.
  {
    pattern:
      /(?:^|\/)(?:node_modules\/@qwen-code\/qwen-code\/(?:cli-entry|cli|scripts\/cli-entry|dist\/cli)|qwen-code\/lib\/cli(?:-entry)?)\.js$/,
    agent: 'qwen-code',
    processName: 'qwen'
  }
]