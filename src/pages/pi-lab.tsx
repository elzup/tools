import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Slider,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import Layout from '../components/Layout'
import { Title } from '../components/Title'
import { colors } from '../components/theme'

const title = 'モンテカルロ PI ラボ'

const PiLab = () => {
  const random = useMonteCarlo('random')
  const stratified = useMonteCarlo('stratified')
  const haltonSeq = useMonteCarlo('halton')
  const [stepSize, setStepSize] = useState<number>(100)

  const randomPlotRef = useRef<HTMLCanvasElement>(null)
  const stratifiedPlotRef = useRef<HTMLCanvasElement>(null)
  const haltonPlotRef = useRef<HTMLCanvasElement>(null)
  const historyCanvasRef = useRef<HTMLCanvasElement>(null)

  // 初期化: すべてのキャンバスに円を描画
  useEffect(() => {
    ;[randomPlotRef, stratifiedPlotRef, haltonPlotRef].forEach((ref) => {
      const canvas = ref.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      drawBackground(ctx)
    })
  }, [])

  // ポイント描画
  const drawPoints = useCallback(
    (ref: React.RefObject<HTMLCanvasElement | null>, newPoints: Point[]) => {
      const canvas = ref.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      newPoints.forEach(({ x, y, inside }) => {
        ctx.beginPath()
        ctx.arc(
          x * CANVAS_SIZE,
          CANVAS_SIZE - y * CANVAS_SIZE,
          2,
          0,
          Math.PI * 2
        )
        ctx.fillStyle = inside
          ? 'rgba(121, 85, 72, 0.5)'
          : 'rgba(229, 115, 115, 0.5)'
        ctx.fill()
      })
    },
    []
  )

  // PI履歴グラフ
  useEffect(() => {
    const canvas = historyCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = 200

    ctx.fillStyle = '#fafafa'
    ctx.fillRect(0, 0, width, height)

    const allValues = [...random.piHistory, ...stratified.piHistory, ...haltonSeq.piHistory]
    if (allValues.length < 2) return

    // 動的スケール: データの範囲 + πを含む + 余白
    const dataMin = Math.min(...allValues)
    const dataMax = Math.max(...allValues)
    const padding = 0.05 // 5%の余白
    const rangeWithPi = Math.max(dataMax, Math.PI) - Math.min(dataMin, Math.PI)
    const yMin = Math.min(dataMin, Math.PI) - rangeWithPi * padding
    const yMax = Math.max(dataMax, Math.PI) + rangeWithPi * padding
    const yRange = yMax - yMin

    // Y軸ラベル
    ctx.fillStyle = colors.grey.main
    ctx.font = '10px sans-serif'
    ctx.fillText(yMax.toFixed(2), 2, 12)
    ctx.fillText(yMin.toFixed(2), 2, height - 4)

    // PI基準線
    const piY = height - ((Math.PI - yMin) / yRange) * height
    ctx.beginPath()
    ctx.moveTo(0, piY)
    ctx.lineTo(width, piY)
    ctx.strokeStyle = colors.gold.main
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.stroke()
    ctx.setLineDash([])

    // ランダム履歴（茶色）
    if (random.piHistory.length >= 2) {
      ctx.beginPath()
      const step = width / (random.piHistory.length - 1)
      random.piHistory.forEach((pi, i) => {
        const x = i * step
        const y = height - ((pi - yMin) / yRange) * height
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.strokeStyle = colors.brown.main
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // 層化履歴（青）
    if (stratified.piHistory.length >= 2) {
      ctx.beginPath()
      const step = width / (stratified.piHistory.length - 1)
      stratified.piHistory.forEach((pi, i) => {
        const x = i * step
        const y = height - ((pi - yMin) / yRange) * height
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.strokeStyle = '#1976d2'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // Halton列履歴（緑）
    if (haltonSeq.piHistory.length >= 2) {
      ctx.beginPath()
      const step = width / (haltonSeq.piHistory.length - 1)
      haltonSeq.piHistory.forEach((pi, i) => {
        const x = i * step
        const y = height - ((pi - yMin) / yRange) * height
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.strokeStyle = '#4caf50'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    ctx.fillStyle = colors.grey.dark
    ctx.font = '12px sans-serif'
    ctx.fillText('π=' + Math.PI.toFixed(4), width - 70, piY - 5)
  }, [random.piHistory, stratified.piHistory, haltonSeq.piHistory])

  const resetCanvas = useCallback(
    (ref: React.RefObject<HTMLCanvasElement | null>) => {
      const canvas = ref.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      drawBackground(ctx)
    },
    []
  )

  const handleStart = useCallback(
    (n: number) => {
      const randomPoints = random.addPoints(n)
      const stratifiedPoints = stratified.addPoints(n)
      const haltonPoints = haltonSeq.addPoints(n)
      drawPoints(randomPlotRef, randomPoints)
      drawPoints(stratifiedPlotRef, stratifiedPoints)
      drawPoints(haltonPlotRef, haltonPoints)
    },
    [random, stratified, haltonSeq, drawPoints]
  )

  const handleReset = useCallback(() => {
    random.reset()
    stratified.reset()
    haltonSeq.reset()
    resetCanvas(randomPlotRef)
    resetCanvas(stratifiedPlotRef)
    resetCanvas(haltonPlotRef)
  }, [random, stratified, haltonSeq, resetCanvas])

  return (
    <Layout title={title} footer="minimal">
      <Title>{title}</Title>

      <Grid container spacing={4}>
        {/* 3つのサンプリング手法を比較 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
              >
                <ColorDot $color={colors.brown.main} />
                <Typography variant="h6">ランダム</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                純粋な乱数で座標を生成。偏りが生じやすく収束にばらつき。
              </Typography>
              <CanvasWrapper>
                <canvas
                  ref={randomPlotRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                />
              </CanvasWrapper>
              <StatsRow>
                <StatItem label="試行" value={random.total.toLocaleString()} />
                <StatItem
                  label="円内"
                  value={random.inCount.toLocaleString()}
                />
                <StatItem
                  label="PI"
                  value={random.total > 0 ? random.pi.toFixed(6) : '-'}
                  primary
                />
                <StatItem
                  label="誤差"
                  value={
                    random.total > 0
                      ? `${((Math.abs(random.pi - Math.PI) / Math.PI) * 100).toFixed(4)}%`
                      : '-'
                  }
                  error={
                    random.total > 0 && Math.abs(random.pi - Math.PI) >= 0.01
                  }
                />
              </StatsRow>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
              >
                <ColorDot $color="#1976d2" />
                <Typography variant="h6">層化サンプリング</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                グリッド分割し各セル内でランダム抽出。均等分散で収束が早い。
              </Typography>
              <CanvasWrapper>
                <canvas
                  ref={stratifiedPlotRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                />
              </CanvasWrapper>
              <StatsRow>
                <StatItem
                  label="試行"
                  value={stratified.total.toLocaleString()}
                />
                <StatItem
                  label="円内"
                  value={stratified.inCount.toLocaleString()}
                />
                <StatItem
                  label="PI"
                  value={stratified.total > 0 ? stratified.pi.toFixed(6) : '-'}
                  primary
                />
                <StatItem
                  label="誤差"
                  value={
                    stratified.total > 0
                      ? `${((Math.abs(stratified.pi - Math.PI) / Math.PI) * 100).toFixed(4)}%`
                      : '-'
                  }
                  error={
                    stratified.total > 0 &&
                    Math.abs(stratified.pi - Math.PI) >= 0.01
                  }
                />
              </StatsRow>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
              >
                <ColorDot $color="#4caf50" />
                <Typography variant="h6">Halton列</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                準乱数列で空間を均等に埋める。同じ点を避け収束が早い。
              </Typography>
              <CanvasWrapper>
                <canvas
                  ref={haltonPlotRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                />
              </CanvasWrapper>
              <StatsRow>
                <StatItem
                  label="試行"
                  value={haltonSeq.total.toLocaleString()}
                />
                <StatItem
                  label="円内"
                  value={haltonSeq.inCount.toLocaleString()}
                />
                <StatItem
                  label="PI"
                  value={haltonSeq.total > 0 ? haltonSeq.pi.toFixed(6) : '-'}
                  primary
                />
                <StatItem
                  label="誤差"
                  value={
                    haltonSeq.total > 0
                      ? `${((Math.abs(haltonSeq.pi - Math.PI) / Math.PI) * 100).toFixed(4)}%`
                      : '-'
                  }
                  error={
                    haltonSeq.total > 0 &&
                    Math.abs(haltonSeq.pi - Math.PI) >= 0.01
                  }
                />
              </StatsRow>
            </CardContent>
          </Card>
        </Grid>

        {/* PI履歴グラフ */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                PI 推定履歴 比較
              </Typography>
              <CanvasWrapper>
                <canvas ref={historyCanvasRef} width={600} height={200} />
              </CanvasWrapper>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 3,
                  mt: 1,
                  flexWrap: 'wrap',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ColorDot $color={colors.brown.main} />
                  <Typography variant="caption">ランダム</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ColorDot $color="#1976d2" />
                  <Typography variant="caption">層化</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ColorDot $color="#4caf50" />
                  <Typography variant="caption">Halton</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ColorDot $color={colors.gold.main} />
                  <Typography variant="caption">実際のπ</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 操作パネル */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                ステップサイズ: {stepSize.toLocaleString()}
              </Typography>
              <Slider
                value={stepSize}
                onChange={(_: Event, v: number | number[]) =>
                  setStepSize(v as number)
                }
                min={1}
                max={10000}
                step={1}
                valueLabelDisplay="auto"
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={() => handleStart(stepSize)}
                >
                  試行 (+{stepSize.toLocaleString()})
                </Button>
                <Button variant="outlined" onClick={() => handleStart(100)}>
                  +100
                </Button>
                <Button variant="outlined" onClick={() => handleStart(1000)}>
                  +1,000
                </Button>
                <Button variant="outlined" onClick={() => handleStart(10000)}>
                  +10,000
                </Button>
                <Button variant="outlined" color="error" onClick={handleReset}>
                  リセット
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Layout>
  )
}

const CANVAS_SIZE = 280

type Point = { x: number; y: number; inside: boolean }
type SamplingMethod = 'random' | 'stratified' | 'halton'

// Halton列: 基数bでインデックスiの値を計算
function halton(index: number, base: number): number {
  let result = 0
  let f = 1 / base
  let i = index
  while (i > 0) {
    result += f * (i % base)
    i = Math.floor(i / base)
    f /= base
  }
  return result
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#fafafa'
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

  ctx.beginPath()
  ctx.arc(0, CANVAS_SIZE, CANVAS_SIZE, -Math.PI / 2, 0)
  ctx.strokeStyle = colors.grey.main
  ctx.lineWidth = 2
  ctx.stroke()
}

function useMonteCarlo(method: SamplingMethod) {
  const [total, setTotal] = useState<number>(0)
  const [inCount, setInCount] = useState<number>(0)
  const [piHistory, setPiHistory] = useState<number[]>([])
  const haltonIndexRef = useRef<number>(1) // Halton列の現在のインデックス

  const addPoints = useCallback(
    (n: number): Point[] => {
      const newPoints: Point[] = []
      let ic = 0

      if (method === 'random') {
        // 純粋なランダムサンプリング
        for (let i = 0; i < n; i++) {
          const x = Math.random()
          const y = Math.random()
          const inside = x ** 2 + y ** 2 <= 1
          if (inside) ic++
          if (n <= 1000 || i % Math.ceil(n / 1000) === 0) {
            newPoints.push({ x, y, inside })
          }
        }
      } else if (method === 'stratified') {
        // 層化サンプリング: グリッドを使用
        // グリッドサイズを計算（nに近い平方数になるように）
        const gridSize = Math.max(1, Math.floor(Math.sqrt(n)))
        const cellSize = 1 / gridSize
        let count = 0

        for (let gx = 0; gx < gridSize && count < n; gx++) {
          for (let gy = 0; gy < gridSize && count < n; gy++) {
            // 各セル内でランダムな位置を選択
            const x = (gx + Math.random()) * cellSize
            const y = (gy + Math.random()) * cellSize
            const inside = x ** 2 + y ** 2 <= 1
            if (inside) ic++
            newPoints.push({ x, y, inside })
            count++
          }
        }
      } else {
        // Halton列: 準乱数で均等に空間を埋める
        for (let i = 0; i < n; i++) {
          const idx = haltonIndexRef.current++
          const x = halton(idx, 2) // 基数2でx座標
          const y = halton(idx, 3) // 基数3でy座標
          const inside = x ** 2 + y ** 2 <= 1
          if (inside) ic++
          newPoints.push({ x, y, inside })
        }
      }

      setTotal((prev) => {
        const newTotal = prev + (method === 'random' ? n : newPoints.length)
        setInCount((prevIn) => {
          const newInCount = prevIn + ic
          setPiHistory((h) => [...h, (newInCount / newTotal) * 4])
          return newInCount
        })
        return newTotal
      })

      return newPoints
    },
    [method]
  )

  const reset = useCallback(() => {
    setTotal(0)
    setInCount(0)
    setPiHistory([])
    haltonIndexRef.current = 1
  }, [])

  return {
    total,
    inCount,
    piHistory,
    addPoints,
    reset,
    pi: total > 0 ? (inCount / total) * 4 : 0,
  } as const
}

function StatItem({
  label,
  value,
  primary,
  error,
}: {
  label: string
  value: string
  primary?: boolean
  error?: boolean
}) {
  return (
    <StatItemWrapper>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: primary ? 700 : 400,
          color: error ? 'error.main' : primary ? 'primary.main' : 'inherit',
        }}
      >
        {value}
      </Typography>
    </StatItemWrapper>
  )
}

const CanvasWrapper = styled.div`
  display: flex;
  justify-content: center;

  canvas {
    max-width: 100%;
    height: auto;
    border: 1px solid ${colors.grey.light};
    border-radius: 4px;
  }
`

const StatsRow = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${colors.grey.light};
`

const StatItemWrapper = styled.div`
  text-align: center;
`

const ColorDot = styled.span<{ $color: string }>`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
`

export default PiLab
