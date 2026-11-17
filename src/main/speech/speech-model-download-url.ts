/**
 * Configurable base URL for local speech-model downloads.
 *
 * Orca pulls on-device STT/ASR weights from an internal mirror by default
 * (HuggingFace is blocked on the corporate network). The base URL can be
 * overridden via the ORCA_MODEL_DOWNLOAD_BASE_URL environment variable. The
 * mirror serves each model file directly by name:
 *
 *   <baseUrl>/<file>?download=true
 *
 * The pinned repositories/revisions and files are listed in
 * speech-model-gguf-downloads.ts and model-download-catalog.ts.
 */

export const DEFAULT_MODEL_DOWNLOAD_BASE_URL =
  'https://s3-msk.tinkoff.ru/loyalty-platforms-t-whisper/models'
export const MODEL_DOWNLOAD_BASE_URL_ENV = 'ORCA_MODEL_DOWNLOAD_BASE_URL'

/** Resolves the configured base URL, trimming any trailing slashes so joins stay clean. */
export function getModelDownloadBaseUrl(): string {
  const override = process.env[MODEL_DOWNLOAD_BASE_URL_ENV]?.trim()
  if (!override) {
    return DEFAULT_MODEL_DOWNLOAD_BASE_URL
  }
  return override.replace(/\/+$/, '')
}

/** Builds a flat download URL under the configured base; the internal mirror serves files by name. */
export function modelDownloadUrl(_repository: string, _revision: string, name: string): string {
  const base = getModelDownloadBaseUrl()
  return `${base}/${encodeURIComponent(name)}?download=true`
}
