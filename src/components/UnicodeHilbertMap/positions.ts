import { d2xy } from './hilbert'
import { N, TOTAL } from './mapData'
import type { Positions } from './render'

export type MapLayout = 'hilbert' | 'row'

export const LAYOUTS: { id: MapLayout; label: string }[] = [
  { id: 'hilbert', label: 'ヒルベルト曲線' },
  { id: 'row', label: '行優先' },
]

/**
 * codepoint -> 表示座標 (xs/ys) と、その逆引き (cpAt) をまとめて作る。
 * 逆引きを持っておくことで hover 時に全走査せず codepoint を引ける。
 */
export const buildPositions = (layout: MapLayout): Positions => {
  const xs = new Uint8Array(TOTAL)
  const ys = new Uint8Array(TOTAL)
  const cpAt = new Int32Array(TOTAL)

  for (let cp = 0; cp < TOTAL; cp++) {
    const [x, y] = layout === 'hilbert' ? d2xy(N, cp) : [cp % N, (cp / N) | 0]

    xs[cp] = x
    ys[cp] = y
    cpAt[y * N + x] = cp
  }
  return { xs, ys, cpAt }
}
