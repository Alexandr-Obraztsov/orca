/**
 * Configurable base URL for local speech-model downloads.
 *
 * Orca pulls on-device STT/ASR weights from HuggingFace by default. In network
 * environments where huggingface.co is blocked (e.g. a corporate network), the
 * base URL can be pointed at an internal mirror via the
 * ORCA_MODEL_DOWNLOAD_BASE_URL environment variable. The download path mirrors
 * HuggingFace's resolve layout:
 *
 *   <baseUrl>/<repository>/resolve/<revision>/<name>?download=true
 *
 * A mirror must reproduce that exact layout for the pinned repositories,
 * revisions and files listed in speech-model-gguf-downloads.ts and
 * model-download-catalog.ts. When the variable is unset, behavior is unchanged
 * (defaults to https://huggingface.co).
 */

export const DEFAULT_MODEL_DOWNLOAD_BASE_URL = 'https://huggingface.co'
export const MODEL_DOWNLOAD_BASE_URL_ENV = 'ORCA_MODEL_DOWNLOAD_BASE_URL'

/** Resolves the configured base URL, trimming any trailing slashes so joins stay clean. */
export function getModelDownloadBaseUrl(): string {
  const override = process.env[MODEL_DOWNLOAD_BASE_URL_ENV]?.trim()
  if (!override) return DEFAULT_MODEL_DOWNLOAD_BASE_URL
  return override.replace(/\/+$/, '')
}

/** Builds a download URL in the HuggingFace resolve layout under the configured base URL. */
export function modelDownloadUrl(repository: string, revision: string, name: string): string {
  const base = getModelDownloadBaseUrl()
  return `${base}/${repository}/resolve/${revision}/${encodeURIComponent(name)}?download=true`
}