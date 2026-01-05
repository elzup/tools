import { Box, Button, Collapse, Slider, Stack, Typography } from '@mui/material'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useState, useCallback, useRef, Suspense, useMemo } from 'react'
import * as THREE from 'three'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const GEAR_COUNT = 100
const GEAR_RATIO = 10n // 10回転で次の歯車が1回転

const title = 'Googol Visualizer - 10^100 歯車装置'

/**
 * BigInt から各歯車の回転位置(0.0-9.999...)を取得
 * 連続的な値で、後ろの歯車ほどゆっくり回転する
 */
function getGearPositions(value: bigint): number[] {
  const positions: number[] = []
  let remaining = value < 0n ? -value : value
  for (let i = 0; i < GEAR_COUNT; i++) {
    // 下位2桁を取得して小数精度を確保（0.0〜9.9の範囲）
    const twoDigits = remaining % 100n
    const position = Number(twoDigits) / 10
    positions.push(position)
    remaining = remaining / GEAR_RATIO
  }
  return positions
}

/**
 * 歯車コンポーネント
 */
type GearProps = {
  index: number
  position: number // 0.0-9.999... (連続値)
  size: number
}

function Gear({
  index,
  position,
  size,
  reverse,
}: GearProps & { reverse?: boolean }) {
  const baseAngle = (position / 10) * 360
  const angle = reverse ? -baseAngle : baseAngle
  const teethCount = 12
  const bodyRadius = size * 0.35
  const toothHeight = size * 0.12
  const holeRadius = size * 0.08

  // 歯車のパスを生成
  const gearPath = () => {
    const points: string[] = []
    for (let i = 0; i < teethCount; i++) {
      const baseAngle = (i / teethCount) * Math.PI * 2
      const toothWidth = (Math.PI / teethCount) * 0.6

      // 歯の外側
      const outerR = bodyRadius + toothHeight
      const innerR = bodyRadius

      // 歯の根元（左）
      const a1 = baseAngle - toothWidth
      points.push(`${Math.cos(a1) * innerR},${Math.sin(a1) * innerR}`)
      // 歯の先端（左）
      points.push(`${Math.cos(a1) * outerR},${Math.sin(a1) * outerR}`)
      // 歯の先端（右）
      const a2 = baseAngle + toothWidth
      points.push(`${Math.cos(a2) * outerR},${Math.sin(a2) * outerR}`)
      // 歯の根元（右）
      points.push(`${Math.cos(a2) * innerR},${Math.sin(a2) * innerR}`)
    }
    return `M ${points.join(' L ')} Z`
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient
          id={`gear-grad-${index}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="50%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#2a2a2a" />
        </linearGradient>
      </defs>
      <g transform={`translate(${size / 2}, ${size / 2}) rotate(${angle})`}>
        {/* 歯車本体 */}
        <path
          d={gearPath()}
          fill={`url(#gear-grad-${index})`}
          stroke="#000"
          strokeWidth={1}
        />
        {/* 中心の穴 */}
        <circle r={holeRadius} fill="#f5f5f5" />
        {/* 回転マーカー */}
        <line
          x1={0}
          y1={-holeRadius}
          x2={0}
          y2={-bodyRadius + 2}
          stroke="#e53935"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </g>
      {/* インデックス表示 */}
      <text
        x={size / 2}
        y={size - 1}
        textAnchor="middle"
        fontSize={size * 0.16}
        fill="#666"
        fontFamily="monospace"
      >
        {index}
      </text>
    </svg>
  )
}

/**
 * 3D歯車コンポーネント（軽量版）
 */
const GEAR_BODY_RADIUS = 1.5
const GEAR_TOOTH_HEIGHT = 0.4

// 歯車形状を一度だけ生成（メモ化）
function createGearShape() {
  const gearShape = new THREE.Shape()
  const teethCount = 12

  for (let i = 0; i < teethCount; i++) {
    const baseAngle = (i / teethCount) * Math.PI * 2
    const toothWidth = (Math.PI / teethCount) * 0.6

    const outerR = GEAR_BODY_RADIUS + GEAR_TOOTH_HEIGHT
    const innerR = GEAR_BODY_RADIUS

    const a1 = baseAngle - toothWidth
    const a2 = baseAngle + toothWidth

    if (i === 0) {
      gearShape.moveTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR)
    } else {
      gearShape.lineTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR)
    }
    gearShape.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR)
    gearShape.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR)
    gearShape.lineTo(Math.cos(a2) * innerR, Math.sin(a2) * innerR)
  }
  gearShape.closePath()

  // 中心の穴
  const holePath = new THREE.Path()
  holePath.absarc(0, 0, 0.4, 0, Math.PI * 2, false)
  gearShape.holes.push(holePath)

  return gearShape
}

function Gear3D({
  position,
  posX,
  posZ,
  reverse,
}: {
  index: number
  position: number
  posX: number
  posZ: number
  reverse: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const baseAngle = (position / 10) * Math.PI * 2
  const angle = reverse ? -baseAngle : baseAngle

  // 形状をメモ化（厚み付き）
  const gearShape = useMemo(() => createGearShape(), [])
  const extrudeSettings = useMemo(
    () => ({ depth: 0.15, bevelEnabled: false }),
    []
  )
  const extrudeGeometry = useMemo(
    () => new THREE.ExtrudeGeometry(gearShape, extrudeSettings),
    [gearShape, extrudeSettings]
  )

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.z = angle
    }
  })

  return (
    <group position={[posX, 0, posZ]}>
      <group ref={groupRef}>
        {/* 歯車本体（厚み付き） */}
        <mesh geometry={extrudeGeometry}>
          <meshStandardMaterial
            attach="material-0"
            color="#1a1a1a"
            metalness={0.8}
            roughness={0.3}
          />
          <meshStandardMaterial
            attach="material-1"
            color="#4a4a4a"
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>
        {/* 回転マーカー（中心から外周まで伸びる線） */}
        <mesh
          position={[
            0,
            (GEAR_BODY_RADIUS + GEAR_TOOTH_HEIGHT * 0.3) / 2,
            -0.05,
          ]}
        >
          <boxGeometry
            args={[0.15, GEAR_BODY_RADIUS + GEAR_TOOTH_HEIGHT * 0.3, 0.08]}
          />
          <meshStandardMaterial color="#e53935" />
        </mesh>
      </group>
    </group>
  )
}

/**
 * カメラ位置トラッカー
 */
function CameraTracker({
  onUpdate,
}: {
  onUpdate: (
    pos: [number, number, number],
    target: [number, number, number]
  ) => void
}) {
  const controlsRef = useRef<any>(null)

  useFrame(({ camera }) => {
    const pos: [number, number, number] = [
      Math.round(camera.position.x * 10) / 10,
      Math.round(camera.position.y * 10) / 10,
      Math.round(camera.position.z * 10) / 10,
    ]
    const target: [number, number, number] = controlsRef.current
      ? [
          Math.round(controlsRef.current.target.x * 10) / 10,
          Math.round(controlsRef.current.target.y * 10) / 10,
          Math.round(controlsRef.current.target.z * 10) / 10,
        ]
      : [0, 0, 0]
    onUpdate(pos, target)
  })

  return <OrbitControls ref={controlsRef} target={[-3.7, -1.1, 8.8]} />
}

/**
 * 3D歯車グループ（机の上に鉛筆が並ぶように配置）
 */
function GearGroup3D({ positions }: { positions: number[] }) {
  const spacing = 0.25

  return (
    <group>
      {positions.map((pos, index) => {
        const isOdd = index % 2 === 1
        // 手前から奥に向かって配置（index 0が手前）
        const posZ = index * spacing
        // 交互にX方向にずらす（横にしっかりオフセット）
        const posX = isOdd ? 1.8 : 0
        return (
          <Gear3D
            key={index}
            index={index}
            position={pos}
            posX={posX}
            posZ={posZ}
            reverse={isOdd}
          />
        )
      })}
    </group>
  )
}

/**
 * 歯車グループ（2列ジグザグ配置）
 */
type GearGroupProps = {
  positions: number[]
  gearSize: number
  overlapRatio: number
  indentRatio: number
  zigzagPeriod: number
}

function GearGroup({
  positions,
  gearSize,
  overlapRatio,
  indentRatio,
  zigzagPeriod,
}: GearGroupProps) {
  const overlap = gearSize * overlapRatio
  const indent = gearSize * indentRatio

  // N周期のジグザグパターンを生成
  const getOffset = (index: number) => {
    const half = Math.floor(zigzagPeriod / 2)
    const pos = index % zigzagPeriod
    return pos <= half ? pos : zigzagPeriod - pos
  }

  // 下から上に表示（0が下）
  const reversedPositions = [...positions].reverse()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        width: 'fit-content',
        mx: 'auto',
      }}
    >
      {reversedPositions.map((pos, reversedIndex) => {
        const index = positions.length - 1 - reversedIndex
        const offset = getOffset(index)
        const isReverse = index % 2 === 1
        return (
          <Box
            key={index}
            sx={{
              marginLeft: `${offset * indent}px`,
              marginTop: reversedIndex > 0 ? `-${overlap}px` : 0,
            }}
          >
            <Gear
              index={index}
              position={pos}
              size={gearSize}
              reverse={isReverse}
            />
          </Box>
        )
      })}
    </Box>
  )
}

// BigInt を文字列として保持するためのヘルパー
const addBigIntStr = (a: string, b: number): string => {
  const result = BigInt(a) + BigInt(b)
  return result < 0n ? '0' : result.toString()
}

const GoogolPage = () => {
  // BigInt は React の状態として問題があるため文字列で保持
  const [counterStr, setCounterStr] = useState('0')
  const [sliderValue, setSliderValue] = useState(50)
  const lastSliderRef = useRef(50)
  const [cameraPos, setCameraPos] = useState<[number, number, number]>([
    -8, 15, -5,
  ])
  const [cameraTarget, setCameraTarget] = useState<[number, number, number]>([
    1, 0, 12,
  ])

  // 2D歯車レイアウト設定
  const [showConfig, setShowConfig] = useState(false)
  const [overlapRatio, setOverlapRatio] = useState(0.95)
  const [indentRatio, setIndentRatio] = useState(0.75)
  const [zigzagPeriod, setZigzagPeriod] = useState(16)

  const handleCameraUpdate = useCallback(
    (pos: [number, number, number], target: [number, number, number]) => {
      setCameraPos(pos)
      setCameraTarget(target)
    },
    []
  )

  const positions = getGearPositions(BigInt(counterStr))

  const handleIncrement = useCallback(() => {
    setCounterStr((prev) => addBigIntStr(prev, 1))
  }, [])

  const handleDecrement = useCallback(() => {
    setCounterStr((prev) => addBigIntStr(prev, -1))
  }, [])

  const handleReset = useCallback(() => {
    setCounterStr('0')
    setSliderValue(50)
    lastSliderRef.current = 50
  }, [])

  const handleSliderChange = useCallback(
    (_: Event, value: number | number[]) => {
      const newValue = value as number
      const diff = Math.abs(newValue - lastSliderRef.current)
      if (diff !== 0) {
        setCounterStr((prev) => addBigIntStr(prev, diff))
      }
      lastSliderRef.current = newValue
      setSliderValue(newValue)
    },
    []
  )

  const handleSliderCommit = useCallback(() => {
    // スライダーを離したら中央にリセット（無限に擦れるように）
    setSliderValue(50)
    lastSliderRef.current = 50
  }, [])

  return (
    <Layout title={title}>
      <Title>{title}</Title>

      {/* 歯車表示（メイン） */}
      <Box
        sx={{
          p: 2,
          bgcolor: '#f5f5f5',
          borderRadius: 2,
          border: '1px solid #ddd',
          mb: 3,
        }}
      >
        <GearGroup
          positions={positions}
          gearSize={60}
          overlapRatio={overlapRatio}
          indentRatio={indentRatio}
          zigzagPeriod={zigzagPeriod}
        />
      </Box>

      {/* コントロール */}
      <Box sx={{ mb: 3 }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ mb: 2 }}
          justifyContent="center"
          alignItems="center"
        >
          <Button variant="contained" onClick={handleDecrement}>
            -1
          </Button>
          <Button variant="contained" onClick={handleIncrement}>
            +1
          </Button>
          <Button variant="outlined" onClick={handleReset}>
            Reset
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowConfig(!showConfig)}
          >
            {showConfig ? 'Config ▲' : 'Config ▼'}
          </Button>
        </Stack>
        <Collapse in={showConfig}>
          <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 2 }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption">
                  Overlap Ratio: {overlapRatio}
                </Typography>
                <Slider
                  value={overlapRatio}
                  onChange={(_, v) => setOverlapRatio(v as number)}
                  min={0}
                  max={1}
                  step={0.05}
                  size="small"
                />
              </Box>
              <Box>
                <Typography variant="caption">
                  Indent Ratio: {indentRatio}
                </Typography>
                <Slider
                  value={indentRatio}
                  onChange={(_, v) => setIndentRatio(v as number)}
                  min={0}
                  max={1}
                  step={0.05}
                  size="small"
                />
              </Box>
              <Box>
                <Typography variant="caption">
                  Zigzag Period: {zigzagPeriod}
                </Typography>
                <Slider
                  value={zigzagPeriod}
                  onChange={(_, v) => setZigzagPeriod(v as number)}
                  min={2}
                  max={20}
                  step={2}
                  size="small"
                />
              </Box>
            </Stack>
          </Box>
        </Collapse>

        {/* スライダー（左右に擦ると+） */}
        <Box sx={{ px: 2, maxWidth: 400, mx: 'auto' }}>
          <Slider
            value={sliderValue}
            onChange={handleSliderChange}
            onChangeCommitted={handleSliderCommit}
            min={0}
            max={100}
            step={1}
          />
        </Box>
      </Box>

      {/* 現在の値 */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          回転数:
        </Typography>
        <Typography
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            wordBreak: 'break-all',
          }}
        >
          {counterStr}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          桁数: {counterStr.length}
        </Typography>
      </Box>

      {/* 3D表示 */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          3D View
        </Typography>
        <Box
          sx={{
            height: 500,
            bgcolor: '#e8e8e8',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Canvas camera={{ position: [11.1, 4.6, -4.7], fov: 50 }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 20, 10]} intensity={1} />
              <pointLight position={[-10, 10, -10]} intensity={0.5} />
              <GearGroup3D positions={positions} />
              <CameraTracker onUpdate={handleCameraUpdate} />
            </Suspense>
          </Canvas>
        </Box>
        <Box
          sx={{
            mt: 1,
            p: 1,
            bgcolor: 'grey.200',
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.75rem',
          }}
        >
          <Typography variant="caption" component="div">
            Camera position: [{cameraPos.join(', ')}]
          </Typography>
          <Typography variant="caption" component="div">
            Camera target: [{cameraTarget.join(', ')}]
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          ※ ドラッグで視点を回転できます。
        </Typography>
      </Box>

      {/* 説明 */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          10回転で次の歯車を1回転させる歯車が100枚。 最初の歯車を googol
          (10^100) 回まわすと、最後の歯車が1回転します。
        </Typography>
      </Box>
    </Layout>
  )
}

export default GoogolPage
