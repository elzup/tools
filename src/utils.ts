export const zoom1D = (
  s: number,
  e: number,
  p: number,
  scale = 2
): [number, number] => {
  const d = e - s
  const o = s + d * p
  const r = d / scale / 2

  return [o - r, o + r]
}

export const zoom2D = (
  sx: number,
  sy: number,
  ex: number,
  ey: number,
  px: number,
  py: number,
  scale = 2
) => {
  const [nsx, nex] = zoom1D(sx, ex, px, scale)
  const [nsy, ney] = zoom1D(sy, ey, py, scale)

  return [nsx, nex, nsy, ney]
}
