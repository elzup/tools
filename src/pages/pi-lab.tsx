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
  const { total, inCount, pi, piHistory, addPoints, reset } = useMonteCarlo()
  const [stepSize, setStepSize] = useState<number>(100)
  const plotCanvasRef = useRef<HTMLCanvasElement>(null)
  const historyCanvasRef = useRef<HTMLCanvasElement>(null)

  // 初期化: 円を描画
  useEffect(() => {
    const canvas = plotCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#fafafa'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    ctx.beginPath()
    ctx.arc(0, CANVAS_SIZE, CANVAS_SIZE, -Math.PI / 2, 0)
    ctx.strokeStyle = colors.grey.main
    ctx.lineWidth = 2
    ctx.stroke()
  }, [])

  // ポイント追加時の描画（上書き）
  const drawPoints = useCallback((newPoints: Point[]) => {
    const canvas = plotCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    newPoints.forEach(({ x, y, inside }) => {
      ctx.beginPath()
      ctx.arc(x * CANVAS_SIZE, CANVAS_SIZE - y * CANVAS_SIZE, 2, 0, Math.PI * 2)
      ctx.fillStyle = inside ? 'rgba(121, 85, 72, 0.5)' : 'rgba(229, 115, 115, 0.5)'
      ctx.fill()
    })
  }, [])

  // PI履歴グラフの再描画
  useEffect(() => {
    const canvas = historyCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = CANVAS_SIZE
    const height = 200

    ctx.fillStyle = '#fafafa'
    ctx.fillRect(0, 0, width, height)

    if (piHistory.length < 2) return

    const yMin = 2.5
    const yMax = 4.0
    const yRange = yMax - yMin

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

    // 履歴ライン
    ctx.beginPath()
    const step = width / (piHistory.length - 1)
    piHistory.forEach((pi, i) => {
      const x = i * step
      const y = height - ((Math.min(Math.max(pi, yMin), yMax) - yMin) / yRange) * height
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.strokeStyle = colors.brown.main
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = colors.grey.dark
    ctx.font = '12px sans-serif'
    ctx.fillText('π=' + Math.PI.toFixed(4), width - 70, piY - 5)
  }, [piHistory])

  // プロットキャンバスのリセット
  const resetCanvas = useCallback(() => {
    const canvas = plotCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#fafafa'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    ctx.beginPath()
    ctx.arc(0, CANVAS_SIZE, CANVAS_SIZE, -Math.PI / 2, 0)
    ctx.strokeStyle = colors.grey.main
    ctx.lineWidth = 2
    ctx.stroke()
  }, [])

  const handleStart = useCallback((n: number) => {
    const newPoints = addPoints(n)
    drawPoints(newPoints)
  }, [addPoints, drawPoints])

  const handleReset = useCallback(() => {
    reset()
    resetCanvas()
  }, [reset, resetCanvas])

  return (
    <Layout title={title} footer="minimal">
      <Title>{title}</Title>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ポイントプロット
              </Typography>
              <CanvasWrapper>
                <canvas ref={plotCanvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} />
              </CanvasWrapper>
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  茶: 円内 / 赤: 円外
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                PI 推定履歴
              </Typography>
              <CanvasWrapper>
                <canvas ref={historyCanvasRef} width={CANVAS_SIZE} height={200} />
              </CanvasWrapper>
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  横軸: 試行回数 / 縦軸: PI推定値
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 4 }}>
                  <StatBox>
                    <Typography variant="caption" color="text.secondary">
                      試行回数
                    </Typography>
                    <Typography variant="h4">{total.toLocaleString()}</Typography>
                  </StatBox>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <StatBox>
                    <Typography variant="caption" color="text.secondary">
                      円内ポイント
                    </Typography>
                    <Typography variant="h4">{inCount.toLocaleString()}</Typography>
                  </StatBox>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <StatBox>
                    <Typography variant="caption" color="text.secondary">
                      推定 PI
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {total > 0 ? pi.toFixed(8) : '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      実際: {Math.PI.toFixed(8)}
                    </Typography>
                    {total > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography
                          variant="body2"
                          color={Math.abs(pi - Math.PI) < 0.01 ? 'success.main' : 'error.main'}
                        >
                          誤差: {(pi - Math.PI).toFixed(8)} ({((Math.abs(pi - Math.PI) / Math.PI) * 100).toFixed(4)}%)
                        </Typography>
                      </Box>
                    )}
                  </StatBox>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                ステップサイズ: {stepSize.toLocaleString()}
              </Typography>
              <Slider
                value={stepSize}
                onChange={(_: Event, v: number | number[]) => setStepSize(v as number)}
                min={1}
                max={10000}
                step={1}
                valueLabelDisplay="auto"
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                <Button variant="contained" onClick={() => handleStart(stepSize)}>
                  試行 (+{stepSize.toLocaleString()})
                </Button>
                <Button variant="outlined" onClick={() => handleStart(1000)}>
                  +1,000
                </Button>
                <Button variant="outlined" onClick={() => handleStart(10000)}>
                  +10,000
                </Button>
                <Button variant="outlined" onClick={() => handleStart(100000)}>
                  +100,000
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

const CANVAS_SIZE = 300

type Point = { x: number; y: number; inside: boolean }

function useMonteCarlo() {
  const [total, setTotal] = useState<number>(0)
  const [inCount, setInCount] = useState<number>(0)
  const [piHistory, setPiHistory] = useState<number[]>([])

  const addPoints = useCallback((n: number): Point[] => {
    const newPoints: Point[] = []
    let ic = 0

    for (let i = 0; i < n; i++) {
      const x = Math.random()
      const y = Math.random()
      const inside = x ** 2 + y ** 2 <= 1

      if (inside) ic++
      // 描画用に間引き（最大1000点まで）
      if (n <= 1000 || i % Math.ceil(n / 1000) === 0) {
        newPoints.push({ x, y, inside })
      }
    }

    setTotal((prev) => {
      const newTotal = prev + n
      setInCount((prevIn) => {
        const newInCount = prevIn + ic
        setPiHistory((h) => [...h, (newInCount / newTotal) * 4])
        return newInCount
      })
      return newTotal
    })

    return newPoints
  }, [])

  const reset = useCallback(() => {
    setTotal(0)
    setInCount(0)
    setPiHistory([])
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

const StatBox = styled.div`
  text-align: center;
  padding: 1rem;
`

export default PiLab
