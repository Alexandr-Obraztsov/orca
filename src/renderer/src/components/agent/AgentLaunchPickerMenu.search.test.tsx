// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useState, type ComponentProps } from 'react'
import userEvent from '@testing-library/user-event'
import type * as LaunchSetup from './AgentLaunchSetupButton'
import type { AgentLaunchSetupButton } from './AgentLaunchSetupButton'
import { AgentLaunchPickerMenu } from './AgentLaunchPickerMenu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu'
import type { AgentPickerEntry } from '../../../../shared/agent-launch/picker/agent-launch-picker'

vi.mock('@/hooks/useShortcutLabel', () => ({ useOptionalShortcutLabel: () => null }))
vi.mock('./AgentLaunchSetupButton', async (importOriginal) => ({
  ...(await importOriginal<typeof LaunchSetup>()),
  AgentLaunchSetupButton: vi.fn((props: ComponentProps<typeof AgentLaunchSetupButton>) => (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger asChild hideChevron>
        {props.renderAnchor?.(<button>Setup</button>)}
      </DropdownMenuSubTrigger>
    </DropdownMenuSub>
  ))
}))
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

it('includes blank terminal in keyboard results and filters it for agent and model searches', async () => {
  const entry: AgentPickerEntry = {
    agent: 'codex',
    label: 'Codex',
    rows: [{ agent: 'codex', kind: 'cli' }],
    surfaces: ['terminal'],
    defaultSurface: 'terminal',
    terminal: {},
    structured: {},
    catalog: {
      origin: 'probe',
      fetchedAt: 1,
      models: [{ id: 'astra', label: 'Astra', isDefault: true, efforts: [] }]
    }
  }
  const qwenCode: AgentPickerEntry = {
    ...entry,
    agent: 'qwen-code',
    label: 'Qwen Code',
    rows: [{ agent: 'qwen-code', kind: 'cli' }],
    catalog: { origin: 'probe', fetchedAt: 1, models: [] }
  }
  function Picker({ showLeadingItem = false }: { showLeadingItem?: boolean }) {
    const [selection, setSelection] = useState('')
    return (
      <>
        <output aria-label="Selection">{selection}</output>
        <DropdownMenu defaultOpen modal={false}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <AgentLaunchPickerMenu
              entries={[entry, qwenCode]}
              leadingItems={
                showLeadingItem ? <DropdownMenuItem>Custom command</DropdownMenuItem> : undefined
              }
              onSelectBlankTerminal={() => setSelection('blank')}
              runLaunch={(row, draft) => {
                setSelection(`${row.agent}:${draft?.choices.model ?? ''}`)
              }}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    )
  }
  const view = render(<Picker />)
  const user = userEvent.setup()
  const input = screen.getByRole('textbox')
  await user.click(input)
  await user.keyboard('{ArrowDown}')
  expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Blank Terminal' }))
  await user.click(input)
  await user.type(input, 'shell{Enter}')
  expect(screen.getByLabelText('Selection').textContent).toBe('blank')

  view.rerender(<Picker showLeadingItem />)
  await user.click(screen.getByRole('button', { name: 'Open' }))
  await user.keyboard('{ArrowDown}')
  expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Custom command' }))
  await user.type(screen.getByRole('textbox'), 'codex')
  expect(screen.queryByRole('menuitem', { name: 'Blank Terminal' })).toBeNull()
  await user.keyboard('{Enter}')
  expect(screen.getByLabelText('Selection').textContent).toBe('codex:')

  await user.click(screen.getByRole('button', { name: 'Open' }))
  await user.type(screen.getByRole('textbox'), 'qwen')
  expect(screen.queryByRole('menuitem', { name: 'Blank Terminal' })).toBeNull()
  await user.keyboard('{Enter}')
  expect(screen.getByLabelText('Selection').textContent).toBe('qwen-code:')

  await user.click(screen.getByRole('button', { name: 'Open' }))
  await user.type(screen.getByRole('textbox'), 'astra{Enter}')
  expect(screen.getByLabelText('Selection').textContent).toBe('codex:astra')
})

it('lists an agent named by the query before other agents’ model setups', () => {
  const codex: AgentPickerEntry = {
    agent: 'codex',
    label: 'Codex',
    rows: [{ agent: 'codex', kind: 'cli' }],
    surfaces: ['terminal'],
    defaultSurface: 'terminal',
    terminal: {},
    structured: {},
    catalog: { origin: 'probe', fetchedAt: 1, models: [] }
  }
  const nessy: AgentPickerEntry = {
    ...codex,
    agent: 'nessy',
    label: 'Nessy',
    rows: [{ agent: 'nessy', kind: 'cli' }],
    catalog: {
      origin: 'probe',
      fetchedAt: 1,
      models: [{ id: 'gpt-5-codex', label: 'GPT-5 Codex', isDefault: false, efforts: [] }]
    }
  }
  const launch = vi.fn()
  render(
    <DropdownMenu defaultOpen modal={false}>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <AgentLaunchPickerMenu entries={[nessy, codex]} runLaunch={launch} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
  fireEvent.focus(screen.getByRole('textbox'))
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'codex' } })
  const items = screen.getAllByRole('menuitem').map((item) => item.textContent)
  expect(items[0]).toContain('Codex')
  expect(items[0]).not.toContain('Nessy')
  expect(items.some((text) => text?.includes('Nessy · GPT-5 Codex'))).toBe(true)
  const highlighted = document.querySelectorAll('[data-search-default]')
  expect(highlighted).toHaveLength(1)
  expect(highlighted[0].textContent).toContain('Codex')
  expect(highlighted[0].textContent).not.toContain('Nessy')
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })
  expect(launch).toHaveBeenCalledWith({ agent: 'codex', kind: 'cli' }, undefined)
})

it('matches Qwen Code and its model setups via the qwen query', async () => {
  const codex: AgentPickerEntry = {
    agent: 'codex',
    label: 'Codex',
    rows: [{ agent: 'codex', kind: 'cli' }],
    surfaces: ['terminal'],
    defaultSurface: 'terminal',
    terminal: {},
    structured: {},
    catalog: { origin: 'probe', fetchedAt: 1, models: [] }
  }
  const qwenCode: AgentPickerEntry = {
    ...codex,
    agent: 'qwen-code',
    label: 'Qwen Code',
    rows: [{ agent: 'qwen-code', kind: 'cli' }],
    catalog: {
      origin: 'probe',
      fetchedAt: 1,
      models: [{ id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', isDefault: false, efforts: [] }]
    }
  }
  const launch = vi.fn()
  const user = userEvent.setup()
  render(
    <DropdownMenu defaultOpen modal={false}>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <AgentLaunchPickerMenu entries={[codex, qwenCode]} runLaunch={launch} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
  await user.type(screen.getByRole('textbox'), 'qwen')
  expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
    expect.stringContaining('Qwen Code')
  ])
  await user.keyboard('{Enter}')
  expect(launch).toHaveBeenCalledWith({ agent: 'qwen-code', kind: 'cli' }, undefined)

  launch.mockClear()
  await user.click(screen.getByRole('button', { name: 'Open' }))
  await user.type(screen.getByRole('textbox'), 'qwen Gemini{Enter}')
  expect(launch).toHaveBeenCalledWith(
    { agent: 'qwen-code', kind: 'cli', executionHostId: undefined },
    expect.objectContaining({
      agent: 'qwen-code',
      choices: { model: 'gemini-2.5-pro' }
    }),
    qwenCode
  )
})
