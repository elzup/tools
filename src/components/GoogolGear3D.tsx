import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#4488ff" />
      </mesh>
      <OrbitControls />
    </>
  )
}

export default function GoogolGear3D({ positions }: { positions: number[] }) {
  void positions // unused for now
  return (
    <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
      <Scene />
    </Canvas>
  )
}
