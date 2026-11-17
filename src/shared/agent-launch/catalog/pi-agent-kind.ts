/** Pi-compatible agents share PI_CODING_AGENT_DIR and extension APIs but have separate user directories.
 * Never cross-fallback: switching agents must not shadow the other agent’s extensions. */
export type PiAgentKind = 'pi' | 'omp' | 'prime-agent'

export const PRIMARY_AGENT_DIR_ENV_BY_KIND: Readonly<Record<PiAgentKind, string>> = {
  pi: 'PI_CODING_AGENT_DIR',
  omp: 'PI_CODING_AGENT_DIR',
  'prime-agent': 'PRIME_AGENT_CODING_AGENT_DIR'
}

export const SOURCE_AGENT_DIR_ENV_BY_KIND: Readonly<Record<PiAgentKind, string>> = {
  pi: 'ORCA_PI_SOURCE_AGENT_DIR',
  omp: 'ORCA_OMP_SOURCE_AGENT_DIR',
  'prime-agent': 'ORCA_PRIME_AGENT_SOURCE_AGENT_DIR'
}

/** Pi-compatible agents emit agent_end milestones while still working; do not treat every event as turn completion. */
export function isPiCompatibleAgentType(
  agentType: string | null | undefined
): agentType is PiAgentKind {
  return agentType === 'pi' || agentType === 'omp' || agentType === 'prime-agent'
}

// pi/omp/prime-agent are no longer TuiAgents, so their launch binaries cannot be resolved
// from TUI_AGENT_CONFIG and their kind detection is dead. These functions return only the
// bare-shell 'pi' default.

export function detectExplicitPiAgentKindFromCommand(
  _command: string | undefined
): PiAgentKind | null {
  return null
}

/** Detect the launched Pi-compatible kind; retain pi as the bare-shell integration default.
 * Missing directories must create only the resolved kind’s extension directory, never substitute another agent’s. */
export function detectPiAgentKindFromCommand(_command: string | undefined): PiAgentKind {
  // Why: PI launches and the no-command (bare-shell) fallback both resolve to 'pi'.
  return 'pi'
}
