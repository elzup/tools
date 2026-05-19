import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Slider,
  Stack,
  Typography,
} from '@mui/material'
import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import {
  CuboidCollider,
  Physics,
  RapierRigidBody,
  RigidBody,
} from '@react-three/rapier'
import React, { Suspense, useCallback, useMemo, useRef, useState } from 'react'

type LayoutType = 'straight' | 'curve' | 'spiral' | 'zigzag' | 'circle'

type DominoSpec = {
  position: [number, number, number]
  rotationY: number
  color: string
}

const DOMINO_WIDTH = 0.3
const DOMINO_HEIGHT = 1.6
const DOMINO_DEPTH = 0.7

function generateLayout(
  layout: LayoutType,
  count: number,
  spacing: number
): DominoSpec[] {
  const baseY = DOMINO_HEIGHT / 2

  const hueFor = (index: number) =>
    `hsl(${(index * 360) / Math.max(count, 1)}, 70%, 55%)`

  if (layout === 'straight') {
    return Array.from({ length: count }, (_, index) => ({
      position: [index * spacing - ((count - 1) * spacing) / 2, baseY, 0],
      rotationY: 0,
      color: hueFor(index),
    }))
  }

  if (layout === 'zigzag') {
    return Array.from({ length: count }, (_, index) => {
      const offset = index * spacing - ((count - 1) * spacing) / 2
      const z = Math.sin(index * 0.7) * 1.5
      const next = Math.sin((index + 1) * 0.7) * 1.5
      const angle = Math.atan2(next - z, spacing)
      return {
        position: [offset, baseY, z] as [number, number, number],
        rotationY: angle,
        color: hueFor(index),
      }
    })
  }

  if (layout === 'curve') {
    const radius = (count * spacing) / Math.PI
    return Array.from({ length: count }, (_, index) => {
      const angle = (index / (count - 1)) * Math.PI - Math.PI / 2
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      const tangent = angle + Math.PI / 2
      return {
        position: [x, baseY, z] as [number, number, number],
        rotationY: -tangent,
        color: hueFor(index),
      }
    })
  }

  if (layout === 'circle') {
    const radius = (count * spacing) / (2 * Math.PI)
    return Array.from({ length: count }, (_, index) => {
      const angle = (index / count) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      const tangent = angle + Math.PI / 2
      return {
        position: [x, baseY, z] as [number, number, number],
        rotationY: -tangent,
        color: hueFor(index),
      }
    })
  }

  // spiral
  return Array.from({ length: count }, (_, index) => {
    const t = index * 0.4
    const radius = 1.5 + t * 0.25
    const angle = t
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    const tangent = angle + Math.PI / 2
    return {
      position: [x, baseY, z] as [number, number, number],
      rotationY: -tangent,
      color: hueFor(index),
    }
  })
}

type DominoProps = {
  spec: DominoSpec
  bodyRef: (body: RapierRigidBody | null) => void
}

const Domino = ({ spec, bodyRef }: DominoProps) => {
  const localRef = useRef<RapierRigidBody | null>(null)

  return (
    <RigidBody
      ref={(value) => {
        localRef.current = value
        bodyRef(value)
      }}
      position={spec.position}
      rotation={[0, spec.rotationY, 0]}
      colliders="cuboid"
      restitution={0.05}
      friction={0.6}
      mass={0.5}
      linearDamping={0.05}
      angularDamping={0.05}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[DOMINO_WIDTH, DOMINO_HEIGHT, DOMINO_DEPTH]} />
        <meshStandardMaterial
          color={spec.color}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
    </RigidBody>
  )
}

const Floor = () => (
  <RigidBody type="fixed" friction={0.8}>
    <CuboidCollider args={[25, 0.1, 25]} position={[0, -0.1, 0]} />
    <mesh position={[0, -0.1, 0]} receiveShadow>
      <boxGeometry args={[50, 0.2, 50]} />
      <meshStandardMaterial color="#2a2a2a" />
    </mesh>
    {/* grid lines */}
    <gridHelper args={[50, 50, '#444', '#333']} position={[0, 0.01, 0]} />
  </RigidBody>
)

type SceneProps = {
  specs: DominoSpec[]
  pushSignal: number
  registerBody: (index: number, body: RapierRigidBody | null) => void
}

const Scene = ({ specs, pushSignal, registerBody }: SceneProps) => {
  const sceneKey = useMemo(
    () => `${specs.length}-${pushSignal}`,
    [specs.length, pushSignal]
  )

  return (
    <Physics gravity={[0, -9.81, 0]} key={sceneKey}>
      <Floor />
      {specs.map((spec, index) => (
        <Domino
          key={index}
          spec={spec}
          bodyRef={(body) => registerBody(index, body)}
        />
      ))}
    </Physics>
  )
}

const Domino3D = () => {
  const [layout, setLayout] = useState<LayoutType>('straight')
  const [count, setCount] = useState(20)
  const [spacing, setSpacing] = useState(1.0)
  const [pushSignal, setPushSignal] = useState(0)
  const bodiesRef = useRef<Array<RapierRigidBody | null>>([])

  const specs = useMemo(
    () => generateLayout(layout, count, spacing),
    [layout, count, spacing]
  )

  const registerBody = useCallback(
    (index: number, body: RapierRigidBody | null) => {
      bodiesRef.current[index] = body
    },
    []
  )

  const handlePush = useCallback(() => {
    const first = bodiesRef.current[0]
    if (!first) return
    const spec = specs[0]
    const dirX = Math.cos(spec.rotationY)
    const dirZ = -Math.sin(spec.rotationY)
    first.applyImpulse({ x: dirX * 2.5, y: 0, z: dirZ * 2.5 }, true)
    first.applyTorqueImpulse({ x: dirZ * 1.2, y: 0, z: -dirX * 1.2 }, true)
  }, [specs])

  const handleReset = useCallback(() => {
    bodiesRef.current = []
    setPushSignal((value) => value + 1)
  }, [])

  const handleLayoutChange = useCallback((event: SelectChangeEvent) => {
    setLayout(event.target.value as LayoutType)
    bodiesRef.current = []
    setPushSignal((value) => value + 1)
  }, [])

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ md: 'center' }}
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

          <Box sx={{ minWidth: 200 }}>
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

          <Box sx={{ minWidth: 200 }}>
            <Typography variant="caption">
              間隔: {spacing.toFixed(2)}
            </Typography>
            <Slider
              size="small"
              value={spacing}
              onChange={(_, value) => setSpacing(value as number)}
              min={0.6}
              max={1.6}
              step={0.05}
            />
          </Box>

          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={handlePush}>
              先頭を倒す
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
          ドラッグで視点回転 / ホイールでズーム / 右クリックでパン
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
        <Canvas
          shadows
          camera={{ position: [12, 10, 14], fov: 50 }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 20, 10]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
          />
          <Suspense fallback={null}>
            <Scene
              specs={specs}
              pushSignal={pushSignal}
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
