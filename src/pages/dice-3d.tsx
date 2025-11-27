import { Box, Button, Paper, Slider, Stack, Typography } from '@mui/material'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, RoundedBox } from '@react-three/drei'
import {
  Physics,
  RigidBody,
  CuboidCollider,
  RapierRigidBody,
} from '@react-three/rapier'
import React, { useRef, useState, useCallback, Suspense } from 'react'
import * as THREE from 'three'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const title = '3D サイコロシミュレーター'

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

// 上面の値を取得する関数
function getTopFace(quaternion: THREE.Quaternion): number {
  const up = new THREE.Vector3(0, 1, 0)

  // 各面の法線ベクトル（ローカル座標）
  const faces = [
    { value: 1, normal: new THREE.Vector3(0, 0, 1) }, // +Z
    { value: 6, normal: new THREE.Vector3(0, 0, -1) }, // -Z
    { value: 2, normal: new THREE.Vector3(0, 1, 0) }, // +Y
    { value: 5, normal: new THREE.Vector3(0, -1, 0) }, // -Y
    { value: 3, normal: new THREE.Vector3(-1, 0, 0) }, // -X
    { value: 4, normal: new THREE.Vector3(1, 0, 0) }, // +X
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

// サイコロコンポーネント
function Dice({
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

    // 静止判定
    if (speed < 0.1 && angularSpeed < 0.1) {
      settleCountRef.current++
      if (settleCountRef.current > 30) {
        // 約0.5秒静止
        settledRef.current = true
        const rotation = rigidBodyRef.current.rotation()
        const quaternion = new THREE.Quaternion(
          rotation.x,
          rotation.y,
          rotation.z,
          rotation.w
        )
        const topFace = getTopFace(quaternion)
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
      {/* 各面の目 */}
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

// 壁
function Walls() {
  return (
    <>
      {/* 床 */}
      <RigidBody type="fixed" position={[0, -0.5, 0]}>
        <CuboidCollider args={[10, 0.5, 10]} />
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[20, 0.1, 20]} />
          <meshStandardMaterial color="#d4c4b0" />
        </mesh>
      </RigidBody>
      {/* 左壁 */}
      <RigidBody type="fixed" position={[-5, 2, 0]}>
        <CuboidCollider args={[0.5, 3, 10]} />
        <mesh>
          <boxGeometry args={[0.2, 6, 20]} />
          <meshStandardMaterial color="#8b7355" transparent opacity={0.3} />
        </mesh>
      </RigidBody>
      {/* 右壁 */}
      <RigidBody type="fixed" position={[5, 2, 0]}>
        <CuboidCollider args={[0.5, 3, 10]} />
        <mesh>
          <boxGeometry args={[0.2, 6, 20]} />
          <meshStandardMaterial color="#8b7355" transparent opacity={0.3} />
        </mesh>
      </RigidBody>
      {/* 奥壁 */}
      <RigidBody type="fixed" position={[0, 2, -5]}>
        <CuboidCollider args={[10, 3, 0.5]} />
        <mesh>
          <boxGeometry args={[20, 6, 0.2]} />
          <meshStandardMaterial color="#8b7355" transparent opacity={0.3} />
        </mesh>
      </RigidBody>
      {/* 手前壁 */}
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
}: {
  diceList: Array<{
    id: number
    position: [number, number, number]
    velocity: [number, number, number]
    angularVelocity: [number, number, number]
  }>
  onDiceSettle: (id: number, value: number) => void
}) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.3} />

      <Physics gravity={[0, -20, 0]}>
        <Walls />
        {diceList.map((dice) => (
          <Dice
            key={dice.id}
            id={dice.id}
            initialPosition={dice.position}
            initialVelocity={dice.velocity}
            initialAngularVelocity={dice.angularVelocity}
            onSettle={onDiceSettle}
          />
        ))}
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
  const nextIdRef = useRef(0)

  const handleRoll = useCallback(() => {
    const newDice: DiceData[] = []
    const newResults: Record<number, number> = {}

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
    setResults(newResults)
  }, [diceCount, power])

  const handleDiceSettle = useCallback(
    (id: number, value: number) => {
      setResults((prev) => {
        const next = { ...prev, [id]: value }
        // 全てのサイコロが静止したか確認
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

  // 統計計算
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
          物理演算でサイコロを転がします。マウスでドラッグして視点を変更できます。
        </Typography>
      </Box>

      <Stack spacing={2}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ height: 450, bgcolor: '#2a2a2a', borderRadius: 1 }}>
            <Suspense
              fallback={<Box sx={{ color: 'white', p: 2 }}>Loading...</Box>}
            >
              <Canvas camera={{ position: [0, 8, 12], fov: 50 }}>
                <Scene diceList={diceList} onDiceSettle={handleDiceSettle} />
              </Canvas>
            </Suspense>
          </Box>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography sx={{ minWidth: 80 }}>サイコロ数:</Typography>
              <Slider
                value={diceCount}
                onChange={(_, v) => setDiceCount(v as number)}
                min={1}
                max={10}
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
                onChange={(_, v) => setPower(v as number)}
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
                    fontSize: '1.5rem',
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
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.200',
                    borderRadius: 0.5,
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
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
          </Paper>
        )}
      </Stack>
    </Layout>
  )
}

export default Dice3D
