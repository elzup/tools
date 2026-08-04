// ヒルベルト曲線: d (0..n*n-1) -> [x, y]
const rot = (n: number, x: number, y: number, rx: number, ry: number) => {
  if (ry === 0) {
    if (rx === 1) return [n - 1 - y, n - 1 - x] as const
    return [y, x] as const
  }
  return [x, y] as const
}

export const d2xy = (n: number, d: number): readonly [number, number] => {
  let x = 0
  let y = 0
  let t = d

  for (let s = 1; s < n; s *= 2) {
    const rx = (t >> 1) & 1
    const ry = (t ^ rx) & 1

    ;[x, y] = rot(s, x, y, rx, ry)
    x += s * rx
    y += s * ry
    t >>= 2
  }
  return [x, y] as const
}
