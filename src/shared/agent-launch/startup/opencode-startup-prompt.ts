// OpenCode was removed; only these env/path constants survive for live callers that
// still host or serve its startup-prompt claim (agent-hook server, legacy host env).

export const OPENCODE_STARTUP_PROMPT_SHA256_ENV = 'ORCA_OPENCODE_STARTUP_PROMPT_SHA256'
export const OPENCODE_STARTUP_PROMPT_NONCE_ENV = 'ORCA_OPENCODE_STARTUP_PROMPT_NONCE'
export const OPENCODE_STARTUP_PROMPT_ENDPOINT_ENV = 'ORCA_OPENCODE_STARTUP_PROMPT_ENDPOINT'
export const OPENCODE_STARTUP_PROMPT_CLAIM_PATH = '/opencode/startup-prompt/claim'
export const OPENCODE_STARTUP_PROMPT_BODY_ENV = 'ORCA_OPENCODE_STARTUP_PROMPT_BODY'
export const OPENCODE_STARTUP_PROMPT_SHELL_ENV = 'ORCA_OPENCODE_STARTUP_PROMPT_SHELL'