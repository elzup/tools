import through from 'through'

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

export const sleep = (msec: number) =>
  new Promise((resolve) => setTimeout(resolve, msec))

export const delay = (time: number) => {
  const queue: unknown[] = []

  function next(data: unknown) {
    queue.push(data)
    setTimeout(function () {
      ts.queue(queue.shift())
    }, time)
  }

  const ts = through(
    (data) => next(data),
    () => next(null)
  )

  return ts
}
export const sum = (a: number, b: number) => a + b

export const noop = () => {}
