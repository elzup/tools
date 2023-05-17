import { OrthographicCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import Layout from '../components/Layout'
import { Title } from '../components/Title'
import { useAnotime } from '../lib/time/useAnotime'

function Spring() {
  const lineRef = useRef<SVGLineElement>(null)
  const { buffer, size, positions } = useAnotime()

  console.log(positions)

  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={size}
          array={buffer}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="black" />
    </line>
  )
}

const title = 'Time'
const Time = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <Canvas>
        <Suspense fallback={null}>
          <ambientLight />
          <Spring />

          <pointLight position={[10, 10, 10]} />
          {/* <Rig /> */}
        </Suspense>
        <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={40} />
      </Canvas>
    </Layout>
  )
}

export default Time
