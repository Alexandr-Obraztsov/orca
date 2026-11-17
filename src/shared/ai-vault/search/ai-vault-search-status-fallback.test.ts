import { describe, expect, it, vi } from 'vitest'
import { createSessionSearchClient } from './ai-vault-search-client'
import { AiVaultSearchRequestSchema as LegacyRequestSchema } from '../../__fixtures__/pre-qoder-search-request'
import { searchResults } from './ai-vault-search-test-fixture'

const query = {
  query: 'needle',
  scope: 'conversation' as const,
  limit: 7,
  cursor: 'next-page',
  filters: { agents: ['claude'] as const, scopePaths: ['/execution-host/folder'] }
}

describe.each(['runtime', 'relay'] as const)('missing search status over %s', (transport) => {
  it('keeps only the conservative legacy subset when status is absent', async () => {
    const call = vi.fn(async (method: string, params: Record<string, unknown>) => {
      if (method === 'aiVault.searchStatus') {
        throw { code: 'method_not_found' }
      }
      expect(LegacyRequestSchema.parse(params)).toEqual({
        ...query,
        filters: { ...query.filters, agents: ['codex', 'claude'] }
      })
      return searchResults()
    })
    expect(
      await createSessionSearchClient(call, transport).searchSessions({
        ...query,
        filters: { ...query.filters, agents: ['nessy', 'codex', 'claude'] }
      })
    ).toMatchObject({ kind: 'results' })
    expect(call).toHaveBeenCalledTimes(2)
  })

  it('does not dispatch an unsupported-only filter after status refusal', async () => {
    const call = vi.fn(async () => {
      throw { code: 'method_not_found' }
    })
    expect(
      await createSessionSearchClient(call, transport).searchSessions({
        query: 'needle',
        filters: { agents: ['nessy'] }
      })
    ).toEqual({ kind: 'unavailable', reason: 'unsupported-agent' })
    expect(call).toHaveBeenCalledExactlyOnceWith('aiVault.searchStatus', {})
  })

  it('reports no service only when the search method itself is missing', async () => {
    const call = vi.fn(async () => {
      throw { code: 'method_not_found' }
    })
    expect(
      await createSessionSearchClient(call, transport).searchSessions({
        query: 'needle',
        filters: { agents: ['claude'] }
      })
    ).toEqual({ kind: 'unavailable', reason: 'no-service' })
    expect(call.mock.calls).toEqual([
      ['aiVault.searchStatus', {}],
      [
        'aiVault.searchSessions',
        expect.objectContaining({ query: 'needle', filters: { agents: ['claude'] } })
      ]
    ])
  })
})
