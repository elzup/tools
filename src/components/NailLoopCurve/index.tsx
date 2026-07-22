import {
  Button,
  FormControlLabel,
  Slider,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import styled from 'styled-components'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  PRESET_OPTIONS,
  PRESETS,
  type PresetKey,
  presetToNails,
} from './config'
import { type DrawFlags, drawNailLoopCurve } from './drawing'
import { type Curve, type Point, computeCurve, distance } from './geometry'

const DEFAULT_SLACK = 90
const NAIL_HIT_RADIUS = 22
const CANVAS_PADDING = 12

const DEFAULT_FLAGS: DrawFlags = {
  showTriangle: true,
  colorArcs: false,
  isDemoPlaying: false,
}

const NailLoopCurve = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nailsRef = useRef<Point[]>(presetToNails(PRESETS.equilateral))
  const slackRef = useRef(DEFAULT_SLACK)
  const flagsRef = useRef<DrawFlags>(DEFAULT_FLAGS)
  const curveRef = useRef<Curve | null>(null)
  const curveSignatureRef = useRef('')
  const draggedNailIndexRef = useRef(-1)
  const demoIndexRef = useRef(0)

  const [slack, setSlack] = useState(DEFAULT_SLACK)
  const [flags, setFlags] = useState<DrawFlags>(DEFAULT_FLAGS)
  const [readout, setReadout] = useState({
    trianglePerimeter: 0,
    loopLength: 0,
  })

  slackRef.current = slack
  flagsRef.current = flags

  const pointerToCanvasPoint = (event: ReactPointerEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect()

    return {
      x: ((event.clientX - rect.left) * CANVAS_WIDTH) / rect.width,
      y: ((event.clientY - rect.top) * CANVAS_HEIGHT) / rect.height,
    }
  }

  const handlePointerDown = (event: ReactPointerEvent) => {
    const pointer = pointerToCanvasPoint(event)
    const nearestNailIndex = nailsRef.current.reduce(
      (nearestIndex, nail, index) => {
        if (distance(nail, pointer) >= NAIL_HIT_RADIUS) return nearestIndex
        if (nearestIndex < 0) return index
        return distance(nail, pointer) <
          distance(nailsRef.current[nearestIndex], pointer)
          ? index
          : nearestIndex
      },
      -1
    )

    if (nearestNailIndex < 0) return
    draggedNailIndexRef.current = nearestNailIndex
    canvasRef.current?.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: ReactPointerEvent) => {
    if (draggedNailIndexRef.current < 0) return
    const pointer = pointerToCanvasPoint(event)

    nailsRef.current = nailsRef.current.map((nail, index) =>
      index === draggedNailIndexRef.current
        ? {
            x: Math.max(
              CANVAS_PADDING,
              Math.min(CANVAS_WIDTH - CANVAS_PADDING, pointer.x)
            ),
            y: Math.max(
              CANVAS_PADDING,
              Math.min(CANVAS_HEIGHT - CANVAS_PADDING, pointer.y)
            ),
          }
        : nail
    )
  }

  const finishDragging = (event: ReactPointerEvent) => {
    draggedNailIndexRef.current = -1
    if (canvasRef.current?.hasPointerCapture(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId)
    }
  }

  const applyPreset = (key: PresetKey) => {
    const preset = PRESETS[key]

    nailsRef.current = presetToNails(preset)
    if ('slack' in preset && preset.slack !== undefined) {
      setSlack(preset.slack)
    }
  }

  const updateFlags = (patch: Partial<DrawFlags>) =>
    setFlags((currentFlags) => ({ ...currentFlags, ...patch }))

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d')

    if (!context) return
    let animationFrame = 0

    const renderFrame = () => {
      const nails = nailsRef.current
      const signature = `${nails
        .map((nail) => `${nail.x.toFixed(1)},${nail.y.toFixed(1)}`)
        .join(';')}|${slackRef.current}`

      if (signature !== curveSignatureRef.current || !curveRef.current) {
        curveSignatureRef.current = signature
        curveRef.current = computeCurve(nails, slackRef.current)
        setReadout({
          trianglePerimeter: curveRef.current.trianglePerimeter,
          loopLength: curveRef.current.loopLength,
        })
      }
      if (flagsRef.current.isDemoPlaying) {
        demoIndexRef.current =
          (demoIndexRef.current + 2) % curveRef.current.points.length
      }

      drawNailLoopCurve(
        context,
        nails,
        curveRef.current,
        flagsRef.current,
        demoIndexRef.current
      )
      animationFrame = requestAnimationFrame(renderFrame)
    }

    animationFrame = requestAnimationFrame(renderFrame)
    return () => cancelAnimationFrame(animationFrame)
  }, [])

  const slackRatio =
    readout.trianglePerimeter > 0
      ? (slack / readout.trianglePerimeter) * 100
      : 0

  return (
    <PageContent>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        aria-label="3本の釘と糸の輪からできる曲線"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDragging}
        onPointerCancel={finishDragging}
      />

      <Controls>
        <div>
          <Typography variant="caption">
            糸の余りの長さ ({slack}px / 三角形比 +{slackRatio.toFixed(0)}%)
          </Typography>
          <Slider
            size="small"
            min={3}
            max={520}
            step={1}
            value={slack}
            valueLabelDisplay="auto"
            onChange={(_, value) => setSlack(value as number)}
          />
        </div>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {PRESET_OPTIONS.map(({ key, label }) => (
            <Button
              key={key}
              variant="outlined"
              size="small"
              onClick={() => applyPreset(key)}
            >
              {label}
            </Button>
          ))}
        </Stack>

        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={flags.showTriangle}
                onChange={(event) =>
                  updateFlags({ showTriangle: event.target.checked })
                }
              />
            }
            label="釘を結ぶ三角形"
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={flags.colorArcs}
                onChange={(event) =>
                  updateFlags({ colorArcs: event.target.checked })
                }
              />
            }
            label="3つの楕円弧を色分け"
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={flags.isDemoPlaying}
                onChange={(event) =>
                  updateFlags({ isDemoPlaying: event.target.checked })
                }
              />
            }
            label="実演 (鉛筆と糸の輪)"
          />
        </Stack>

        <Typography variant="caption" color="text.secondary">
          三角形の周長 {readout.trianglePerimeter.toFixed(0)}px ／ 糸の輪の全長{' '}
          {readout.loopLength.toFixed(0)}px
        </Typography>
      </Controls>

      <Note>
        3 本の釘 A・B・C
        に一定長の糸の輪をかけ、鉛筆でピンと張ってなぞった軌跡。
        <b>「輪の全長が一定」= P と 3 本の釘を囲む凸包の周長が一定</b>
        という条件で決まり、直接張る 2 本の釘を焦点とする
        <b>楕円の弧が 3 枚</b>
        なめらかに繋がった丸い三角形になる。余りを 0
        に近づけると三角形へ、大きくすると真円へ近づく。釘 (●)
        はドラッグで動かせる。
      </Note>
    </PageContent>
  )
}

const PageContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  canvas {
    width: 100%;
    max-width: ${CANVAS_WIDTH}px;
    height: auto;
    border-radius: 8px;
    touch-action: none;
    cursor: grab;
  }

  canvas:active {
    cursor: grabbing;
  }
`

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: ${CANVAS_WIDTH}px;
`

const Note = styled.p`
  max-width: ${CANVAS_WIDTH}px;
  font-size: 0.85rem;
  line-height: 1.7;
  color: #555;
`

export default NailLoopCurve
