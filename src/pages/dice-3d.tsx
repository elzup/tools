import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Slider,
  Stack,
  Typography,
} from '@mui/material'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, RoundedBox } from '@react-three/drei'
import {
  Physics,
  RigidBody,
  CuboidCollider,
  BallCollider,
  RapierRigidBody,
} from '@react-three/rapier'
import React, { useRef, useState, useCallback, Suspense, useMemo } from 'react'
import * as THREE from 'three'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const title = '3D サイコロシミュレーター'

type DiceType = 'd6' | 'd100'

// サイコロの目の位置（各面の中心からのオフセット）
const dotPositions: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [
    [-0.25, 0.25],
    [0.25, -0.25],
  ],
  3: [
    [-0.25, 0.25],
    [0, 0],
    [0.25, -0.25],
  ],
  4: [
    [-0.25, 0.25],
    [0.25, 0.25],
    [-0.25, -0.25],
    [0.25, -0.25],
  ],
  5: [
    [-0.25, 0.25],
    [0.25, 0.25],
    [0, 0],
    [-0.25, -0.25],
    [0.25, -0.25],
  ],
  6: [
    [-0.25, 0.25],
    [0.25, 0.25],
    [-0.25, 0],
    [0.25, 0],
    [-0.25, -0.25],
    [0.25, -0.25],
  ],
}

// サイコロの目を描画するコンポーネント
function DiceDots({
  value,
  position,
  rotation,
}: {
  value: number
  position: [number, number, number]
  rotation: [number, number, number]
}) {
  const dots = dotPositions[value] || []
  return (
    <group position={position} rotation={rotation}>
      {dots.map((pos, i) => (
        <mesh key={i} position={[pos[0], pos[1], 0.01]}>
          <circleGeometry args={[0.08, 32]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}
    </group>
  )
}

// D6用: 上面の値を取得する関数
function getTopFaceD6(quaternion: THREE.Quaternion): number {
  const up = new THREE.Vector3(0, 1, 0)

  const faces = [
    { value: 1, normal: new THREE.Vector3(0, 0, 1) },
    { value: 6, normal: new THREE.Vector3(0, 0, -1) },
    { value: 2, normal: new THREE.Vector3(0, 1, 0) },
    { value: 5, normal: new THREE.Vector3(0, -1, 0) },
    { value: 3, normal: new THREE.Vector3(-1, 0, 0) },
    { value: 4, normal: new THREE.Vector3(1, 0, 0) },
  ]

  let maxDot = -Infinity
  let topValue = 1

  for (const face of faces) {
    const worldNormal = face.normal.clone().applyQuaternion(quaternion)
    const dot = worldNormal.dot(up)
    if (dot > maxDot) {
      maxDot = dot
      topValue = face.value
    }
  }

  return topValue
}

// D100の面データを生成（球面上に100面を配置）
function generateD100Faces(): Array<{ value: number; normal: THREE.Vector3 }> {
  const faces: Array<{ value: number; normal: THREE.Vector3 }> = []
  const phi = Math.PI * (3 - Math.sqrt(5)) // 黄金角

  for (let i = 0; i < 100; i++) {
    const y = 1 - (i / 99) * 2
    const radius = Math.sqrt(1 - y * y)
    const theta = phi * i

    const x = Math.cos(theta) * radius
    const z = Math.sin(theta) * radius

    faces.push({
      value: i + 1,
      normal: new THREE.Vector3(x, y, z).normalize(),
    })
  }

  return faces
}

const d100Faces = generateD100Faces()

// D100用: 上面の値を取得する関数
function getTopFaceD100(quaternion: THREE.Quaternion): number {
  const up = new THREE.Vector3(0, 1, 0)

  let maxDot = -Infinity
  let topValue = 1

  for (const face of d100Faces) {
    const worldNormal = face.normal.clone().applyQuaternion(quaternion)
    const dot = worldNormal.dot(up)
    if (dot > maxDot) {
      maxDot = dot
      topValue = face.value
    }
  }

  return topValue
}

// D6サイコロコンポーネント
function DiceD6({
  id,
  initialPosition,
  initialVelocity,
  initialAngularVelocity,
  onSettle,
}: {
  id: number
  initialPosition: [number, number, number]
  initialVelocity: [number, number, number]
  initialAngularVelocity: [number, number, number]
  onSettle: (id: number, value: number) => void
}) {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const settledRef = useRef(false)
  const settleCountRef = useRef(0)

  useFrame(() => {
    if (!rigidBodyRef.current || settledRef.current) return

    const linvel = rigidBodyRef.current.linvel()
    const angvel = rigidBodyRef.current.angvel()

    const speed = Math.sqrt(linvel.x ** 2 + linvel.y ** 2 + linvel.z ** 2)
    const angularSpeed = Math.sqrt(
      angvel.x ** 2 + angvel.y ** 2 + angvel.z ** 2
    )

    if (speed < 0.1 && angularSpeed < 0.1) {
      settleCountRef.current++
      if (settleCountRef.current > 30) {
        settledRef.current = true
        const rotation = rigidBodyRef.current.rotation()
        const quaternion = new THREE.Quaternion(
          rotation.x,
          rotation.y,
          rotation.z,
          rotation.w
        )
        const topFace = getTopFaceD6(quaternion)
        onSettle(id, topFace)
      }
    } else {
      settleCountRef.current = 0
    }
  })

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={initialPosition}
      linearVelocity={initialVelocity}
      angularVelocity={initialAngularVelocity}
      restitution={0.3}
      friction={0.8}
      colliders="cuboid"
    >
      <RoundedBox args={[1, 1, 1]} radius={0.1} smoothness={4}>
        <meshStandardMaterial color="#f5f5f5" />
      </RoundedBox>
      <DiceDots value={1} position={[0, 0, 0.51]} rotation={[0, 0, 0]} />
      <DiceDots value={6} position={[0, 0, -0.51]} rotation={[0, Math.PI, 0]} />
      <DiceDots
        value={2}
        position={[0, 0.51, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <DiceDots
        value={5}
        position={[0, -0.51, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <DiceDots
        value={3}
        position={[-0.51, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      <DiceDots
        value={4}
        position={[0.51, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
    </RigidBody>
  )
}

// D100の色：10色（一の位）× 10段階の明度（十の位）
// 一の位: 0=赤, 1=オレンジ, 2=黄, 3=黄緑, 4=緑, 5=シアン, 6=青, 7=紫, 8=マゼンタ, 9=ピンク
// 十の位: 0=暗い → 9=明るい
const d100BaseHues = [0, 30, 60, 90, 120, 180, 210, 270, 300, 330] // HSL色相

function getD100Color(value: number): string {
  const onesDigit = (value - 1) % 10 // 0-9 (1→0, 10→9, 11→0...)
  const tensDigit = Math.floor((value - 1) / 10) // 0-9
  const hue = d100BaseHues[onesDigit]
  const lightness = 30 + tensDigit * 5 // 30% ~ 75%
  return `hsl(${hue}, 70%, ${lightness}%)`
}

// D100用のカラフルなジオメトリを作成
function D100Geometry() {
  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(0.5, 2)
    const colors: number[] = []
    const positionAttribute = geo.getAttribute('position')
    const faceCount = positionAttribute.count / 3

    // 各面に色を割り当て
    for (let i = 0; i < faceCount; i++) {
      // 面の中心座標を計算
      const idx = i * 3
      const cx =
        (positionAttribute.getX(idx) +
          positionAttribute.getX(idx + 1) +
          positionAttribute.getX(idx + 2)) /
        3
      const cy =
        (positionAttribute.getY(idx) +
          positionAttribute.getY(idx + 1) +
          positionAttribute.getY(idx + 2)) /
        3
      const cz =
        (positionAttribute.getZ(idx) +
          positionAttribute.getZ(idx + 1) +
          positionAttribute.getZ(idx + 2)) /
        3

      // 面の法線から最も近いd100Facesを見つける
      const faceNormal = new THREE.Vector3(cx, cy, cz).normalize()
      let closestValue = 1
      let maxDot = -Infinity
      for (const face of d100Faces) {
        const dot = faceNormal.dot(face.normal)
        if (dot > maxDot) {
          maxDot = dot
          closestValue = face.value
        }
      }

      // 色を取得
      const color = new THREE.Color(getD100Color(closestValue))

      // 3頂点に同じ色を設定
      for (let j = 0; j < 3; j++) {
        colors.push(color.r, color.g, color.b)
      }
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    return geo
  }, [])

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial vertexColors flatShading />
    </mesh>
  )
}

// D100サイコロコンポーネント
function DiceD100({
  id,
  initialPosition,
  initialVelocity,
  initialAngularVelocity,
  onSettle,
}: {
  id: number
  initialPosition: [number, number, number]
  initialVelocity: [number, number, number]
  initialAngularVelocity: [number, number, number]
  onSettle: (id: number, value: number) => void
}) {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const settledRef = useRef(false)
  const settleCountRef = useRef(0)

  useFrame(() => {
    if (!rigidBodyRef.current || settledRef.current) return

    const linvel = rigidBodyRef.current.linvel()
    const angvel = rigidBodyRef.current.angvel()

    const speed = Math.sqrt(linvel.x ** 2 + linvel.y ** 2 + linvel.z ** 2)
    const angularSpeed = Math.sqrt(
      angvel.x ** 2 + angvel.y ** 2 + angvel.z ** 2
    )

    // D100は球なので静止判定を厳しく
    if (speed < 0.05 && angularSpeed < 0.05) {
      settleCountRef.current++
      if (settleCountRef.current > 60) {
        settledRef.current = true
        const rotation = rigidBodyRef.current.rotation()
        const quaternion = new THREE.Quaternion(
          rotation.x,
          rotation.y,
          rotation.z,
          rotation.w
        )
        const topFace = getTopFaceD100(quaternion)
        onSettle(id, topFace)
      }
    } else {
      settleCountRef.current = 0
    }
  })

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={initialPosition}
      linearVelocity={initialVelocity}
      angularVelocity={initialAngularVelocity}
      restitution={0.2}
      friction={1.0}
      linearDamping={0.5}
      angularDamping={0.5}
    >
      <BallCollider args={[0.5]} />
      <D100Geometry />
    </RigidBody>
  )
}

// 壁
function Walls() {
  return (
    <>
      <RigidBody type="fixed" position={[0, -0.5, 0]}>
        <CuboidCollider args={[10, 0.5, 10]} />
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[20, 0.1, 20]} />
          <meshStandardMaterial color="#d4c4b0" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[-5, 2, 0]}>
        <CuboidCollider args={[0.5, 3, 10]} />
        <mesh>
          <boxGeometry args={[0.2, 6, 20]} />
          <meshStandardMaterial color="#8b7355" transparent opacity={0.3} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[5, 2, 0]}>
        <CuboidCollider args={[0.5, 3, 10]} />
        <mesh>
          <boxGeometry args={[0.2, 6, 20]} />
          <meshStandardMaterial color="#8b7355" transparent opacity={0.3} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[0, 2, -5]}>
        <CuboidCollider args={[10, 3, 0.5]} />
        <mesh>
          <boxGeometry args={[20, 6, 0.2]} />
          <meshStandardMaterial color="#8b7355" transparent opacity={0.3} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[0, 2, 5]}>
        <CuboidCollider args={[10, 3, 0.5]} />
        <mesh>
          <boxGeometry args={[20, 6, 0.2]} />
          <meshStandardMaterial color="#8b7355" transparent opacity={0.3} />
        </mesh>
      </RigidBody>
    </>
  )
}

// シーンコンポーネント
function Scene({
  diceList,
  onDiceSettle,
  diceType,
}: {
  diceList: Array<{
    id: number
    position: [number, number, number]
    velocity: [number, number, number]
    angularVelocity: [number, number, number]
  }>
  onDiceSettle: (id: number, value: number) => void
  diceType: DiceType
}) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.3} />

      <Physics gravity={[0, -20, 0]}>
        <Walls />
        {diceList.map((dice) =>
          diceType === 'd6' ? (
            <DiceD6
              key={dice.id}
              id={dice.id}
              initialPosition={dice.position}
              initialVelocity={dice.velocity}
              initialAngularVelocity={dice.angularVelocity}
              onSettle={onDiceSettle}
            />
          ) : (
            <DiceD100
              key={dice.id}
              id={dice.id}
              initialPosition={dice.position}
              initialVelocity={dice.velocity}
              initialAngularVelocity={dice.angularVelocity}
              onSettle={onDiceSettle}
            />
          )
        )}
      </Physics>

      <OrbitControls
        enablePan={true}
        minDistance={3}
        maxDistance={20}
        target={[0, 0, 0]}
      />
    </>
  )
}

type DiceData = {
  id: number
  position: [number, number, number]
  velocity: [number, number, number]
  angularVelocity: [number, number, number]
}

const Dice3D = () => {
  const [diceList, setDiceList] = useState<DiceData[]>([])
  const [results, setResults] = useState<Record<number, number>>({})
  const [history, setHistory] = useState<number[]>([])
  const [diceCount, setDiceCount] = useState(1)
  const [power, setPower] = useState(5)
  const [diceType, setDiceType] = useState<DiceType>('d6')
  const nextIdRef = useRef(0)

  const handleRoll = useCallback(() => {
    const newDice: DiceData[] = []

    for (let i = 0; i < diceCount; i++) {
      const id = nextIdRef.current++
      const spreadX = (Math.random() - 0.5) * 2
      const spreadZ = (Math.random() - 0.5) * 2

      newDice.push({
        id,
        position: [spreadX, 5 + i * 1.5, 3 + spreadZ],
        velocity: [
          (Math.random() - 0.5) * power * 2,
          -power,
          -power * (1 + Math.random() * 0.5),
        ],
        angularVelocity: [
          (Math.random() - 0.5) * power * 3,
          (Math.random() - 0.5) * power * 3,
          (Math.random() - 0.5) * power * 3,
        ],
      })
    }

    setDiceList(newDice)
    setResults({})
  }, [diceCount, power])

  const handleDiceSettle = useCallback(
    (id: number, value: number) => {
      setResults((prev) => {
        const next = { ...prev, [id]: value }
        const settledCount = Object.keys(next).length
        if (settledCount === diceList.length && diceList.length > 0) {
          const values = Object.values(next)
          setHistory((h) => [...h, ...values])
        }
        return next
      })
    },
    [diceList.length]
  )

  const handleClearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const handleClear = useCallback(() => {
    setDiceList([])
    setResults({})
  }, [])

  const handleDiceTypeChange = (event: SelectChangeEvent) => {
    setDiceType(event.target.value as DiceType)
    setDiceList([])
    setResults({})
  }

  const stats = history.reduce(
    (acc, val) => {
      acc[val] = (acc[val] || 0) + 1
      return acc
    },
    {} as Record<number, number>
  )
  const total = history.length
  const average =
    total > 0 ? (history.reduce((a, b) => a + b, 0) / total).toFixed(2) : '-'
  const currentSum = Object.values(results).reduce((a, b) => a + b, 0)

  return (
    <Layout title={title}>
      <Title>{title}</Title>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">
          物理演算でサイコロを転がします。D6（6面）とD100（100面）を選択できます。
        </Typography>
      </Box>

      <Stack spacing={2}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ height: 450, bgcolor: '#2a2a2a', borderRadius: 1 }}>
            <Suspense
              fallback={<Box sx={{ color: 'white', p: 2 }}>Loading...</Box>}
            >
              <Canvas camera={{ position: [0, 8, 12], fov: 50 }}>
                <Scene
                  diceList={diceList}
                  onDiceSettle={handleDiceSettle}
                  diceType={diceType}
                />
              </Canvas>
            </Suspense>
          </Box>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography sx={{ minWidth: 80 }}>サイコロ:</Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select value={diceType} onChange={handleDiceTypeChange}>
                  <MenuItem value="d6">D6 (6面)</MenuItem>
                  <MenuItem value="d100">D100 (100面)</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <Typography sx={{ minWidth: 80 }}>サイコロ数:</Typography>
              <Slider
                value={diceCount}
                onChange={(_: Event, v: number | number[]) =>
                  setDiceCount(v as number)
                }
                min={1}
                max={diceType === 'd6' ? 10 : 5}
                step={1}
                marks
                valueLabelDisplay="auto"
                sx={{ maxWidth: 200 }}
              />
              <Typography>{diceCount}個</Typography>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <Typography sx={{ minWidth: 80 }}>投げる力:</Typography>
              <Slider
                value={power}
                onChange={(_: Event, v: number | number[]) =>
                  setPower(v as number)
                }
                min={1}
                max={15}
                step={1}
                valueLabelDisplay="auto"
                sx={{ maxWidth: 200 }}
              />
              <Typography>{power}</Typography>
            </Stack>
          </Stack>
        </Paper>

        {diceType === 'd100' && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              D100 色の見方
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 1 }}
            >
              色相（横）= 一の位、明度（縦）= 十の位
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'auto repeat(10, 1fr)',
                gap: 0.25,
                fontSize: '0.6rem',
              }}
            >
              <Box />
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => (
                <Box key={n} sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                  {n}
                </Box>
              ))}
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((tens) => (
                <React.Fragment key={tens}>
                  <Box sx={{ pr: 0.5, fontWeight: 'bold' }}>{tens}0</Box>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((ones) => {
                    const value = tens * 10 + (ones === 0 ? 10 : ones)
                    return (
                      <Box
                        key={ones}
                        sx={{
                          width: 20,
                          height: 16,
                          bgcolor: getD100Color(value),
                          borderRadius: 0.25,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.5rem',
                          color: tens < 5 ? 'white' : 'black',
                        }}
                      >
                        {value}
                      </Box>
                    )
                  })}
                </React.Fragment>
              ))}
            </Box>
          </Paper>
        )}

        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="center"
        >
          <Button
            variant="contained"
            size="large"
            onClick={handleRoll}
            sx={{ minWidth: 150 }}
          >
            サイコロを振る
          </Button>
          <Button variant="outlined" size="large" onClick={handleClear}>
            クリア
          </Button>
        </Stack>

        {Object.keys(results).length > 0 && (
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ mb: 1 }}>
              結果: {Object.values(results).join(' + ')} = {currentSum}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              justifyContent="center"
              flexWrap="wrap"
            >
              {Object.values(results).map((val, idx) => (
                <Box
                  key={idx}
                  sx={{
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'primary.main',
                    color: 'white',
                    borderRadius: 1,
                    fontWeight: 'bold',
                    fontSize: diceType === 'd100' ? '1rem' : '1.5rem',
                  }}
                >
                  {val}
                </Box>
              ))}
            </Stack>
          </Paper>
        )}

        {history.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography variant="h6">履歴</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={handleClearHistory}
              >
                クリア
              </Button>
            </Stack>

            <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mb: 2 }}>
              {history.map((val, idx) => (
                <Box
                  key={idx}
                  sx={{
                    minWidth: 28,
                    height: 28,
                    px: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.200',
                    borderRadius: 0.5,
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    mb: 0.5,
                  }}
                >
                  {val}
                </Box>
              ))}
            </Stack>

            <Typography variant="body2" sx={{ mb: 1 }}>
              回数: {total} / 平均: {average} / 合計:{' '}
              {history.reduce((a, b) => a + b, 0)}
            </Typography>

            {diceType === 'd6' && (
              <Stack direction="row" spacing={2}>
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <Box key={num} sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      {num}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stats[num] || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {total > 0
                        ? (((stats[num] || 0) / total) * 100).toFixed(1) + '%'
                        : '-'}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        )}
      </Stack>
    </Layout>
  )
}

export default Dice3D
