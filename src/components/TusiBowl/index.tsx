import { Box, Button, Paper, Slider, Stack, Typography } from '@mui/material'
import { Line, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  type CollisionEnterPayload,
  Physics,
  RigidBody,
} from '@react-three/rapier'
import {
  type MutableRefObject,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import * as THREE from 'three'

const GRAVITY = 9.81
const BOWL_RADIUS = 5
const BALL_RADIUS = 0.25
// ボール中心は球面の内側を滑るので、振り子長は半径差
const PENDULUM_LENGTH = BOWL_RADIUS - BALL_RADIUS
const BOWL_CENTER_Y = BOWL_RADIUS
const DROP_ANGLE = (Math.PI / 180) * 60
const BOWL_CAP_ANGLE = (Math.PI / 180) * 80
const PERFECT_MS = 60
const GOOD_MS = 150

// 振り子周期 T = 4√(L/g)・K(sin(α/2))。K は AGM で数値計算 (振幅が大きいと単純式からずれる)
function pendulumPeriod(length: number, amplitude: number): number {
  const modulus = Math.sin(amplitude / 2)
  let a = 1
  let b = Math.sqrt(1 - modulus * modulus)
  for (let i = 0; i < 30 && Math.abs(a - b) > 1e-12; i++) {
    const nextA = (a + b) / 2
    b = Math.sqrt(a * b)
    a = nextA
  }
  const ellipticK = Math.PI / (2 * a)
  return 4 * Math.sqrt(length / GRAVITY) * ellipticK
}

const PERIOD = pendulumPeriod(PENDULUM_LENGTH, DROP_ANGLE)

const nowSec = () => performance.now() / 1000

type BallSpec = {
  id: number
  theta: number
  color: string
}

const spawnPosition = (theta: number): [number, number, number] => [
  PENDULUM_LENGTH * Math.sin(DROP_ANGLE) * Math.cos(theta),
  BOWL_CENTER_Y - PENDULUM_LENGTH * Math.cos(DROP_ANGLE),
  PENDULUM_LENGTH * Math.sin(DROP_ANGLE) * Math.sin(theta),
]

const Bowl = () => (
  <RigidBody type="fixed" colliders="trimesh" friction={0}>
    <mesh position={[0, BOWL_CENTER_Y, 0]} receiveShadow>
      <sphereGeometry
        args={[
          BOWL_RADIUS,
          64,
          32,
          0,
          Math.PI * 2,
          Math.PI - BOWL_CAP_ANGLE,
          BOWL_CAP_ANGLE,
        ]}
      />
      <meshStandardMaterial
        color="#90caf9"
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  </RigidBody>
)

type BallProps = {
  spec: BallSpec
  collided: boolean
  onCollide: (a: number, b: number) => void
}

const Ball = ({ spec, collided, onCollide }: BallProps) => {
  const handleCollision = useCallback(
    (e: CollisionEnterPayload) => {
      const other = e.other.rigidBodyObject?.userData as
        | { ballId?: number }
        | undefined

      if (other?.ballId === undefined) return
      // ペアの両方でイベントが発火するので id の小さい側だけ数える
      if (other.ballId > spec.id) onCollide(spec.id, other.ballId)
    },
    [spec.id, onCollide]
  )

  return (
    <RigidBody
      colliders="ball"
      position={spawnPosition(spec.theta)}
      friction={0}
      restitution={0.05}
      canSleep={false}
      userData={{ ballId: spec.id }}
      onCollisionEnter={handleCollision}
    >
      <mesh castShadow>
        <sphereGeometry args={[BALL_RADIUS, 24, 24]} />
        <meshStandardMaterial color={collided ? '#d32f2f' : spec.color} />
      </mesh>
    </RigidBody>
  )
}

type DropMarkerProps = {
  theta: number
  ballIndex: number
  t0Ref: MutableRefObject<number | null>
  interval: number
}

const DropMarker = ({ theta, ballIndex, t0Ref, interval }: DropMarkerProps) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshStandardMaterial>(null)

  useFrame(() => {
    const mesh = meshRef.current
    const mat = matRef.current

    if (!mesh || !mat) return
    const t0 = t0Ref.current
    let pulse = 0.3

    if (t0 !== null) {
      const raw = nowSec() - t0 - ballIndex * interval
      const phase = (((raw % PERIOD) + PERIOD) % PERIOD) / PERIOD

      pulse = Math.max(Math.cos(phase * Math.PI * 2), 0) ** 12
    }
    const scale = 1 + pulse * 0.9

    mesh.scale.set(scale, scale, scale)
    mat.emissiveIntensity = 0.2 + pulse * 1.5
  })

  const pos = spawnPosition(theta)
  const opposite = spawnPosition(theta + Math.PI)

  return (
    <group>
      <mesh ref={meshRef} position={pos}>
        <sphereGeometry args={[BALL_RADIUS * 0.6, 16, 16]} />
        <meshStandardMaterial
          ref={matRef}
          color="#ffd54f"
          emissive="#ffb300"
          transparent
          opacity={0.9}
        />
      </mesh>
      <Line
        points={[pos, opposite]}
        color="#aaaaaa"
        lineWidth={1}
        dashed
        dashSize={0.3}
        gapSize={0.2}
        transparent
        opacity={0.5}
      />
    </group>
  )
}

type ViewRequest = { mode: 'side' | 'top'; n: number }

const CameraPreset = ({ view }: { view: ViewRequest }) => {
  const camera = useThree((s) => s.camera)

  useEffect(() => {
    if (view.n === 0) return
    if (view.mode === 'top') camera.position.set(0, 17, 0.01)
    else camera.position.set(8, 9, 10)
  }, [view, camera])
  return null
}

const judge = (errMs: number): string => {
  if (errMs < PERFECT_MS) return `Perfect! (${Math.round(errMs)}ms)`
  if (errMs < GOOD_MS) return `Good (${Math.round(errMs)}ms)`
  return `Miss… (${Math.round(errMs)}ms ずれ)`
}

const TusiBowl = () => {
  const [ballCount, setBallCount] = useState(10)
  const [balls, setBalls] = useState<BallSpec[]>([])
  const [collidedIds, setCollidedIds] = useState<ReadonlySet<number>>(new Set())
  const [collisionCount, setCollisionCount] = useState(0)
  const [judgement, setJudgement] = useState('')
  const [auto, setAuto] = useState(false)
  const [view, setView] = useState<ViewRequest>({ mode: 'side', n: 0 })
  const t0Ref = useRef<number | null>(null)

  // 半周を N 等分した方向に置く。理想の間隔は T/(2N) (周期の整数倍ずらしも OK)
  const interval = PERIOD / (2 * ballCount)
  const done = balls.length >= ballCount

  const dropNext = useCallback(() => {
    if (balls.length >= ballCount) return
    const k = balls.length
    const t = nowSec()

    if (k === 0) {
      t0Ref.current = t
      setJudgement('スタート！マーカーが光る瞬間に次を置こう')
    } else if (t0Ref.current !== null) {
      const raw = t - t0Ref.current - k * interval
      const mod = ((raw % PERIOD) + PERIOD) % PERIOD
      const err = Math.min(mod, PERIOD - mod) * 1000

      setJudgement(judge(err))
    }

    const theta = (k * Math.PI) / ballCount
    const color = `hsl(${(k * 360) / ballCount}, 75%, 55%)`

    setBalls((prev) => [...prev, { id: k, theta, color }])
  }, [balls.length, ballCount, interval])

  useEffect(() => {
    if (!auto) return
    if (balls.length >= ballCount) {
      setAuto(false)
      return
    }
    if (balls.length === 0) {
      dropNext()
      return
    }
    const t0 = t0Ref.current

    if (t0 === null) return
    const target = t0 + balls.length * interval
    let wait = target - nowSec()

    while (wait < 0) wait += PERIOD
    const timer = setTimeout(dropNext, wait * 1000)

    return () => clearTimeout(timer)
  }, [auto, balls.length, ballCount, interval, dropNext])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      e.preventDefault()
      dropNext()
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [dropNext])

  const handleCollide = useCallback((a: number, b: number) => {
    setCollisionCount((c) => c + 1)
    setCollidedIds((prev) => new Set([...prev, a, b]))
  }, [])

  const reset = useCallback(() => {
    setBalls([])
    setCollidedIds(new Set())
    setCollisionCount(0)
    setJudgement('')
    setAuto(false)
    t0Ref.current = null
  }, [])

  const handleCountChange = (_: Event, value: number | number[]) => {
    setBallCount(value as number)
    reset()
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 1 }}>
        ボウル型の器では、どのボールも中心を通る直線上を同じ周期で往復します。
        半周ぶんの方向に等間隔・等タイミングで置いていくと、直線運動の集まりなのに
        回転する円に見えます (Tusi couple / トゥーシーの対円)。
        タイミングを外すとボール同士が衝突します (衝突判定あり)。
      </Typography>
      <Paper sx={{ p: 2, mb: 1 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Button
            variant="contained"
            onClick={dropNext}
            disabled={done || auto}
          >
            置く (Space)
          </Button>
          <Button
            variant="outlined"
            onClick={() => setAuto(true)}
            disabled={done || auto}
          >
            自動でお手本
          </Button>
          <Button variant="outlined" color="warning" onClick={reset}>
            リセット
          </Button>
          <Button
            variant="outlined"
            onClick={() =>
              setView((v) => ({
                mode: v.mode === 'top' ? 'side' : 'top',
                n: v.n + 1,
              }))
            }
          >
            {view.mode === 'top' ? '横から見る' : '上から見る'}
          </Button>
          <Box sx={{ width: 180 }}>
            <Typography variant="caption">ボール数: {ballCount}</Typography>
            <Slider
              size="small"
              min={4}
              max={16}
              value={ballCount}
              onChange={handleCountChange}
            />
          </Box>
        </Stack>
        <Stack direction="row" spacing={3} sx={{ mt: 1 }} flexWrap="wrap">
          <Typography variant="body2">
            配置: {balls.length}/{ballCount}
          </Typography>
          <Typography variant="body2">衝突: {collisionCount} 回</Typography>
          <Typography variant="body2">
            周期 T = {PERIOD.toFixed(2)}s / 間隔 {interval.toFixed(2)}s
          </Typography>
          <Typography variant="body2" color="primary">
            {judgement}
          </Typography>
          {done && collisionCount === 0 && (
            <Typography variant="body2" color="success.main">
              成功！「上から見る」で回転する円を確認しよう
            </Typography>
          )}
        </Stack>
      </Paper>
      <Canvas
        shadows
        camera={{ position: [8, 9, 10], fov: 45 }}
        style={{ height: 560, background: '#0d1117', borderRadius: 8 }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[6, 12, 6]} intensity={1.2} castShadow />
        <Suspense>
          <Physics gravity={[0, -GRAVITY, 0]}>
            <Bowl />
            {balls.map((b) => (
              <Ball
                key={b.id}
                spec={b}
                collided={collidedIds.has(b.id)}
                onCollide={handleCollide}
              />
            ))}
          </Physics>
        </Suspense>
        {!done && (
          <DropMarker
            theta={(balls.length * Math.PI) / ballCount}
            ballIndex={balls.length}
            t0Ref={t0Ref}
            interval={interval}
          />
        )}
        <CameraPreset view={view} />
        <OrbitControls target={[0, 2, 0]} />
      </Canvas>
    </Box>
  )
}

export default TusiBowl
