import { useEffect, useState } from 'react'

// リフレッシュレート計測: 中央値を使うのは、GC や タブ切り替え直後の 1 フレームの遅れで値が跳ねるため
const REFRESH_SAMPLE_FRAMES = 60
// 59.94Hz 等の実測誤差で 60fps を不可と誤判定しないための許容幅
export const REFRESH_TOLERANCE = 1.05

// カスタムフック: 表示環境のリフレッシュレート (Hz) を rAF の間隔から推定する。計測中は null
export function useDisplayRefreshRate() {
  const [hz, setHz] = useState<number | null>(null)

  useEffect(() => {
    let rafId = 0
    let last = 0
    let deltas: number[] = []

    const tick = (t: number) => {
      if (last > 0) deltas = [...deltas, t - last]
      last = t
      if (deltas.length < REFRESH_SAMPLE_FRAMES) {
        rafId = requestAnimationFrame(tick)
        return
      }
      const sorted = [...deltas].sort((a, b) => a - b)
      const median = sorted[Math.floor(sorted.length / 2)]

      setHz(1000 / median)
    }

    rafId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafId)
  }, [])

  return hz
}
