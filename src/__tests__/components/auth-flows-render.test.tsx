// @vitest-environment happy-dom
// 計算は auth-flows.test.ts で見ているので、ここは「実際にマウントして step 操作に追従するか」だけを見る

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import AuthFlows from '../../components/AuthFlows'

afterEach(cleanup)

describe('AuthFlows render', () => {
  test('3 方式のシーケンスが STEP 1 で出る', async () => {
    render(<AuthFlows />)
    expect(
      await screen.findByText(/STEP 1 \/ 7\s+ユーザーが決める/)
    ).toBeTruthy()
    expect(
      await screen.findByText(/STEP 1 \/ 11\s+サーバーが乱数の秘密を作る/)
    ).toBeTruthy()
    expect(
      await screen.findByText(/STEP 1 \/ 12\s+サーバーが登録を依頼/)
    ).toBeTruthy()
  })

  test('次へボタンで step が進む', async () => {
    render(<AuthFlows />)
    await screen.findByText(/STEP 1 \/ 7\s+ユーザーが決める/)
    const [next] = screen.getAllByRole('button', { name: '次 ▶' })
    fireEvent.click(next)
    fireEvent.click(next)
    expect(
      screen.getByText(/STEP 3 \/ 7\s+ハッシュだけ保存して平文は捨てる/)
    ).toBeTruthy()
  })

  test('辞書攻撃ボタンで初期パスワード hunter2 が解読される', async () => {
    render(<AuthFlows />)
    await screen.findByText(/STEP 1 \/ 7\s+ユーザーが決める/)
    fireEvent.click(
      screen.getByRole('button', { name: 'サーバー DB が漏洩 → 辞書攻撃' })
    )
    expect(await screen.findByText(/解読成功: "hunter2"/)).toBeTruthy()
  })
})
