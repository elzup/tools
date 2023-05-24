import { range } from '@elzup/kit/lib/range'
import { useMemo } from 'react'

const YR = 100
// const WR = 10
// const DR = 1

export const useAnotime = () => {
  const date = new Date()
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  const h = date.getHours()

  const { buffer, positions } = useMemo(() => {
    const times = range(100).map((v) => new Date(+date - v * 1000 * 60 * 60))
    const positions = times.map((t) =>
      calcRad(t.getFullYear(), t.getMonth() + 1, t.getDate(), t.getHours())
    )
    const buffer = new Float32Array(positions.flat())

    return { buffer, positions }
  }, [y, m, d, h])

  return { positions, buffer, size: positions.length }
}

const isUru = (y: number) => {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}
const is31Month = (m: number) => ((m >> 3) & 1) ^ (m & 1)

const monthDayNum = (y: number, m: number) =>
  m === 2 ? (isUru(y) ? 29 : 28) : is31Month(m) ? 31 : 30
const totalDayNum = (y: number, m: number) =>
  range(m - 1)
    .map((v) => monthDayNum(y, v + 1))
    .reduce((a, b) => a + b, 0)

export const calcRad = (year: number, mon: number, d: number, h: number) => {
  const all = isUru(year) ? 366 : 365
  const dm = totalDayNum(year, mon)
  const perYear = (dm + (d - 1 + h / 24)) / all
  const x = Math.sin(perYear * Math.PI * 2) * YR + YR
  const y = Math.cos(perYear * Math.PI * 2) * YR + YR

  const z = 0

  return [(x - 162) * 1, (y - 21) * 1, z]
}
