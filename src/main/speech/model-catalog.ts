import type { SpeechModelManifest } from '../../shared/speech/speech-types'
import {
  DICTATION_LANGUAGES,
  PARAKEET_V3_LANGUAGES,
  WHISPER_LANGUAGES
} from '../../shared/speech/models/dictation-language'
import { getSpeechModelDownloadMetadata } from './model-download-catalog'
import { getGgufSpeechModelDownload } from './speech-model-gguf-downloads'
import { getSpeechModelErrorRates } from './speech-model-error-rates'

const legacy = (id: Parameters<typeof getSpeechModelDownloadMetadata>[0]) => ({
  legacyDownloadFiles: getSpeechModelDownloadMetadata(id).downloadFiles
})

// Only models served by the internal t-whisper mirror (flat <base>/<file> layout) stay downloadable.
export const SPEECH_MODEL_CATALOG: SpeechModelManifest[] = [
  {
    id: 'parakeet-tdt-0.6b-v3-int8',
    label: 'Parakeet TDT v3',
    type: 'transducer',
    provider: 'local',
    language: 'multilingual',
    ...getGgufSpeechModelDownload('parakeet-tdt-0.6b-v3-int8'),
    ...legacy('parakeet-tdt-0.6b-v3-int8'),
    languages: PARAKEET_V3_LANGUAGES,
    ...getSpeechModelErrorRates('parakeet-tdt-0.6b-v3-int8'),
    licence: 'CC-BY-4.0',
    sampleRate: 16000,
    streaming: false,
    recommended: true
  },
  {
    id: 'whisper-large-v3-turbo',
    label: 'Whisper Large v3 Turbo',
    type: 'whisper',
    provider: 'local',
    language: 'multilingual',
    ...getGgufSpeechModelDownload('whisper-large-v3-turbo'),
    dictationLanguages: DICTATION_LANGUAGES,
    languages: [...WHISPER_LANGUAGES, 'yue'],
    ...getSpeechModelErrorRates('whisper-large-v3-turbo'),
    licence: 'MIT',
    sampleRate: 16000,
    streaming: false
  },
  {
    id: 'openai-gpt-transcribe',
    label: 'GPT Transcribe',
    type: 'openai',
    provider: 'openai',
    language: 'multilingual',
    dictationLanguages: DICTATION_LANGUAGES,
    languages: DICTATION_LANGUAGES,
    sampleRate: 16000,
    streaming: false
  },
  {
    id: 'openai-compatible',
    label: 'OpenAI-compatible',
    type: 'openai',
    provider: 'openai-compatible',
    language: 'multilingual',
    dictationLanguages: DICTATION_LANGUAGES,
    languages: DICTATION_LANGUAGES,
    sampleRate: 16000,
    streaming: false
  },
  {
    id: 'openai-gpt-4o-mini-transcribe',
    label: 'GPT-4o mini Transcribe',
    type: 'openai',
    provider: 'openai',
    language: 'multilingual',
    dictationLanguages: DICTATION_LANGUAGES,
    languages: DICTATION_LANGUAGES,
    sampleRate: 16000,
    streaming: false,
    // OpenAI shuts the gpt-4o transcribe models down on 2027-02-26.
    replacedBy: 'openai-gpt-transcribe'
  },
  {
    id: 'openai-gpt-4o-transcribe',
    label: 'GPT-4o Transcribe',
    type: 'openai',
    provider: 'openai',
    language: 'multilingual',
    dictationLanguages: DICTATION_LANGUAGES,
    languages: DICTATION_LANGUAGES,
    sampleRate: 16000,
    streaming: false,
    replacedBy: 'openai-gpt-transcribe'
  }
]

export function getCatalogModel(id: string): SpeechModelManifest | undefined {
  return SPEECH_MODEL_CATALOG.find((m) => m.id === id)
}

export function isLocalSpeechModel(manifest: SpeechModelManifest): boolean {
  return manifest.provider === 'local'
}

export function replaceRetiredSpeechModelId(id: string): string {
  return getCatalogModel(id)?.replacedBy ?? id
}
