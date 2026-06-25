import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Slider,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Engine, type Body as MatterBody } from 'matter-js'
import styled from 'styled-components'
import {
  CASHEW_STAGE,
  type CashewSimulationSettings,
  type CashewOutcome,
  type CashewSide,
  classifyCashewSide,
  createCashewScene,
  simulateCashewTrials,
} from '../../lib/cashew-fortune'
import { colors } from '../theme'

type OutcomeInfo = {
  label: string
  caption: string
  color: string
}

const outcomeInfo: Record<CashewOutcome, OutcomeInfo> = {
  bothInnerUp: {
    label: '表表',
    caption: '2枚とも表',
    color: colors.gold.main,
  },
  bothInnerDown: {
    label: '裏裏',
    caption: '2枚とも裏',
    color: colors.brown.main,
  },
  split: {
    label: '表裏',
    caption: '表と裏に分かれた',
    color: '#607d8b',
  },
}

const formatRate = (count: number, total: number) =>
  `${((count / Math.max(1, total)) * 100).toFixed(2)}%`

const sideLabel = (side: CashewSide) => (side === 'innerUp' ? '表' : '裏')

const CashewMark = ({ side }: { side: CashewSide }) => (
  <Nut $side={side} aria-label={sideLabel(side)}>
    <span />
  </Nut>
)

type PreviewState = {
  status: 'idle' | 'running' | 'settled'
  pair: [CashewSide, CashewSide] | null
}

const fitCanvas = (canvas: HTMLCanvasElement) => {
  const rect = canvas.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.max(1, Math.round(rect.width * dpr))
  canvas.height = Math.max(1, Math.round(rect.height * dpr))
  return { width: rect.width, height: rect.height, dpr }
}

const toCanvasPoint = (x: number, y: number, width: number, height: number) => {
  const xRatio =
    (x - CASHEW_STAGE.minX) / (CASHEW_STAGE.maxX - CASHEW_STAGE.minX)
  const yRatio =
    (y - CASHEW_STAGE.minY) / (CASHEW_STAGE.maxY - CASHEW_STAGE.minY)

  return {
    x: xRatio * width,
    y: (1 - yRatio) * height,
  }
}

const isSettledBody = (body: MatterBody) => {
  const speed = Math.hypot(body.velocity.x, body.velocity.y)
  return (
    body.isSleeping || (speed < 0.04 && Math.abs(body.angularVelocity) < 0.04)
  )
}

const drawBody = (
  ctx: CanvasRenderingContext2D,
  body: MatterBody,
  width: number,
  height: number,
  fill: string,
  stroke: string
) => {
  const vertices = body.vertices
  if (vertices.length === 0) return

  ctx.beginPath()
  vertices.forEach((vertex, index) => {
    const point = toCanvasPoint(vertex.x, vertex.y, width, height)
    if (index === 0) ctx.moveTo(point.x, point.y)
    else ctx.lineTo(point.x, point.y)
  })
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = stroke
  ctx.stroke()

  const center = toCanvasPoint(body.position.x, body.position.y, width, height)
  const innerAngle = body.angle
  const grooveX = center.x + Math.cos(innerAngle) * 11
  const grooveY = center.y + Math.sin(innerAngle) * 11
  ctx.beginPath()
  ctx.ellipse(grooveX, grooveY, 10, 4.5, innerAngle, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 250, 235, 0.75)'
  ctx.fill()
}

const drawScene = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  first: MatterBody,
  second: MatterBody,
  settledPair: [CashewSide, CashewSide] | null
) => {
  const bg = ctx.createLinearGradient(0, 0, 0, height)
  bg.addColorStop(0, '#fbf6ee')
  bg.addColorStop(1, '#f3e7d3')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  const floorY = toCanvasPoint(0, 180, width, height).y
  const shelfY = toCanvasPoint(0, 88, width, height).y

  ctx.strokeStyle = 'rgba(61, 39, 31, 0.28)'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(0, floorY)
  ctx.lineTo(width, floorY)
  ctx.stroke()

  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(width * 0.24, shelfY)
  ctx.lineTo(width * 0.76, shelfY - 6)
  ctx.stroke()

  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.fillRect(0, floorY + 3, width, height - floorY)

  drawBody(ctx, first, width, height, '#c99b63', '#754a2e')
  drawBody(ctx, second, width, height, '#d9b37c', '#7a5330')

  ctx.fillStyle = '#4b382b'
  ctx.font = '600 14px sans-serif'
  ctx.fillText('落下中', 16, 24)

  if (settledPair) {
    const text = `${sideLabel(settledPair[0])} / ${sideLabel(settledPair[1])}`
    ctx.fillStyle = 'rgba(58, 39, 28, 0.92)'
    ctx.fillRect(16, height - 42, 178, 24)
    ctx.fillStyle = '#fff'
    ctx.fillText(text, 24, height - 24)
  }
}

const CashewPreview = ({
  settings,
  replayKey,
  onSettle,
}: {
  settings: Omit<CashewSimulationSettings, 'trials'>
  replayKey: number
  onSettle?: (pair: [CashewSide, CashewSide]) => void
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [previewState, setPreviewState] = useState<PreviewState>({
    status: 'idle',
    pair: null,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scene = createCashewScene({ trials: 1, ...settings }, Math.random)
    const { engine, first, second } = scene
    let frameId = 0
    let stableFrames = 0
    let disposed = false
    let settledPair: [CashewSide, CashewSide] | null = null

    const render = () => {
      const { width, height, dpr } = fitCanvas(canvas)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawScene(ctx, width, height, first, second, settledPair)
    }

    const tick = () => {
      if (disposed) return
      Engine.update(engine, 1000 / 60)
      render()

      if (isSettledBody(first) && isSettledBody(second)) {
        stableFrames += 1
        if (stableFrames >= 18) {
          settledPair = [
            classifyCashewSide(first.angle),
            classifyCashewSide(second.angle),
          ]
          setPreviewState({ status: 'settled', pair: settledPair })
          onSettle?.(settledPair)
          render()
          return
        }
      } else {
        stableFrames = 0
      }

      frameId = window.requestAnimationFrame(tick)
    }

    const observer = new ResizeObserver(() => {
      render()
    })

    observer.observe(canvas)
    setPreviewState({ status: 'running', pair: null })
    render()
    frameId = window.requestAnimationFrame(tick)

    return () => {
      disposed = true
      window.cancelAnimationFrame(frameId)
      observer.disconnect()
    }
  }, [
    onSettle,
    replayKey,
    settings.asymmetry,
    settings.damping,
    settings.launchEnergy,
  ])

  return (
    <PreviewWrap>
      <PreviewCanvas ref={canvasRef} />
      <PreviewBadge $status={previewState.status}>
        {previewState.status === 'running' ? '落下中' : '停止'}
      </PreviewBadge>
      {previewState.pair && (
        <PreviewCaption>
          {sideLabel(previewState.pair[0])} / {sideLabel(previewState.pair[1])}
        </PreviewCaption>
      )}
    </PreviewWrap>
  )
}

const CashewFortune = () => {
  const [trials, setTrials] = useState(400)
  const [asymmetry, setAsymmetry] = useState(0.12)
  const [launchEnergy, setLaunchEnergy] = useState(1.35)
  const [damping, setDamping] = useState(0.16)
  const [appliedSettings, setAppliedSettings] =
    useState<CashewSimulationSettings>({
      trials,
      asymmetry,
      launchEnergy,
      damping,
    })
  const [runId, setRunId] = useState(0)

  const result = useMemo(
    () => simulateCashewTrials(appliedSettings),
    [appliedSettings, runId]
  )

  const entries = Object.entries(result.pairCounts) as Array<
    [CashewOutcome, number]
  >
  const topOutcome = entries.reduce((best, current) =>
    current[1] > best[1] ? current : best
  )
  const innerUpRate = formatRate(result.innerUp, result.trials * 2)
  const innerDownRate = formatRate(result.innerDown, result.trials * 2)

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <StageShell>
            <StageHeader>
              <Box>
                <Typography variant="h6">落下中の様子</Typography>
                <Typography variant="body2" color="text.secondary">
                  1 つの物体を落として割り、2 枚の向きを物理演算で見ます。
                </Typography>
              </Box>
            </StageHeader>
            <CashewPreview
              settings={{
                asymmetry,
                launchEnergy,
                damping,
              }}
              replayKey={runId}
            />
          </StageShell>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6">物理モデル</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Matter.js で 1 枚の本体を落とし、着地で 2
                    枚に分かれるようにしています。
                    形の偏りは左右の重心差として入れています。
                  </Typography>
                </Box>

                <ControlBlock>
                  <ControlHeader>
                    <Typography>試行回数</Typography>
                    <Typography>{trials.toLocaleString()} 回</Typography>
                  </ControlHeader>
                  <Slider
                    min={50}
                    max={2000}
                    step={50}
                    value={trials}
                    onChange={(_, value) => setTrials(value as number)}
                  />
                </ControlBlock>

                <ControlBlock>
                  <ControlHeader>
                    <Typography>左右の偏り</Typography>
                    <Typography>{asymmetry.toFixed(2)}</Typography>
                  </ControlHeader>
                  <Slider
                    min={-0.45}
                    max={0.45}
                    step={0.01}
                    value={asymmetry}
                    onChange={(_, value) => setAsymmetry(value as number)}
                    marks={[
                      { value: -0.45, label: '下寄り' },
                      { value: 0, label: '対称' },
                      { value: 0.45, label: '上寄り' },
                    ]}
                  />
                </ControlBlock>

                <ControlBlock>
                  <ControlHeader>
                    <Typography>投げる強さ</Typography>
                    <Typography>{launchEnergy.toFixed(2)}</Typography>
                  </ControlHeader>
                  <Slider
                    min={0.4}
                    max={2.6}
                    step={0.05}
                    value={launchEnergy}
                    onChange={(_, value) => setLaunchEnergy(value as number)}
                  />
                </ControlBlock>

                <ControlBlock>
                  <ControlHeader>
                    <Typography>止まりやすさ</Typography>
                    <Typography>{damping.toFixed(2)}</Typography>
                  </ControlHeader>
                  <Slider
                    min={0.04}
                    max={0.3}
                    step={0.01}
                    value={damping}
                    onChange={(_, value) => setDamping(value as number)}
                  />
                </ControlBlock>

                <Button
                  onClick={() => {
                    setAppliedSettings({
                      trials,
                      asymmetry,
                      launchEnergy,
                      damping,
                    })
                    setRunId((value) => value + 1)
                  }}
                >
                  物理演算で実行
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="h6">出やすい結果</Typography>
                  <Typography variant="h4" component="p">
                    {outcomeInfo[topOutcome[0]].label}
                  </Typography>
                  <Typography color="text.secondary">
                    {formatRate(topOutcome[1], result.trials)}
                  </Typography>
                </Box>

                <Stack spacing={1.5}>
                  {entries.map(([outcome, count]) => (
                    <ResultRow key={outcome}>
                      <ResultLabel>
                        <Typography>{outcomeInfo[outcome].label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {outcomeInfo[outcome].caption}
                        </Typography>
                      </ResultLabel>
                      <ResultTrack>
                        <ResultBar
                          $color={outcomeInfo[outcome].color}
                          $rate={count / result.trials}
                        />
                      </ResultTrack>
                      <RateText>{formatRate(count, result.trials)}</RateText>
                    </ResultRow>
                  ))}
                </Stack>

                <SideSummary>
                  <div>
                    <Typography variant="caption" color="text.secondary">
                      単体の表が上
                    </Typography>
                    <Typography variant="h5">{innerUpRate}</Typography>
                  </div>
                  <div>
                    <Typography variant="caption" color="text.secondary">
                      単体の裏が上
                    </Typography>
                    <Typography variant="h5">{innerDownRate}</Typography>
                  </div>
                </SideSummary>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            最近の割れ方
          </Typography>
          <SampleGrid>
            {result.samples.map(([first, second], index) => (
              <SampleItem key={`${index}-${first}-${second}`}>
                <CashewMark side={first} />
                <CashewMark side={second} />
              </SampleItem>
            ))}
          </SampleGrid>
        </CardContent>
      </Card>
    </Stack>
  )
}

const ControlBlock = styled.div`
  display: grid;
  gap: 0.35rem;
`

const ControlHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
`

const ResultRow = styled.div`
  display: grid;
  grid-template-columns: minmax(10rem, 1fr) minmax(8rem, 2fr) 4.5rem;
  gap: 1rem;
  align-items: center;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
    gap: 0.4rem;
  }
`

const ResultLabel = styled.div`
  min-width: 0;
`

const ResultTrack = styled.div`
  height: 14px;
  background: ${colors.grey.light};
  border-radius: 999px;
  overflow: hidden;
`

const ResultBar = styled.div<{ $color: string; $rate: number }>`
  width: ${({ $rate }) => `${Math.max(1, $rate * 100)}%`};
  height: 100%;
  background: ${({ $color }) => $color};
`

const RateText = styled.div`
  font-variant-numeric: tabular-nums;
  text-align: right;

  @media (max-width: 700px) {
    text-align: left;
  }
`

const SideSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  > div {
    border: 1px solid ${colors.grey.light};
    border-radius: 8px;
    padding: 1rem;
  }
`

const SampleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(74px, 1fr));
  gap: 0.75rem;
`

const SampleItem = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.35rem;
  border: 1px solid ${colors.grey.light};
  border-radius: 8px;
  padding: 0.75rem 0.5rem;
`

const Nut = styled.div<{ $side: CashewSide }>`
  position: relative;
  width: 28px;
  height: 42px;
  transform: ${({ $side }) =>
    $side === 'innerUp' ? 'rotate(-28deg)' : 'rotate(152deg)'};

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border: 8px solid ${colors.gold.main};
    border-left-color: ${colors.brown.light};
    border-radius: 50%;
  }

  span {
    position: absolute;
    inset: 10px 7px;
    border-radius: 50%;
    background: #fffaf0;
  }
`

const StageShell = styled.div`
  display: grid;
  gap: 1rem;
`

const StageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
`

const PreviewWrap = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 7;
  overflow: hidden;
  border: 1px solid ${colors.grey.light};
  border-radius: 8px;
`

const PreviewCanvas = styled.canvas`
  display: block;
  width: 100%;
  height: 100%;
`

const PreviewBadge = styled.div<{ $status: PreviewState['status'] }>`
  position: absolute;
  left: 12px;
  top: 12px;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.82);
  color: ${colors.brown.darker};
`

const PreviewCaption = styled.div`
  position: absolute;
  left: 12px;
  bottom: 12px;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  background: rgba(34, 21, 16, 0.78);
  color: #fff;
`

export default CashewFortune
