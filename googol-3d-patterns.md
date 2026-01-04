# Googol 3D表示 コードバリエーション集

## 依存パッケージ（package.json）

```json
"@react-three/drei": "9.88.17",
"@react-three/fiber": "8.15.19",
"three": "^0.181.2"
```

```js
// next.config.js
transpilePackages: ['three'],
```

---

## パターン1: シンプル版（現在のGoogolGear3D.tsx）

```tsx
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

const GEAR_BODY_RADIUS = 1.5

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

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = angle
    }
  })

  return (
    <group position={[posX, 0, posZ]}>
      <group ref={groupRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[GEAR_BODY_RADIUS, 24]} />
          <meshBasicMaterial color="#444444" side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[GEAR_BODY_RADIUS - 0.05, GEAR_BODY_RADIUS, 24]} />
          <meshBasicMaterial color="#888888" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.05, GEAR_BODY_RADIUS * 0.5]}>
          <boxGeometry args={[0.15, 0.1, GEAR_BODY_RADIUS]} />
          <meshBasicMaterial color="#e53935" />
        </mesh>
      </group>
    </group>
  )
}

function GearGroup3D({ positions }: { positions: number[] }) {
  const spacing = 0.25
  return (
    <group>
      {positions.map((pos, index) => {
        const isOdd = index % 2 === 1
        const posZ = index * spacing
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

function Scene({ positions }: { positions: number[] }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1} />
      <pointLight position={[-10, 10, -10]} intensity={0.5} />
      <GearGroup3D positions={positions} />
      <OrbitControls target={[-1.7, -1.4, 10.5]} />
    </>
  )
}

export default function GoogolGear3D({ positions }: { positions: number[] }) {
  return (
    <Canvas camera={{ position: [15.2, 7.9, -4.5], fov: 50 }}>
      <Scene positions={positions} />
    </Canvas>
  )
}
```

---

## パターン2: 共有ジオメトリ版（歯車形状あり）

```tsx
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

const GEAR_BODY_RADIUS = 1.5
const GEAR_TOOTH_HEIGHT = 0.4

// グローバルで一度だけ生成
const gearShape = (() => {
  const shape = new THREE.Shape()
  const teethCount = 12

  for (let i = 0; i < teethCount; i++) {
    const baseAngle = (i / teethCount) * Math.PI * 2
    const toothWidth = Math.PI / teethCount * 0.6

    const outerR = GEAR_BODY_RADIUS + GEAR_TOOTH_HEIGHT
    const innerR = GEAR_BODY_RADIUS

    const a1 = baseAngle - toothWidth
    const a2 = baseAngle + toothWidth

    if (i === 0) {
      shape.moveTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR)
    } else {
      shape.lineTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR)
    }
    shape.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR)
    shape.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR)
    shape.lineTo(Math.cos(a2) * innerR, Math.sin(a2) * innerR)
  }
  shape.closePath()

  // 中心の穴
  const holePath = new THREE.Path()
  holePath.absarc(0, 0, 0.4, 0, Math.PI * 2, false)
  shape.holes.push(holePath)

  return shape
})()

const sharedGearGeometry = new THREE.ShapeGeometry(gearShape)
const sharedGearMaterial = new THREE.MeshBasicMaterial({
  color: '#333333',
  side: THREE.DoubleSide
})
const sharedEdgeMaterial = new THREE.LineBasicMaterial({ color: '#666666' })
const sharedMarkerMaterial = new THREE.MeshBasicMaterial({ color: '#e53935' })
const sharedMarkerGeometry = new THREE.BoxGeometry(0.15, 0.1, GEAR_BODY_RADIUS + GEAR_TOOTH_HEIGHT * 0.3)

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

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = angle
    }
  })

  return (
    <group position={[posX, 0, posZ]}>
      <group ref={groupRef}>
        {/* 歯車本体 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={sharedGearGeometry} material={sharedGearMaterial} />
        {/* 輪郭線 */}
        <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
          <edgesGeometry args={[sharedGearGeometry]} />
          <primitive object={sharedEdgeMaterial} attach="material" />
        </lineSegments>
        {/* 回転マーカー */}
        <mesh
          position={[0, 0.05, (GEAR_BODY_RADIUS + GEAR_TOOTH_HEIGHT * 0.3) / 2]}
          geometry={sharedMarkerGeometry}
          material={sharedMarkerMaterial}
        />
      </group>
    </group>
  )
}

// GearGroup3D, Scene, export は パターン1 と同じ
```

---

## パターン3: ページ内直接埋め込み（Suspense使用）

```tsx
// googol.tsx 内に直接記述
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useState, useCallback, useRef, Suspense } from 'react'
import * as THREE from 'three'

// ... Gear3D, GearGroup3D, Scene コンポーネント定義 ...

const GoogolPage = () => {
  // ... state定義 ...

  return (
    <Layout title={title}>
      {/* 2D表示部分 */}

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
          <Suspense
            fallback={<Box sx={{ color: '#666', p: 2 }}>Loading 3D...</Box>}
          >
            <Canvas camera={{ position: [15.2, 7.9, -4.5], fov: 50 }}>
              <Scene positions={positions} />
            </Canvas>
          </Suspense>
        </Box>
      </Box>
    </Layout>
  )
}
```

---

## パターン4: Dynamic Import（SSR無効）

```tsx
// googol.tsx
import dynamic from 'next/dynamic'

const GoogolGear3D = dynamic(() => import('../components/GoogolGear3D'), {
  ssr: false,
  loading: () => <Box sx={{ color: '#666', p: 2 }}>Loading 3D...</Box>,
})

// 使用
<GoogolGear3D positions={positions} />
```

---

## パターン5: エラー境界付き

```tsx
import { Component, ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
  fallback: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
          <Typography color="error" variant="subtitle2">
            3D表示でエラーが発生しました
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
            {this.state.error?.message}
          </Typography>
        </Box>
      )
    }
    return this.props.children
  }
}

// 使用
<ErrorBoundary fallback={<Box>3D表示を読み込めませんでした</Box>}>
  <GoogolGear3D positions={positions} />
</ErrorBoundary>
```

---

## dice-3d.tsx からのパターン

### RoundedBox使用

```tsx
import { RoundedBox } from '@react-three/drei'

<RoundedBox args={[1, 1, 1]} radius={0.1} smoothness={4}>
  <meshStandardMaterial color="#f5f5f5" />
</RoundedBox>
```

### useMemoでジオメトリ生成

```tsx
import { useMemo } from 'react'

function D100Geometry() {
  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(0.5, 2)
    const colors: number[] = []
    // ... 色の計算 ...
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    return geo
  }, [])

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial vertexColors flatShading />
    </mesh>
  )
}
```

### ライティング設定

```tsx
// シンプル
<ambientLight intensity={0.5} />
<directionalLight position={[10, 20, 10]} intensity={1} />
<pointLight position={[-10, 10, -10]} intensity={0.5} />

// 影あり
<ambientLight intensity={0.6} />
<directionalLight position={[5, 10, 5]} intensity={1} castShadow />
<pointLight position={[-5, 5, -5]} intensity={0.3} />
```

### OrbitControls設定

```tsx
// シンプル
<OrbitControls target={[-1.7, -1.4, 10.5]} />

// 詳細
<OrbitControls
  enablePan={true}
  minDistance={3}
  maxDistance={20}
  target={[0, 0, 0]}
/>
```

---

## カメラ設定例

```tsx
<Canvas camera={{ position: [15.2, 7.9, -4.5], fov: 50 }}>
<Canvas camera={{ position: [0, 8, 12], fov: 50 }}>
```

---

## 現在のファイル構成

- `src/components/GoogolGear3D.tsx` - 3Dコンポーネント
- `src/pages/googol.tsx` - ページ（dynamic import + ErrorBoundary）
- `googol-3d-backup.patch` - バックアップパッチ
