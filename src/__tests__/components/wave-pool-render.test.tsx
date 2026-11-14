// @vitest-environment happy-dom
// 物理は wave-pool.test.ts で見ているので、ここは「マウントしてループが回り、操作で落ちないか」だけを見る。
// happy-dom の canvas は 2D context を返さないため描画は飛ばされ、計算と統計表示だけが動く

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import WavePool from '../../components/WavePool'

// 統計表示の更新間隔 (STAT_INTERVAL_MS = 250) を数回またぐ長さ
const RUN_MS = 900

const runFor = (ms: number) =>
  act(() => new Promise<void>((resolve) => setTimeout(resolve, ms)))

const elapsedT = () => {
  const m = document.body.textContent?.match(/t = (\d+)/)
  return m === null || m === undefined ? -1 : Number(m[1])
}

afterEach(cleanup)

describe('WavePool render', () => {
  test('マウント後にシミュレーション時間が進む', async () => {
    render(<WavePool />)
    await runFor(RUN_MS)
    expect(elapsedT()).toBeGreaterThan(0)
  })

  test('ターゲット・表示・位相制御を切り替えても例外なく回り続ける', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<WavePool />)
    for (const name of ['リング', '三角形', '自由配置', '2 点']) {
      fireEvent.click(screen.getByRole('button', { name }))
    }
    fireEvent.click(screen.getByRole('button', { name: '時間平均エネルギー' }))
    fireEvent.click(screen.getByLabelText('位相制御'))
    await runFor(RUN_MS)
    expect(elapsedT()).toBeGreaterThan(0)
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })
})
