import { Text } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import { Line, Vector3 } from 'three'
import Layout from '../components/Layout'
import { Title } from '../components/Title'
import { useAnotime } from '../lib/time/useAnotime'

function Spring() {
  const lineRef = useRef<Line>(null)
  const lineRef2 = useRef<Line>(null)
  const { frame, current } = useAnotime()

  return (
    <group position={[0, -2.5, -10]}>
      <line ref={lineRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={frame.size}
            array={frame.buffer}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial attach="material" color={'#9c88ff'} />
      </line>
      <line ref={lineRef2}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={current.size}
            array={current.buffer}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial attach="material" color={'#ff8800'} />
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <div style={{ border: 'solid 1px', aspectRatio: '1' }}>
          <Canvas>
            <Suspense fallback={null}>
              <Spring />

              <ambientLight />
              <pointLight position={[10, 10, 10]} />
              <Rig />
              <Text
                position={[0, 0, 2]}
                font="/Roboto-Black.ttf"
                fontSize={2}
                color={'#222'}
              >
                Year
              </Text>
            </Suspense>
          </Canvas>
        </div>
        <div style={{ border: 'solid 1px', aspectRatio: '1' }}></div>
      </div>
    </Layout>
  )
}

export default Time
