import { NESSY_LAUNCH_SPEC } from '../../nessy/nessy-acp-launch-spec'
import type { AcpLaunchSpec } from './acp-launch-contract'

export const ACP_LAUNCH_SPECS: readonly AcpLaunchSpec[] = [
  NESSY_LAUNCH_SPEC
]

export function acpLaunchSpecFor(agent: string): AcpLaunchSpec | null {
  return ACP_LAUNCH_SPECS.find((spec) => spec.agent === agent) ?? null
}