// @vitest-environment happy-dom

import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReactRenderDemo from '../../components/ReactRenderDemo'

const count = (key: string) => screen.getByTestId(`count-${key}`)
const status = (key: string) => screen.getByTestId(`status-${key}`)

const RERENDERED = ['app', 'calcPlain', 'effectEvery', 'child', 'memoInlineFn']
const SKIPPED = ['calcMemo', 'callback', 'effectId', 'memo', 'memoCallback']

describe('ReactRenderDemo', () => {
  test('初回はすべて 1 回', () => {
    render(<ReactRenderDemo />)
    ;[...RERENDERED, ...SKIPPED].forEach((key) => {
      expect(count(key)).toHaveTextContent('1 回')
      expect(status(key)).toHaveTextContent('初回')
    })
  })

  test('無関係な更新では memo 系・useMemo・useEffect([id]) が実際にスキップされる', async () => {
    const user = userEvent.setup()
    render(<ReactRenderDemo />)

    await user.click(
      screen.getByRole('button', { name: 'setCount(count + 1)' })
    )

    RERENDERED.forEach((key) => {
      expect(count(key)).toHaveTextContent('2 回')
      expect(status(key)).toHaveTextContent('実行')
    })
    SKIPPED.forEach((key) => {
      expect(count(key)).toHaveTextContent('1 回')
      expect(status(key)).toHaveTextContent('スキップ')
    })
  })

  test('id 更新ではすべて実行される', async () => {
    const user = userEvent.setup()
    render(<ReactRenderDemo />)

    await user.click(screen.getByRole('button', { name: 'setId(id + 1)' }))
    ;[...RERENDERED, ...SKIPPED].forEach((key) => {
      expect(count(key)).toHaveTextContent('2 回')
      expect(status(key)).toHaveTextContent('実行')
    })
  })

  test('リセットで回数が初期化される', async () => {
    const user = userEvent.setup()
    render(<ReactRenderDemo />)

    await user.click(
      screen.getByRole('button', { name: 'setCount(count + 1)' })
    )
    await user.click(screen.getByRole('button', { name: 'リセット' }))

    expect(count('child')).toHaveTextContent('1 回')
    expect(status('child')).toHaveTextContent('初回')
  })
})
