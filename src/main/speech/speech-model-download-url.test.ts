import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_MODEL_DOWNLOAD_BASE_URL,
  getModelDownloadBaseUrl,
  MODEL_DOWNLOAD_BASE_URL_ENV,
  modelDownloadUrl
} from './speech-model-download-url'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getModelDownloadBaseUrl', () => {
  it('defaults to the configured base when the env override is unset', () => {
    vi.stubEnv(MODEL_DOWNLOAD_BASE_URL_ENV, '')
    expect(getModelDownloadBaseUrl()).toBe(DEFAULT_MODEL_DOWNLOAD_BASE_URL)
  })

  it('prefers the internal mirror when ORCA_MODEL_DOWNLOAD_BASE_URL is set', () => {
    vi.stubEnv(MODEL_DOWNLOAD_BASE_URL_ENV, 'https://models.internal.example')
    expect(getModelDownloadBaseUrl()).toBe('https://models.internal.example')
  })

  it('trims trailing slashes from the configured base URL', () => {
    vi.stubEnv(MODEL_DOWNLOAD_BASE_URL_ENV, 'https://models.internal.example///')
    expect(getModelDownloadBaseUrl()).toBe('https://models.internal.example')
  })
})

describe('modelDownloadUrl', () => {
  it('builds a flat URL under the default base', () => {
    vi.stubEnv(MODEL_DOWNLOAD_BASE_URL_ENV, '')
    expect(modelDownloadUrl('repo/name', 'rev1', 'model-Q8_0.gguf')).toBe(
      `${DEFAULT_MODEL_DOWNLOAD_BASE_URL}/model-Q8_0.gguf?download=true`
    )
  })

  it('builds the same flat layout under an internal mirror', () => {
    vi.stubEnv(MODEL_DOWNLOAD_BASE_URL_ENV, 'https://s3-msk.tinkoff.ru/models')
    expect(modelDownloadUrl('repo/name', 'rev1', 'model-Q8_0.gguf')).toBe(
      'https://s3-msk.tinkoff.ru/models/model-Q8_0.gguf?download=true'
    )
  })

  it('URL-encodes the model filename', () => {
    vi.stubEnv(MODEL_DOWNLOAD_BASE_URL_ENV, '')
    expect(modelDownloadUrl('repo', 'rev', 'my model.bin')).toBe(
      `${DEFAULT_MODEL_DOWNLOAD_BASE_URL}/my%20model.bin?download=true`
    )
  })
})
