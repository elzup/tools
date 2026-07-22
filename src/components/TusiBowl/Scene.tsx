import { Box, Chip, Stack, Typography } from '@mui/material'
import { Line, OrbitControls } from '@react-three/drei'
import { Canvas, type ThreeEvent, useFrame, useThree } from '@react-three/fiber'
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
} from 'react'
import * as THREE from 'three'
import {
  BALL_RADIUS,
  BOWL_CAP_ANGLE,
  BOWL_CENTER_Y,
  BOWL_RADIUS,
  GRAVITY,
  type BallSpec,
  type Judgement,
  type NavMode,
  PERIOD,
  RIM_RADIUS,
  SPAWN_Y,
  TWO_PI,
  type ViewRequest,
  goodAngleAt,
  nowSeconds,
  spawnPosition,
  wrapAngle,
} from './model'

const NAV_DOT_COUNT = 32
const NAV_GLOW_WIDTH = 0.5
const TOUCH_THRESHOLD = 0.08
const TOUCH_COOLDOWN_SECONDS = 0.8
const TOUCH_MINIMUM_MOVE = 0.2

const JUDGEMENT_COLORS: Record<Judgement['tone'], string> = {
  perfect: '#66bb6a',
  good: '#ffa726',
  miss: '#ef5350',
}

type BowlProps = {
  onPick: (theta: number) => void
  onMove: (theta: number | null) => void
}

const Bowl = ({ onPick, onMove }: BowlProps) => {
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    // OrbitControls のドラッグ操作はクリック扱いしない。
    if (event.delta > 6) return
    onPick(Math.atan2(event.point.z, event.point.x))
  }

  return (
    <RigidBody type="fixed" colliders="trimesh" friction={0}>
      <mesh
        position={[0, BOWL_CENTER_Y, 0]}
        receiveShadow
        onClick={handleClick}
        onPointerMove={(event) =>
          onMove(Math.atan2(event.point.z, event.point.x))
        }
        onPointerLeave={() => onMove(null)}
      >
        <sphereGeometry
          args={[
            BOWL_RADIUS,
            128,
            64,
            0,
            TWO_PI,
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
}

type BallProps = {
  spec: BallSpec
  hasCollided: boolean
  onCollide: (firstId: number, secondId: number) => void
}

const Ball = ({ spec, hasCollided, onCollide }: BallProps) => {
  const handleCollision = useCallback(
    (event: CollisionEnterPayload) => {
      const otherBall = event.other.rigidBodyObject?.userData as
        | { ballId?: number }
        | undefined

      if (otherBall?.ballId === undefined) return
      // ペアの両方でイベントが発火するため id の小さい側だけ数える。
      if (otherBall.ballId > spec.id) onCollide(spec.id, otherBall.ballId)
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
      <mesh castShadow onClick={(event) => event.stopPropagation()}>
        <sphereGeometry args={[BALL_RADIUS, 24, 24]} />
        <meshStandardMaterial color={hasCollided ? '#d32f2f' : spec.color} />
      </mesh>
    </RigidBody>
  )
}

const NavRing = () => {
  const beaconRef = useRef<THREE.Mesh>(null)
  const materialsRef = useRef<(THREE.MeshStandardMaterial | null)[]>([])

  useFrame(() => {
    const goodAngle = goodAngleAt(nowSeconds())
    beaconRef.current?.position.set(
      RIM_RADIUS * Math.cos(goodAngle),
      SPAWN_Y,
      RIM_RADIUS * Math.sin(goodAngle)
    )
    materialsRef.current.forEach((material, index) => {
      if (!material) return
      const theta = (index * TWO_PI) / NAV_DOT_COUNT
      const distanceFromGoodAngle = Math.abs(wrapAngle(theta - goodAngle))
      const glow = Math.max(0, 1 - distanceFromGoodAngle / NAV_GLOW_WIDTH) ** 2

      material.emissiveIntensity = 0.1 + glow * 2.5
      material.opacity = 0.35 + glow * 0.65
    })
  })

  return (
    <group>
      <mesh ref={beaconRef}>
        <sphereGeometry args={[BALL_RADIUS * 0.5, 16, 16]} />
        <meshStandardMaterial
          color="#fff59d"
          emissive="#ffb300"
          emissiveIntensity={2}
          transparent
          opacity={0.9}
        />
      </mesh>
      {Array.from({ length: NAV_DOT_COUNT }, (_, index) => {
        const theta = (index * TWO_PI) / NAV_DOT_COUNT

        return (
          <mesh key={theta} position={spawnPosition(theta)}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial
              ref={(material) => {
                materialsRef.current[index] = material
              }}
              color="#ffd54f"
              emissive="#ffb300"
              emissiveIntensity={0.1}
              transparent
              opacity={0.35}
            />
          </mesh>
        )
      })}
    </group>
  )
}

const DiameterGuide = ({ theta }: { theta: number }) => (
  <Line
    points={[spawnPosition(theta), spawnPosition(theta + Math.PI)]}
    color="#888888"
    lineWidth={1}
    dashed
    dashSize={0.3}
    gapSize={0.2}
    transparent
    opacity={0.15}
  />
)

type HoverDropperProps = {
  pointerThetaRef: MutableRefObject<number | null>
  onDrop: (theta: number) => void
}

const HoverDropper = ({ pointerThetaRef, onDrop }: HoverDropperProps) => {
  const ghostRef = useRef<THREE.Mesh>(null)
  const lastDropTimeRef = useRef(Number.NEGATIVE_INFINITY)
  const lastDropThetaRef = useRef<number | null>(null)

  useFrame(() => {
    const ghost = ghostRef.current
    const theta = pointerThetaRef.current

    if (ghost) {
      ghost.visible = theta !== null
      if (theta !== null) ghost.position.set(...spawnPosition(theta))
    }
    if (theta === null) return
    const currentTime = nowSeconds()

    if (currentTime - lastDropTimeRef.current < TOUCH_COOLDOWN_SECONDS) return
    const lastDropTheta = lastDropThetaRef.current

    if (
      lastDropTheta !== null &&
      Math.abs(wrapAngle(theta - lastDropTheta)) < TOUCH_MINIMUM_MOVE
    ) {
      return
    }
    if (
      Math.abs(wrapAngle(theta - goodAngleAt(currentTime))) > TOUCH_THRESHOLD
    ) {
      return
    }

    lastDropTimeRef.current = currentTime
    lastDropThetaRef.current = theta
    onDrop(theta)
  })

  return (
    <mesh ref={ghostRef} visible={false}>
      <sphereGeometry args={[BALL_RADIUS, 16, 16]} />
      <meshStandardMaterial color="#ffffff" transparent opacity={0.35} />
    </mesh>
  )
}

const AutoTargetMarker = ({ theta }: { theta: number }) => (
  <mesh position={spawnPosition(theta)}>
    <sphereGeometry args={[BALL_RADIUS * 0.6, 16, 16]} />
    <meshStandardMaterial
      color="#4fc3f7"
      emissive="#0288d1"
      emissiveIntensity={1}
      transparent
      opacity={0.8}
    />
  </mesh>
)

const CameraPreset = ({ view }: { view: ViewRequest }) => {
  const camera = useThree((state) => state.camera)

  useEffect(() => {
    if (view.revision === 0) return
    if (view.mode === 'top') camera.position.set(0, 17, 0.01)
    else camera.position.set(8, 9, 10)
  }, [view, camera])

  return null
}

type SceneOverlayProps = {
  ballCount: number
  collisionCount: number
  judgement: Judgement | null
  placedBallCount: number
  showSuccess: boolean
}

const overlayChipSx = {
  bgcolor: 'rgba(13, 17, 23, 0.65)',
  color: '#e6edf3',
} as const

const overlayTextSx = {
  position: 'absolute',
  left: '50%',
  transform: 'translateX(-50%)',
  fontWeight: 700,
  pointerEvents: 'none',
  textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)',
} as const

const SceneOverlay = ({
  ballCount,
  collisionCount,
  judgement,
  placedBallCount,
  showSuccess,
}: SceneOverlayProps) => (
  <>
    <Stack
      direction="row"
      spacing={1}
      sx={{ position: 'absolute', top: 12, left: 12, pointerEvents: 'none' }}
    >
      <Chip
        size="small"
        label={`配置 ${placedBallCount}/${ballCount}`}
        sx={overlayChipSx}
      />
      <Chip
        size="small"
        label={`衝突 ${collisionCount}`}
        sx={{
          ...overlayChipSx,
          color: collisionCount > 0 ? '#ef5350' : overlayChipSx.color,
        }}
      />
      <Chip
        size="small"
        label={`T = ${PERIOD.toFixed(2)}s`}
        sx={overlayChipSx}
      />
    </Stack>
    {judgement && (
      <Typography
        sx={{
          ...overlayTextSx,
          top: 12,
          color: JUDGEMENT_COLORS[judgement.tone],
        }}
      >
        {judgement.text}
      </Typography>
    )}
    {showSuccess && (
      <Typography sx={{ ...overlayTextSx, bottom: 16, color: '#66bb6a' }}>
        成功！ノーミスで円が完成
      </Typography>
    )}
  </>
)

type TusiBowlSceneProps = {
  balls: BallSpec[]
  ballCount: number
  collidedIds: ReadonlySet<number>
  collisionCount: number
  isAutoPlaying: boolean
  isDone: boolean
  judgement: Judgement | null
  navMode: NavMode
  pointerThetaRef: MutableRefObject<number | null>
  view: ViewRequest
  onCollide: (firstId: number, secondId: number) => void
  onDrop: (theta: number) => void
  onMove: (theta: number | null) => void
  onPick: (theta: number) => void
}

export const TusiBowlScene = ({
  balls,
  ballCount,
  collidedIds,
  collisionCount,
  isAutoPlaying,
  isDone,
  judgement,
  navMode,
  pointerThetaRef,
  view,
  onCollide,
  onDrop,
  onMove,
  onPick,
}: TusiBowlSceneProps) => (
  <Box sx={{ position: 'relative' }}>
    <Canvas
      shadows
      camera={{ position: [0, 17, 0.01], fov: 45 }}
      style={{ height: 560, background: '#0d1117', borderRadius: 8 }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 12, 6]} intensity={1.2} castShadow />
      <Suspense>
        <Physics gravity={[0, -GRAVITY, 0]} timeStep={1 / 120}>
          <Bowl onPick={onPick} onMove={onMove} />
          {balls.map((ball) => (
            <Ball
              key={ball.id}
              spec={ball}
              hasCollided={collidedIds.has(ball.id)}
              onCollide={onCollide}
            />
          ))}
        </Physics>
      </Suspense>
      {navMode !== 'off' && !isDone && <NavRing />}
      {navMode !== 'off' &&
        balls.map((ball) => <DiameterGuide key={ball.id} theta={ball.theta} />)}
      {navMode === 'touch' && !isDone && !isAutoPlaying && (
        <HoverDropper pointerThetaRef={pointerThetaRef} onDrop={onDrop} />
      )}
      {isAutoPlaying && !isDone && (
        <AutoTargetMarker theta={(balls.length * Math.PI) / ballCount} />
      )}
      <CameraPreset view={view} />
      <OrbitControls target={[0, 2, 0]} />
    </Canvas>
    <SceneOverlay
      ballCount={ballCount}
      collisionCount={collisionCount}
      judgement={judgement}
      placedBallCount={balls.length}
      showSuccess={isDone && collisionCount === 0}
    />
  </Box>
)
