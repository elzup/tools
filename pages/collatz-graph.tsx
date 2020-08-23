import * as React from 'react'
import Layout from '../components/Layout'

const size = 100
const title = 'モンテカルロ PI ラボ'
const PiLab = () => {
  const [plots, setPlots] = React.useState<[number, number][]>([])
  const [subplots, setSubplots] = React.useState<[number, number][]>([])
  const ref = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const plots: [number, number][] = []
    const subplots: [number, number][] = []
    const map: Record<number, number> = { 1: 1 }

    let nums: number[] = [1]

    for (let i = 0; i < 50; i++) {
      const newNums: number[] = [1]

      console.log(plots.length)

      nums.forEach((v) => {
        const poss = []

        poss.push(v * 2)
        if ((v - 1) % 3 === 0 && v !== 1) {
          poss.push((v - 1) / 3)
        }
        poss.forEach((pos) => {
          if (!map[pos]) {
            map[pos] = 1
            newNums.push(pos)
            plots.push([i, pos])
          } else {
            map[pos]++
            if (size >= pos) {
              subplots.push([i, pos])
            }
          }
        })
      })
      nums = newNums
    }
    setPlots(plots)
    setSubplots(subplots)
  }, [])

  // n / 2
  // n * 3 + 1 = k
  // n = (k - 1) / 3
  // 1
  // (v - 1) / 3
  // v * 2

  React.useEffect(() => {
    const ctx = ref?.current?.getContext('2d')

    if (!ctx) return

    ctx.fillStyle = 'rgb(0, 0, 0)'
    ctx.fillRect(0, 0, size, size)
    plots.forEach(([x, y]) => {
      ctx.fillStyle = 'rgb(100, 100, 255)'
      ctx.fillRect(x, size - y, size, 1)
      ctx.fillStyle = 'rgb(255, 100, 255)'
      ctx.fillRect(x, size - y, 1, 1)
    })
    subplots.forEach(([x, y]) => {
      ctx.fillStyle = 'rgb(240, 100, 100)'
      ctx.fillRect(x, size - y, 1, 1)
    })
    ctx.scale(10, 10)
    ctx.save()
  }, [!ref.current, plots])

  return (
    <Layout title={title}>
      <p>コラッツ予想 プロット</p>
      <canvas height={1000} width={1000} ref={ref} />
    </Layout>
  )
}

const stopCount = Number.MAX_SAFE_INTEGER

export default PiLab
