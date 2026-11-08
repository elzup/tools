// @vitest-environment happy-dom
// 計算は space.test.ts で見ているので、ここは「実際にマウントして操作に追従するか」だけを見る

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import PasswordSpace from '../../components/PasswordSpace'

afterEach(cleanup)

describe('PasswordSpace render', () => {
  test('初期表示で +1 文字 ×62 と 記号 1 か所 ×288 を出す', () => {
    render(<PasswordSpace />)
    // 比較パネルと棒グラフの両方に出る
    expect(screen.getAllByText('×62').length).toBe(2)
    expect(screen.getAllByText('×288').length).toBeGreaterThan(0)
    expect(screen.getByText('9 か所 × 32 種 = 288 通り')).toBeTruthy()
  })

  test('記号の候補を 10 種にすると逆転する L を出し直す', () => {
    render(<PasswordSpace />)
    fireEvent.click(screen.getByRole('button', { name: 'よく使う 10' }))
    expect(screen.getByText('9 か所 × 10 種 = 90 通り')).toBeTruthy()
    expect(screen.getByText(/L ≥ 6/)).toBeTruthy()
  })

  test('グラフの列クリックで L を切り替える', () => {
    const { container } = render(<PasswordSpace />)
    const hits = container.querySelectorAll('svg rect')
    // 列は L_MIN=4 から並ぶので index 0 が L=4
    fireEvent.click(hits[0])
    expect(screen.getByText('5 か所 × 32 種 = 160 通り')).toBeTruthy()
  })
})
