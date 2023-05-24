import { Box, Text } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import { BufferGeometry, Vector3 } from 'three'
import Layout from '../components/Layout'
import { Title } from '../components/Title'
import { useAnotime } from '../lib/time/useAnotime'

function Spring() {
  const lineRef = useRef<SVGLineElement>(null)
  const { buffer, size, positions } = useAnotime()

  console.log(positions)
  const points = []

  points.push(new Vector3(-10, 0, 0))
  points.push(new Vector3(0, 10, 0))
  points.push(new Vector3(10, 0, 0))

  const lineGeometry = new BufferGeometry().setFromPoints(points)

  return (
    <group position={[0, -2.5, -10]}>
      <line ref={lineRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={size}
            array={buffer}
            // count={3}
            // array={Float32Array.from([-10, 0, 0, 0, 10, 0, 10, 0, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          attach="material"
          color={'#9c88ff'}
          linewidth={10}
          linecap={'round'}
          linejoin={'round'}
        />
      </line>
    </group>
  )
}

const Rig = ({ v = new Vector3() }) => {
  return useFrame((state) => {
    state.camera.position.lerp(
      v.set(state.mouse.x / 2, state.mouse.y / 2, 10),
      0.05
    )
  })
}

const title = 'Time'
const Time = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <div style={{ border: 'solid 1px', height: '100vh' }}>
        <Canvas>
          <Suspense fallback={null}>
            <Spring />

            <ambientLight />
            <pointLight position={[10, 10, 10]} />
            <Rig />
            <Box position={[0, 1, -10]} />
            <Box position={[-1.2, 0, 0]} />
            <Box position={[1.2, 0, 0]} />
            <Text
              position={[0, 1, 0]}
              font="/Roboto-Black.ttf"
              fontSize={2}
              color={'#222'}
            >
              HELLO
            </Text>
            <Text
              position={[0, 0, 2]}
              font="/Roboto-Black.ttf"
              fontSize={2}
              color={'#222'}
            >
              WORLD
            </Text>
          </Suspense>
        </Canvas>
      </div>
    </Layout>
  )
}

export default Time
