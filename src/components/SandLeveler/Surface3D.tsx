// 砂の高さ場を 3D サーフェスで表示するビュー (OrbitControls で自由アングル)
import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { type MutableRefObject, useMemo, useRef } from 'react'
import * as THREE from 'three'
import {
  BLADE_INNER,
  type BladeState,
  GRID,
  RADIUS,
  type SandField,
} from './field'
import { shadeCell } from './shading'

// 高さ 1 (掘り/盛りの単位) を皿半径の何倍の起伏として見せるか
const Z_SCALE = 0.3

type FieldRef = MutableRefObject<SandField | null>
type BladeRef = MutableRefObject<BladeState>
type Pointer = { active: boolean; gx: number; gy: number }
type PointerRef = MutableRefObject<Pointer>

const SandSurface = ({ fieldRef }: { fieldRef: FieldRef }) => {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(2, 2, GRID - 1, GRID - 1)

    g.setAttribute(
      'color',
      new THREE.BufferAttribute(new Float32Array(GRID * GRID * 3), 3)
    )
    return g
  }, [])
  const rgb = useMemo(() => [0, 0, 0], [])

  useFrame(() => {
    const field = fieldRef.current

    if (!field) return
    const pos = geometry.attributes.position as THREE.BufferAttribute
    const col = geometry.attributes.color as THREE.BufferAttribute

    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const idx = y * GRID + x

        if (!field.inside[idx]) {
          pos.setZ(idx, -0.03)
          col.setXYZ(idx, 0.08, 0.09, 0.12)
          continue
        }
        shadeCell(field, x, y, rgb)
        pos.setZ(idx, field.height[idx] * Z_SCALE)
        col.setXYZ(idx, rgb[0] / 255, rgb[1] / 255, rgb[2] / 255)
      }
    }
    pos.needsUpdate = true
    col.needsUpdate = true
  })

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
    </mesh>
  )
}

const Blade3D = ({ bladeRef }: { bladeRef: BladeRef }) => {
  const groupRef = useRef<THREE.Group>(null)
  const inner = BLADE_INNER / (GRID / 2)
  const outer = RADIUS / (GRID / 2)
  const len = outer - inner

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y = -bladeRef.current.angle
  })

  return (
    <group ref={groupRef}>
      <mesh position={[inner + len / 2, 0.06, 0]}>
        <boxGeometry args={[len, 0.06, 0.03]} />
        <meshBasicMaterial color="#4a4034" />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.16, 16]} />
        <meshBasicMaterial color="#3a3228" />
      </mesh>
    </group>
  )
}

/** 左ドラッグの掘る/盛るを受ける透明な当たり判定面 (起伏メッシュへの raycast は重いため平面で代用) */
const PointerPad = ({ pointerRef }: { pointerRef: PointerRef }) => {
  const toGrid = (p: THREE.Vector3) => ({
    gx: Math.round(((p.x + 1) / 2) * GRID),
    gy: Math.round(((p.z + 1) / 2) * GRID),
  })

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        pointerRef.current = { active: true, ...toGrid(e.point) }
      }}
      onPointerMove={(e) => {
        if (!pointerRef.current.active) return
        pointerRef.current = { active: true, ...toGrid(e.point) }
      }}
      onPointerUp={() => {
        pointerRef.current = { ...pointerRef.current, active: false }
      }}
    >
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

const Rim = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
    <ringGeometry
      args={[RADIUS / (GRID / 2), RADIUS / (GRID / 2) + 0.04, 96]}
    />
    <meshBasicMaterial color="#565e70" side={THREE.DoubleSide} />
  </mesh>
)

const Surface3D = ({
  fieldRef,
  bladeRef,
  pointerRef,
}: {
  fieldRef: FieldRef
  bladeRef: BladeRef
  pointerRef: PointerRef
}) => (
  <Canvas
    camera={{ position: [0, 1.5, 1.7], fov: 50 }}
    style={{
      width: '100%',
      maxWidth: 560,
      height: 560,
      borderRadius: 8,
      background: '#10141c',
    }}
  >
    <SandSurface fieldRef={fieldRef} />
    <Blade3D bladeRef={bladeRef} />
    <PointerPad pointerRef={pointerRef} />
    <Rim />
    <OrbitControls
      maxPolarAngle={Math.PI / 2 - 0.05}
      minDistance={0.8}
      maxDistance={5}
      mouseButtons={{
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
      }}
    />
  </Canvas>
)

export default Surface3D
