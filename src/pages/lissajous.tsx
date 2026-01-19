import { useEffect, useRef, useState } from 'react'
import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  Paper,
  Radio,
  RadioGroup,
  Slider,
  Switch,
  Typography,
} from '@mui/material'
import styled from 'styled-components'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const title = 'Lissajous Curves Grid'

type WaveformType = 'sine' | 'triangle' | 'square' | 'sawtooth'

type LissajousCanvasProps = {
  freqA: number
  freqB: number
  size: number
  speed: number
  showTrace: boolean
  waveform: WaveformType
  customWaveform?: number[]
  phase?: number
}

// Waveform functions
const waveforms = {
  sine: (t: number) => Math.sin(t),
  triangle: (t: number) => {
    const normalized = ((t / Math.PI) % 2) - 1
    return 2 * Math.abs(normalized) - 1
  },
  square: (t: number) => (Math.sin(t) >= 0 ? 1 : -1),
  sawtooth: (t: number) => 2 * ((t / (Math.PI * 2)) % 1) - 1,
  custom: (t: number, customPoints?: number[]) => {
    if (!customPoints || customPoints.length === 0) return Math.sin(t)
    const normalized = ((t / (Math.PI * 2)) % 1) * customPoints.length
    const index = Math.floor(normalized)
    const frac = normalized - index
    const p1 = customPoints[index % customPoints.length]
    const p2 = customPoints[(index + 1) % customPoints.length]
    return p1 + (p2 - p1) * frac
  },
}

const LissajousCanvas = ({
  freqA,
  freqB,
  size,
  speed,
  showTrace,
  waveform,
  customWaveform,
  phase = 0,
}: LissajousCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const timeRef = useRef<number>(0)
  const tracePointsRef = useRef<{ x: number; y: number }[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = size / 2
    const centerY = size / 2
    const radius = size * 0.4
    const waveFn = (t: number) => waveforms.custom(t, customWaveform)

    const animate = () => {
      ctx.clearRect(0, 0, size, size)

      // Background
      ctx.fillStyle = '#f8f9fa'
      ctx.fillRect(0, 0, size, size)

      // Draw trace
      if (showTrace && tracePointsRef.current.length > 1) {
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(tracePointsRef.current[0].x, tracePointsRef.current[0].y)
        for (let i = 1; i < tracePointsRef.current.length; i++) {
          ctx.lineTo(tracePointsRef.current[i].x, tracePointsRef.current[i].y)
        }
        ctx.stroke()
      }

      // Calculate current position
      const x = centerX + radius * waveFn(freqA * timeRef.current + phase)
      const y = centerY + radius * waveFn(freqB * timeRef.current)

      // Add to trace
      if (showTrace) {
        tracePointsRef.current.push({ x, y })
        if (tracePointsRef.current.length > 500) {
          tracePointsRef.current.shift()
        }
      }

      // Draw current point
      ctx.fillStyle = '#3b82f6'
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()

      // Draw curve path
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      for (let t = 0; t <= Math.PI * 2; t += 0.01) {
        const px = centerX + radius * waveFn(freqA * t + phase)
        const py = centerY + radius * waveFn(freqB * t)
        if (t === 0) {
          ctx.moveTo(px, py)
        } else {
          ctx.lineTo(px, py)
        }
      }
      ctx.stroke()

      timeRef.current += 0.02 * speed
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [freqA, freqB, size, speed, showTrace, waveform, customWaveform, phase])

  useEffect(() => {
    tracePointsRef.current = []
  }, [showTrace])

  return <canvas ref={canvasRef} width={size} height={size} />
}

type CurveEditorProps = {
  points: number[]
  onChange: (points: number[]) => void
}

const CurveEditor = ({ points, onChange }: CurveEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dragging, setDragging] = useState<number | null>(null)

  const width = 400
  const height = 150
  const padding = 20

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)

    // Grid
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, height / 2)
    ctx.lineTo(width, height / 2)
    ctx.stroke()

    // Curve
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.beginPath()
    points.forEach((y, i) => {
      const x = padding + (i / (points.length - 1)) * (width - padding * 2)
      const py = height / 2 - y * (height / 2 - padding)
      if (i === 0) {
        ctx.moveTo(x, py)
      } else {
        ctx.lineTo(x, py)
      }
    })
    ctx.stroke()

    // Points
    points.forEach((y, i) => {
      const x = padding + (i / (points.length - 1)) * (width - padding * 2)
      const py = height / 2 - y * (height / 2 - padding)
      ctx.fillStyle = dragging === i ? '#ff5722' : '#3b82f6'
      ctx.beginPath()
      ctx.arc(x, py, 6, 0, Math.PI * 2)
      ctx.fill()
    })
  }, [points, dragging])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    points.forEach((py, i) => {
      const px = padding + (i / (points.length - 1)) * (width - padding * 2)
      const pointY = height / 2 - py * (height / 2 - padding)
      const dist = Math.sqrt((x - px) ** 2 + (y - pointY) ** 2)
      if (dist < 10) {
        setDragging(i)
      }
    })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragging === null) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const y = e.clientY - rect.top
    const normalized = -(y - height / 2) / (height / 2 - padding)
    const clamped = Math.max(-1, Math.min(1, normalized))

    const newPoints = [...points]
    newPoints[dragging] = clamped
    onChange(newPoints)
  }

  const handleMouseUp = () => {
    setDragging(null)
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: dragging !== null ? 'grabbing' : 'pointer', border: '1px solid #ccc', borderRadius: '4px' }}
    />
  )
}

const LissajousPage = () => {
  const [gridSize, setGridSize] = useState(8)
  const [cellSize, setCellSize] = useState(80)
  const [speed, setSpeed] = useState(1)
  const [showTrace, setShowTrace] = useState(false)
  const [waveform, setWaveform] = useState<WaveformType>('sine')
  const [phase, setPhase] = useState(0)
  const [customWaveform, setCustomWaveform] = useState<number[]>(
    Array.from({ length: 16 }, (_, i) => Math.sin((i / 16) * Math.PI * 2))
  )

  useEffect(() => {
    const waveFn = waveforms[waveform]
    const newPoints = Array.from({ length: 16 }, (_, i) => {
      const t = (i / 16) * Math.PI * 2
      return waveFn(t)
    })
    setCustomWaveform(newPoints)
  }, [waveform])

  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <Container>
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Controls
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="textSecondary" gutterBottom>
              Grid Size: {gridSize}x{gridSize}
            </Typography>
            <Slider
              value={gridSize}
              onChange={(_, v) => setGridSize(v as number)}
              min={3}
              max={12}
              step={1}
              marks
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="textSecondary" gutterBottom>
              Cell Size: {cellSize}px
            </Typography>
            <Slider
              value={cellSize}
              onChange={(_, v) => setCellSize(v as number)}
              min={40}
              max={120}
              step={10}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="textSecondary" gutterBottom>
              Animation Speed: {speed.toFixed(1)}x
            </Typography>
            <Slider
              value={speed}
              onChange={(_, v) => setSpeed(v as number)}
              min={0.1}
              max={3}
              step={0.1}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="textSecondary" gutterBottom>
              Phase Shift: {(phase / Math.PI).toFixed(2)}π
            </Typography>
            <Slider
              value={phase}
              onChange={(_, v) => setPhase(v as number)}
              min={0}
              max={Math.PI * 2}
              step={0.01}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showTrace}
                  onChange={(e) => setShowTrace(e.target.checked)}
                />
              }
              label="Show trace"
            />
          </Box>

          <FormControl>
            <FormLabel>Waveform</FormLabel>
            <RadioGroup
              value={waveform}
              onChange={(e) => setWaveform(e.target.value as WaveformType)}
            >
              <FormControlLabel
                value="sine"
                control={<Radio />}
                label="Sine (Circle)"
              />
              <FormControlLabel
                value="triangle"
                control={<Radio />}
                label="Triangle (Hexagon-like)"
              />
              <FormControlLabel
                value="square"
                control={<Radio />}
                label="Square (Rectangle-like)"
              />
              <FormControlLabel
                value="sawtooth"
                control={<Radio />}
                label="Sawtooth"
              />
            </RadioGroup>
          </FormControl>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Waveform Editor
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
              Drag points to customize the selected waveform
            </Typography>
            <CurveEditor points={customWaveform} onChange={setCustomWaveform} />
          </Box>
        </Paper>

        <Paper elevation={1} sx={{ p: 2, overflow: 'auto' }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Each cell shows a Lissajous curve with frequency ratio A:B (row:col).
            Sine wave creates circles on diagonals. Try 3:2 or 2:3 ratios with phase shift π/2 (0.50π) to see hexagons!
            Triangle wave creates hexagon-like shapes. Square wave creates rectangle-like shapes.
          </Typography>

          <GridContainer cellSize={cellSize} gridSize={gridSize}>
            {/* Column headers */}
            <HeaderCell />
            {Array.from({ length: gridSize }).map((_, col) => (
              <HeaderCell key={`col-${col}`}>{col + 1}</HeaderCell>
            ))}

            {Array.from({ length: gridSize }).map((_, row) => (
              <>
                {/* Row header */}
                <HeaderCell key={`row-${row}`}>{row + 1}</HeaderCell>

                {/* Grid cells */}
                {Array.from({ length: gridSize }).map((_, col) => (
                  <GridCell key={`${row}-${col}`}>
                    <LissajousCanvas
                      freqA={row + 1}
                      freqB={col + 1}
                      size={cellSize}
                      speed={speed}
                      showTrace={showTrace}
                      waveform={waveform}
                      customWaveform={customWaveform}
                      phase={phase}
                    />
                  </GridCell>
                ))}
              </>
            ))}
          </GridContainer>
        </Paper>

        <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            About Lissajous Curves
          </Typography>
          <Typography variant="body2" paragraph>
            Lissajous curves are complex harmonic motions created by combining
            two perpendicular sinusoidal oscillations. The shape depends on the
            frequency ratio and phase difference between the two oscillations.
          </Typography>
          <Typography variant="body2" component="div">
            <strong>Formula:</strong>
            <br />
            x(t) = A × sin(a×t + δ)
            <br />
            y(t) = B × sin(b×t)
            <br />
            <br />
            Where a:b is the frequency ratio shown in each cell (row:column).
          </Typography>
        </Paper>
      </Container>
    </Layout>
  )
}

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
`

const GridContainer = styled.div<{ cellSize: number; gridSize: number }>`
  display: grid;
  grid-template-columns: 40px repeat(${(props) => props.gridSize}, ${(props) => props.cellSize}px);
  gap: 4px;
  width: fit-content;
  margin: 0 auto;
`

const HeaderCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #666;
  font-size: 0.875rem;
`

const GridCell = styled.div`
  background: #f8f9fa;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #e0e0e0;

  canvas {
    display: block;
  }
`

export default LissajousPage
