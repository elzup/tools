import { useEffect, useRef, useState } from 'react'
import {
  Box,
  FormControlLabel,
  Paper,
  Slider,
  Switch,
  Typography,
} from '@mui/material'
import styled from 'styled-components'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const title = 'Lissajous Curves Grid'

type LissajousCanvasProps = {
  freqA: number
  freqB: number
  size: number
  speed: number
  showTrace: boolean
}

const LissajousCanvas = ({
  freqA,
  freqB,
  size,
  speed,
  showTrace,
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
      const x = centerX + radius * Math.sin(freqA * timeRef.current)
      const y = centerY + radius * Math.sin(freqB * timeRef.current)

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
        const px = centerX + radius * Math.sin(freqA * t)
        const py = centerY + radius * Math.sin(freqB * t)
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
  }, [freqA, freqB, size, speed, showTrace])

  useEffect(() => {
    tracePointsRef.current = []
  }, [showTrace])

  return <canvas ref={canvasRef} width={size} height={size} />
}

const LissajousPage = () => {
  const [gridSize, setGridSize] = useState(8)
  const [cellSize, setCellSize] = useState(80)
  const [speed, setSpeed] = useState(1)
  const [showTrace, setShowTrace] = useState(false)

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

          <FormControlLabel
            control={
              <Switch
                checked={showTrace}
                onChange={(e) => setShowTrace(e.target.checked)}
              />
            }
            label="Show trace"
          />
        </Paper>

        <Paper elevation={1} sx={{ p: 2, overflow: 'auto' }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Each cell shows a Lissajous curve with frequency ratio A:B (row:col).
            Diagonal cells (1:1, 2:2, etc.) create circles.
          </Typography>

          <GridContainer cellSize={cellSize}>
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

const GridContainer = styled.div<{ cellSize: number }>`
  display: grid;
  grid-template-columns: 40px repeat(
      ${(props) => Math.floor((window.innerWidth - 200) / props.cellSize)},
      ${(props) => props.cellSize}px
    );
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
