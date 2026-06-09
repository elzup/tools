import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import {
  CuboidCollider,
  Physics,
  type RapierRigidBody,
  RigidBody,
} from '@react-three/rapier'
import { Suspense, useCallback, useMemo, useRef, useState } from 'react'

type LayoutType = 'straight' | 'curve' | 'spiral' | 'zigzag' | 'circle'

type Dims = {
  width: number
  height: number
  depth: number
}

type DominoSpec = {
  position: [number, number, number]
  rotationY: number
  color: string
  dims: Dims
  mass: number
}

const DOMINO_WIDTH_BASE = 0.3
const DOMINO_HEIGHT_BASE = 1.6
const DOMINO_DEPTH_BASE = 0.7

function generateLayout(
  layout: LayoutType,
  count: number,
  dimsArr: Dims[],
  massArr: number[],
  gapRatio: number
): DominoSpec[] {
  // Per-segment center-to-center spacing: covers half-width of each + face gap
  // (face gap = min(height) * gapRatio so the taller side can still topple onto the shorter)
  const segments: number[] = []
  for (let i = 0; i < count - 1; i++) {
    const a = dimsArr[i]
    const b = dimsArr[i + 1]
    segments.push(
      (a.width + b.width) / 2 + Math.min(a.height, b.height) * gapRatio
    )
  }
  const cumLen = [0]
  for (const s of segments) cumLen.push(cumLen[cumLen.length - 1] + s)
  const total = cumLen[count - 1] || 1

  const hueFor = (i: number) =>
    `hsl(${(i * 360) / Math.max(count, 1)}, 70%, 55%)`

  return Array.from({ length: count }, (_, i) => {
    const dims = dimsArr[i]
    const baseY = dims.height / 2
    const s = cumLen[i]
    const u = total > 0 ? s / total : 0

    let position: [number, number, number]
    let rotationY: number

    if (layout === 'straight') {
      position = [s - total / 2, baseY, 0]
      rotationY = 0
    } else if (layout === 'zigzag') {
      const x = s - total / 2
      const freq = ((count - 1) * 0.7) / Math.max(total, 0.001)
      const z = Math.sin(s * freq) * 1.5
      const dz = Math.cos(s * freq) * 1.5 * freq
      position = [x, baseY, z]
      rotationY = Math.atan2(dz, 1)
    } else if (layout === 'curve') {
      const r = total / Math.PI
      const angle = u * Math.PI - Math.PI / 2
      position = [Math.cos(angle) * r, baseY, Math.sin(angle) * r]
      rotationY = -(angle + Math.PI / 2)
    } else if (layout === 'circle') {
      const r = total / (2 * Math.PI)
      const angle = u * 2 * Math.PI
      position = [Math.cos(angle) * r, baseY, Math.sin(angle) * r]
      rotationY = -(angle + Math.PI / 2)
    } else {
      // spiral — keep original parametric shape; arc length is approximate
      const t = u * Math.max(count - 1, 0) * 0.4
      const radius = 1.5 + t * 0.25
      position = [Math.cos(t) * radius, baseY, Math.sin(t) * radius]
      rotationY = -(t + Math.PI / 2)
    }

    return {
      position,
      rotationY,
      color: hueFor(i),
      dims,
      mass: massArr[i],
    }
  })
}

type DominoProps = {
  spec: DominoSpec
  tilted?: boolean
  bodyRef: (body: RapierRigidBody | null) => void
}

const Domino = ({ spec, tilted = false, bodyRef }: DominoProps) => {
  const localRef = useRef<RapierRigidBody | null>(null)
  const tiltAngle = tilted ? 0.22 : 0
  const dirX = Math.cos(spec.rotationY)
  const dirZ = -Math.sin(spec.rotationY)

  return (
    <RigidBody
      ref={(value) => {
        localRef.current = value
        bodyRef(value)
      }}
      position={spec.position}
      rotation={[dirZ * tiltAngle, spec.rotationY, -dirX * tiltAngle]}
      colliders="cuboid"
      restitution={0.05}
      friction={0.6}
      mass={spec.mass}
      linearDamping={0.05}
      angularDamping={0.05}
    >
      <mesh>
        <boxGeometry
          args={[spec.dims.width, spec.dims.height, spec.dims.depth]}
        />
        <meshLambertMaterial color={spec.color} />
      </mesh>
    </RigidBody>
  )
}

const Floor = () => (
  <RigidBody type="fixed" friction={0.8}>
    <CuboidCollider args={[25, 0.1, 25]} position={[0, -0.1, 0]} />
    <mesh position={[0, -0.1, 0]}>
      <boxGeometry args={[50, 0.2, 50]} />
      <meshLambertMaterial color="#2a2a2a" />
    </mesh>
    {/* grid lines */}
    <gridHelper args={[50, 50, '#444', '#333']} position={[0, 0.01, 0]} />
  </RigidBody>
)

type SceneProps = {
  specs: DominoSpec[]
  sceneKey: string
  isStarterTilted: boolean
  registerBody: (index: number, body: RapierRigidBody | null) => void
}

const Scene = ({
  specs,
  sceneKey,
  isStarterTilted,
  registerBody,
}: SceneProps) => {
  return (
    <Physics gravity={[0, -9.81, 0]} key={sceneKey}>
      <Floor />
      {specs.map((spec, index) => (
        <Domino
          key={index}
          spec={spec}
          tilted={index === 0 && isStarterTilted}
          bodyRef={(body) => registerBody(index, body)}
        />
      ))}
    </Physics>
  )
}

const Domino3D = () => {
  const [layout, setLayout] = useState<LayoutType>('straight')
  const [count, setCount] = useState(20)
  const [scale, setScale] = useState(1.0)
  const [growth, setGrowth] = useState(1.0)
  const [gapRatio, setGapRatio] = useState(0.5)
  const [pushSignal, setPushSignal] = useState(0)
  const [resetSignal, setResetSignal] = useState(0)
  const bodiesRef = useRef<Array<RapierRigidBody | null>>([])

  const dimsArr = useMemo<Dims[]>(
    () =>
      Array.from({ length: count }, (_, i) => {
        const factor = count <= 1 ? 1 : growth ** (i / (count - 1))
        return {
          width: DOMINO_WIDTH_BASE * scale * factor,
          height: DOMINO_HEIGHT_BASE * scale * factor,
          depth: DOMINO_DEPTH_BASE * scale * factor,
        }
      }),
    [count, scale, growth]
  )

  const massArr = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const factor = count <= 1 ? 1 : growth ** (i / (count - 1))
        return 0.5 * (scale * factor) ** 3
      }),
    [count, scale, growth]
  )

  const specs = useMemo(
    () => generateLayout(layout, count, dimsArr, massArr, gapRatio),
    [layout, count, dimsArr, massArr, gapRatio]
  )

  // Rebuild physics world on any layout change so stale bodies don't collide with new positions
  const sceneKey = useMemo(
    () =>
      `${layout}-${count}-${scale}-${growth}-${gapRatio}-${resetSignal}-${pushSignal}`,
    [layout, count, scale, growth, gapRatio, resetSignal, pushSignal]
  )

  const registerBody = useCallback(
    (index: number, body: RapierRigidBody | null) => {
      bodiesRef.current[index] = body
    },
    []
  )

  const handlePush = useCallback(() => {
    setPushSignal((value) => value + 1)
  }, [])

  const handleReset = useCallback(() => {
    bodiesRef.current = []
    setResetSignal((value) => value + 1)
  }, [])

  const handleGapRatioChange = useCallback((value: number) => {
    setGapRatio(Math.min(Math.max(value, 0.2), 0.95))
  }, [])

  const handleReboundPreset = useCallback(() => {
    setLayout('straight')
    setScale(1.0)
    setGrowth(1.0)
    setGapRatio(0.8245)
    bodiesRef.current = []
    setResetSignal((value) => value + 1)
  }, [])

  const handleLayoutChange = useCallback((event: SelectChangeEvent) => {
    setLayout(event.target.value as LayoutType)
    bodiesRef.current = []
    setResetSignal((value) => value + 1)
  }, [])

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ md: 'center' }}
          flexWrap="wrap"
        >
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="domino-layout-label">配置パターン</InputLabel>
            <Select
              labelId="domino-layout-label"
              label="配置パターン"
              value={layout}
              onChange={handleLayoutChange}
            >
              <MenuItem value="straight">直線</MenuItem>
              <MenuItem value="curve">半円カーブ</MenuItem>
              <MenuItem value="circle">円</MenuItem>
              <MenuItem value="spiral">螺旋</MenuItem>
              <MenuItem value="zigzag">ジグザグ</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ minWidth: 160 }}>
            <Typography variant="caption">枚数: {count}</Typography>
            <Slider
              size="small"
              value={count}
              onChange={(_, value) => setCount(value as number)}
              min={3}
              max={80}
              step={1}
            />
          </Box>

          <Box sx={{ minWidth: 160 }}>
            <Typography variant="caption">
              サイズ: ×{scale.toFixed(2)}
            </Typography>
            <Slider
              size="small"
              value={scale}
              onChange={(_, value) => setScale(value as number)}
              min={0.4}
              max={2.5}
              step={0.05}
            />
          </Box>

          <Box sx={{ minWidth: 180 }}>
            <Typography variant="caption">
              成長: ×{growth.toFixed(2)} (最後 / 最初)
            </Typography>
            <Slider
              size="small"
              value={growth}
              onChange={(_, value) => setGrowth(value as number)}
              min={0.5}
              max={3.0}
              step={0.05}
            />
          </Box>

          <Box sx={{ minWidth: 160 }}>
            <Typography variant="caption">
              次への間隔: 高さ ×{gapRatio.toFixed(2)}
            </Typography>
            <Slider
              size="small"
              value={gapRatio}
              onChange={(_, value) => handleGapRatioChange(value as number)}
              min={0.2}
              max={0.95}
              step={0.0005}
            />
            <TextField
              type="number"
              size="small"
              value={gapRatio}
              onChange={(event) => {
                const value = Number(event.target.value)
                if (!Number.isNaN(value)) handleGapRatioChange(value)
              }}
              inputProps={{ min: 0.2, max: 0.95, step: 0.0005 }}
              sx={{ width: 112 }}
            />
          </Box>

          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={handlePush}>
              先頭を倒す
            </Button>
            <Button variant="outlined" onClick={handleReboundPreset}>
              折り返し再現
            </Button>
            <Button variant="outlined" onClick={handleReset}>
              リセット
            </Button>
          </Stack>
        </Stack>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: 'block' }}
        >
          ドラッグで視点回転 / ホイールでズーム / 右クリックでパン ・ 成長 &gt;
          1 で巨大連鎖、&lt; 1 で縮小チェーン ・
          折り返し再現は直線/成長1.00/間隔0.8245
        </Typography>
      </Paper>

      <Box
        sx={{
          width: '100%',
          height: { xs: '70vh', md: '78vh' },
          borderRadius: 1,
          overflow: 'hidden',
          background: 'linear-gradient(to bottom, #1a1d2e 0%, #0d0e18 100%)',
        }}
      >
        <Canvas camera={{ position: [12, 10, 14], fov: 50 }} dpr={[1, 1.5]}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 20, 10]} intensity={0.8} />
          <Suspense fallback={null}>
            <Scene
              specs={specs}
              sceneKey={sceneKey}
              isStarterTilted={pushSignal > 0}
              registerBody={registerBody}
            />
          </Suspense>
          <OrbitControls makeDefault enableDamping />
        </Canvas>
      </Box>
    </Box>
  )
}

export default Domino3D
